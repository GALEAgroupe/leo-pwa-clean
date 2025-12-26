// src/data/teethTimeline.js
// Repères indicatifs (variations normales). Unités en mois (M).
// Remarque: les “ans” sont convertis en mois pour simplifier les calculs.

export const TEETH_TIMELINE = {
  primaryEruption: [
    { tooth: "Incisive centrale", upper: { startM: 8, endM: 12 }, lower: { startM: 6, endM: 10 } },
    { tooth: "Incisive latérale", upper: { startM: 9, endM: 13 }, lower: { startM: 10, endM: 16 } },
    { tooth: "1ère molaire", upper: { startM: 13, endM: 19 }, lower: { startM: 14, endM: 18 } },
    { tooth: "Canine", upper: { startM: 16, endM: 22 }, lower: { startM: 17, endM: 23 } },
    { tooth: "2ème molaire", upper: { startM: 25, endM: 33 }, lower: { startM: 23, endM: 31 } },
  ],

  primaryShedding: [
    { tooth: "Incisive centrale", upper: { startM: 72, endM: 84 }, lower: { startM: 72, endM: 84 } }, // 6–7 ans
    { tooth: "Incisive latérale", upper: { startM: 84, endM: 96 }, lower: { startM: 84, endM: 96 } }, // 7–8 ans
    { tooth: "1ère molaire", upper: { startM: 108, endM: 132 }, lower: { startM: 108, endM: 132 } }, // 9–11 ans
    { tooth: "Canine", upper: { startM: 120, endM: 144 }, lower: { startM: 108, endM: 144 } }, // haut 10–12, bas 9–12
    { tooth: "2ème molaire", upper: { startM: 120, endM: 144 }, lower: { startM: 120, endM: 144 } }, // 10–12 ans
  ],

  permanentEruption: [
    { tooth: "1ère molaire (6 ans)", upper: { startM: 72, endM: 84 }, lower: { startM: 72, endM: 84 } }, // 6–7 ans
    { tooth: "Incisive centrale", upper: { startM: 84, endM: 96 }, lower: { startM: 72, endM: 84 } }, // haut 7–8, bas 6–7
    { tooth: "Incisive latérale", upper: { startM: 96, endM: 108 }, lower: { startM: 84, endM: 96 } }, // haut 8–9, bas 7–8
    { tooth: "Canine", upper: { startM: 132, endM: 144 }, lower: { startM: 108, endM: 120 } }, // haut 11–12, bas 9–10
    { tooth: "1ère prémolaire", upper: { startM: 120, endM: 132 }, lower: { startM: 120, endM: 144 } }, // haut 10–11, bas 10–12
    { tooth: "2ème prémolaire", upper: { startM: 120, endM: 144 }, lower: { startM: 132, endM: 144 } }, // haut 10–12, bas 11–12
    { tooth: "2ème molaire (12 ans)", upper: { startM: 144, endM: 156 }, lower: { startM: 144, endM: 156 } }, // 12–13 ans
    { tooth: "3ème molaire (sagesse)", upper: { startM: 204, endM: 252 }, lower: { startM: 204, endM: 252 } }, // 17–21 ans
  ],
};
