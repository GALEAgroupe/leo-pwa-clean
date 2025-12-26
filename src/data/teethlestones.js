// src/data/teethMilestones.js
// Repères d'âges (peuvent varier d'un enfant à l'autre).
// Source synthèse : Cleveland Clinic (primary eruption + shedding + permanent eruption). :contentReference[oaicite:1]{index=1}

export const PRIMARY_ERUPTION = [
  { tooth: "Incisive centrale", upper: "8–12 mois", lower: "6–10 mois" },
  { tooth: "Incisive latérale", upper: "9–13 mois", lower: "10–16 mois" },
  { tooth: "1ère molaire", upper: "13–19 mois", lower: "14–18 mois" },
  { tooth: "Canine", upper: "16–22 mois", lower: "17–23 mois" },
  { tooth: "2ème molaire", upper: "25–33 mois", lower: "23–31 mois" },
];

export const PRIMARY_SHEDDING = [
  { tooth: "Incisive centrale", upper: "6–7 ans", lower: "6–7 ans" },
  { tooth: "Incisive latérale", upper: "7–8 ans", lower: "7–8 ans" },
  { tooth: "1ère molaire", upper: "9–11 ans", lower: "9–11 ans" },
  { tooth: "Canine", upper: "10–12 ans", lower: "9–12 ans" },
  { tooth: "2ème molaire", upper: "10–12 ans", lower: "10–12 ans" },
];

export const PERMANENT_ERUPTION = [
  { tooth: "1ère molaire (6 ans)", upper: "6–7 ans", lower: "6–7 ans" },
  { tooth: "Incisive centrale", upper: "7–8 ans", lower: "6–7 ans" },
  { tooth: "Incisive latérale", upper: "8–9 ans", lower: "7–8 ans" },
  { tooth: "1ère prémolaire", upper: "10–11 ans", lower: "10–12 ans" },
  { tooth: "2ème prémolaire", upper: "10–12 ans", lower: "11–12 ans" },
  { tooth: "Canine", upper: "11–12 ans", lower: "9–10 ans" },
  { tooth: "2ème molaire (12 ans)", upper: "12–13 ans", lower: "12–13 ans" },
  { tooth: "3ème molaire (sagesse)", upper: "17–21 ans", lower: "17–21 ans" },
];
