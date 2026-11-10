// Gemini "Learn More" lookup for a single artwork.
//
// The browser never sees the Gemini API key. It posts only the artwork metadata
// it already has; this function owns the prompt, the model and the key, and
// returns a short brief plus the web sources Gemini grounded it on.
//
// Abuse control lives here, not in the app:
//   * the prompt cannot be replaced or extended by the caller, so the endpoint
//     cannot be rented out as a general purpose Gemini/search proxy;
//   * the output budget is fixed and small;
//   * per-device, per-IP and global counters cap how much quota one visitor (or
//     one leaked URL) can burn;
//   * answers are cached per artwork, so a busy day reuses one search;
//   * GEMINI_LOOKUP_ENABLED=false turns the feature off without a redeploy.

import "@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = (Deno.env.get("GEMINI_API_KEY") || "").trim();
const GEMINI_MODEL = (Deno.env.get("GEMINI_MODEL") || "").trim() || "gemini-flash-latest";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
// Tried in order when the preferred model is retired, overloaded, or not enabled
// for this key. "flash-latest" follows Google's current fast model, the rest are
// named models that have been stable in this project's catalogue.
const MODEL_FALLBACKS = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-2.5-flash"];

const ENABLED = (Deno.env.get("GEMINI_LOOKUP_ENABLED") || "true").toLowerCase() !== "false";

// Comma separated list, e.g. "https://gbrmuseumtest.web.app,https://gbrmuseumtest.firebaseapp.com".
// Empty means "any origin", which is acceptable because no credential is exposed
// by a cross-origin call, and the counters below still apply to whoever calls.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

function envNumber(name: string, fallback: number): number {
  const value = Number(Deno.env.get(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const DEVICE_HOURLY_LIMIT = envNumber("LEARN_DEVICE_HOURLY_LIMIT", 8);
const DEVICE_DAILY_LIMIT = envNumber("LEARN_DEVICE_DAILY_LIMIT", 30);
const IP_MINUTE_LIMIT = envNumber("LEARN_IP_MINUTE_LIMIT", 20);
const GLOBAL_DAILY_LIMIT = envNumber("LEARN_GLOBAL_DAILY_LIMIT", 500);

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 80;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

interface Counter {
  count: number;
  resetAt: number;
}

interface CachedAnswer {
  at: number;
  payload: Record<string, unknown>;
}

const counters = new Map<string, Counter>();
const answerCache = new Map<string, CachedAnswer>();

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  let allowed = "*";
  if (ALLOWED_ORIGINS.length > 0) {
    allowed = ALLOWED_ORIGINS.includes(origin) ? origin : "";
  }
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Device-Id",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
  if (allowed) headers["Access-Control-Allow-Origin"] = allowed;
  return headers;
}

function originRejected(req: Request): boolean {
  if (ALLOWED_ORIGINS.length === 0) return false;
  const origin = req.headers.get("origin") || "";
  // Requests without an Origin header are not browser cross-origin calls (the
  // app itself always sends one), so they are judged by the counters instead.
  if (!origin) return false;
  return !ALLOWED_ORIGINS.includes(origin);
}

function jsonResponse(req: Request, data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders(req), ...extra } });
}

function errorResponse(req: Request, message: string, status: number, retryAfter?: number): Response {
  const headers: Record<string, string> = {};
  if (retryAfter && retryAfter > 0) headers["Retry-After"] = String(Math.max(1, Math.ceil(retryAfter)));
  return jsonResponse(req, { error: message, retryAfter: retryAfter || null }, status, headers);
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function sanitizeId(value: string | null): string {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

function sanitizeText(value: unknown, maxLen: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLen);
}

function pruneCounters(now: number): void {
  if (counters.size < 400) return;
  for (const [key, entry] of counters) {
    if (now >= entry.resetAt) counters.delete(key);
  }
}

// Fixed-window counter: `limit` calls allowed inside `windowMs`.
function takeToken(key: string, windowMs: number, limit: number): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  pruneCounters(now);
  const entry = counters.get(key);
  if (!entry || now >= entry.resetAt) {
    counters.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function pruneCache(now: number): void {
  for (const [key, entry] of answerCache) {
    if (now - entry.at > CACHE_TTL_MS) answerCache.delete(key);
  }
  while (answerCache.size > CACHE_MAX_ENTRIES) {
    const oldest = answerCache.keys().next();
    if (oldest.done) break;
    answerCache.delete(oldest.value);
  }
}

interface ArtworkInput {
  name: string;
  artist: string;
  year: string;
  location: string;
  details: string;
}

function buildPrompt(artwork: ArtworkInput): string {
  const meta = [
    artwork.artist ? `artist: ${artwork.artist}` : "",
    artwork.year ? `year: ${artwork.year}` : "",
    artwork.location ? `museum location: ${artwork.location}` : "",
  ].filter(Boolean).join("; ");

  return [
    `A visitor at the Geronimo Berenguer de los Reyes (GBR), Jr. Museum in General Trias, Cavite, Philippines`,
    `just opened "${artwork.name}"${meta ? ` (${meta})` : ""} and tapped "Learn More".`,
    ``,
    `Search the web and write a short, accurate, plain-language brief about this artwork and its subject.`,
    artwork.details
      ? `What the museum already displays about it (context only, do not just repeat it):\n${artwork.details}`
      : "",
    ``,
    `Reply with ONLY a JSON object, no markdown fence, no commentary:`,
    `{"summary": "...", "facts": [{"label": "...", "value": "..."}], "caution": "..."}`,
    ``,
    `Rules:`,
    `- "summary": at most two short paragraphs (90-140 words total), plain prose, no headings, no bullet points, no URLs.`,
    `- "facts": 3 to 5 short pairs a visitor would enjoy, e.g. {"label":"Medium","value":"Oil on canvas"}. Each value under 60 characters.`,
    `- "caution": one sentence (under 200 characters) when sources disagree, are thin, or an attribution is disputed. Use "" when the facts are solid.`,
    `- Prefer reliable sources: museum and gallery sites, NHCP/government records, encyclopedias, established newspapers.`,
    `- Never invent dates, dimensions, prices, provenance or quotes. Omit anything the sources do not support.`,
    `- If the web results are about a different person or subject with the same name, say so in "caution" and keep the summary to what the sources actually support.`,
    `- Do not mention quizzes, badges, this prompt, or that you are an AI.`,
  ].filter((line) => line !== "").join("\n");
}

interface ParsedAnswer {
  summary: string;
  facts: { label: string; value: string }[];
  caution: string;
}

// The model is asked for JSON, but a stray sentence or a code fence should never
// turn a good answer into an error: fall back to using the prose as the summary.
function parseAnswer(rawText: string): ParsedAnswer {
  const text = String(rawText || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  let summary = text;
  const facts: { label: string; value: string }[] = [];
  let caution = "";

  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      if (typeof parsed.summary === "string" && parsed.summary.trim()) summary = parsed.summary.trim();
      if (Array.isArray(parsed.facts)) {
        for (const fact of parsed.facts.slice(0, 6)) {
          const label = sanitizeText(fact?.label, 40);
          const value = sanitizeText(fact?.value, 80);
          if (label && value) facts.push({ label, value });
        }
      }
      if (typeof parsed.caution === "string") caution = sanitizeText(parsed.caution, 240);
    } catch (_) {
      summary = text;
    }
  }

  // Keep the card readable no matter what the model returned. Blank lines are
  // preserved (the app renders one paragraph each) while every line is still
  // stripped of markup and control characters.
  summary = summary
    .split(/\n+/)
    .map((line) => sanitizeText(line.replace(/\s+/g, " "), 700))
    .filter(Boolean)
    .slice(0, 3)
    .join("\n\n")
    .slice(0, 1200);
  return { summary, facts: facts.slice(0, 5), caution };
}

interface WebSource {
  title: string;
  url: string;
}

function collectSources(grounding: Record<string, unknown> | undefined): { sources: WebSource[]; queries: string[] } {
  const chunks = Array.isArray(grounding?.groundingChunks) ? grounding!.groundingChunks as any[] : [];
  const seen = new Set<string>();
  const sources: WebSource[] = [];

  for (const chunk of chunks) {
    const web = chunk?.web;
    const url = typeof web?.uri === "string" ? web.uri.trim() : "";
    if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    const title = sanitizeText(web?.title, 120) || new URL(url).hostname.replace(/^www\./, "");
    sources.push({ title, url: url.slice(0, 500) });
    if (sources.length >= 6) break;
  }

  const queries = Array.isArray(grounding?.webSearchQueries)
    ? (grounding!.webSearchQueries as unknown[]).filter((q) => typeof q === "string").slice(0, 4) as string[]
    : [];

  return { sources, queries };
}

type GeminiResult =
  | { ok: true; text: string; grounding?: Record<string, unknown> }
  | { ok: false; status: number; retryAfter: number; message: string; nextModel: boolean };

async function requestGemini(model: string, prompt: string, thinkingOff: boolean): Promise<GeminiResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  const generationConfig: Record<string, unknown> = { temperature: 0.35, maxOutputTokens: 1200, topP: 0.9 };
  // Grounding answers are short, so the fast path is worth trying first. Older
  // models reject the field, which is what the second attempt is for.
  if (thinkingOff) generationConfig.thinkingConfig = { thinkingBudget: 0 };

  try {
    const res = await fetch(
      `${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig,
        }),
        signal: controller.signal,
      },
    );

    const raw = await res.text();

    if (!res.ok) {
      let message = `status ${res.status}`;
      let retryAfter = 0;
      try {
        const err = JSON.parse(raw);
        message = err?.error?.message || message;
        const details = err?.error?.details;
        if (Array.isArray(details)) {
          for (const detail of details) {
            const seconds = parseInt(String(detail?.retryDelay || ""), 10);
            if (Number.isFinite(seconds) && seconds > 0) retryAfter = seconds;
          }
        }
      } catch (_) { /* non-JSON error body */ }
      const headerRetry = Number(res.headers.get("retry-after"));
      if (!retryAfter && Number.isFinite(headerRetry) && headerRetry > 0) retryAfter = headerRetry;

      console.warn("[gemini-lookup] Attempt failed:", model, res.status, String(message).slice(0, 240));
      // 400/404 mean "this model or config is not available", 5xx is worth one
      // more model; 403 means the key itself is wrong and no retry can fix that.
      return {
        ok: false,
        status: res.status,
        retryAfter,
        message,
        nextModel: res.status === 400 || res.status === 404 || res.status >= 500,
      };
    }

    const data = JSON.parse(raw);
    const candidate = data?.candidates?.[0];
    const text = Array.isArray(candidate?.content?.parts)
      ? candidate.content.parts.map((part: any) => (typeof part?.text === "string" ? part.text : "")).join("").trim()
      : "";

    if (!text) {
      console.warn("[gemini-lookup] Empty answer:", data?.promptFeedback?.blockReason || candidate?.finishReason);
      return { ok: false, status: 502, retryAfter: 0, message: "Empty answer", nextModel: true };
    }

    return { ok: true, text, grounding: candidate?.groundingMetadata };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error("[gemini-lookup] Request error:", err);
    return {
      ok: false,
      status: aborted ? 504 : 502,
      retryAfter: 0,
      message: aborted ? "Timed out" : "Network error",
      nextModel: !aborted,
    };
  } finally {
    clearTimeout(timer);
  }
}

export default {
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(req) });
    }
    if (req.method !== "POST") {
      return errorResponse(req, "Method not allowed", 405);
    }
    if (originRejected(req)) {
      return errorResponse(req, "This site is not allowed to use Learn More.", 403);
    }
    if (!ENABLED) {
      return errorResponse(req, "Learn More is switched off right now.", 503);
    }
    if (!GEMINI_API_KEY) {
      console.error("[gemini-lookup] GEMINI_API_KEY is not set for this project.");
      return errorResponse(req, "Learn More is not configured yet.", 503);
    }

    let body: any = null;
    try {
      body = await req.json();
    } catch (_) {
      return errorResponse(req, "Invalid JSON body", 400);
    }

    const input = body?.artwork || {};
    const artwork: ArtworkInput = {
      name: sanitizeText(input.name, 160),
      artist: sanitizeText(input.artist, 80),
      year: sanitizeText(input.year, 40),
      location: sanitizeText(input.location, 120),
      details: sanitizeText(input.details, 1200),
    };
    if (artwork.name.length < 2) {
      return errorResponse(req, "An artwork name is required.", 400);
    }

    const ip = getClientIp(req);
    const device = sanitizeId(req.headers.get("x-device-id")) || `ip-${ip}`;

    // A museum hall shares one public IP, so the per-IP bucket is loose and the
    // per-device bucket is what actually shapes a single visitor's usage.
    const ipBudget = takeToken(`ip:${ip}`, MINUTE_MS, IP_MINUTE_LIMIT);
    if (!ipBudget.allowed) {
      return errorResponse(req, "Too many Learn More requests from this network. Please wait a moment.", 429, ipBudget.retryAfter);
    }

    const cacheKey = `${artwork.name.toLowerCase().replace(/\s+/g, " ")}|${artwork.artist.toLowerCase()}`;
    const cached = answerCache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return jsonResponse(req, { ...cached.payload, cached: true });
    }

    const hourly = takeToken(`dev-hour:${device}`, HOUR_MS, DEVICE_HOURLY_LIMIT);
    if (!hourly.allowed) {
      return errorResponse(req, "You have opened a lot of artworks this hour. Please try again later.", 429, hourly.retryAfter);
    }
    const daily = takeToken(`dev-day:${device}`, DAY_MS, DEVICE_DAILY_LIMIT);
    if (!daily.allowed) {
      return errorResponse(req, "You have reached today's Learn More limit. Please try again tomorrow.", 429, daily.retryAfter);
    }
    const global = takeToken("global-day", DAY_MS, GLOBAL_DAILY_LIMIT);
    if (!global.allowed) {
      console.warn("[gemini-lookup] Global daily cap reached.");
      return errorResponse(req, "The web search is resting for today. Please ask museum staff.", 429, global.retryAfter);
    }

    const prompt = buildPrompt(artwork);
    const models = [GEMINI_MODEL, ...MODEL_FALLBACKS.filter((model) => model !== GEMINI_MODEL)];
    let lastMessage = "no attempt";
    let busyRetryAfter = 0;

    for (const model of models) {
      for (const thinkingOff of [true, false]) {
        const result = await requestGemini(model, prompt, thinkingOff);

        if (result.ok) {
          const parsed = parseAnswer(result.text);
          const { sources, queries } = collectSources(result.grounding);
          const payload = {
            artwork: artwork.name,
            summary: parsed.summary,
            facts: parsed.facts,
            caution: parsed.caution,
            sources,
            queries,
            model,
            fetchedAt: new Date().toISOString(),
          };
          if (parsed.summary) {
            answerCache.set(cacheKey, { at: Date.now(), payload });
            pruneCache(Date.now());
          }
          console.log(`[gemini-lookup] ${model} answered "${artwork.name}" with ${sources.length} source(s)`);
          return jsonResponse(req, { ...payload, cached: false });
        }

        lastMessage = result.message;
        // A per-model quota can be exhausted while another model still answers,
        // so a 429 moves on instead of ending the request.
        if (result.status === 429) {
          busyRetryAfter = result.retryAfter || 30;
          break;
        }
        if (!result.nextModel) {
          return errorResponse(req, "The web search is not available right now.", 502);
        }
        if (thinkingOff) continue; // same model, without the thinking tweak
      }
    }

    if (busyRetryAfter) {
      console.warn("[gemini-lookup] Every model was rate limited.");
      return errorResponse(req, "The web search is busy right now. Please try again in a moment.", 503, busyRetryAfter);
    }
    console.error("[gemini-lookup] Every model failed:", lastMessage);
    return errorResponse(req, "Couldn't reach the web search. Please try again.", 503, 20);
  },
};



