import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const ADMIN_PASSWORD_HASH = Deno.env.get("ADMIN_PASSWORD_HASH")!;
const FIREBASE_SERVICE_ACCOUNT = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT")!);
const FIREBASE_URL = "https://gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app";

let adminApp: any = null;
let adminAuth: any = null;

async function initFirebaseAdmin() {
  if (adminApp) return;
  const { initializeApp, cert, getApps } = await import("npm:firebase-admin@12.6.0/app");
  const { getAuth } = await import("npm:firebase-admin@12.6.0/auth");

  if (getApps().length === 0) {
    adminApp = initializeApp({ credential: cert(FIREBASE_SERVICE_ACCOUNT), databaseURL: FIREBASE_URL });
  } else {
    adminApp = getApps()[0];
  }
  adminAuth = getAuth(adminApp);
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60000 });
    return { allowed: true };
  }
  if (entry.count >= 5) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const { subtle } = globalThis.crypto;
  const encoder = new TextEncoder();
  const key = await subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const derived = await subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode("gbr-museum-salt"), iterations: 100000, hash: "SHA-256" }, key, 256);
  const derivedHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, "0")).join("");
  return derivedHex === hash;
}

export default {
  fetch: withSupabase({ auth: ["publishable"] }, async (req, ctx) => {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
    }

    const ip = getClientIp(req);
    const rateLimit = checkLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: "Too many attempts. Try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": String(rateLimit.retryAfter || 60) },
      });
    }

    try {
      const body = await req.json();
      const { password } = body;

      if (!password || typeof password !== "string") {
        return new Response(JSON.stringify({ error: "Password required" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      const valid = await verifyPassword(password, ADMIN_PASSWORD_HASH);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }

      await initFirebaseAdmin();
      const uid = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const customToken = await adminAuth.createCustomToken(uid, { admin: true });

      return new Response(JSON.stringify({ customToken, uid }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (err) {
      console.error("[admin-auth] Error:", err);
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }),
};