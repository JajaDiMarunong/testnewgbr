// =====================================================================
// ADMIN PANEL — standalone page
// =====================================================================
const FIREBASE_URL = "https://gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app";
const EDGE_FUNCTIONS_BASE = "https://twkgioiyfjfkppzerdii.functions.supabase.co/functions/v1";
const FIREBASE_ADMIN_URL = `${EDGE_FUNCTIONS_BASE}/firebase-admin`;
const UPLOAD_SIGNED_URL = `${EDGE_FUNCTIONS_BASE}/upload-signed-url`;
const GROQ_PROXY_URL = `${EDGE_FUNCTIONS_BASE}/groq-proxy`;

// -------------------------------------------------------------------
// Built-in artworks
// -------------------------------------------------------------------
const BUILTIN_ARTWORKS = [
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
const artworkModelScaleInput = document.getElementById("artwork-model-scale");
const artworkModelForwardInput = document.getElementById("artwork-model-forward");
const artworkImmersiveScaleInput = document.getElementById("artwork-immersive-scale");
const artworkImmersiveRotationInput = document.getElementById("artwork-immersive-rotation");
const artworkImmersiveForwardInput = document.getElementById("artwork-immersive-forward");
const artworkMainInput = document.getElementById("artwork-main");
const artworkScannableInput = document.getElementById("artwork-scannable");
const artworkPublishedInput = document.getElementById("artwork-published");
const btnCancelArtworkEdit = document.getElementById("btn-cancel-artwork-edit");
const btnBuildAr = document.getElementById("btn-build-ar");
const arBuildStatus = document.getElementById("ar-build-status");

// Marker quality refs
const markerQualityWrap = document.getElementById("marker-quality-wrap");
const markerQualityImg = document.getElementById("marker-quality-img");
const markerQualityCanvas = document.getElementById("marker-quality-canvas");
const markerQualityResolution = document.getElementById("marker-quality-resolution");
const markerQualityContrast = document.getElementById("marker-quality-contrast");
const markerQualityContrastBar = document.getElementById("marker-quality-contrast-bar");
const markerQualityFeatures = document.getElementById("marker-quality-features");
const markerQualityRating = document.getElementById("marker-quality-rating");
const btnTestMarker = document.getElementById("btn-test-marker");
const markerTestStatus = document.getElementById("marker-test-status");

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
// Login - Use Firebase Email/Password Auth (admin@gbrmuseum.test / GBRMu5281)
// Create this user in Firebase Console → Authentication → Users → Add user
// -------------------------------------------------------------------
const ADMIN_EMAIL = "admin@gbrmuseum.test";

btnAdminLoginSubmit.addEventListener("click", async () => {
  const password = adminPasswordInput.value;
  if (!password) {
    adminLoginError.classList.remove("hidden");
    return;
  }
  btnAdminLoginSubmit.disabled = true;
  adminLoginError.classList.add("hidden");
  console.log("[Admin] Signing in with email:", ADMIN_EMAIL);
  try {
    await firebase.auth().signInWithEmailAndPassword(ADMIN_EMAIL, password);
    console.log("[Admin] Signed in as:", firebase.auth().currentUser?.uid);
    screenLogin.classList.add("hidden");
    adminDashboard.classList.remove("hidden");
    loadAllData();
  } catch (err) {
    console.error("[Admin] Login failed:", err);
    let msg = "Login failed";
    if (err.code === "auth/wrong-password") msg = "Incorrect password";
    else if (err.code === "auth/user-not-found") msg = "Admin user not found. Create in Firebase Console: admin@gbrmuseum.test";
    else if (err.code === "auth/invalid-email") msg = "Invalid email format";
    else if (err.message) msg = err.message;
    adminLoginError.textContent = msg;
    adminLoginError.classList.remove("hidden");
  } finally {
    btnAdminLoginSubmit.disabled = false;
  }
});
adminPasswordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnAdminLoginSubmit.click();
});
btnLogout.addEventListener("click", () => {
  firebase.auth().signOut();
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
    console.log("[AI] Sending request to Groq proxy…");
    const res = await fetch(GROQ_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: query }],
        systemPrompt: `You are a museum cataloging assistant. The user pasted information about an artwork. Extract the following fields and return ONLY a valid JSON object with these exact keys: title, artist, year, location, description.

CRITICAL RULES:
1. Return ONLY the JSON object. No markdown, no explanations, no text before or after.
2. The description must be 2-3 sentences maximum. Keep it short so the JSON fits in the response.
3. If a field cannot be determined, use null.
4. The JSON must be complete and valid — do not cut it off.

Example output:
{"title":"The Starry Night","artist":"Vincent van Gogh","year":"1889","location":"MoMA, New York","description":"A swirling night sky over a village, painted by Van Gogh in 1889. One of the most recognized works in Western art."}`,
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

    const raw = data.content || "";
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
    const user = firebase.auth().currentUser;
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    const res = await fetch(`${FIREBASE_URL}/presence.json${authParam}`);
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
    const user = firebase.auth().currentUser;
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    const [artRes, lbRes, notesRes] = await Promise.all([
      fetch(`${FIREBASE_URL}/artworks.json${authParam}`),
      fetch(`${FIREBASE_URL}/leaderboard.json${authParam}`),
      fetch(`${FIREBASE_URL}/notes.json${authParam}`),
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
    const user = firebase.auth().currentUser;
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    const res = await fetch(`${FIREBASE_URL}/analytics_visits.json${authParam}`);
    const data = await res.json();
    cachedVisitTimestamps = data ? Object.values(data).map((v) => v.timestamp).filter(Boolean) : [];

    const staleCutoff = Date.now() - 35 * DAY;
    const staleEntries = data ? Object.entries(data).filter(([, v]) => v.timestamp < staleCutoff) : [];
    for (const [key] of staleEntries) {
      const authParam2 = user ? `?auth=${await user.getIdToken()}` : "";
      fetch(`${FIREBASE_URL}/analytics_visits/${key}.json${authParam2}`, { method: "DELETE" }).catch(() => {});
    }
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
let editingArtworkId = null;

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function resetArtworkForm() {
  editingArtworkId = null;
  document.getElementById("artwork-name").value = "";
  document.getElementById("artwork-artist").value = "";
  document.getElementById("artwork-year").value = "";
  document.getElementById("artwork-location").value = "";
  document.getElementById("artwork-details").value = "";
  artworkImageInput.value = "";
  artworkMarkerInput.value = "";
  artworkModelInput.value = "";
  artworkSkyboxInput.value = "";
  artworkModelScaleInput.value = "0.5";
  artworkModelForwardInput.value = "0.1";
  artworkImmersiveScaleInput.value = "1";
  artworkImmersiveRotationInput.value = "0 0 0";
  artworkImmersiveForwardInput.value = "-3";
  artworkMainInput.checked = true;
  artworkScannableInput.checked = true;
  artworkPublishedInput.checked = true;
  processedImageBase64 = null;
  imagePreview.classList.add("hidden");
  uploadPlaceholder.classList.remove("hidden");
  markerQualityWrap.classList.add("hidden");
  btnUploadArtwork.textContent = "Upload Artwork";
  btnCancelArtworkEdit.classList.add("hidden");
}

async function startArtworkSettingsEdit(art) {
  editingArtworkId = art.id;
  document.getElementById("artwork-name").value = art.name || "";
  document.getElementById("artwork-artist").value = art.artist || "";
  document.getElementById("artwork-year").value = art.year || "";
  document.getElementById("artwork-location").value = art.location || "";
  document.getElementById("artwork-details").value = art.details || "";
  artworkModelScaleInput.value = numberOrDefault(art.baseScale, 0.5);
  artworkModelForwardInput.value = numberOrDefault(art.modelPositionZ, 0.1);
  artworkImmersiveScaleInput.value = numberOrDefault(art.immersiveScale, 1);
  artworkImmersiveRotationInput.value = art.immersiveRotation || "0 0 0";
  artworkImmersiveForwardInput.value = numberOrDefault(art.immersiveForward, -3);
  artworkMainInput.checked = art.showInMainCollection !== false;
  artworkScannableInput.checked = art.scannable !== false;
  artworkPublishedInput.checked = art.published !== false;
  if (art.imageUrl || art.image) {
    imagePreview.src = art.imageUrl || art.image;
    imagePreview.classList.remove("hidden");
    uploadPlaceholder.classList.add("hidden");
  }
  if (art.markerImageUrl) {
    const file = await fetch(art.markerImageUrl).then(r => r.blob()).then(b => new File([b], "marker.jpg"));
    await analyzeMarkerQuality(file);
  }
  btnUploadArtwork.textContent = "Save Artwork Settings";
  btnCancelArtworkEdit.classList.remove("hidden");
  uploadStatus.textContent = `Editing ${art.name}. Change the AR model scale or forward position, then save.`;
  uploadStatus.className = "upload-status";
  document.getElementById("artwork-model-scale").scrollIntoView({ behavior: "smooth", block: "center" });
}

function storagePath(...parts) {
  return parts.flatMap((part) => part.split("/")).map((part) => encodeURIComponent(part)).join("/");
}

function publicAssetUrl(path) {
  return `https://twkgioiyfjfkppzerdii.supabase.co/storage/v1/object/public/gbr-assets/${path}`;
}

async function uploadSupabaseAsset(file, path) {
  const cleanPath = storagePath(path);
  const contentType = file.type || "application/octet-stream";

  console.log("[Admin] Uploading asset:", cleanPath, contentType);

  // Get signed URL from Edge Function
  const signedRes = await fetch(UPLOAD_SIGNED_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: cleanPath, contentType }),
  });
  console.log("[Admin] Signed URL response:", signedRes.status, signedRes.statusText);
  if (!signedRes.ok) {
    const err = await signedRes.json();
    console.error("[Admin] Signed URL error:", err);
    throw new Error(err.error || "Failed to get signed URL");
  }
  const { signedUrl, publicUrl } = await signedRes.json();
  console.log("[Admin] Got signed URL and public URL:", publicUrl);

  // Upload directly to Supabase Storage using signed URL
  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  console.log("[Admin] Upload response:", uploadRes.status, uploadRes.statusText);
  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    console.error("[Admin] Upload failed:", errText);
    throw new Error(`Upload failed (${uploadRes.status}): ${errText}`);
  }

  return publicUrl;
}

function fileExtension(file, fallback) {
  const match = file?.name?.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : fallback;
}

async function loadAdminArtworks() {
  adminArtworksList.innerHTML = `<p class="leaderboard-status">Loading…</p>`;
  try {
    const user = firebase.auth().currentUser;
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    const res = await fetch(`${FIREBASE_URL}/artworks.json${authParam}`);
    console.log("[Admin] Artworks response:", res.status, res.statusText);
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
        ${isBuiltin ? "" : `<div class="artwork-row-actions"><button class="btn-tiny artwork-edit-btn" data-artwork-id="${art.id}">Edit Settings</button><button class="admin-delete-btn" data-path="artworks/${art.id}" data-label="this artwork">Delete</button></div>`}
      </div>`;
      })
      .join("");

    attachDeleteHandlers();
adminArtworksList.querySelectorAll(".artwork-edit-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const artwork = uploadedArtworksCache.find((item) => item.key === button.dataset.artworkId);
        if (artwork) await startArtworkSettingsEdit({ ...artwork, id: artwork.key });
      });
    });
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

artworkMarkerInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) {
    markerQualityWrap.classList.add("hidden");
    return;
  }
  await analyzeMarkerQuality(file);
});

btnTestMarker.addEventListener("click", async () => {
  const file = artworkMarkerInput.files[0];
  if (!file) return;
  markerTestStatus.classList.remove("hidden");
  markerTestStatus.className = "upload-status";
  markerTestStatus.textContent = "Testing with MindAR compiler…";
  btnTestMarker.disabled = true;
  try {
    const result = await testMarkerWithCompiler(file);
    markerTestStatus.className = "upload-status success";
    markerTestStatus.textContent = `MindAR: ${result.features} feature points, quality ${(result.quality * 100).toFixed(0)}%`;
  } catch (err) {
    markerTestStatus.className = "upload-status error";
    markerTestStatus.textContent = err.message || "MindAR test failed";
  } finally {
    btnTestMarker.disabled = false;
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

async function analyzeMarkerQuality(file) {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let sum = 0;
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += gray;
    if (gray < min) min = gray;
    if (gray > max) max = gray;
  }
  const mean = sum / (data.length / 4);
  const contrast = max - min;
  const contrastNorm = Math.min(1, contrast / 128);

  const estimatedFeatures = Math.round((canvas.width * canvas.height / 10000) * contrastNorm * 100);

  let rating = "Poor";
  let ratingClass = "poor";
  if (contrastNorm > 0.5 && estimatedFeatures > 200) { rating = "Excellent"; ratingClass = "excellent"; }
  else if (contrastNorm > 0.3 && estimatedFeatures > 100) { rating = "Good"; ratingClass = "good"; }
  else if (contrastNorm > 0.15 && estimatedFeatures > 50) { rating = "Fair"; ratingClass = "fair"; }

  markerQualityImg.src = URL.createObjectURL(file);
  markerQualityResolution.textContent = `${img.width} × ${img.height} px`;
  markerQualityContrast.textContent = `${contrast} (${(contrastNorm * 100).toFixed(0)}%)`;
  markerQualityContrastBar.querySelector(".quality-bar-fill").style.width = `${contrastNorm * 100}%`;
  markerQualityFeatures.textContent = `~${estimatedFeatures}`;
  markerQualityRating.textContent = rating;
  markerQualityRating.className = `quality-rating ${ratingClass}`;

  markerQualityWrap.classList.remove("hidden");
}

async function testMarkerWithCompiler(file) {
  if (!window.MINDAR?.IMAGE?.Compiler) {
    await loadMindARCompiler();
  }
  const img = await loadImageFromFile(file);
  const canvas = downscaleImage(img, 700);
  const compiler = new window.MINDAR.IMAGE.Compiler();
  const compiled = await compiler.compileImageTargets([canvas]);
  const features = compiled?.targets?.[0]?.keypoints?.length || 0;
  const quality = Math.min(1, features / 500);
  return { features, quality };
}

function loadMindARCompiler() {
  return new Promise((resolve, reject) => {
    if (window.MINDAR?.IMAGE?.Compiler) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load MindAR compiler"));
    document.head.appendChild(script);
  });
}

btnUploadArtwork.addEventListener("click", async () => {
  if (editingArtworkId) {
    const baseScale = numberOrDefault(artworkModelScaleInput.value, NaN);
    const modelPositionZ = numberOrDefault(artworkModelForwardInput.value, NaN);
    const immersiveScale = numberOrDefault(artworkImmersiveScaleInput.value, NaN);
    const immersiveRotation = artworkImmersiveRotationInput.value.trim();
    const immersiveForward = numberOrDefault(artworkImmersiveForwardInput.value, NaN);
    if (!Number.isFinite(baseScale) || baseScale <= 0 || !Number.isFinite(modelPositionZ) || !Number.isFinite(immersiveScale) || immersiveScale <= 0 || !Number.isFinite(immersiveForward)) {
      uploadStatus.textContent = "Enter valid positive scales and valid forward positions.";
      uploadStatus.className = "upload-status error";
      return;
    }

    btnUploadArtwork.disabled = true;
    uploadStatus.textContent = "Saving artwork settings…";
    uploadStatus.className = "upload-status";
    try {
      const response = await fetch(`${FIREBASE_URL}/artworks/${editingArtworkId}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseScale, modelPositionZ, immersiveScale, immersiveRotation, immersiveForward }),
      });
      if (!response.ok) throw new Error(`Firebase artwork settings save failed (${response.status})`);
      uploadStatus.textContent = "Artwork settings saved successfully!";
      uploadStatus.className = "upload-status success";
      resetArtworkForm();
      loadAdminArtworks();
    } catch (err) {
      console.error("Artwork settings save failed:", err);
      uploadStatus.textContent = err?.message || "Could not save artwork settings.";
      uploadStatus.className = "upload-status error";
    } finally {
      btnUploadArtwork.disabled = false;
    }
    return;
  }

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
      baseScale: numberOrDefault(artworkModelScaleInput.value, 0.5),
      modelPositionZ: numberOrDefault(artworkModelForwardInput.value, 0.1),
      immersiveScale: numberOrDefault(artworkImmersiveScaleInput.value, 1),
      immersiveRotation: artworkImmersiveRotationInput.value.trim() || "0 0 0",
      immersiveForward: numberOrDefault(artworkImmersiveForwardInput.value, -3),
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
    resetArtworkForm();

    loadAdminArtworks();
    loadCounts();
  } catch (err) {
    console.error("Artwork upload failed:", err);
    uploadStatus.textContent = err?.message || "Upload failed. Check your connection.";
    uploadStatus.className = "upload-status error";
  } finally {
    btnUploadArtwork.disabled = false;
  }
});

btnCancelArtworkEdit.addEventListener("click", resetArtworkForm);

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

  arBuildStatus.textContent = "Compiling AR targets…";
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

  // Publish via firebase-admin Edge Function (requires admin auth)
  const user = firebase.auth().currentUser;
  if (!user) throw new Error("Not authenticated");
  const idToken = await user.getIdToken();
  const response = await fetch(`${FIREBASE_ADMIN_URL}/arBundleCurrent`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
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
      const user = firebase.auth().currentUser;
      if (!user) return;
      const idToken = await user.getIdToken();
      const path = btn.dataset.path;
      let endpoint = "";
      if (path.startsWith("leaderboard/")) endpoint = "/leaderboard";
      else if (path.startsWith("notes/")) endpoint = "/notes";
      else if (path.startsWith("artworks/")) endpoint = `/artworks/${path.split("/")[1]}`;
      else return;
      try {
        await fetch(`${FIREBASE_ADMIN_URL}${endpoint}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        });
      } catch (err) {
        console.error("Delete failed:", err);
      }
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
  const user = firebase.auth().currentUser;
  if (!user) return;
  const idToken = await user.getIdToken();
  await fetch(`${FIREBASE_ADMIN_URL}/leaderboard`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
  }).catch(() => {});
  loadAllData();
});
document.getElementById("btn-clear-notes").addEventListener("click", async () => {
  if (!confirm("Delete ALL guestbook notes? This can't be undone.")) return;
  const user = firebase.auth().currentUser;
  if (!user) return;
  const idToken = await user.getIdToken();
  await fetch(`${FIREBASE_ADMIN_URL}/notes`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
  }).catch(() => {});
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
