import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const SUPABASE_URL = "https://twkgioiyfjfkppzerdii.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const BUCKET = "gbr-assets";

const ALLOWED_FOLDERS = ["artworks", "bundles"];
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg", "image/png", "image/webp",
  "model/gltf-binary", "application/octet-stream",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

const uploadRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkUploadRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = uploadRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    uploadRateLimit.set(ip, { count: 1, resetAt: now + 60000 });
    return { allowed: true };
  }
  if (entry.count >= 20) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

function validatePath(path: string): { valid: boolean; error?: string; folder?: string } {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return { valid: false, error: "Path must include folder and filename" };
  const folder = parts[0];
  if (!ALLOWED_FOLDERS.includes(folder)) return { valid: false, error: `Folder must be one of: ${ALLOWED_FOLDERS.join(", ")}` };
  const filename = parts.slice(1).join("/");
  if (filename.length > 200) return { valid: false, error: "Filename too long" };
  if (!/^[\w\-. ]+$/.test(filename)) return { valid: false, error: "Invalid filename characters" };
  return { valid: true, folder };
}

export default {
  fetch: withSupabase({ auth: ["publishable"] }, async (req, ctx) => {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
    }

    const ip = getClientIp(req);
    const rateLimit = checkUploadRateLimit(ip);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: "Upload rate limited. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": String(rateLimit.retryAfter || 60) },
      });
    }

    try {
      const body = await req.json();
      const { path, contentType } = body;

      if (!path || typeof path !== "string") {
        return new Response(JSON.stringify({ error: "Path required" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      if (!contentType || typeof contentType !== "string") {
        return new Response(JSON.stringify({ error: "Content-Type required" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      const pathValidation = validatePath(path);
      if (!pathValidation.valid) {
        return new Response(JSON.stringify({ error: pathValidation.error }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
        return new Response(JSON.stringify({ error: "Content-Type not allowed" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      const fullPath = `${BUCKET}/${path}`;
      const signedUrlRes = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${fullPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ expiresIn: 300 }), // 5 minutes
      });

      if (!signedUrlRes.ok) {
        const err = await signedUrlRes.text();
        console.error("[upload-signed-url] Sign failed:", signedUrlRes.status, err);
        return new Response(JSON.stringify({ error: "Failed to generate signed URL" }), { status: 500, headers: { "Content-Type": "application/json" } });
      }

      const { signedUrl, token } = await signedUrlRes.json();
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${fullPath}`;

      return new Response(JSON.stringify({ signedUrl: `${SUPABASE_URL}${signedUrl}`, publicUrl, token }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[upload-signed-url] Error:", err);
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }),
};