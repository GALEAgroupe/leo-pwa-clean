import { format, subDays, parseISO } from "date-fns";
import { ageInMonths } from "./age.js";

// -------------------------
// Config (6–10 ans)
// -------------------------

export function isAge6to10(child) {
  const dob = child?.dob || child?.birthDate || child?.birthdate || child?.birth_date || null;
  const m = ageInMonths(dob);
  if (m == null) return false;
  return m >= 72 && m < 120; // 6y -> <10y
}

export const SHOP_ITEMS = [
  {
    id: "item_5",
    cost: 5,
    title: "Badge / objet",
    subtitle: "Débloque un badge ou un petit objet (avatar, sticker…)",
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

const MILESTONES = {
  3: { bonus: 2, badge: "Série 3 jours" },
  7: { bonus: 5, badge: "Série 7 jours" },
  14: { bonus: 10, badge: "Série 14 jours" },
};

function todayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

function defaultRewards() {
  return {
    tokens: 0,
    badges: [],
    unlocked: [],
    redemptions: [],
    // flags pour éviter de “farmer” en cliquant on/off
    awarded: {
      // [dateKey]: { am:true, pm:true, day:true }
    },
    // streak et milestones (pas obligatoire, mais pratique à afficher)
    streak: 0,
    milestonesAwarded: {},
    completedDays: {},
  };
}

export function getRewardsForChild(state, childId) {
  const r = state?.rewards?.[childId];
  return r ? { ...defaultRewards(), ...r } : defaultRewards();
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

export function applyRewardsFromLogTransition({
  state,
  child,
  childId,
  dateKey,
  prevLog,
  nextLog,
}) {
  if (!childId || !child) return state;
  if (!isAge6to10(child)) return state;

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

  // Enregistre les jours complets (pour le streak) dès qu’un jour devient complet
  const completedDays = { ...(r0.completedDays || {}) };
  if (dayComplete) completedDays[dateKey] = true;

  // Recalcule le streak “aujourd’hui” à chaque update
  const streakNow = computeStreak(completedDays, todayKey());

  // Milestones: 3 / 7 / 14 jours -> badge + bonus tokens (une seule fois)
  const milestonesAwarded = { ...(r0.milestonesAwarded || {}) };
  const ms = MILESTONES[streakNow];
  let badges = Array.isArray(r0.badges) ? [...r0.badges] : [];

  if (ms && !milestonesAwarded[String(streakNow)]) {
    milestonesAwarded[String(streakNow)] = true;
    tokens += ms.bonus;
    if (!badges.includes(ms.badge)) badges.push(ms.badge);
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

export function redeemShopItem({ state, child, childId, itemId }) {
  if (!childId || !child) return state;
  if (!isAge6to10(child)) return state;

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

  const nextRewards = {
    ...r0,
    tokens: tokens - item.cost,
    redemptions,
  };

  return {
    ...state,
    rewards: {
      ...(state.rewards || {}),
      [childId]: nextRewards,
    },
  };
}
