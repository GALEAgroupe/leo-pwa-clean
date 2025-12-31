import { format, subDays, parseISO } from "date-fns";
import { ageInMonths } from "./age.js";

// -------------------------
// Config (récompenses)
// -------------------------
// ✅ Activation demandée : dès 3 ans.
// On garde un “cap” à 12 ans pour rester cohérent avec la cible kids.

export function isRewardsEnabled(child) {
  const dob =
    child?.dob || child?.birthDate || child?.birthdate || child?.birth_date || null;
  const m = ageInMonths(dob);
  if (m == null) return false;
  return m >= 36 && m < 144; // 3y -> <12y
}

// Back-compat (ancienne API) — conservée pour éviter de casser des imports.
// NB: le nom n'est plus “vrai”, mais le comportement est correct pour le produit.
export function isAge6to10(child) {
  return isRewardsEnabled(child);
}

export const SHOP_ITEMS = [
  {
    id: "item_5",
    cost: 5,
    title: "Badge / objet",
    subtitle: "Débloque un badge “pin” (avatar, sticker…)",
  },
  {
    id: "power_15",
    cost: 15,
    title: "Récompense “pouvoir”",
    subtitle: "Choisir une activité / histoire / petit privilège",
  },
  {
    id: "family_50",
    cost: 50,
    title: "Récompense famille",
    subtitle: "Soirée film, sortie… à définir ensemble",
  },
];

// Badges (IDs stables)
export const BADGES = {
  streak_3: { label: "Série 3 jours", pinText: "3J", pinVariant: "gold" },
  streak_7: { label: "Série 7 jours", pinText: "7J", pinVariant: "gold" },
  streak_14: { label: "Série 14 jours", pinText: "14J", pinVariant: "gold" },

  pin_gem: { label: "Pin : Gemme", pinText: "GEM" },
  pin_planet: { label: "Pin : Planète", pinText: "ORB" },
  pin_crown: { label: "Pin : Couronne", pinText: "CROWN" },
  pin_star: { label: "Pin : Étoile", pinText: "STAR" },
  pin_rocket: { label: "Pin : Fusée", pinText: "ROCK" },
  pin_shield: { label: "Pin : Bouclier", pinText: "SAFE" },
};

const COSMETIC_PINS = [
  "pin_gem",
  "pin_planet",
  "pin_crown",
  "pin_star",
  "pin_rocket",
  "pin_shield",
];

const MILESTONES = {
  3: { bonus: 2, badgeId: "streak_3" },
  7: { bonus: 5, badgeId: "streak_7" },
  14: { bonus: 10, badgeId: "streak_14" },
};

function todayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

function defaultRewards() {
  return {
    tokens: 0,
    badges: [],
    redemptions: [],
    // flags pour éviter de “farmer” en cliquant on/off
    awarded: {
      // [dateKey]: { am:true, pm:true, day:true }
    },
    // streak et milestones
    streak: 0,
    milestonesAwarded: {},
    completedDays: {},
  };
}

export function getRewardsForChild(state, childId) {
  const r = state?.rewards?.[childId];
  return r ? { ...defaultRewards(), ...r } : defaultRewards();
}

export function badgeLabel(badgeId) {
  return BADGES?.[badgeId]?.label || badgeId;
}

export function badgesToPins(badges = [], max = 3) {
  const uniq = Array.from(new Set(Array.isArray(badges) ? badges : [])).filter(Boolean);
  // On prend les derniers d’abord (plus “collection”)
  const ordered = uniq.slice().reverse();
  const pins = [];
  for (const id of ordered) {
    const meta = BADGES[id];
    if (!meta) continue;
    if (!meta.pinText) continue;
    pins.push({ id, text: meta.pinText, variant: meta.pinVariant || "dark" });
    if (pins.length >= max) break;
  }
  return pins;
}

export function computeStreak(completedDays, endKey = todayKey()) {
  // streak = nombre de jours consécutifs COMPLETS en finissant par endKey
  let streak = 0;
  let cursor = endKey;
  while (completedDays?.[cursor]) {
    streak += 1;
    const d = parseISO(cursor);
    cursor = format(subDays(d, 1), "yyyy-MM-dd");
  }
  return streak;
}

export function applyRewardsFromLogTransition({ state, child, childId, dateKey, prevLog, nextLog }) {
  if (!childId || !child) return state;
  if (!isRewardsEnabled(child)) return state;

  const r0 = getRewardsForChild(state, childId);
  const awarded = { ...(r0.awarded || {}) };
  const dayFlags = { ...(awarded[dateKey] || {}) };

  let tokens = Number(r0.tokens || 0);

  // 1 brossage validé = 1 jeton
  if (nextLog?.am && !dayFlags.am) {
    tokens += 1;
    dayFlags.am = true;
  }
  if (nextLog?.pm && !dayFlags.pm) {
    tokens += 1;
    dayFlags.pm = true;
  }

  // Jour complet = +1 jeton (une seule fois)
  const dayComplete = !!(nextLog?.am && nextLog?.pm);
  if (dayComplete && !dayFlags.day) {
    tokens += 1;
    dayFlags.day = true;
  }

  awarded[dateKey] = dayFlags;

  // Enregistre les jours complets (pour le streak)
  const completedDays = { ...(r0.completedDays || {}) };
  if (dayComplete) completedDays[dateKey] = true;

  // Recalcule le streak “aujourd’hui”
  const streakNow = computeStreak(completedDays, todayKey());

  // Milestones: 3 / 7 / 14 jours -> badge + bonus tokens (une seule fois)
  const milestonesAwarded = { ...(r0.milestonesAwarded || {}) };
  const ms = MILESTONES[streakNow];
  let badges = Array.isArray(r0.badges) ? [...r0.badges] : [];

  if (ms && !milestonesAwarded[String(streakNow)]) {
    milestonesAwarded[String(streakNow)] = true;
    tokens += ms.bonus;
    if (!badges.includes(ms.badgeId)) badges.push(ms.badgeId);
  }

  const nextRewards = {
    ...r0,
    tokens,
    awarded,
    completedDays,
    streak: streakNow,
    milestonesAwarded,
    badges,
  };

  return {
    ...state,
    rewards: {
      ...(state.rewards || {}),
      [childId]: nextRewards,
    },
  };
}

function pickRandom(arr) {
  if (!arr.length) return null;
  const i = Math.floor(Math.random() * arr.length);
  return arr[i];
}

export function redeemShopItem({ state, child, childId, itemId }) {
  if (!childId || !child) return state;
  if (!isRewardsEnabled(child)) return state;

  const item = SHOP_ITEMS.find((x) => x.id === itemId);
  if (!item) return state;

  const r0 = getRewardsForChild(state, childId);
  const tokens = Number(r0.tokens || 0);
  if (tokens < item.cost) return state;

  const redemptions = Array.isArray(r0.redemptions) ? [...r0.redemptions] : [];
  redemptions.unshift({
    id: globalThis.crypto?.randomUUID?.() || `redeem_${Date.now()}`,
    date: new Date().toISOString(),
    itemId: item.id,
    title: item.title,
    cost: item.cost,
  });

  let badges = Array.isArray(r0.badges) ? [...r0.badges] : [];

  // ✅ Gamification assumée : item_5 débloque un pin cosmétique
  if (item.id === "item_5") {
    const candidate = pickRandom(COSMETIC_PINS);
    if (candidate && !badges.includes(candidate)) badges.push(candidate);
  }

  const nextRewards = {
    ...r0,
    tokens: tokens - item.cost,
    redemptions,
    badges,
  };

  return {
    ...state,
    rewards: {
      ...(state.rewards || {}),
      [childId]: nextRewards,
    },
  };
}
