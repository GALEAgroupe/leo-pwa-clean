const BASE_KEY = "leo_pwa_v1";

const defaultState = {
  user: { name: "Parent" },
  children: [
    {
      id: "c1",
      name: "Enfant",
      birthdate: "2020-06-01",
      lastConsultationDate: null,
    },
  ],
  activeChildId: "c1",
  logs: {},
  // ✅ Récompenses / jetons (par enfant)
  rewards: {},
  favorites: { videos: {} },
  settings: { cabinetPhone: "+33100000000" },
};

function storageKey(uid) {
  // uid = user.uid de Firebase (ou null si pas connecté)
  return uid ? `${BASE_KEY}_${uid}` : `${BASE_KEY}_anon`;
}

export function loadState(uid = null) {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    // fusion simple avec defaults pour éviter les "undefined" quand tu ajoutes des champs plus tard
    return {
      ...defaultState,
      ...parsed,
      favorites: { ...defaultState.favorites, ...(parsed.favorites || {}) },
      settings: { ...defaultState.settings, ...(parsed.settings || {}) },
    };
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
