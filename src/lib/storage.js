const BASE_KEY = "leo_pwa_v1";

const defaultState = {
  user: { name: "Parent" },
  children: [
    {
      id: "c1",
      name: "Enfant",
      dob: "2020-06-01",
      avatar: { type: "preset", presetId: "girl_1" },
      lastDentalVisit: "",
      dentalRecallMonths: 6,
    },
  ],
  activeChildId: "c1",
  logs: {},
  // ✅ Récompenses / jetons (par enfant)
  rewards: {},
  // ✅ Nouvelle gamification (Step 2) : XP / niveaux / coffres (par enfant)
  gami: {},
  favorites: { videos: {} },
  settings: { cabinetPhone: "+33100000000" },
  timerSeconds: {},
  timerVideoId: {},
};

function storageKey(uid) {
  // uid = user.uid de Firebase (ou null si pas connecté)
  return uid ? `${BASE_KEY}_${uid}` : `${BASE_KEY}_anon`;
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeDob(child) {
  const dob = child?.dob || child?.birthDate || child?.birthdate || child?.birth_date || child?.birthDateISO || "";
  return typeof dob === "string" ? dob : "";
}

function migrateAvatar(child) {
  if (child?.avatar && typeof child.avatar === "object" && child.avatar.type) return child.avatar;

  // Photo legacy
  const photo = child?.photoDataUrl || child?.photo || null;
  if (typeof photo === "string" && photo.startsWith("data:")) {
    return { type: "photo", photoDataUrl: photo };
  }

  // Preset legacy -> map vers portraits kids
  const p = child?.avatarPreset || null;
  if (typeof p === "string" && p) {
    // Si déjà au bon format
    if (/^(girl|boy)_[1-3]$/.test(p)) return { type: "preset", presetId: p };

    const map = {
      "spark-sky": "girl_1",
      "star-lime": "girl_2",
      "tooth-mint": "boy_1",
    };
    return { type: "preset", presetId: map[p] || "boy_2" };
  }

  return { type: "preset", presetId: "girl_1" };
}

function migrateRewards(state) {
  const rewards = { ...(state.rewards || {}) };
  for (const [childId, r] of Object.entries(rewards)) {
    if (!r || typeof r !== "object") continue;
    const badges = Array.isArray(r.badges) ? r.badges.map(String) : [];
    const mapped = badges.map((b) => {
      if (b === "Série 3 jours") return "streak_3";
      if (b === "Série 7 jours") return "streak_7";
      if (b === "Série 14 jours") return "streak_14";
      return b;
    });
    rewards[childId] = { ...r, badges: mapped };
  }
  return { ...state, rewards };
}

function migrateState(parsed) {
  const base = {
    ...defaultState,
    ...parsed,
    favorites: { ...defaultState.favorites, ...(parsed.favorites || {}) },
    settings: { ...defaultState.settings, ...(parsed.settings || {}) },
    timerSeconds: { ...(parsed.timerSeconds || {}) },
    timerVideoId: { ...(parsed.timerVideoId || {}) },
    gami: { ...(parsed.gami || {}) },
  };

  // Children
  const children0 = Array.isArray(base.children) ? base.children : [];
  const children = children0.map((c) => {
    const id = c?.id || makeId();
    const name = (c?.name || c?.firstName || "Enfant").trim() || "Enfant";
    const dob = normalizeDob(c);
    const avatar = migrateAvatar(c);

    return {
      ...c,
      id,
      name,
      dob,
      // keep compat fields for older code paths
      firstName: name,
      birthDate: dob,
      birthdate: dob,
      avatar,
      lastDentalVisit: c?.lastDentalVisit || c?.lastDentistVisit || "",
      dentalRecallMonths: Number.isFinite(Number(c?.dentalRecallMonths)) ? Number(c.dentalRecallMonths) : 6,
    };
  });

  let activeChildId = base.activeChildId;
  if (!activeChildId || !children.some((c) => c.id === activeChildId)) {
    activeChildId = children[0]?.id || null;
  }

  const withChildren = { ...base, children, activeChildId };
  return migrateRewards(withChildren);
}

export function loadState(uid = null) {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return migrateState(parsed);
  } catch (e) {
    console.warn("loadState error", e);
    return defaultState;
  }
}

// NOTE: signature used throughout the app: saveState(state, uid)
export function saveState(state, uid = null) {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(state));
  } catch (e) {
    console.warn("saveState error", e);
  }
}

export function resetState(uid = null) {
  try {
    localStorage.removeItem(storageKey(uid));
  } catch (e) {
    console.warn("resetState error", e);
  }
}
