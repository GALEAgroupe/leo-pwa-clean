import { format, parseISO, subDays } from "date-fns";
import { isRewardsEnabled, BADGES } from "./rewards.js";

// =========================================================
// LEO Gamification Engine (Step 2)
// Goals:
// - Replace "tokens/shop" by a clearer progression:
//   XP -> Level -> League
// - Daily missions: AM / PM / Timer
// - Daily chest: unlocked when AM+PM are done.
//   Ethic: the child chooses 1 reward among 3 (no gambling-like lootbox).
//
// Notes:
// - Step 2 is intentionally compact: weekly album + advanced quests come in Step 3.
// - We reuse existing pin metadata from rewards.js (BADGES) to keep visuals consistent.
// =========================================================

export function dateKey(d = new Date()) {
  return format(d, "yyyy-MM-dd");
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

// ---- Level curve
// Cadrage produit : 1 niveau = 1000 points.
// (On garde le nom "xp" dans l'état pour compat, mais UI = "points").
export function getLevelInfo(xp = 0) {
  const x = Math.max(0, Math.floor(Number(xp) || 0));
  const nextCost = 1000;
  const level = Math.floor(x / nextCost) + 1;
  const curInLevel = x % nextCost;
  const pct = nextCost ? clamp(curInLevel / nextCost, 0, 1) : 0;
  return { level, curInLevel, nextCost, pct };
}

// ---- League from last 14 days regularity (full days)
export function computeLeague(completedDays = {}, end = dateKey()) {
  let full = 0;
  for (let i = 0; i < 14; i++) {
    const k = format(subDays(parseISO(end), i), "yyyy-MM-dd");
    if (completedDays?.[k]) full += 1;
  }
  const rate = full / 14;
  if (rate >= 0.85) return "Or";
  if (rate >= 0.7) return "Argent";
  return "Bronze";
}

export function computeStreak(completedDays = {}, end = dateKey()) {
  let streak = 0;
  let cursor = end;
  while (completedDays?.[cursor]) {
    streak += 1;
    cursor = format(subDays(parseISO(cursor), 1), "yyyy-MM-dd");
    if (streak > 365) break;
  }
  return streak;
}

function defaultGami() {
  return {
    xp: 0,
    // completedDays[dateKey] = true when AM+PM are done
    completedDays: {},
    streak: 0,
    league: "Bronze",

    // daily[dateKey] = { amAwarded, pmAwarded, timerDone, chestOpened, chestChoiceId }
    daily: {},

    // inventory of cosmetics (pins use BADGES ids to render)
    inventory: {
      pins: [],
      stickers: [],
    },

    // Récompenses “famille” revendiquées (par palier)
    // familyClaims[milestoneId] = { optionId, optionLabel, claimedAtISO }
    familyClaims: {},
  };
}

export function getGamiForChild(state, childId) {
  const g = state?.gami?.[childId];
  return g
    ? {
        ...defaultGami(),
        ...g,
        inventory: { ...defaultGami().inventory, ...(g.inventory || {}) },
        familyClaims: { ...(g.familyClaims || {}) },
      }
    : defaultGami();
}

function uniqPush(arr, value) {
  const a = Array.isArray(arr) ? [...arr] : [];
  if (!a.includes(value)) a.push(value);
  return a;
}

// ---- Rewards pool (Step 2)
const PIN_POOL = [
  "pin_gem",
  "pin_planet",
  "pin_star",
  "pin_rocket",
  "pin_shield",
  "pin_crown",
].filter((id) => !!BADGES?.[id]);

const STICKER_POOL = [
  "st_cosmo_01",
  "st_cosmo_02",
  "st_cosmo_03",
  "st_lab_01",
  "st_lab_02",
  "st_neo_01",
];

function hashString(str) {
  // tiny deterministic hash
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickDeterministic(arr, seed, count = 1) {
  const a = [...arr];
  const out = [];
  let s = seed;
  while (a.length && out.length < count) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const i = s % a.length;
    out.push(a.splice(i, 1)[0]);
  }
  return out;
}

export function getDailyChestChoices({ childId, dateKey: k }) {
  const seed = hashString(`${childId}:${k}:chest`);
  const pin = pickDeterministic(PIN_POOL, seed, 1)[0];
  const sticker = pickDeterministic(STICKER_POOL, seed ^ 0x9e3779b9, 1)[0];
  // Points bundle varies a bit
  const pts = 20 + (seed % 3) * 10; // 20/30/40

  return [
    {
      id: `pin:${pin}`,
      kind: "pin",
      title: "Nouveau pin",
      subtitle: BADGES?.[pin]?.label || "Pin",
      payload: { pinId: pin },
    },
    {
      id: `sticker:${sticker}`,
      kind: "sticker",
      title: "Sticker",
      subtitle: "À collectionner",
      payload: { stickerId: sticker },
    },
    {
      id: `points:${pts}`,
      kind: "points",
      title: "+Points",
      subtitle: `${pts} points`,
      payload: { points: pts },
    },
  ];
}

// ---- Core transitions

export function applyGamiFromLogTransition({ state, child, childId, dateKey: k, prevLog, nextLog }) {
  if (!childId || !child) return state;
  if (!isRewardsEnabled(child)) return state;

  const g0 = getGamiForChild(state, childId);
  const daily = { ...(g0.daily || {}) };
  const d0 = { ...(daily[k] || {}) };

  let xp = Number(g0.xp || 0);

  // Award XP once per slot when becoming true
  if (nextLog?.am && !d0.amAwarded) {
    xp += 10;
    d0.amAwarded = true;
  }
  if (nextLog?.pm && !d0.pmAwarded) {
    xp += 10;
    d0.pmAwarded = true;
  }

  // Full day bonus
  const full = !!(nextLog?.am && nextLog?.pm);
  if (full && !d0.dayAwarded) {
    xp += 15;
    d0.dayAwarded = true;
  }

  // completedDays + streak/league
  const completedDays = { ...(g0.completedDays || {}) };
  if (full) completedDays[k] = true;
  // if user unchecks, we keep completion for history BUT remove today if uncompleted
  if (!full && completedDays[k]) delete completedDays[k];

  const streak = computeStreak(completedDays, dateKey());
  const league = computeLeague(completedDays, dateKey());

  // Chest unlock depends on full day
  d0.chestUnlocked = full;

  daily[k] = d0;

  const g1 = {
    ...g0,
    xp,
    completedDays,
    streak,
    league,
    daily,
  };

  return {
    ...state,
    gami: {
      ...(state.gami || {}),
      [childId]: g1,
    },
  };
}

export function applyTimerComplete({ state, child, childId, dateKey: k, seconds, targetSeconds = 120 }) {
  if (!childId || !child) return state;
  if (!isRewardsEnabled(child)) return state;

  const g0 = getGamiForChild(state, childId);
  const daily = { ...(g0.daily || {}) };
  const d0 = { ...(daily[k] || {}) };

  if (d0.timerDone) return state; // once/day

  const s = Number(seconds || 0);
  const base = 12;
  const bonus = Math.abs(s - targetSeconds) <= 5 ? 8 : 0;
  const xpGain = base + bonus;

  d0.timerDone = true;
  d0.timerSeconds = s;
  daily[k] = d0;

  const g1 = {
    ...g0,
    xp: Number(g0.xp || 0) + xpGain,
    daily,
  };

  return {
    ...state,
    gami: {
      ...(state.gami || {}),
      [childId]: g1,
    },
  };
}

export function openDailyChest({ state, child, childId, dateKey: k, choiceId }) {
  if (!childId || !child) return state;
  if (!isRewardsEnabled(child)) return state;

  const g0 = getGamiForChild(state, childId);
  const daily = { ...(g0.daily || {}) };
  const d0 = { ...(daily[k] || {}) };
  if (!d0.chestUnlocked || d0.chestOpened) return state;

  const choices = getDailyChestChoices({ childId, dateKey: k });
  const picked = choices.find((c) => c.id === choiceId) || null;
  if (!picked) return state;

  let xp = Number(g0.xp || 0);
  const inventory = { ...(g0.inventory || {}) };
  const pins = Array.isArray(inventory.pins) ? [...inventory.pins] : [];
  const stickers = Array.isArray(inventory.stickers) ? [...inventory.stickers] : [];

  if (picked.kind === "pin") {
    const pinId = picked.payload?.pinId;
    if (pinId) inventory.pins = uniqPush(pins, pinId);
  }
  if (picked.kind === "sticker") {
    const stickerId = picked.payload?.stickerId;
    if (stickerId) inventory.stickers = uniqPush(stickers, stickerId);
  }
  if (picked.kind === "points") {
    const gain = Number(picked.payload?.points || 0);
    xp += gain;
  }

  d0.chestOpened = true;
  d0.chestChoiceId = picked.id;
  daily[k] = d0;

  const g1 = {
    ...g0,
    xp,
    daily,
    inventory,
  };

  return {
    ...state,
    gami: {
      ...(state.gami || {}),
      [childId]: g1,
    },
  };
}

// --- Récompenses “famille” : enregistrer le choix de l’enfant au palier
export function claimFamilyReward({ state, child, childId, milestoneId, optionId, optionLabel }) {
  if (!childId || !child) return state;
  if (!isRewardsEnabled(child)) return state;
  if (!milestoneId || !optionId) return state;

  const g0 = getGamiForChild(state, childId);
  const familyClaims = { ...(g0.familyClaims || {}) };
  // idempotent: on écrase si le parent veut corriger
  familyClaims[milestoneId] = {
    optionId: String(optionId),
    optionLabel: String(optionLabel || optionId),
    claimedAtISO: new Date().toISOString(),
  };

  const g1 = { ...g0, familyClaims };
  return {
    ...state,
    gami: {
      ...(state.gami || {}),
      [childId]: g1,
    },
  };
}
