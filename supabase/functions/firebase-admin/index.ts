import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const FIREBASE_URL = "https://gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app";
const FIREBASE_SERVICE_ACCOUNT = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT")!);

let adminApp: any = null;
let adminAuth: any = null;
let adminDb: any = null;

async function initFirebaseAdmin() {
  if (adminApp) return;
  const { initializeApp, cert, getApps } = await import("npm:firebase-admin@12.6.0/app");
  const { getAuth } = await import("npm:firebase-admin@12.6.0/auth");
  const { getDatabase } = await import("npm:firebase-admin@12.6.0/database");

  if (getApps().length === 0) {
    adminApp = initializeApp({ credential: cert(FIREBASE_SERVICE_ACCOUNT), databaseURL: FIREBASE_URL });
  } else {
    adminApp = getApps()[0];
  }
  adminAuth = getAuth(adminApp);
  adminDb = getDatabase(adminApp);
}

async function verifyAdminToken(idToken: string): Promise<{ uid: string; admin: boolean } | null> {
  await initFirebaseAdmin();
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return { uid: decoded.uid, admin: decoded.admin === true };
  } catch {
    return null;
  }
}

function validateArtwork(data: any): { valid: boolean; error?: string; sanitized?: any } {
  const required = ["name", "details", "imageUrl", "markerImageUrl"];
  for (const field of required) {
    if (!data[field] || typeof data[field] !== "string") {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  const sanitized = {
    name: data.name.slice(0, 100),
    details: data.details.slice(0, 5000),
    imageUrl: data.imageUrl.slice(0, 500),
    markerImageUrl: data.markerImageUrl.slice(0, 500),
    artist: data.artist ? data.artist.slice(0, 100) : null,
    year: data.year ? data.year.slice(0, 20) : null,
    location: data.location ? data.location.slice(0, 100) : null,
    modelUrl: data.modelUrl ? data.modelUrl.slice(0, 500) : null,
    immersiveSkyboxUrl: data.immersiveSkyboxUrl ? data.immersiveSkyboxUrl.slice(0, 500) : null,
    baseScale: Number(data.baseScale) || 0.5,
    modelPositionZ: Number(data.modelPositionZ) || 0.1,
    immersiveScale: Number(data.immersiveScale) || 1,
    immersiveRotation: data.immersiveRotation || "0 0 0",
    immersiveForward: Number(data.immersiveForward) || -3,
    icon: data.icon || "🖼️",
    showInMainCollection: data.showInMainCollection !== false,
    scannable: data.scannable !== false,
    published: data.published !== false,
    quiz: Array.isArray(data.quiz) ? data.quiz.slice(0, 10) : [],
    createdAt: Date.now(),
  };
  if (sanitized.baseScale <= 0 || sanitized.baseScale > 10) sanitized.baseScale = 0.5;
  if (sanitized.immersiveScale <= 0 || sanitized.immersiveScale > 100) sanitized.immersiveScale = 1;
  return { valid: true, sanitized };
}

export default {
  fetch: withSupabase({ auth: ["publishable"] }, async (req, ctx) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    const idToken = authHeader.slice(7);
    const auth = await verifyAdminToken(idToken);
    if (!auth || !auth.admin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/firebase-admin", "");
    const method = req.method;

    try {
      await initFirebaseAdmin();

      // POST /artworks - Create new artwork
      if (method === "POST" && path === "/artworks") {
        const body = await req.json();
        const validation = validateArtwork(body);
        if (!validation.valid) {
          return new Response(JSON.stringify({ error: validation.error }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        const artworkId = `art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        await adminDb.ref(`artworks/${artworkId}`).set(validation.sanitized);
        return new Response(JSON.stringify({ id: artworkId, ...validation.sanitized }), { status: 201, headers: { "Content-Type": "application/json" } });
      }

      // PATCH /artworks/:id - Update artwork settings (scale, position, etc)
      if (method === "PATCH" && path.startsWith("/artworks/")) {
        const artworkId = path.split("/")[2];
        const body = await req.json();
        const allowedFields = ["baseScale", "modelPositionZ", "immersiveScale", "immersiveRotation", "immersiveForward", "showInMainCollection", "scannable", "published", "name", "details", "artist", "year", "location", "icon"];
        const updates: any = {};
        for (const field of allowedFields) {
          if (body[field] !== undefined) {
            if (typeof body[field] === "number") {
              if (field.includes("Scale") && (body[field] <= 0 || body[field] > (field === "baseScale" ? 10 : 100))) continue;
              updates[field] = body[field];
            } else if (typeof body[field] === "string") {
              updates[field] = body[field].slice(0, field === "details" ? 5000 : 100);
            } else if (typeof body[field] === "boolean") {
              updates[field] = body[field];
            }
          }
        }
        if (Object.keys(updates).length === 0) {
          return new Response(JSON.stringify({ error: "No valid fields to update" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        await adminDb.ref(`artworks/${artworkId}`).update(updates);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      // PUT /arBundleCurrent - Publish AR bundle manifest
      if (method === "PUT" && path === "/arBundleCurrent") {
        const body = await req.json();
        const required = ["version", "mindUrl", "targets"];
        for (const field of required) {
          if (!body[field]) {
            return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), { status: 400, headers: { "Content-Type": "application/json" } });
          }
        }
        const manifest = {
          version: body.version.slice(0, 50),
          createdAt: Date.now(),
          mindUrl: body.mindUrl.slice(0, 500),
          targets: Array.isArray(body.targets) ? body.targets.slice(0, 50).map((t: any) => ({ targetIndex: Number(t.targetIndex), artworkId: String(t.artworkId).slice(0, 50) })) : [],
        };
        await adminDb.ref("arBundleCurrent").set(manifest);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      // DELETE /leaderboard - Clear all leaderboard entries
      if (method === "DELETE" && path === "/leaderboard") {
        await adminDb.ref("leaderboard").remove();
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      // DELETE /notes - Clear all notes
      if (method === "DELETE" && path === "/notes") {
        await adminDb.ref("notes").remove();
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      // DELETE /artworks/:id - Delete specific artwork
      if (method === "DELETE" && path.startsWith("/artworks/")) {
        const artworkId = path.split("/")[2];
        await adminDb.ref(`artworks/${artworkId}`).remove();
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    } catch (err) {
      console.error("[firebase-admin] Error:", err);
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }),
};