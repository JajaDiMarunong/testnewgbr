// =====================================================================
// ADMIN PANEL — standalone page
// =====================================================================
const FIREBASE_URL = "https://gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app";
const ADMIN_PASSWORD = "GBRMu5281";
const SUPABASE_URL = "https://twkgioiyfjfkppzerdii.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UxPFx1rFmy8g8CMaaqtQ1g_LuHnfvry";
const SUPABASE_BUCKET = "gbr-assets";
const SUPABASE_PUBLIC_ROOT = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}`;
const GROQ_API_KEY = "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";
// Preferred models in order of preference. The app will auto-discover
// what's actually available from Groq and pick the first match.
const PREFERRED_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];
let GROQ_MODEL = null; // set dynamically on first use

async function resolveGroqModel() {
  if (GROQ_MODEL) return GROQ_MODEL;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    });
    if (!res.ok) throw new Error("status " + res.status);
    const data = await res.json();
    const available = (data.data || []).map((m) => m.id);
    // Pick first preferred model that exists
    for (const pref of PREFERRED_MODELS) {
      if (available.includes(pref)) {
        GROQ_MODEL = pref;
        console.log("[AI] Using model:", GROQ_MODEL);
        return GROQ_MODEL;
      }
    }
    // Fallback: just use the first chat model available
    const chatModel = available.find((id) => !id.includes("whisper") && !id.includes("orpheus"));
    if (chatModel) {
      GROQ_MODEL = chatModel;
      console.log("[AI] Fallback model:", GROQ_MODEL);
      return GROQ_MODEL;
    }
    throw new Error("No suitable model found");
  } catch (err) {
    console.warn("[AI] Could not discover models, using hard fallback:", err);
    GROQ_MODEL = PREFERRED_MODELS[0];
    return GROQ_MODEL;
  }
}

// -------------------------------------------------------------------
// Built-in artworks
// -------------------------------------------------------------------
const BUILTIN_ARTWORKS = [
  {
    id: "builtin-mona",
    name: "Mona Lisa",
    image: "./assets/mona-marker.jpg",
    artist: "Leonardo da Vinci",
    year: "c. 1503–1506",
    location: "The Louvre, Paris, France",
    details: "Painted by Leonardo da Vinci in the early 1500s, this portrait is one of the most recognized paintings in the world, known for its subtle, ambiguous smile and soft transitions of light and shadow. It has hung in the Louvre in Paris since the museum opened to the public.",
    baseScale: 0.003,
    icon: "🖼️",
    hasModel: true,
    showInMainCollection: true,
    scannable: true,
    published: true,
    markerImage: "./assets/mona-marker.jpg",
  },
  {
    id: "builtin-kiss",
    name: "The Kiss",
    image: "./assets/the-kiss.jpg",
    artist: "Gustav Klimt",
    year: "1907–1908",
    location: "Österreichische Galerie Belvedere, Vienna, Austria",
    details: "Gustav Klimt painted The Kiss between 1907 and 1908, during what's often called his \"Golden Phase\" for its extensive use of gold leaf. It shows an entwined couple kneeling at the edge of a flower-covered meadow, their bodies wrapped in an elaborate mosaic of gold, ornament, and pattern that blurs the line between clothing and abstract design. It remains one of the defining images of the Vienna Secession movement and today hangs in the Österreichische Galerie Belvedere in Vienna, Austria.",
    baseScale: 0.06,
    icon: "💛",
    hasModel: false,
    showInMainCollection: false,
    scannable: false,
    published: true,
    markerImage: null,
  },
  {
    id: "builtin-crisanto",
    name: "Portrait of Crisanto de los Reyes y Mendoza",
    image: "./assets/crisanto-marker.jpg",
    artist: "Rafael del Casal",
    year: "Undated",
    location: "GBR Jr. Museum, General Trias, Philippines",
    details: "Portrait of Crisanto de los Reyes y Mendoza by Rafael del Casal.",
    baseScale: 0.5,
    icon: "🎨",
    hasModel: true,
    showInMainCollection: true,
    scannable: true,
    published: true,
    markerImage: "./assets/crisanto-marker.jpg",
  },
  {
    id: "builtin-mcarthur",
    name: "MacArthur",
    image: "./assets/mcarthurmarker.jpg",
    artist: "",
    year: "",
    location: "",
    details: "MacArthur artwork from the GBR Jr. Museum collection.",
    baseScale: 1,
    icon: "🎖️",
    hasModel: true,
    showInMainCollection: true,
    scannable: true,
    published: true,
    markerImage: "./assets/mcarthurmarker.jpg",
  },

];

// -------------------------------------------------------------------
// DOM refs
// -------------------------------------------------------------------
const screenLogin = document.getElementById("screen-login");
const adminDashboard = document.getElementById("admin-dashboard");
const adminPasswordInput = document.getElementById("admin-password-input");
const adminLoginError = document.getElementById("admin-login-error");
const btnAdminLoginSubmit = document.getElementById("btn-admin-login-submit");
const btnLogout = document.getElementById("btn-logout");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

const visitsFilter = document.getElementById("visits-filter");
const visitsChart = document.getElementById("visits-chart");
const visitsChartTotal = document.getElementById("visits-chart-total");

const adminLeaderboardList = document.getElementById("admin-leaderboard-list");
const adminNotesList = document.getElementById("admin-notes-list");
const adminArtworksList = document.getElementById("admin-artworks-list");

// AI Modal refs
const aiModal = document.getElementById("ai-modal");
const aiPasteInput = document.getElementById("ai-paste-input");
const btnAiSubmit = document.getElementById("btn-ai-submit");
const btnAiCancel = document.getElementById("btn-ai-cancel");
const btnOpenAiModal = document.getElementById("btn-open-ai-modal");
const aiModalStatus = document.getElementById("ai-modal-status");

// Form refs
const imageUploadZone = document.getElementById("image-upload-zone");
const artworkImageInput = document.getElementById("artwork-image");
const imagePreview = document.getElementById("image-preview");
const uploadPlaceholder = document.getElementById("upload-placeholder");
const btnUploadArtwork = document.getElementById("btn-upload-artwork");
const uploadStatus = document.getElementById("upload-status");
const artworkMarkerInput = document.getElementById("artwork-marker");
const artworkModelInput = document.getElementById("artwork-model");
const artworkSkyboxInput = document.getElementById("artwork-skybox");
const artworkMainInput = document.getElementById("artwork-main");
const artworkScannableInput = document.getElementById("artwork-scannable");
const artworkPublishedInput = document.getElementById("artwork-published");
const btnBuildAr = document.getElementById("btn-build-ar");
const arBuildStatus = document.getElementById("ar-build-status");

// Date filter refs — Leaderboard
const lbDateFilter = document.getElementById("lb-date-filter");
const lbCustomRange = document.getElementById("lb-custom-range");
const lbDateFrom = document.getElementById("lb-date-from");
const lbDateTo = document.getElementById("lb-date-to");
const lbApplyCustom = document.getElementById("lb-apply-custom");
const lbFilterCount = document.getElementById("lb-filter-count");

// Date filter refs — Notes
const notesDateFilter = document.getElementById("notes-date-filter");
const notesCustomRange = document.getElementById("notes-custom-range");
const notesDateFrom = document.getElementById("notes-date-from");
const notesDateTo = document.getElementById("notes-date-to");
const notesApplyCustom = document.getElementById("notes-apply-custom");
const notesFilterCount = document.getElementById("notes-filter-count");

// Cached data for filtering
let cachedLeaderboard = [];
let cachedNotes = [];

// -------------------------------------------------------------------
// Login
// -------------------------------------------------------------------
btnAdminLoginSubmit.addEventListener("click", () => {
  if (adminPasswordInput.value === ADMIN_PASSWORD) {
    screenLogin.classList.add("hidden");
    adminDashboard.classList.remove("hidden");
    loadAllData();
  } else {
    adminLoginError.classList.remove("hidden");
  }
});
adminPasswordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnAdminLoginSubmit.click();
});
btnLogout.addEventListener("click", () => {
  adminDashboard.classList.add("hidden");
  screenLogin.classList.remove("hidden");
  adminPasswordInput.value = "";
  adminLoginError.classList.add("hidden");
});

// -------------------------------------------------------------------
// Tabs
// -------------------------------------------------------------------
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    tabButtons.forEach((b) => b.classList.toggle("active", b === btn));
    tabPanels.forEach((p) => p.classList.toggle("hidden", p.id !== `tab-${tab}`));
  });
});

// -------------------------------------------------------------------
// Refresh
// -------------------------------------------------------------------
document.getElementById("btn-refresh-admin").addEventListener("click", loadAllData);

async function loadAllData() {
  await Promise.all([
    loadAdminStats(),
    loadAdminLeaderboard(),
    loadAdminNotes(),
    loadAdminArtworks(),
  ]);
}

// =====================================================================
// AI ASSISTANT POPUP MODAL
// =====================================================================
btnOpenAiModal.addEventListener("click", () => {
  aiPasteInput.value = "";
  aiModalStatus.textContent = "";
  aiModalStatus.className = "ai-status";
  aiModal.classList.remove("hidden");
  aiPasteInput.focus();
});

btnAiCancel.addEventListener("click", () => {
  aiModal.classList.add("hidden");
});

btnAiSubmit.addEventListener("click", async () => {
  const query = aiPasteInput.value.trim();
  if (!query) {
    aiModalStatus.textContent = "Please paste some info about the artwork first.";
    aiModalStatus.className = "ai-status error";
    return;
  }

  aiModalStatus.textContent = "Thinking…";
  aiModalStatus.className = "ai-status";
  btnAiSubmit.disabled = true;

  try {
    console.log("[AI] Sending request to Groq API…");
    const model = await resolveGroqModel();
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are a museum cataloging assistant. The user pasted information about an artwork. Extract the following fields and return ONLY a valid JSON object with these exact keys: title, artist, year, location, description.

CRITICAL RULES:
1. Return ONLY the JSON object. No markdown, no explanations, no text before or after.
2. The description must be 2-3 sentences maximum. Keep it short so the JSON fits in the response.
3. If a field cannot be determined, use null.
4. The JSON must be complete and valid — do not cut it off.

Example output:
{"title":"The Starry Night","artist":"Vincent van Gogh","year":"1889","location":"MoMA, New York","description":"A swirling night sky over a village, painted by Van Gogh in 1889. One of the most recognized works in Western art."}`,
          },
          { role: "user", content: query },
        ],
        temperature: 0.3,
        max_tokens: 1200,
      }),
    });

    console.log("[AI] Response status:", res.status, res.statusText);

    if (!res.ok) {
      let errBody = "";
      try { errBody = await res.text(); } catch (e) {}
      console.error("[AI] API error body:", errBody);
      throw new Error(`API returned ${res.status} ${res.statusText}. ${errBody}`);
    }

    const data = await res.json();
    console.log("[AI] Raw response:", data);

    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    console.log("[AI] Content text:", raw);

    if (!raw) {
      throw new Error("AI returned empty response.");
    }

    // Extract JSON from response (handle markdown fences)
    let jsonStr = raw;
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    // Also try to find JSON between curly braces if the above didn't work
    if (!jsonStr.startsWith("{")) {
      const braceMatch = raw.match(/\{[\s\S]*\}/);
      if (braceMatch) jsonStr = braceMatch[0];
    }

    console.log("[AI] Parsed JSON string:", jsonStr);

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[AI] JSON parse failed:", parseErr);
      console.error("[AI] String that failed:", jsonStr);
      throw new Error(`AI response was not valid JSON. Raw: ${raw.substring(0, 200)}`);
    }

    console.log("[AI] Parsed object:", parsed);

    // Fill form fields
    if (parsed.title) document.getElementById("artwork-name").value = parsed.title;
    if (parsed.artist !== undefined) document.getElementById("artwork-artist").value = parsed.artist || "";
    if (parsed.year !== undefined) document.getElementById("artwork-year").value = parsed.year || "";
    if (parsed.location !== undefined) document.getElementById("artwork-location").value = parsed.location || "";
    if (parsed.description) document.getElementById("artwork-details").value = parsed.description;

    aiModalStatus.textContent = "✅ Fields filled! Closing…";
    aiModalStatus.className = "ai-status success";

    setTimeout(() => {
      aiModal.classList.add("hidden");
    }, 1200);

  } catch (err) {
    console.error("[AI] Full error:", err);
    aiModalStatus.textContent = err.message || "Unknown error. Check browser console (F12) for details.";
    aiModalStatus.className = "ai-status error";
  } finally {
    btnAiSubmit.disabled = false;
  }
});

// =====================================================================
// STATS
// =====================================================================
let cachedVisitTimestamps = [];
let currentVisitsRange = "week";

async function loadAdminStats() {
  await Promise.all([loadActiveNow(), loadVisitData(), loadCounts()]);
  renderVisitsChart(currentVisitsRange);
}

async function loadActiveNow() {
  try {
    const res = await fetch(`${FIREBASE_URL}/presence.json`);
    const data = await res.json();
    const entries = data ? Object.values(data) : [];
    const activeCount = entries.filter((p) => Date.now() - p.timestamp < 60000).length;
    document.getElementById("stat-active-now").textContent = activeCount;
  } catch (err) {
    document.getElementById("stat-active-now").textContent = "?";
  }
}

async function loadCounts() {
  try {
    const [artRes, lbRes, notesRes] = await Promise.all([
      fetch(`${FIREBASE_URL}/artworks.json`),
      fetch(`${FIREBASE_URL}/leaderboard.json`),
      fetch(`${FIREBASE_URL}/notes.json`),
    ]);
    const artData = await artRes.json();
    const lbData = await lbRes.json();
    const notesData = await notesRes.json();

    const uploadedCount = artData ? Object.keys(artData).length : 0;
    document.getElementById("stat-artwork-count").textContent = BUILTIN_ARTWORKS.length + uploadedCount;
    document.getElementById("stat-leaderboard-count").textContent = lbData ? Object.keys(lbData).length : 0;
    document.getElementById("stat-notes-count").textContent = notesData ? Object.keys(notesData).length : 0;
  } catch (err) {
    document.getElementById("stat-artwork-count").textContent = "?";
    document.getElementById("stat-leaderboard-count").textContent = "?";
    document.getElementById("stat-notes-count").textContent = "?";
  }
}

async function loadVisitData() {
  const DAY = 24 * 60 * 60 * 1000;
  try {
    const res = await fetch(`${FIREBASE_URL}/analytics_visits.json`);
    const data = await res.json();
    cachedVisitTimestamps = data ? Object.values(data).map((v) => v.timestamp).filter(Boolean) : [];

    const staleCutoff = Date.now() - 35 * DAY;
    const staleEntries = data ? Object.entries(data).filter(([, v]) => v.timestamp < staleCutoff) : [];
    staleEntries.forEach(([key]) => {
      fetch(`${FIREBASE_URL}/analytics_visits/${key}.json`, { method: "DELETE" }).catch(() => {});
    });
  } catch (err) {
    cachedVisitTimestamps = [];
  }
}

function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function renderVisitsChart(range) {
  const DAY = 24 * 60 * 60 * 1000;
  const timestamps = cachedVisitTimestamps;
  let bars = [];

  if (range === "week" || range === "lastweek") {
    const thisWeekStart = getWeekStart(new Date());
    const weekStart = range === "lastweek" ? new Date(thisWeekStart.getTime() - 7 * DAY) : thisWeekStart;
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < 7; i++) {
      const binStart = weekStart.getTime() + i * DAY;
      const binEnd = binStart + DAY;
      bars.push({ label: dayLabels[i], count: timestamps.filter((t) => t >= binStart && t < binEnd).length });
    }
  } else if (range === "month") {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    let weekStart = getWeekStart(monthStart);
    let weekNum = 1;
    while (weekStart.getTime() < monthEnd.getTime()) {
      const binStart = Math.max(weekStart.getTime(), monthStart.getTime());
      const binEnd = Math.min(weekStart.getTime() + 7 * DAY, monthEnd.getTime());
      bars.push({ label: `Wk${weekNum}`, count: timestamps.filter((t) => t >= binStart && t < binEnd).length });
      weekStart = new Date(weekStart.getTime() + 7 * DAY);
      weekNum++;
    }
  } else {
    const byMonth = {};
    timestamps.forEach((t) => {
      const d = new Date(t);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    const sortedKeys = Object.keys(byMonth).sort((a, b) => {
      const [ya, ma] = a.split("-").map(Number);
      const [yb, mb] = b.split("-").map(Number);
      return ya - yb || ma - mb;
    });
    bars = sortedKeys.slice(-12).map((key) => {
      const [y, m] = key.split("-").map(Number);
      return { label: new Date(y, m, 1).toLocaleDateString(undefined, { month: "short" }), count: byMonth[key] };
    });
    if (bars.length === 0) bars = [{ label: "—", count: 0 }];
  }

  const maxCount = Math.max(1, ...bars.map((b) => b.count));
  visitsChart.innerHTML = bars
    .map(
      (b) => `
    <div class="visits-chart-bar">
      <span class="visits-chart-bar-count">${b.count}</span>
      <div class="visits-chart-bar-fill" style="height: ${Math.max(4, (b.count / maxCount) * 60)}px;"></div>
      <span class="visits-chart-bar-label">${b.label}</span>
    </div>`
    )
    .join("");

  const total = bars.reduce((sum, b) => sum + b.count, 0);
  visitsChartTotal.textContent = `${total} visit${total === 1 ? "" : "s"} in this range`;
}

visitsFilter.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-tab");
  if (!btn) return;
  currentVisitsRange = btn.dataset.range;
  visitsFilter.querySelectorAll(".filter-tab").forEach((t) => t.classList.toggle("active", t === btn));
  renderVisitsChart(currentVisitsRange);
});

// =====================================================================
// DATE FILTERING
// =====================================================================
function getDateRange(filterValue, customFrom, customTo) {
  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;
  let start = 0;
  let end = Infinity;

  switch (filterValue) {
    case "today": {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start = d.getTime();
      end = start + DAY;
      break;
    }
    case "yesterday": {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      start = d.getTime();
      end = start + DAY;
      break;
    }
    case "week": {
      const ws = getWeekStart(now);
      start = ws.getTime();
      end = start + 7 * DAY;
      break;
    }
    case "lastweek": {
      const ws = getWeekStart(now);
      start = ws.getTime() - 7 * DAY;
      end = ws.getTime();
      break;
    }
    case "month": {
      start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
      break;
    }
    case "lastmonth": {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      end = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      break;
    }
    case "custom": {
      if (customFrom) start = new Date(customFrom).getTime();
      if (customTo) end = new Date(customTo).getTime() + DAY - 1;
      break;
    }
    default:
      // "all" — no filter
      start = 0;
      end = Infinity;
  }
  return { start, end };
}

function filterEntriesByDate(entries, filterValue, customFrom, customTo) {
  if (filterValue === "all") return entries;
  const { start, end } = getDateRange(filterValue, customFrom, customTo);
  return entries.filter(([, e]) => {
    const ts = e.timestamp || 0;
    return ts >= start && ts <= end;
  });
}

// =====================================================================
// LEADERBOARD
// =====================================================================
async function loadAdminLeaderboard() {
  adminLeaderboardList.innerHTML = `<p class="leaderboard-status">Loading…</p>`;
  try {
    const res = await fetch(`${FIREBASE_URL}/leaderboard.json`);
    const data = await res.json();
    cachedLeaderboard = data ? Object.entries(data) : [];
    cachedLeaderboard.sort((a, b) => a[1].time - b[1].time);
    renderLeaderboardList();
  } catch (err) {
    adminLeaderboardList.innerHTML = `<p class="leaderboard-status">Couldn't load leaderboard data.</p>`;
  }
}

function renderLeaderboardList() {
  const filterValue = lbDateFilter.value;
  const customFrom = lbDateFrom.value;
  const customTo = lbDateTo.value;

  const filtered = filterEntriesByDate(cachedLeaderboard, filterValue, customFrom, customTo);

  lbFilterCount.textContent = filtered.length > 0
    ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
    : "No results";

  if (filtered.length === 0) {
    adminLeaderboardList.innerHTML = `<p class="leaderboard-status">No entries match this date filter.</p>`;
    return;
  }

  adminLeaderboardList.innerHTML = filtered
    .map(
      ([key, e]) => `
    <div class="admin-row">
      <div class="admin-row-info">
        <div class="admin-row-name">${escapeHtml(e.name || "Anonymous")} — ${formatTime(e.time)}</div>
        <div class="admin-row-date">${formatDateFull(e.timestamp)}</div>
      </div>
      <button class="admin-delete-btn" data-path="leaderboard/${key}" data-label="this leaderboard entry">Delete</button>
    </div>`
    )
    .join("");

  attachDeleteHandlers();
}

// Leaderboard date filter events
lbDateFilter.addEventListener("change", () => {
  const isCustom = lbDateFilter.value === "custom";
  lbCustomRange.classList.toggle("hidden", !isCustom);
  renderLeaderboardList();
});

lbApplyCustom.addEventListener("click", renderLeaderboardList);

// =====================================================================
// NOTES
// =====================================================================
async function loadAdminNotes() {
  adminNotesList.innerHTML = `<p class="leaderboard-status">Loading…</p>`;
  try {
    const res = await fetch(`${FIREBASE_URL}/notes.json`);
    const data = await res.json();
    cachedNotes = data ? Object.entries(data) : [];
    cachedNotes.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));
    renderNotesList();
  } catch (err) {
    adminNotesList.innerHTML = `<p class="leaderboard-status">Couldn't load guestbook data.</p>`;
  }
}

function renderNotesList() {
  const filterValue = notesDateFilter.value;
  const customFrom = notesDateFrom.value;
  const customTo = notesDateTo.value;

  const filtered = filterEntriesByDate(cachedNotes, filterValue, customFrom, customTo);

  notesFilterCount.textContent = filtered.length > 0
    ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
    : "No results";

  if (filtered.length === 0) {
    adminNotesList.innerHTML = `<p class="leaderboard-status">No notes match this date filter.</p>`;
    return;
  }

  const typeIcon = { text: "📝", draw: "🎨", photo: "📷" };

  adminNotesList.innerHTML = filtered
    .map(
      ([key, n]) => `
    <div class="admin-row">
      <div class="admin-row-info">
        <div class="admin-row-name">${typeIcon[n.type] || "📝"} ${escapeHtml(n.name || "Anonymous")}</div>
        <div class="admin-row-meta">${!n.type || n.type === "text" ? escapeHtml((n.text || "").slice(0, 40)) : `(${n.type})`}</div>
        <div class="admin-row-date">${formatDateFull(n.timestamp)}</div>
      </div>
      <button class="admin-delete-btn" data-path="notes/${key}" data-label="this note">Delete</button>
    </div>`
    )
    .join("");

  attachDeleteHandlers();
}

// Notes date filter events
notesDateFilter.addEventListener("change", () => {
  const isCustom = notesDateFilter.value === "custom";
  notesCustomRange.classList.toggle("hidden", !isCustom);
  renderNotesList();
});

notesApplyCustom.addEventListener("click", renderNotesList);

// =====================================================================
// ARTWORKS
// =====================================================================
let uploadedArtworksCache = [];

function storagePath(...parts) {
  return parts.flatMap((part) => part.split("/")).map((part) => encodeURIComponent(part)).join("/");
}

function publicAssetUrl(path) {
  return `${SUPABASE_PUBLIC_ROOT}/${path}`;
}

async function uploadSupabaseAsset(file, path) {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${storagePath(path)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });
  if (!response.ok) {
    let message = `Supabase upload failed (${response.status})`;
    try {
      const error = await response.json();
      if (error.message) message += `: ${error.message}`;
    } catch (_) {}
    throw new Error(message);
  }
  return publicAssetUrl(path);
}

function fileExtension(file, fallback) {
  const match = file?.name?.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : fallback;
}

async function loadAdminArtworks() {
  adminArtworksList.innerHTML = `<p class="leaderboard-status">Loading…</p>`;
  try {
    const res = await fetch(`${FIREBASE_URL}/artworks.json`);
    const data = await res.json();
    uploadedArtworksCache = data ? Object.entries(data).map(([key, val]) => ({ key, ...val })) : [];

    const allArtworks = [
      ...BUILTIN_ARTWORKS.map((a) => ({ ...a, _source: "builtin" })),
      ...uploadedArtworksCache.map((a) => ({ ...a, _source: "uploaded", id: a.key })),
    ];

    document.getElementById("artworks-count-label").textContent = `${allArtworks.length} total`;

    adminArtworksList.innerHTML = allArtworks
      .map((art) => {
        const isBuiltin = art._source === "builtin";
        const thumb = art.imageUrl || art.image || "";
        const meta = [art.artist, art.year].filter(Boolean).join(" · ") || "No metadata";
        return `
      <div class="artwork-row">
        <img class="artwork-row-thumb" src="${thumb}" alt="" onerror="this.style.display='none'" />
        <div class="artwork-row-info">
          <p class="artwork-name">${escapeHtml(art.name)}</p>
          <p class="artwork-meta">${escapeHtml(meta)}</p>
          <span class="artwork-source ${isBuiltin ? "builtin" : ""}">${isBuiltin ? "Built-in" : "Uploaded"} · ${art.published === false ? "Draft" : "Published"}</span>
        </div>
        ${isBuiltin ? "" : `<button class="admin-delete-btn" data-path="artworks/${art.id}" data-label="this artwork">Delete</button>`}
      </div>`;
      })
      .join("");

    attachDeleteHandlers();
  } catch (err) {
    adminArtworksList.innerHTML = `<p class="leaderboard-status">Couldn't load artworks.</p>`;
  }
}

// ---- Image upload handling ----
let processedImageBase64 = null;

imageUploadZone.addEventListener("click", () => artworkImageInput.click());
artworkImageInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  uploadStatus.textContent = "Processing image…";
  uploadStatus.className = "upload-status";

  try {
    const img = await loadImageFromFile(file);
    const canvas = downscaleImage(img, 700);
    processedImageBase64 = canvas.toDataURL("image/jpeg", 0.85);

    imagePreview.src = processedImageBase64;
    imagePreview.classList.remove("hidden");
    uploadPlaceholder.classList.add("hidden");
    uploadStatus.textContent = `Ready: ${Math.round(processedImageBase64.length / 1024)} KB`;
    uploadStatus.className = "upload-status success";
  } catch (err) {
    uploadStatus.textContent = "Failed to process image. Try a smaller file.";
    uploadStatus.className = "upload-status error";
    processedImageBase64 = null;
  }
});

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downscaleImage(img, maxDim) {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

btnUploadArtwork.addEventListener("click", async () => {
  const name = document.getElementById("artwork-name").value.trim();
  const details = document.getElementById("artwork-details").value.trim();

  const displayFile = artworkImageInput.files[0];
  const markerFile = artworkMarkerInput.files[0];
  const modelFile = artworkModelInput.files[0];
  const skyboxFile = artworkSkyboxInput.files[0];

  if (!name || !details || (!displayFile && !processedImageBase64)) {
    uploadStatus.textContent = "Please fill in all required fields and select an image.";
    uploadStatus.className = "upload-status error";
    return;
  }

  btnUploadArtwork.disabled = true;
  uploadStatus.textContent = "Uploading assets…";
  uploadStatus.className = "upload-status";

  try {
    const artworkId = `art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const basePath = `artworks/${artworkId}`;
    let imageUrl = null;
    if (displayFile) imageUrl = await uploadSupabaseAsset(displayFile, `${basePath}/display.${fileExtension(displayFile, "jpg")}`);
    else if (processedImageBase64) imageUrl = processedImageBase64;

    const markerUrl = markerFile
      ? await uploadSupabaseAsset(markerFile, `${basePath}/marker.${fileExtension(markerFile, "jpg")}`)
      : imageUrl;
    const modelUrl = modelFile
      ? await uploadSupabaseAsset(modelFile, `${basePath}/model.glb`)
      : null;
    const immersiveSkyboxUrl = skyboxFile
      ? await uploadSupabaseAsset(skyboxFile, `${basePath}/skybox.glb`)
      : null;

    const artwork = {
      name,
      imageUrl,
      markerImageUrl: markerUrl,
      modelUrl,
      immersiveSkyboxUrl,
      artist: document.getElementById("artwork-artist").value.trim() || null,
      year: document.getElementById("artwork-year").value.trim() || null,
      location: document.getElementById("artwork-location").value.trim() || null,
      details,
      baseScale: 0.06,
      icon: "🖼️",
      showInMainCollection: artworkMainInput.checked,
      scannable: artworkScannableInput.checked,
      published: artworkPublishedInput.checked,
      createdAt: Date.now(),
    };

    const response = await fetch(`${FIREBASE_URL}/artworks/${artworkId}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(artwork),
    });
    if (!response.ok) throw new Error(`Firebase artwork save failed (${response.status})`);

    uploadStatus.textContent = "Artwork uploaded successfully!";
    uploadStatus.className = "upload-status success";

    // Reset form
    document.getElementById("artwork-name").value = "";
    document.getElementById("artwork-artist").value = "";
    document.getElementById("artwork-year").value = "";
    document.getElementById("artwork-location").value = "";
    document.getElementById("artwork-details").value = "";
    processedImageBase64 = null;
    imagePreview.classList.add("hidden");
    uploadPlaceholder.classList.remove("hidden");
    artworkImageInput.value = "";
    artworkMarkerInput.value = "";
    artworkModelInput.value = "";
    artworkSkyboxInput.value = "";

    loadAdminArtworks();
    loadCounts();
  } catch (err) {
    uploadStatus.textContent = "Upload failed. Check your connection.";
    uploadStatus.className = "upload-status error";
  } finally {
    btnUploadArtwork.disabled = false;
  }
});

// ---- AR target compiler and versioned publisher ----
async function fetchUploadedArtworks() {
  const response = await fetch(`${FIREBASE_URL}/artworks.json`);
  if (!response.ok) throw new Error(`Could not load artworks (${response.status})`);
  const data = await response.json();
  return data ? Object.entries(data).map(([id, value]) => ({ id, ...value })) : [];
}

function allPublishedScannableArtworks(uploaded) {
  const builtins = BUILTIN_ARTWORKS
    .filter((art) => art.published !== false && art.scannable && art.markerImage)
    .map((art) => ({ ...art, markerImageUrl: art.markerImage }));
  const firebaseArtworks = uploaded.filter((art) => art.published !== false && art.scannable && (art.markerImageUrl || art.imageUrl));
  return [...builtins, ...firebaseArtworks];
}

async function loadCompilerImage(url) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error(`Could not load marker image: ${url}`));
    image.src = url;
  });
  return downscaleImage(image, 700);
}

async function publishArBundle() {
  if (!window.MINDAR?.IMAGE?.Compiler) throw new Error("MindAR compiler is still loading. Try again in a moment.");
  const uploaded = await fetchUploadedArtworks();
  const targets = allPublishedScannableArtworks(uploaded);
  if (!targets.length) throw new Error("No published scannable artworks have marker images.");

  const images = [];
  for (let i = 0; i < targets.length; i++) {
    arBuildStatus.textContent = `Loading marker images: ${i + 1} / ${targets.length}`;
    images.push(await loadCompilerImage(targets[i].markerImageUrl));
  }

  const compiler = new window.MINDAR.IMAGE.Compiler();
  const compiled = await compiler.compileImageTargets(images, (progress) => {
    arBuildStatus.textContent = `Compiling AR targets: ${Math.round(progress)}%`;
  });
  const exportedBuffer = await compiler.exportData();
  const version = `bundle-${Date.now()}`;
  const file = new File([exportedBuffer], "targets.mind", { type: "application/octet-stream" });
  const mindPath = `bundles/${version}/targets.mind`;
  const mindUrl = await uploadSupabaseAsset(file, mindPath);
  const manifest = {
    version,
    createdAt: Date.now(),
    mindUrl,
    targets: targets.map((art, targetIndex) => ({ targetIndex, artworkId: art.id })),
  };
  const manifestFile = new File([JSON.stringify(manifest, null, 2)], "manifest.json", { type: "application/json" });
  const manifestUrl = await uploadSupabaseAsset(manifestFile, `bundles/${version}/manifest.json`);
  const response = await fetch(`${FIREBASE_URL}/arBundleCurrent.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...manifest, manifestUrl }),
  });
  if (!response.ok) throw new Error(`Could not publish bundle pointer (${response.status})`);
  return { version, count: targets.length };
}

btnBuildAr.addEventListener("click", async () => {
  btnBuildAr.disabled = true;
  arBuildStatus.className = "upload-status";
  arBuildStatus.textContent = "Preparing AR build…";
  try {
    const result = await publishArBundle();
    arBuildStatus.className = "upload-status success";
    arBuildStatus.textContent = `Published ${result.version} with ${result.count} targets.`;
  } catch (error) {
    console.error("AR build failed:", error);
    arBuildStatus.className = "upload-status error";
    arBuildStatus.textContent = error.message || "AR build failed.";
  } finally {
    btnBuildAr.disabled = false;
  }
});

// =====================================================================
// SHARED UTILITIES
// =====================================================================
function attachDeleteHandlers() {
  document.querySelectorAll(".admin-delete-btn").forEach((btn) => {
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll(".admin-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Delete ${btn.dataset.label}? This can't be undone.`)) return;
      btn.disabled = true;
      btn.textContent = "…";
      await fetch(`${FIREBASE_URL}/${btn.dataset.path}.json`, { method: "DELETE" }).catch(() => {});
      loadAllData();
    });
  });
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("btn-export-leaderboard").addEventListener("click", async () => {
  const res = await fetch(`${FIREBASE_URL}/leaderboard.json`);
  downloadJson("leaderboard-export.json", await res.json());
});
document.getElementById("btn-export-notes").addEventListener("click", async () => {
  const res = await fetch(`${FIREBASE_URL}/notes.json`);
  downloadJson("guestbook-notes-export.json", await res.json());
});
document.getElementById("btn-clear-leaderboard").addEventListener("click", async () => {
  if (!confirm("Delete ALL leaderboard entries? This can't be undone.")) return;
  await fetch(`${FIREBASE_URL}/leaderboard.json`, { method: "DELETE" }).catch(() => {});
  loadAllData();
});
document.getElementById("btn-clear-notes").addEventListener("click", async () => {
  if (!confirm("Delete ALL guestbook notes? This can't be undone.")) return;
  await fetch(`${FIREBASE_URL}/notes.json`, { method: "DELETE" }).catch(() => {});
  loadAllData();
});

function formatTime(seconds) {
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function formatDateFull(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const datePart = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
