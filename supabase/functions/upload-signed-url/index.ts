import "@supabase/functions-js/edge-runtime.d.ts";

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
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const ip = getClientIp(req);
    const rateLimit = checkUploadRateLimit(ip);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: "Upload rate limited. Try again later." }), {
        status: 429,
        headers: { ...corsHeaders(), "Retry-After": String(rateLimit.retryAfter || 60) },
      });
    }

    try {
      const body = await req.json();
      const { path, contentType } = body;

      if (!path || typeof path !== "string") {
        return errorResponse("Path required", 400);
      }
      if (!contentType || typeof contentType !== "string") {
        return errorResponse("Content-Type required", 400);
      }

      const pathValidation = validatePath(path);
      if (!pathValidation.valid) {
        return errorResponse(pathValidation.error, 400);
      }
      if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
        return errorResponse("Content-Type not allowed", 400);
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
        return errorResponse("Failed to generate signed URL", 500);
      }

      const { signedUrl, token } = await signedUrlRes.json();
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${fullPath}`;

      return successResponse({ signedUrl: `${SUPABASE_URL}${signedUrl}`, publicUrl, token });
    } catch (err) {
      console.error("[upload-signed-url] Error:", err);
      return errorResponse("Internal server error", 500);
    }
  },
};