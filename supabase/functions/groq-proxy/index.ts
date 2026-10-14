import "@supabase/functions-js/edge-runtime.d.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const PREFERRED_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

const JSON_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
];

let cachedModel: string | null = null;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return { allowed: true };
  }
  if (entry.count >= 10) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

async function resolveGroqModel(forceJsonMode = false): Promise<string> {
  const cacheKey = forceJsonMode ? "jsonModel" : "chatModel";
  const cached = forceJsonMode ? cachedJsonModel : cachedModel;
  if (cached) return cached;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const available = (data.data || []).map((m: any) => m.id);
    const prefs = forceJsonMode ? JSON_MODELS : PREFERRED_MODELS;
    for (const pref of prefs) {
      if (available.includes(pref)) {
        if (forceJsonMode) cachedJsonModel = pref;
        else cachedModel = pref;
        return pref;
      }
    }
    const chatModel = available.find((id: string) => !id.includes("whisper") && !id.includes("orpheus"));
    if (chatModel) {
      if (forceJsonMode) cachedJsonModel = chatModel;
      else cachedModel = chatModel;
      return chatModel;
    }
    throw new Error("No suitable model found");
  } catch (err) {
    console.warn("[groq-proxy] Model discovery failed, using fallback:", err);
    const fallback = forceJsonMode ? JSON_MODELS[0] : PREFERRED_MODELS[0];
    if (forceJsonMode) cachedJsonModel = fallback;
    else cachedModel = fallback;
    return fallback;
  }
}

let cachedJsonModel: string | null = null;

function sanitizeInput(str: string, maxLen: number): string {
  return str.slice(0, maxLen).replace(/[<>]/g, "");
}

function buildSystemPrompt(artworks: any[]): string {
  const artworkList = artworks
    .map((a) => `- "${a.name}"${a.modelObj ? " (has 3D AR model)" : ""}: ${a.details}`)
    .join("\n");
  return `You are Kuya Davon, the official AI museum guide for the Geronimo Berenguer de los Reyes (GBR), Jr. Museum, located in General Trias, Philippines.

=== STRICT RULES — YOU MUST FOLLOW THESE EXACTLY ===
1. You may ONLY discuss the artworks listed below. NOTHING else.
2. If asked about ANY topic not directly related to these artworks — including but not limited to: general history, other artists, other museums, science, politics, sports, entertainment, personal advice, coding, math, weather, current events, or ANY artwork not in this list — you MUST refuse. Do not answer, do not summarize, do not redirect to the topic. Simply say you can only help with questions about the artworks at this museum.
3. Do NOT be conversational about off-topic subjects. A single firm refusal is enough.
4. Do NOT provide "fun facts" or tangential information that strays from the listed artworks.
5. If the user asks "who are you" or "what can you do", answer: "I'm Kuya Davon, your guide for the artworks here at GBR Jr. Museum. Ask me about any piece in our collection!"
6. Keep all on-topic answers concise (2-3 sentences max).

Current artworks in the collection:
${artworkList}

Remember: If it is not about one of the artworks above, you do NOT know it. Period.`;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  return null;
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders() });
}

function successResponse(data: any): Response {
  return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders() });
}

export default {
  fetch: async (req: Request) => {
    // Handle CORS preflight
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), {
        status: 429,
        headers: { ...corsHeaders(), "Retry-After": String(rateLimit.retryAfter || 60) },
      });
    }

    try {
      const body = await req.json();
      const { messages, systemPrompt, model, jsonMode } = body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return errorResponse("Invalid messages array", 400);
      }

      const sanitizedMessages = messages.slice(-20).map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: sanitizeInput(String(m.content || ""), 300),
      }));

      const isJsonMode = jsonMode || (systemPrompt && systemPrompt.includes("JSON"));
      const resolvedModel = model || (await resolveGroqModel(isJsonMode));
      const systemContent = systemPrompt || "You are a helpful assistant.";

      const temperature = isJsonMode ? 0.1 : 0.4;
      const maxTokens = isJsonMode ? 800 : 300;

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: resolvedModel,
          messages: [{ role: "system", content: systemContent }, ...sanitizedMessages],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        console.error("[groq-proxy] Groq API error:", groqRes.status, errText);
        return errorResponse("AI service unavailable", 502);
      }

      const data = await groqRes.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't come up with an answer for that.";

      return successResponse({ content: reply });
    } catch (err) {
      console.error("[groq-proxy] Error:", err);
      return errorResponse("Internal server error", 500);
    }
  },
};