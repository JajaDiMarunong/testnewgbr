// =====================================================================
// ADMIN PANEL — standalone page
// =====================================================================
const FIREBASE_URL = "https://gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app";
const EDGE_FUNCTIONS_BASE = "https://twkgioiyfjfkppzerdii.functions.supabase.co/functions/v1";
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
    inScavengerHunt: true,
    markerImage: "./assets/crisanto-marker.jpg",
  },
{
    id: "builtin-mcarthur",
    name: "General Douglas MacArthur",
    image: "./assets/mcarthurmarker.jpg",
    artist: "GBR Jr. Museum Collection",
    year: "20th Century",
    location: "GBR Jr. Museum, General Trias, Philippines",
    details: "General Douglas MacArthur (1880–1964) was a 5-star General of the Army and one of the most prominent military leaders in American history, best known for his command of Allied forces in the Southwest Pacific during World War II. Born on January 26, 1880, in Little Rock, Arkansas, and passing away on April 5, 1964, in Washington, D.C., MacArthur played a pivotal role in the history of the Philippines—first as Field Marshal of the Philippine Army and later as Supreme Commander of Allied Forces. After being forced to evacuate Corregidor in March 1942 under direct orders from President Franklin D. Roosevelt, he famously made his enduring personal pledge to the Filipino people at Terowie Railway Station in South Australia: \"I came through and I shall return.\" He fulfilled that promise two and a half years later on October 20, 1944, when he waded ashore at Red Beach in Palo, Leyte, declaring, \"People of the Philippines, I have returned!\"—a historic landing that initiated the liberation of the archipelago and cemented his legacy in Philippine history.",
    baseScale: 1,
    icon: "🎖️",
    hasModel: true,
    showInMainCollection: true,
    scannable: true,
    published: true,
    inScavengerHunt: true,
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
const adminNoteViewModal = document.getElementById("admin-note-view-modal");
const adminNoteViewContent = document.getElementById("admin-note-view-content");
const adminNoteViewName = document.getElementById("admin-note-view-name");
const btnAdminNoteViewClose = document.getElementById("btn-admin-note-view-close");
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
const artworkHuntInput = document.getElementById("artwork-hunt");
const btnCancelArtworkEdit = document.getElementById("btn-cancel-artwork-edit");
const btnNewArtwork = document.getElementById("btn-new-artwork");
const btnCloseArtworkDrawer = document.getElementById("btn-close-artwork-drawer");
const artworkDrawer = document.getElementById("artwork-drawer");
const artworkDrawerBackdrop = document.getElementById("artwork-drawer-backdrop");
const artworkDrawerTitle = document.getElementById("artwork-drawer-title");
const artworkDrawerEyebrow = document.getElementById("artwork-drawer-eyebrow");
const artworkSearchInput = document.getElementById("artwork-search");
const artworkHuntFilter = document.getElementById("artwork-hunt-filter");
const artworkSelectAll = document.getElementById("artwork-select-all");
const artworkSelectionCount = document.getElementById("artwork-selection-count");
const btnBulkEdit = document.getElementById("btn-bulk-edit");
const bulkEditPanel = document.getElementById("bulk-edit-panel");
const btnBulkClose = document.getElementById("btn-bulk-close");
const btnBulkApply = document.getElementById("btn-bulk-apply");
const bulkHunt = document.getElementById("bulk-hunt");
const bulkPublished = document.getElementById("bulk-published");
const bulkScannable = document.getElementById("bulk-scannable");
const bulkMain = document.getElementById("bulk-main");
const bulkEditStatus = document.getElementById("bulk-edit-status");
const artworkCollectionStatus = document.getElementById("artwork-collection-status");
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
  resetArtworkForm();
  adminDashboard.classList.add("hidden");
  screenLogin.classList.remove("hidden");
  adminPasswordInput.value = "";
  adminLoginError.classList.add("hidden");
});

// -------------------------------------------------------------------
// Tabs
// -------------------------------------------------------------------
const pageTitle = document.getElementById("page-title");
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    if (artworkDrawer.classList.contains("open")) resetArtworkForm();
    tabButtons.forEach((b) => b.classList.toggle("active", b === btn));
    tabPanels.forEach((p) => p.classList.toggle("hidden", p.id !== `tab-${tab}`));
    if (pageTitle && btn.dataset.pageTitle) pageTitle.textContent = btn.dataset.pageTitle;
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
3. If a field cannot be determined, use null. BUT — infer intelligently:
   - If no explicit title but the text centers on a specific person/figure/subject, use that subject's name as the title (e.g., "Portrait of [Name]" or just "[Name]")
   - If the text describes a historical figure, use their name as the title
   - If the text describes a specific artwork by name, use that name as the title
   - Extract artist from phrases like "by [Name]", "painted by [Name]", "created by [Name]", "sculpted by [Name]"
   - Extract year from any 4-digit year mentioned (1800-2025)
   - Extract location from museum names, cities, countries mentioned
4. The JSON must be complete and valid — do not cut it off.
5. Use null ONLY when truly no information exists for that field.

Examples:
Input: "The Starry Night is an oil-on-canvas painting by Dutch Post-Impressionist painter Vincent van Gogh. Painted in June 1889, it depicts the view from the east-facing window of his asylum room at Saint-Rémy-de-Provence. It has been in the permanent collection of the Museum of Modern Art in New York City since 1941."
Output: {"title":"The Starry Night","artist":"Vincent van Gogh","year":"1889","location":"MoMA, New York","description":"A swirling night sky over a village, painted by Van Gogh in 1889. One of the most recognized works in Western art."}

Input: "Portrait of Crisanto de los Reyes y Mendoza by Rafael del Casal. Undated. Located at GBR Jr. Museum, General Trias, Philippines."
Output: {"title":"Portrait of Crisanto de los Reyes y Mendoza","artist":"Rafael del Casal","year":"Undated","location":"GBR Jr. Museum, General Trias, Philippines","description":"Portrait of Crisanto de los Reyes y Mendoza by Rafael del Casal."}

Input: "This is a painting of Jose Rizal, the Philippine national hero. It was painted by Fabian de la Rosa in 1910. The artwork shows Rizal in a formal pose."
Output: {"title":"Portrait of Jose Rizal","artist":"Fabian de la Rosa","year":"1910","location":null,"description":"Portrait of Philippine national hero Jose Rizal, painted by Fabian de la Rosa in 1910."}

Input: "A sculpture of Andres Bonifacio by Guillermo Tolentino. Created in 1930. Currently displayed at the University of the Philippines."
Output: {"title":"Andres Bonifacio","artist":"Guillermo Tolentino","year":"1930","location":"University of the Philippines","description":"Sculpture of Philippine revolutionary Andres Bonifacio by Guillermo Tolentino, created in 1930."}`,
        jsonMode: true,
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
const STATS_DAY_MS = 24 * 60 * 60 * 1000;
let cachedVisitTimestamps = [];
let visitDataError = false;
let currentVisitsRange = "week";
let cachedKnownDevices = new Set();
let cachedLeaderboardStats = [];
let cachedNoteStats = [];
let cachedArtworkStats = [];

async function loadAdminStats() {
  await Promise.all([loadActiveNow(), loadVisitData(), loadCounts()]);
  renderVisitsChart(currentVisitsRange);
  renderAnalytics();
  setStatText(
    "stats-updated",
    `Updated ${new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
  );
}

function setStatText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function startOfLocalDay(timestamp = Date.now()) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function percentOf(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function formatHourRange(hour) {
  const start = new Date();
  start.setHours(hour, 0, 0, 0);
  const end = new Date();
  end.setHours((hour + 1) % 24, 0, 0, 0);
  const startLabel = start.toLocaleTimeString(undefined, { hour: "numeric" });
  const endLabel = end.toLocaleTimeString(undefined, { hour: "numeric" });
  return `${startLabel}–${endLabel}`;
}

async function loadActiveNow() {
  try {
    const user = firebase.auth().currentUser;
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    const res = await fetch(`${FIREBASE_URL}/presence.json${authParam}`);
    const data = await res.json();
    const entries = data ? Object.entries(data) : [];
    const activeCount = entries.filter(([, p]) => p && Date.now() - (p.timestamp || 0) < 60000).length;
    cachedKnownDevices = new Set(entries.map(([key]) => key));
    setStatText("stat-active-now", activeCount);
  } catch (err) {
    cachedKnownDevices = new Set();
    setStatText("stat-active-now", "—");
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

    cachedArtworkStats = [...BUILTIN_ARTWORKS, ...(artData ? Object.values(artData) : [])];
    cachedLeaderboardStats = lbData ? Object.entries(lbData) : [];
    cachedNoteStats = notesData ? Object.entries(notesData) : [];

    const uploadedCount = artData ? Object.keys(artData).length : 0;
    setStatText("stat-artwork-count", BUILTIN_ARTWORKS.length + uploadedCount);
    setStatText("stat-leaderboard-count", cachedLeaderboardStats.length);
    setStatText("stat-notes-count", cachedNoteStats.length);
  } catch (err) {
    cachedArtworkStats = [];
    cachedLeaderboardStats = [];
    cachedNoteStats = [];
    setStatText("stat-artwork-count", "—");
    setStatText("stat-leaderboard-count", "—");
    setStatText("stat-notes-count", "—");
  }
}

async function loadVisitData() {
  visitDataError = false;
  try {
    const user = firebase.auth().currentUser;
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    const res = await fetch(`${FIREBASE_URL}/analytics_visits.json${authParam}`);
    if (!res.ok) throw new Error(`analytics_visits: ${res.status} ${await res.text()}`);
    const data = await res.json();
    cachedVisitTimestamps = data
      ? Object.values(data).map((v) => v && v.timestamp).filter((t) => Number.isFinite(t))
      : [];

    const staleCutoff = Date.now() - 35 * STATS_DAY_MS;
    const staleEntries = data ? Object.entries(data).filter(([, v]) => v && v.timestamp < staleCutoff) : [];
    for (const [key] of staleEntries) {
      const authParam2 = user ? `?auth=${await user.getIdToken()}` : "";
      fetch(`${FIREBASE_URL}/analytics_visits/${key}.json${authParam2}`, { method: "DELETE" }).catch(() => {});
    }
  } catch (err) {
    cachedVisitTimestamps = [];
    visitDataError = true;
    console.error("[Admin] Could not load analytics:", err);
  }
}

function renderAnalytics() {
  const now = Date.now();
  const todayStart = startOfLocalDay(now);
  const weekStart = todayStart - 6 * STATS_DAY_MS;
  const previousWeekStart = weekStart - 7 * STATS_DAY_MS;
  const yesterdayStart = todayStart - STATS_DAY_MS;

  const visits = cachedVisitTimestamps.filter((t) => Number.isFinite(t));
  const todayVisits = visits.filter((t) => t >= todayStart).length;
  const yesterdayVisits = visits.filter((t) => t >= yesterdayStart && t < todayStart).length;
  const weekVisits = visits.filter((t) => t >= weekStart).length;
  const previousWeekVisits = visits.filter((t) => t >= previousWeekStart && t < weekStart).length;

  const noteCount = cachedNoteStats.length;
  const completionCount = cachedLeaderboardStats.length;
  const recentNoteCount = cachedNoteStats.filter(([, note]) => Number(note && note.timestamp) >= weekStart).length;

  setStatText("stat-visits-today", todayVisits);
  setStatText("stat-visits-week", weekVisits);
  setStatText("stat-visits-today-note", yesterdayVisits === 0 ? "No visits yesterday" : `${yesterdayVisits} yesterday`);
  setStatText("stat-notes-note", recentNoteCount === 0 ? "No notes in the last 7 days" : `${recentNoteCount} added in the last 7 days`);

  const weekChange = previousWeekVisits > 0
    ? Math.round(((weekVisits - previousWeekVisits) / previousWeekVisits) * 100)
    : null;
  setStatText(
    "stat-visits-week-note",
    weekChange === null
      ? (weekVisits > 0 ? "First week of recorded activity" : "No visits recorded yet")
      : `${weekChange >= 0 ? "+" : ""}${weekChange}% vs previous week`
  );

  const knownVisitors = new Set(cachedKnownDevices);
  cachedLeaderboardStats.forEach(([key, entry]) => knownVisitors.add(entry && entry.deviceId ? entry.deviceId : key));
  cachedNoteStats.forEach(([key]) => knownVisitors.add(key));
  const visitorCount = knownVisitors.size;
  const completionRate = Math.min(100, percentOf(completionCount, visitorCount));
  setStatText(
    "stat-completions-note",
    visitorCount > 0 ? `${completionRate}% of known visitors finished` : "No visitor activity yet"
  );

  const weekdayCounts = Array(7).fill(0);
  const recentCutoff = now - 28 * STATS_DAY_MS;
  visits.filter((t) => t >= recentCutoff).forEach((t) => {
    weekdayCounts[new Date(t).getDay()]++;
  });
  const busiestWeekday = weekdayCounts.indexOf(Math.max(...weekdayCounts));
  const busiestWeekdayCount = weekdayCounts[busiestWeekday];
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  setStatText(
    "insight-busiest-day",
    busiestWeekdayCount > 0 ? `${weekdayNames[busiestWeekday]} · ${busiestWeekdayCount}` : "No visits yet"
  );

  const hourCounts = Array(24).fill(0);
  visits.forEach((t) => {
    hourCounts[new Date(t).getHours()]++;
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakHourCount = hourCounts[peakHour];
  setStatText("insight-peak-hour", peakHourCount > 0 ? `${formatHourRange(peakHour)} · ${peakHourCount}` : "No visits yet");

  const dailyAverage = weekVisits / 7;
  setStatText(
    "insight-daily-average",
    weekVisits > 0 ? `${dailyAverage % 1 === 0 ? dailyAverage : dailyAverage.toFixed(1)} visits / day` : "No visits yet"
  );
  setStatText(
    "insight-week-change",
    weekChange === null
      ? (weekVisits > 0 ? "No previous data" : "No visits yet")
      : `${weekChange >= 0 ? "+" : ""}${weekChange}%`
  );

  const completionTimes = cachedLeaderboardStats
    .map(([, entry]) => Number(entry && entry.time))
    .filter((time) => Number.isFinite(time) && time >= 0);
  if (completionTimes.length > 0) {
    const averageTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    setStatText("insight-average-completion", formatTime(Math.round(averageTime)));
    setStatText("insight-fastest-completion", formatTime(Math.min(...completionTimes)));
  } else {
    setStatText("insight-average-completion", "No completions yet");
    setStatText("insight-fastest-completion", "No completions yet");
  }

  setStatText("journey-rate", `${completionRate}%`);
  setStatText("journey-completed", completionCount);
  setStatText("journey-visitors", visitorCount);
  setStatText("journey-notes", noteCount);
  const donut = document.getElementById("journey-donut");
  if (donut) donut.style.setProperty("--pct", String(completionRate));
  setStatText(
    "journey-footnote",
    visitorCount > 0
      ? `Based on ${visitorCount} visitor device${visitorCount === 1 ? "" : "s"} seen across presence, completion, and guestbook records.`
      : "No visitor devices have been recorded yet."
  );

  const noteMix = { text: 0, draw: 0, photo: 0 };
  cachedNoteStats.forEach(([, note]) => {
    const type = note && (note.type === "draw" || note.type === "photo") ? note.type : "text";
    noteMix[type]++;
  });
  const totalNotes = noteMix.text + noteMix.draw + noteMix.photo;
  ["text", "draw", "photo"].forEach((type) => {
    const value = noteMix[type];
    setStatText(`note-mix-${type}-count`, `${value} · ${percentOf(value, totalNotes)}%`);
    const bar = document.getElementById(`note-mix-${type}-bar`);
    if (bar) bar.style.width = `${percentOf(value, totalNotes)}%`;
  });
  setStatText(
    "note-mix-summary",
    totalNotes > 0
      ? `${recentNoteCount} added in the last 7 days · ${totalNotes} note${totalNotes === 1 ? "" : "s"} on the board.`
      : "No guestbook notes yet."
  );

  const artworks = cachedArtworkStats;
  const published = artworks.filter((art) => art && art.published !== false).length;
  const scannable = artworks.filter((art) => art
    && art.published !== false
    && art.scannable !== false
    && (art.markerImageUrl || art.markerImage || art.imageUrl || art.image)).length;
  const models = artworks.filter((art) => art && (art.hasModel || art.modelUrl)).length;
  const readiness = percentOf(scannable, artworks.length);

  setStatText("stat-artwork-count", artworks.length);
  setStatText("stat-artwork-published", published);
  setStatText("stat-artwork-scannable", scannable);
  setStatText("stat-artwork-models", models);
  setStatText("readiness-percent", `${readiness}%`);
  const readinessBar = document.getElementById("readiness-bar");
  if (readinessBar) readinessBar.style.width = `${readiness}%`;
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

  if (visitDataError) {
    visitsChart.innerHTML = `<p class="leaderboard-status">Couldn't load analytics data. Check the database rules and admin login.</p>`;
    visitsChartTotal.textContent = "";
    return;
  }

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
    .map((b) => {
      const height = b.count === 0 ? 0 : Math.max(4, Math.round((b.count / maxCount) * 100));
      return `
    <div class="visits-chart-bar" title="${b.label}: ${b.count} visit${b.count === 1 ? "" : "s"}">
      <span class="visits-chart-bar-count">${b.count}</span>
      <div class="visits-chart-bar-track">
        <div class="visits-chart-bar-fill" style="height: ${height}%;"></div>
      </div>
      <span class="visits-chart-bar-label">${b.label}</span>
    </div>`;
    })
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

function escapeAttr(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeNoteColor(color) {
  return /^#[0-9a-f]{3,8}$/i.test(color || "") ? color : "#f4d35e";
}

function noteTypeLabel(type) {
  if (type === "draw") return "Drawing";
  if (type === "photo") return "Photo";
  return "Text";
}

function notePreviewMarkup(note) {
  const type = note.type || "text";
  if (type === "photo" || type === "draw") {
    const src = type === "photo" ? note.photo : note.drawing;
    return src
      ? `<img src="${escapeAttr(src)}" alt="${noteTypeLabel(type)} note" loading="lazy" />`
      : `<div class="admin-note-preview-text">${noteTypeLabel(type)} note</div>`;
  }
  return `<div class="admin-note-preview-text">${escapeHtml(note.text || "")}</div>`;
}

function openAdminNoteView(note) {
  const type = note.type || "text";
  adminNoteViewContent.style.background = type === "photo" ? "#f7f4ec" : safeNoteColor(note.color);
  if (type === "photo" || type === "draw") {
    const src = type === "photo" ? note.photo : note.drawing;
    adminNoteViewContent.innerHTML = src
      ? `<img src="${escapeAttr(src)}" alt="${noteTypeLabel(type)} note" />`
      : `<p>No ${type} data saved for this note.</p>`;
  } else {
    adminNoteViewContent.innerHTML = `<p>${escapeHtml(note.text || "")}</p>`;
  }
  const dateStr = formatDateFull(note.timestamp);
  adminNoteViewName.textContent = `${noteTypeLabel(type)} · ${note.name || "Anonymous"}${dateStr ? " · " + dateStr : ""}`;
  adminNoteViewModal.classList.remove("hidden");
}

function attachNoteViewHandlers() {
  adminNotesList.querySelectorAll("[data-note-view]").forEach((el) => {
    el.addEventListener("click", () => {
      const entry = cachedNotes.find(([key]) => key === el.dataset.noteView);
      if (entry) openAdminNoteView(entry[1]);
    });
  });
}

btnAdminNoteViewClose.addEventListener("click", () => adminNoteViewModal.classList.add("hidden"));
adminNoteViewModal.addEventListener("click", (event) => {
  if (event.target === adminNoteViewModal) adminNoteViewModal.classList.add("hidden");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !adminNoteViewModal.classList.contains("hidden")) {
    adminNoteViewModal.classList.add("hidden");
  }
});

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

  adminNotesList.innerHTML = filtered
    .map(([key, note]) => {
      const type = note.type || "text";
      const isPhoto = type === "photo";
      const color = safeNoteColor(note.color);
      const previewStyle = isPhoto ? "" : ` style="background:${escapeAttr(color)}"`;
      const summary = type === "text" && note.text
        ? escapeHtml(note.text.slice(0, 120))
        : `${noteTypeLabel(type)} note`;
      return `
    <div class="admin-row admin-note-row">
      <button type="button" class="admin-note-preview${isPhoto ? " type-photo" : ""}"${previewStyle} data-note-view="${escapeAttr(key)}" aria-label="View ${noteTypeLabel(type).toLowerCase()} note">
        ${notePreviewMarkup(note)}
      </button>
      <div class="admin-row-info">
        <div class="admin-row-name">${escapeHtml(note.name || "Anonymous")}</div>
        <div class="admin-row-meta">${summary}</div>
        <div class="admin-row-date">${formatDateFull(note.timestamp)}</div>
      </div>
      <div class="admin-row-actions">
        <button type="button" class="btn-tiny admin-note-view-btn" data-note-view="${escapeAttr(key)}">View</button>
        <button class="admin-delete-btn" data-path="notes/${escapeAttr(key)}" data-label="this note">Delete</button>
      </div>
    </div>`;
    })
    .join("");

  attachDeleteHandlers();
  attachNoteViewHandlers();
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
let artworkSettingsCache = {};
let allArtworksCache = [];
let visibleArtworkIds = [];
let selectedArtworkIds = new Set();
let editingArtworkId = null;
let artworkSearchQuery = "";
let artworkFilterMode = "all";

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function openArtworkDrawer(title, eyebrow) {
  if (artworkDrawerTitle) artworkDrawerTitle.textContent = title;
  if (artworkDrawerEyebrow) artworkDrawerEyebrow.textContent = eyebrow;
  artworkDrawer.classList.add("open");
  artworkDrawerBackdrop.classList.add("open");
  artworkDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  artworkDrawer.scrollTop = 0;
}

function closeArtworkDrawer() {
  artworkDrawer.classList.remove("open");
  artworkDrawerBackdrop.classList.remove("open");
  artworkDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("drawer-open");
}

function effectiveHuntStatus(art) {
  const override = artworkSettingsCache[art.id]?.inScavengerHunt;
  if (override !== undefined) return override !== false;
  return art.inScavengerHunt !== false;
}

function artworkThumb(art) {
  return art.imageUrl || art.image || "";
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
  artworkHuntInput.checked = true;
  processedImageBase64 = null;
  imagePreview.classList.add("hidden");
  uploadPlaceholder.classList.remove("hidden");
  markerQualityWrap.classList.add("hidden");
  btnUploadArtwork.textContent = "Upload Artwork";
  btnUploadArtwork.disabled = false;
  uploadStatus.textContent = "";
  uploadStatus.className = "upload-status";
  closeArtworkDrawer();
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
  artworkHuntInput.checked = effectiveHuntStatus(art);
  if (art.imageUrl || art.image) {
    imagePreview.src = art.imageUrl || art.image;
    imagePreview.classList.remove("hidden");
    uploadPlaceholder.classList.add("hidden");
  } else {
    imagePreview.classList.add("hidden");
    uploadPlaceholder.classList.remove("hidden");
  }
  if (art.markerImageUrl) {
    const file = await fetch(art.markerImageUrl).then(r => r.blob()).then(b => new File([b], "marker.jpg"));
    await analyzeMarkerQuality(file);
  }
  btnUploadArtwork.textContent = "Save Artwork";
  uploadStatus.textContent = `Editing ${art.name}.`;
  uploadStatus.className = "upload-status";
  openArtworkDrawer("Edit Artwork", "Collection Entry");
  artworkDrawer.scrollTop = 0;
}

// Supabase client for direct uploads (using anon key)
const SUPABASE_URL = "https://twkgioiyfjfkppzerdii.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UxPFx1rFmy8g8CMaaqtQ1g_LuHnfvry";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function storagePath(...parts) {
  return parts.flatMap((part) => part.split("/")).map((part) => encodeURIComponent(part)).join("/");
}

function publicAssetUrl(path) {
  return `https://twkgioiyfjfkppzerdii.supabase.co/storage/v1/object/public/gbr-assets/${path}`;
}

async function uploadSupabaseAsset(file, path) {
  const cleanPath = storagePath(path);
  const contentType = file.type || "application/octet-stream";

  console.log("[Admin] Uploading asset directly via Supabase JS SDK:", cleanPath, contentType);

  const { data, error } = await supabaseClient.storage
    .from("gbr-assets")
    .upload(cleanPath, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error("[Admin] Upload failed:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  console.log("[Admin] Upload successful:", data);
  const { data: publicUrlData } = supabaseClient.storage.from("gbr-assets").getPublicUrl(cleanPath);
  return publicUrlData.publicUrl;
}

function fileExtension(file, fallback) {
  const match = file?.name?.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : fallback;
}

async function loadAdminArtworks() {
  adminArtworksList.innerHTML = `<p class="collection-empty">Loading artwork collection...</p>`;
  try {
    const user = firebase.auth().currentUser;
    const authParam = user ? `?auth=${await user.getIdToken()}` : "";
    const [res, settingsRes] = await Promise.all([
      fetch(`${FIREBASE_URL}/artworks.json${authParam}`),
      fetch(`${FIREBASE_URL}/artworkSettings.json${authParam}`).catch(() => null),
    ]);
    console.log("[Admin] Artworks response:", res.status, res.statusText);
    const data = await res.json();
    uploadedArtworksCache = data ? Object.entries(data).map(([key, val]) => ({ key, ...val })) : [];
    artworkSettingsCache = {};
    if (settingsRes?.ok) {
      try {
        artworkSettingsCache = (await settingsRes.json()) || {};
      } catch {
        artworkSettingsCache = {};
      }
    }

    const merged = [
      ...BUILTIN_ARTWORKS.map((a) => ({ ...a, _source: "builtin" })),
      ...uploadedArtworksCache.map((a) => ({ ...a, _source: "uploaded", id: a.key })),
    ];
    allArtworksCache = merged.map((art) => ({ ...art, inScavengerHunt: effectiveHuntStatus(art) }));

    const validIds = new Set(allArtworksCache.map((art) => art.id));
    selectedArtworkIds = new Set([...selectedArtworkIds].filter((id) => validIds.has(id)));
    updateArtworkCountLabel();
    renderAdminArtworks();

    if (!settingsRes?.ok) {
      console.warn("[Admin] artworkSettings could not be read. Deploy the updated Firebase rules to persist scavenger hunt changes for built-in artworks.");
    }
  } catch (err) {
    console.error("[Admin] Artworks load failed:", err);
    adminArtworksList.innerHTML = `<p class="collection-empty">Couldn't load artworks.</p>`;
  }
}

function updateArtworkCountLabel() {
  const huntCount = allArtworksCache.filter((art) => art.inScavengerHunt).length;
  document.getElementById("artworks-count-label").textContent = `${allArtworksCache.length} total | ${huntCount} in hunt`;
}

function filteredAdminArtworks() {
  const query = artworkSearchQuery.trim().toLowerCase();
  return allArtworksCache.filter((art) => {
    if (artworkFilterMode === "hunt" && !art.inScavengerHunt) return false;
    if (artworkFilterMode === "not-hunt" && art.inScavengerHunt) return false;
    if (artworkFilterMode === "draft" && art.published !== false) return false;
    if (!query) return true;
    return [art.name, art.artist, art.year, art.location]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

function renderAdminArtworks() {
  const visible = filteredAdminArtworks();
  visibleArtworkIds = visible.map((art) => art.id);

  if (!visible.length) {
    adminArtworksList.innerHTML = `<p class="collection-empty">No artworks match this search or filter.</p>`;
    updateArtworkSelectionUI();
    return;
  }

  adminArtworksList.innerHTML = visible
    .map((art) => {
      const isBuiltin = art._source === "builtin";
      const thumb = artworkThumb(art);
      const meta = [art.artist, art.year].filter(Boolean).join(" · ") || "No metadata";
      const selected = selectedArtworkIds.has(art.id);
      const thumbMarkup = thumb
        ? `<img class="artwork-row-thumb" src="${escapeAttr(thumb)}" alt="" onerror="this.style.display='none'" />`
        : `<div class="artwork-row-thumb artwork-thumb-fallback">${escapeHtml((art.name || "?").slice(0, 1))}</div>`;
      return `
      <div class="artwork-row ${selected ? "selected" : ""}" data-artwork-id="${escapeAttr(art.id)}">
        <label class="artwork-select-cell" title="Select ${escapeAttr(art.name || "artwork")}">
          <input class="artwork-select-input" type="checkbox" data-artwork-id="${escapeAttr(art.id)}" ${selected ? "checked" : ""} />
        </label>
        ${thumbMarkup}
        <div class="artwork-row-info">
          <p class="artwork-name">${escapeHtml(art.name)}</p>
          <p class="artwork-meta">${escapeHtml(meta)}</p>
          <div class="artwork-tags">
            <span class="artwork-source ${isBuiltin ? "builtin" : ""}">${isBuiltin ? "Built-in" : "Uploaded"}</span>
            <span class="status-pill ${art.published === false ? "draft" : "published"}">${art.published === false ? "Draft" : "Published"}</span>
            ${art.scannable === false ? "" : `<span class="status-pill">AR</span>`}
            <span class="status-pill ${art.inScavengerHunt ? "hunt" : "muted"}">${art.inScavengerHunt ? "Scavenger hunt" : "Not in hunt"}</span>
          </div>
        </div>
        <div class="artwork-row-controls">
          <label class="hunt-switch" title="Toggle scavenger hunt inclusion">
            <input class="hunt-toggle-input" type="checkbox" data-artwork-id="${escapeAttr(art.id)}" ${art.inScavengerHunt ? "checked" : ""} />
            <span class="hunt-track"></span>
            <span>Hunt</span>
          </label>
          ${isBuiltin ? "" : `
          <div class="artwork-row-actions">
            <button class="btn-tiny artwork-edit-btn" type="button" data-artwork-id="${escapeAttr(art.id)}">Edit</button>
            <button class="admin-delete-btn" type="button" data-path="artworks/${escapeAttr(art.id)}" data-label="this artwork">Delete</button>
          </div>`}
        </div>
      </div>`;
    })
    .join("");

  attachDeleteHandlers();
  adminArtworksList.querySelectorAll(".artwork-edit-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const artwork = allArtworksCache.find((item) => item.id === button.dataset.artworkId);
      if (artwork) await startArtworkSettingsEdit(artwork);
    });
  });
  adminArtworksList.querySelectorAll(".artwork-select-input").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selectedArtworkIds.add(checkbox.dataset.artworkId);
      else selectedArtworkIds.delete(checkbox.dataset.artworkId);
      updateArtworkSelectionUI();
    });
  });
  adminArtworksList.querySelectorAll(".hunt-toggle-input").forEach((checkbox) => {
    checkbox.addEventListener("change", () => updateArtworkHunt(checkbox.dataset.artworkId, checkbox.checked));
  });
  updateArtworkSelectionUI();
}

function updateArtworkSelectionUI() {
  const count = selectedArtworkIds.size;
  artworkSelectionCount.textContent = `${count} selected`;
  btnBulkEdit.disabled = count === 0;
  if (!count) closeBulkEditPanel();

  const visibleSelectedCount = visibleArtworkIds.filter((id) => selectedArtworkIds.has(id)).length;
  artworkSelectAll.checked = visibleArtworkIds.length > 0 && visibleSelectedCount === visibleArtworkIds.length;
  artworkSelectAll.indeterminate = visibleSelectedCount > 0 && visibleSelectedCount < visibleArtworkIds.length;

  adminArtworksList.querySelectorAll(".artwork-row").forEach((row) => {
    row.classList.toggle("selected", selectedArtworkIds.has(row.dataset.artworkId));
  });
}

function closeBulkEditPanel() {
  bulkEditPanel.classList.add("hidden");
  btnBulkEdit.textContent = "Bulk edit";
  bulkEditStatus.textContent = "";
  bulkEditStatus.className = "upload-status";
}

let collectionStatusTimer = null;
function setArtworkCollectionStatus(message, type = "success") {
  clearTimeout(collectionStatusTimer);
  artworkCollectionStatus.textContent = message;
  artworkCollectionStatus.className = `collection-status ${type}`;
  artworkCollectionStatus.classList.remove("hidden");
  if (type === "success") {
    collectionStatusTimer = setTimeout(() => artworkCollectionStatus.classList.add("hidden"), 5000);
  }
}

async function updateArtworkHunt(artworkId, shouldInclude) {
  const artwork = allArtworksCache.find((item) => item.id === artworkId);
  if (!artwork) return;
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Sign in again before changing scavenger hunt settings.");
    renderAdminArtworks();
    return;
  }

  try {
    const idToken = await user.getIdToken();
    let artworkSaved = false;
    let settingsSaved = false;
    let settingsError = null;

    if (artwork._source === "uploaded") {
      const artResponse = await fetch(`${FIREBASE_URL}/artworks/${encodeURIComponent(artworkId)}.json?auth=${idToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inScavengerHunt: shouldInclude }),
      });
      if (!artResponse.ok) throw new Error(`Artwork update failed (${artResponse.status}).`);
      artworkSaved = true;
      const cached = uploadedArtworksCache.find((item) => item.key === artworkId);
      if (cached) cached.inScavengerHunt = shouldInclude;
    }

    try {
      const settingsResponse = await fetch(`${FIREBASE_URL}/artworkSettings/${encodeURIComponent(artworkId)}.json?auth=${idToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inScavengerHunt: shouldInclude }),
      });
      if (!settingsResponse.ok) {
        throw new Error(settingsResponse.status === 401 || settingsResponse.status === 403
          ? "The artworkSettings Firebase rule is not deployed yet."
          : `Firebase returned ${settingsResponse.status}.`);
      }
      settingsSaved = true;
    } catch (error) {
      settingsError = error;
    }

    if (!settingsSaved && !artworkSaved) {
      throw settingsError || new Error("Could not save scavenger hunt setting.");
    }
    if (!settingsSaved) {
      console.warn("[Admin] Saved scavenger hunt setting on the artwork only:", settingsError?.message);
    }

    artworkSettingsCache[artworkId] = { ...(artworkSettingsCache[artworkId] || {}), inScavengerHunt: shouldInclude };
    artwork.inScavengerHunt = shouldInclude;
    updateArtworkCountLabel();
    renderAdminArtworks();
    setArtworkCollectionStatus(`${artwork.name} ${shouldInclude ? "added to" : "removed from"} the scavenger hunt.`);
  } catch (err) {
    console.error("[Admin] Scavenger hunt update failed:", err);
    setArtworkCollectionStatus(`Could not update scavenger hunt setting. ${err.message}`, "error");
    renderAdminArtworks();
  }
}

async function applyBulkEdit() {
  const selected = allArtworksCache.filter((art) => selectedArtworkIds.has(art.id));
  if (!selected.length) return;

  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Sign in again before editing artworks.");
    return;
  }

  const huntChoice = bulkHunt.value;
  const publishedChoice = bulkPublished.value;
  const scannableChoice = bulkScannable.value;
  const mainChoice = bulkMain.value;
  if ([huntChoice, publishedChoice, scannableChoice, mainChoice].every((choice) => choice === "keep")) {
    bulkEditStatus.textContent = "Choose at least one field to change.";
    bulkEditStatus.className = "upload-status error";
    return;
  }

  const idToken = await user.getIdToken();
  const errors = [];
  let uploadedUpdated = 0;
  let huntUpdated = 0;
  let huntFallback = 0;
  let skippedBuiltins = 0;

  btnBulkApply.disabled = true;
  bulkEditStatus.textContent = "Applying changes...";
  bulkEditStatus.className = "upload-status";

  for (const art of selected) {
    const visibilityChanges = publishedChoice !== "keep" || scannableChoice !== "keep" || mainChoice !== "keep";
    const huntValue = huntChoice === "keep" ? null : huntChoice === "yes";
    const updates = {};
    if (publishedChoice !== "keep") updates.published = publishedChoice === "yes";
    if (scannableChoice !== "keep") updates.scannable = scannableChoice === "yes";
    if (mainChoice !== "keep") updates.showInMainCollection = mainChoice === "yes";
    if (huntValue !== null && art._source === "uploaded") updates.inScavengerHunt = huntValue;

    if (visibilityChanges && art._source === "builtin") skippedBuiltins += 1;

    if (Object.keys(updates).length) {
      try {
        const response = await fetch(`${FIREBASE_URL}/artworks/${encodeURIComponent(art.id)}.json?auth=${idToken}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error(`artwork update failed (${response.status})`);
        uploadedUpdated += 1;
        if (huntValue !== null) art.inScavengerHunt = huntValue;
      } catch (err) {
        errors.push(`${art.name}: ${err.message}`);
      }
    }

    if (huntValue !== null) {
      try {
        const response = await fetch(`${FIREBASE_URL}/artworkSettings/${encodeURIComponent(art.id)}.json?auth=${idToken}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inScavengerHunt: huntValue }),
        });
        if (!response.ok) {
          throw new Error(response.status === 401 || response.status === 403
            ? "artworkSettings rule not deployed"
            : `settings update failed (${response.status})`);
        }
        artworkSettingsCache[art.id] = { ...(artworkSettingsCache[art.id] || {}), inScavengerHunt: huntValue };
        huntUpdated += 1;
      } catch (err) {
        if (art._source === "uploaded") {
          huntFallback += 1;
          console.warn("[Admin] Hunt saved on artwork but settings node failed:", err);
        } else {
          errors.push(`${art.name}: ${err.message}`);
        }
      }
    }
  }

  selectedArtworkIds.clear();
  await loadAdminArtworks();
  closeBulkEditPanel();
  [bulkHunt, bulkPublished, bulkScannable, bulkMain].forEach((select) => { select.value = "keep"; });
  btnBulkApply.disabled = false;

  if (errors.length) {
    setArtworkCollectionStatus(
      `Updated ${uploadedUpdated} artwork(s), ${huntUpdated} hunt setting(s). ${errors.length} failed: ${errors[0]}`,
      "error",
    );
  } else {
    const parts = [];
    if (huntUpdated) parts.push(`${huntUpdated} hunt setting(s)`);
    if (uploadedUpdated) parts.push(`${uploadedUpdated} artwork(s)`);
    let message = `Saved ${parts.join(" and ") || "changes"}.`;
    if (skippedBuiltins) message += " Built-in artworks only support hunt changes.";
    if (huntFallback) message += ` ${huntFallback} uploaded artwork(s) used the artwork fallback; deploy the artworkSettings rule for built-ins.`;
    setArtworkCollectionStatus(message, "success");
  }
}

artworkSearchInput.addEventListener("input", () => {
  artworkSearchQuery = artworkSearchInput.value;
  selectedArtworkIds.clear();
  renderAdminArtworks();
});
artworkHuntFilter.addEventListener("change", () => {
  artworkFilterMode = artworkHuntFilter.value;
  selectedArtworkIds.clear();
  renderAdminArtworks();
});
artworkSelectAll.addEventListener("change", () => {
  visibleArtworkIds.forEach((id) => {
    if (artworkSelectAll.checked) selectedArtworkIds.add(id);
    else selectedArtworkIds.delete(id);
  });
  updateArtworkSelectionUI();
});
btnBulkEdit.addEventListener("click", () => {
  const opening = bulkEditPanel.classList.contains("hidden");
  bulkEditPanel.classList.toggle("hidden", !opening);
  btnBulkEdit.textContent = opening ? "Hide bulk edit" : "Bulk edit";
  if (opening) {
    bulkEditStatus.textContent = "";
    bulkEditStatus.className = "upload-status";
  }
});
btnBulkClose.addEventListener("click", closeBulkEditPanel);
btnBulkApply.addEventListener("click", applyBulkEdit);
btnNewArtwork.addEventListener("click", () => {
  resetArtworkForm();
  openArtworkDrawer("Upload Artwork", "New Entry");
  requestAnimationFrame(() => document.getElementById("artwork-name").focus({ preventScroll: true }));
});
btnCloseArtworkDrawer.addEventListener("click", resetArtworkForm);
artworkDrawerBackdrop.addEventListener("click", resetArtworkForm);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!aiModal.classList.contains("hidden")) return;
  if (artworkDrawer.classList.contains("open")) resetArtworkForm();
  else if (!bulkEditPanel.classList.contains("hidden")) closeBulkEditPanel();
});

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
    uploadStatus.textContent = "Saving artwork settings...";
    uploadStatus.className = "upload-status";
    try {
      const user = firebase.auth().currentUser;
      if (!user) throw new Error("Not authenticated");
      const idToken = await user.getIdToken();
      const name = document.getElementById("artwork-name").value.trim();
      if (!name) throw new Error("Artwork title is required.");

      const payload = {
        name,
        artist: document.getElementById("artwork-artist").value.trim() || null,
        year: document.getElementById("artwork-year").value.trim() || null,
        location: document.getElementById("artwork-location").value.trim() || null,
        details: document.getElementById("artwork-details").value.trim(),
        baseScale,
        modelPositionZ,
        immersiveScale,
        immersiveRotation,
        immersiveForward,
        showInMainCollection: artworkMainInput.checked,
        scannable: artworkScannableInput.checked,
        published: artworkPublishedInput.checked,
        inScavengerHunt: artworkHuntInput.checked,
      };

      const response = await fetch(`${FIREBASE_URL}/artworks/${editingArtworkId}.json?auth=${idToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Firebase artwork settings save failed (${response.status})`);

      try {
        const settingsResponse = await fetch(`${FIREBASE_URL}/artworkSettings/${encodeURIComponent(editingArtworkId)}.json?auth=${idToken}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inScavengerHunt: artworkHuntInput.checked }),
        });
        if (!settingsResponse.ok) console.warn("[Admin] Could not save artworkSettings entry:", settingsResponse.status);
      } catch (settingsError) {
        console.warn("[Admin] Could not save artworkSettings entry:", settingsError);
      }

      uploadStatus.textContent = "Artwork saved successfully!";
      uploadStatus.className = "upload-status success";
      loadCounts();
      loadAdminArtworks();
      setTimeout(resetArtworkForm, 180);
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
      inScavengerHunt: artworkHuntInput.checked,
      createdAt: Date.now(),
    };

    const user = firebase.auth().currentUser;
    if (!user) throw new Error("Not authenticated");
    const idToken = await user.getIdToken();

    // Use Firebase REST API directly (supports CORS with auth param)
    const response = await fetch(`${FIREBASE_URL}/artworks/${artworkId}.json?auth=${idToken}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(artwork),
    });
    if (!response.ok) throw new Error(`Firebase artwork save failed (${response.status})`);

    try {
      const settingsResponse = await fetch(`${FIREBASE_URL}/artworkSettings/${encodeURIComponent(artworkId)}.json?auth=${idToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inScavengerHunt: artworkHuntInput.checked }),
      });
      if (!settingsResponse.ok) console.warn("[Admin] Could not save artworkSettings entry:", settingsResponse.status);
    } catch (settingsError) {
      console.warn("[Admin] Could not save artworkSettings entry:", settingsError);
    }

    uploadStatus.textContent = "Artwork uploaded successfully!";
    uploadStatus.className = "upload-status success";

    loadCounts();
    loadAdminArtworks();
    setTimeout(resetArtworkForm, 180);
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

  // Publish via Firebase REST API directly (supports CORS with auth param)
  const user = firebase.auth().currentUser;
  if (!user) throw new Error("Not authenticated");
  const idToken = await user.getIdToken();
  const manifestWithUrl = { ...manifest, manifestUrl };
  const response = await fetch(`${FIREBASE_URL}/arBundleCurrent.json?auth=${idToken}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(manifestWithUrl),
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
      btn.textContent = "Deleting...";
      const user = firebase.auth().currentUser;
      if (!user) return;
      const idToken = await user.getIdToken();
      const path = btn.dataset.path || "";
      const slashIndex = path.indexOf("/");
      const collection = slashIndex === -1 ? path : path.slice(0, slashIndex);
      const key = slashIndex === -1 ? "" : path.slice(slashIndex + 1);
      let endpoint = "";
      if (!key) return;
      if (collection === "leaderboard") endpoint = `/leaderboard/${encodeURIComponent(key)}.json`;
      else if (collection === "notes") endpoint = `/notes/${encodeURIComponent(key)}.json`;
      else if (collection === "artworks") endpoint = `/artworks/${encodeURIComponent(key)}.json`;
      else return;
      try {
        const res = await fetch(`${FIREBASE_URL}${endpoint}?auth=${idToken}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Delete failed. Make sure the admin database rules are deployed.");
      } finally {
        loadAllData();
      }
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
async function clearCollection(collection, label) {
  if (!confirm(`Delete ALL ${label}? This can't be undone.`)) return;
  const user = firebase.auth().currentUser;
  if (!user) return;
  const idToken = await user.getIdToken();
  try {
    const listRes = await fetch(`${FIREBASE_URL}/${collection}.json?auth=${idToken}`);
    if (!listRes.ok) throw new Error(`${listRes.status} ${await listRes.text()}`);
    const data = await listRes.json();
    const keys = data ? Object.keys(data) : [];
    const results = await Promise.all(keys.map((key) =>
      fetch(`${FIREBASE_URL}/${collection}/${encodeURIComponent(key)}.json?auth=${idToken}`, { method: "DELETE" })
    ));
    const failed = results.find((res) => !res.ok);
    if (failed) throw new Error(`${failed.status} ${await failed.text()}`);
  } catch (err) {
    console.error("Clear failed:", err);
    alert("Clear failed. Make sure the admin database rules are deployed.");
  } finally {
    loadAllData();
  }
}

document.getElementById("btn-clear-leaderboard").addEventListener("click", () => clearCollection("leaderboard", "leaderboard entries"));
document.getElementById("btn-clear-notes").addEventListener("click", () => clearCollection("notes", "guestbook notes"));

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
