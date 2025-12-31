// src/lib/familyRewards.js

/**
 * Récompenses “famille / parentales” (non matérielles) :
 * - Le parent valide une liste d’options.
 * - L’enfant déverrouille un palier puis choisit 1 option.
 *
 * Cadrage produit :
 * - 1 niveau = 1000 points.
 * - Les paliers se rejouent à chaque niveau.
 */

export const LEVEL_POINTS = 1000;

// Paliers à l’intérieur d’un niveau
export const LEVEL_MILESTONES = [200, 400, 600, 800, 1000];

// Récompenses parentales (à certains paliers, dans le niveau)
export const FAMILY_MILESTONES = [
  {
    id: "family_story",
    at: 400,
    title: "Choisir l’histoire du soir",
    subtitle: "Le parent valide une liste. L’enfant choisit.",
    category: "story",
    icon: "book",
  },
  {
    id: "family_snack",
    at: 600,
    title: "Choisir le dessert / goûter",
    subtitle: "Uniquement dans une liste validée.",
    category: "snack",
    icon: "cookie",
  },
  {
    id: "family_activity",
    at: 800,
    title: "Choisir une activité",
    subtitle: "Jeu, Lego, 10 min dessin animé…",
    category: "activity",
    icon: "spark",
  },
];

// Options par défaut (à adapter)
export const FAMILY_OPTIONS = {
  story: [
    { id: "story_1", label: "Choisir un livre (à la maison)" },
    { id: "story_2", label: "Choisir l’histoire courte" },
    { id: "story_3", label: "Choisir l’histoire longue" },
  ],
  snack: [
    { id: "snack_1", label: "Dessert (liste validée)" },
    { id: "snack_2", label: "Goûter (liste validée)" },
    { id: "snack_3", label: "Fruit + option" },
  ],
  activity: [
    { id: "act_1", label: "10 min dessin animé" },
    { id: "act_2", label: "Lego / construction" },
    { id: "act_3", label: "Jeu de société" },
    { id: "act_4", label: "Dessin (10–15 min)" },
  ],
};

export function getLevelProgress(points = 0) {
  const x = Math.max(0, Math.floor(Number(points) || 0));
  const level = Math.floor(x / LEVEL_POINTS) + 1;
  const current = x % LEVEL_POINTS;
  const target = LEVEL_POINTS;
  const pct = target ? Math.min(1, current / target) : 0;
  return { level, current, target, pct, totalPoints: x };
}

// ---- Back-compat exports (ancienne “season” API) ----
// On les conserve pour éviter de casser des imports historiques.
export const SEASON_XP = LEVEL_POINTS;
export const SEASON_MILESTONES = LEVEL_MILESTONES;
export function getSeasonProgress(xp = 0) {
  // xp = points (legacy naming)
  const p = getLevelProgress(xp);
  return { season: p.level, current: p.current, target: p.target, pct: p.pct, totalXp: p.totalPoints };
}
