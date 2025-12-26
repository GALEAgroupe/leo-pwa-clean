// src/components/TeethTimelineCard.jsx
import { useContext, useMemo, useState, useEffect, useRef } from "react";
import { AppCtx } from "../app/AppShell.jsx";

/**
 * 🔧 CALIBRATE = true :
 * - tu peux "drag" les hotspots
 * - le bouton "Export coords" apparaît sur l'image (en haut à gauche)
 * - tu copies la sortie console et tu remplaces tes tableaux PRIMARY_* / PERM_*
 *
 * ✅ Remets CALIBRATE = false quand c'est fini.
 */
const CALIBRATE = false;

/** ---------- Helpers date / âge ---------- **/
function parseDob(raw) {
  if (!raw) return null;

  // ISO yyyy-mm-dd
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }

  // dd/mm/yyyy
  if (typeof raw === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split("/").map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return isNaN(d.getTime()) ? null : d;
  }

  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;

  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function ageInMonths(dob, ref = new Date()) {
  if (!dob) return null;
  let months =
    (ref.getFullYear() - dob.getFullYear()) * 12 + (ref.getMonth() - dob.getMonth());
  if (ref.getDate() < dob.getDate()) months -= 1;
  return Math.max(0, months);
}

function fmtRangeMonths([a, b], unit) {
  if (unit === "ans") {
    const ya = Math.round((a / 12) * 10) / 10;
    const yb = Math.round((b / 12) * 10) / 10;
    return `${ya}–${yb} ans`;
  }
  return `${a}–${b} mois`;
}

/** ---------- Assets (public/) ---------- **/
const ARCH_IMG = {
  primaryUpper: "/assets/dentition/primary-upper.png",
  primaryLower: "/assets/dentition/primary-lower.png",
  permanentUpper: "/assets/dentition/permanent-upper.png",
  permanentLower: "/assets/dentition/permanent-lower.png",
};

/** ---------- Données (tout en mois) ---------- **/
const DATASETS = {
  primaryEruption: {
    key: "primaryEruption",
    title: "Dents de lait",
    subtitle: "Éruption (fenêtres usuelles)",
    unit: "mois",
    horizonSoon: 3,
    arches: "primary",
    groups: {
      CI: { label: "Incisive centrale", upper: [8, 12], lower: [6, 10] },
      LI: { label: "Incisive latérale", upper: [9, 13], lower: [9, 16] },
      M1: { label: "1ère molaire", upper: [13, 19], lower: [13, 19] },
      C: { label: "Canine", upper: [16, 23], lower: [16, 23] },
      M2: { label: "2ème molaire", upper: [23, 33], lower: [23, 31] },
    },
  },

  primaryShedding: {
    key: "primaryShedding",
    title: "Dents de lait",
    subtitle: "Chute (fenêtres usuelles)",
    unit: "ans",
    horizonSoon: 6,
    arches: "primary",
    groups: {
      CI: { label: "Incisive centrale", upper: [6 * 12, 7 * 12], lower: [6 * 12, 7 * 12] },
      LI: { label: "Incisive latérale", upper: [7 * 12, 8 * 12], lower: [7 * 12, 8 * 12] },
      M1: { label: "1ère molaire", upper: [9 * 12, 11 * 12], lower: [9 * 12, 11 * 12] },
      C: { label: "Canine", upper: [9 * 12, 12 * 12], lower: [9 * 12, 12 * 12] },
      M2: { label: "2ème molaire", upper: [10 * 12, 12 * 12], lower: [10 * 12, 12 * 12] },
    },
  },

  permanentEruption: {
    key: "permanentEruption",
    title: "Dents définitives",
    subtitle: "Éruption (fenêtres usuelles)",
    unit: "ans",
    horizonSoon: 6,
    arches: "permanent",
    groups: {
      M1: { label: "1ère molaire", upper: [6 * 12, 7 * 12], lower: [6 * 12, 7 * 12] },
      CI: { label: "Incisive centrale", upper: [6 * 12, 7 * 12], lower: [6 * 12, 7 * 12] },
      LI: { label: "Incisive latérale", upper: [7 * 12, 8 * 12], lower: [7 * 12, 8 * 12] },
      C: { label: "Canine", upper: [11 * 12, 12 * 12], lower: [9 * 12, 10 * 12] },
      PM1: { label: "1ère prémolaire", upper: [10 * 12, 12 * 12], lower: [10 * 12, 12 * 12] },
      PM2: { label: "2ème prémolaire", upper: [10 * 12, 12 * 12], lower: [10 * 12, 12 * 12] },
      M2: { label: "2ème molaire", upper: [11 * 12, 13 * 12], lower: [11 * 12, 13 * 12] },
    },
  },
};

/** ---------- Hotspots (x/y en %) ---------- **/

// 10 dents (temporaires) — PRIMARY UPPER
const PRIMARY_UPPER_POINTS = [
  { id: "pu1", group: "M2", x: 10.10381711409396, y: 79.23467891701691 },
  { id: "pu2", group: "M1", x: 16.416736577181208, y: 53.6848792884371 },
  { id: "pu3", group: "C",  x: 23.504351929530202, y: 36.0595249731209 },
  { id: "pu4", group: "LI", x: 31.854289010067117, y: 23.880852311601995 },
  { id: "pu5", group: "CI", x: 43.516673657718115, y: 19.228325676864433 },
  { id: "pu6", group: "CI", x: 55.62998112416108,  y: 18.24112989932558 },
  { id: "pu7", group: "LI", x: 66.17685612416108,  y: 24.52350698856417 },
  { id: "pu8", group: "C",  x: 74.84270134228188,  y: 36.049750757501705 },
  { id: "pu9", group: "M1", x: 83.69992659395973,  y: 53.1204183364285 },
  { id: "pu10", group: "M2", x: 89.62746434563759, y: 79.90909979474146 },
];


const PRIMARY_LOWER_POINTS = [
  { id: "pl1", group: "M2", x: 10.647808305369127, y: 20.706675789267912 },
  { id: "pl2", group: "M1", x: 18.50356543624161,  y: 42.93079855341609 },
  { id: "pl3", group: "C",  x: 25.475828439597315, y: 64.5342586257453 },
  { id: "pl4", group: "LI", x: 33.9869966442953,   y: 76.4490274655459 },
  { id: "pl5", group: "CI", x: 44.7907927852349,   y: 81.2237317955234 },
  { id: "pl6", group: "CI", x: 56.793991191275175, y: 81.39722412276414 },
  { id: "pl7", group: "LI", x: 67.34479865771812,  y: 76.27309158440035 },
  { id: "pl8", group: "C",  x: 76.14828020134227,  y: 64.64666210536605 },
  { id: "pl9", group: "M1", x: 85.61897021812081,  y: 49.20828853484508 },
  { id: "pl10",group: "M2", x: 90.3038485738255,   y: 19.389600234581174 },
];


// 14 dents (permanentes) — calibrées sur ton PNG permanent
const PERM_LOWER_POINTS = [
  { id: "el1", group: "M2", x: 11.374003775167784, y: 13.976801988400995 },
  { id: "el2", group: "M1", x: 12.726772231543624, y: 33.80613090306545 },
  { id: "el3", group: "PM2", x: 15.744284815436242, y: 49.613918806959404 },
  { id: "el4", group: "PM1", x: 19.508966023489933, y: 60.50207125103563 },
  { id: "el5", group: "C", x: 22.841075922818792, y: 73.03893951946976 },
  { id: "el6", group: "LI", x: 32.15839974832215, y: 82.06793703396852 },
  { id: "el7", group: "CI", x: 43.46686241610738, y: 85.90223695111847 },
  { id: "el8", group: "CI", x: 55.74664429530202, y: 88.15741507870753 },
  { id: "el9", group: "LI", x: 67.11409395973155, y: 83.2079536039768 },
  { id: "el10", group: "C", x: 75.95690016778524, y: 73.47141673570837 },
  { id: "el11", group: "PM1", x: 79.35061870805369, y: 59.69014084507043 },
  { id: "el12", group: "PM2", x: 83.81658976510067, y: 48.91797845898923 },
  { id: "el13", group: "M1", x: 85.41448196308725, y: 32.470588235294116 },
  { id: "el14", group: "M2", x: 85.5494966442953, y: 13.00248550124275 },
];

const PERM_UPPER_POINTS = [
  { id: "eu1", group: "M2", x: 13.42412961409396, y: 88.50704225352113 },
  { id: "eu2", group: "M1", x: 15.257969798657717, y: 66.50869925434962 },
  { id: "eu3", group: "PM2", x: 17.778680788590602, y: 50.039768019884015 },
  { id: "eu4", group: "PM1", x: 21.455536912751676, y: 38.84838442419221 },
  { id: "eu5", group: "C", x: 25.7170197147651, y: 27.07539353769677 },
  { id: "eu6", group: "LI", x: 33.29357172818792, y: 17.459817729908863 },
  { id: "eu7", group: "CI", x: 57.04042575503355, y: 13.27754763877382 },
  { id: "eu8", group: "CI", x: 44.97430788590604, y: 12.420878210439106 },
  { id: "eu9", group: "LI", x: 68.4393351510067, y: 16.740679370339684 },
  { id: "eu10", group: "C", x: 76.65556837248322, y: 26.15410107705054 },
  { id: "eu11", group: "PM1", x: 81.94997902684564, y: 38.44739022369511 },
  { id: "eu12", group: "PM2", x: 85.64780830536914, y: 49.18475559237779 },
  { id: "eu13", group: "M1", x: 87.8880033557047, y: 67.34548467274234 },
  { id: "eu14", group: "M2", x: 89.22897441275168, y: 86.20049710024855 },
];


function pickFocusGroup(groups, ageM, which) {
  if (ageM == null) return null;
  const entries = Object.entries(groups).map(([k, v]) => ({ key: k, ...v }));
  const inWindow = entries.filter((t) => {
    const [a, b] = which === "upper" ? t.upper : t.lower;
    return ageM >= a && ageM <= b;
  });
  if (!inWindow.length) return null;
  inWindow.sort((p, q) => (which === "upper" ? p.upper[1] - q.upper[1] : p.lower[1] - q.lower[1]));
  return inWindow[0].key;
}

function pickSoonGroup(groups, ageM, which, horizonMonths) {
  if (ageM == null) return null;
  const entries = Object.entries(groups).map(([k, v]) => ({ key: k, ...v }));
  const upcoming = entries
    .map((t) => {
      const [a] = which === "upper" ? t.upper : t.lower;
      return { key: t.key, start: a };
    })
    .filter((x) => x.start > ageM && x.start - ageM <= horizonMonths);

  if (!upcoming.length) return null;
  upcoming.sort((p, q) => p.start - q.start);
  return upcoming[0].key;
}

function groupToType(group) {
  if (group === "CI" || group === "LI") return "incisor";
  if (group === "C") return "canine";
  if (group === "PM1" || group === "PM2") return "premolar";
  return "molar";
}

const HOTSPOT_SIZES = {
  incisor: { w: 34, h: 44 },
  canine: { w: 36, h: 46 },
  premolar: { w: 44, h: 52 },
  molar: { w: 54, h: 56 },
};

function Arch({
  imgSrc,
  points,
  selectedGroup,
  focusGroups,
  soonGroups,
  onPick,
  titleForExport = "POINTS",
  calibrate = false,
}) {
  const [draft, setDraft] = useState(points);
  const wrapRef = useRef(null);
  const draggingIdRef = useRef(null);

  useEffect(() => {
    if (calibrate) setDraft(points);
  }, [calibrate, points]);

  const activePoints = calibrate ? draft : points;

  const clamp = (v) => Math.max(0, Math.min(100, v));

  const setPointXY = (id, x, y) => {
    setDraft((prev) =>
      prev.map((p) => (p.id === id ? { ...p, x: clamp(x), y: clamp(y) } : p))
    );
  };

  const onPointerMove = (e) => {
    if (!calibrate) return;
    const id = draggingIdRef.current;
    if (!id) return;

    const el = wrapRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setPointXY(id, x, y);
  };

  const onPointerUp = () => {
    draggingIdRef.current = null;
  };

  const exportPoints = () => {
    // ✅ prêt à copier-coller dans ton fichier
    // eslint-disable-next-line no-console
    console.log(
      `\n// ${titleForExport}\nconst ${titleForExport} = ${JSON.stringify(draft, null, 2)};\n`
    );
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img src={imgSrc} alt="" className="w-full h-auto block select-none pointer-events-none" />

      {activePoints.map((p) => {
        const isSelected = selectedGroup === p.group;
        const isFocus = focusGroups?.has(p.group);
        const isSoon = soonGroups?.has(p.group);

        const shouldShowRing = calibrate || isSelected || isFocus || isSoon;

        const ring = !shouldShowRing
          ? "ring-0"
          : isSelected
          ? "ring-2 ring-sky-500"
          : isFocus
          ? "ring-2 ring-emerald-400"
          : isSoon
          ? "ring-2 ring-amber-300"
          : "ring-1 ring-gray-300";

        const type = groupToType(p.group);
        const { w, h } = HOTSPOT_SIZES[type] || { w: 40, h: 40 };

        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick?.(p.group)}
            onPointerDown={(e) => {
              if (!calibrate) return;
              e.preventDefault();
              draggingIdRef.current = p.id;
            }}
            className={[
              "absolute -translate-x-1/2 -translate-y-1/2",
              "bg-white/0",
              ring,
              // ✅ forme “dent” (si tu ajoutes du CSS, encore mieux)
              "rounded-[18px]",
              calibrate ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
            ].join(" ")}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${w}px`,
              height: `${h}px`,
            }}
            aria-label={`Dent ${p.group}`}
          />
        );
      })}

      {calibrate && (
        <div className="absolute left-2 top-2 flex gap-2">
          <button
            type="button"
            className="px-3 py-2 rounded-full border border-gray-200 bg-white/80 text-sm font-semibold"
            onClick={exportPoints}
          >
            Export coords
          </button>
        </div>
      )}
    </div>
  );
}

/** ---------- Summary “sans distinction” ---------- **/
function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function summarize(ds, ageM) {
  const focusU = pickFocusGroup(ds.groups, ageM, "upper");
  const focusL = pickFocusGroup(ds.groups, ageM, "lower");
  const soonU = pickSoonGroup(ds.groups, ageM, "upper", ds.horizonSoon);
  const soonL = pickSoonGroup(ds.groups, ageM, "lower", ds.horizonSoon);

  const focusLabels = uniq([focusU && ds.groups[focusU]?.label, focusL && ds.groups[focusL]?.label]);
  const soonLabels = uniq([soonU && ds.groups[soonU]?.label, soonL && ds.groups[soonL]?.label]);

  return { focusLabels, soonLabels };
}

export default function TeethTimelineCard() {
  const { state, activeChild } = useContext(AppCtx);
  const child = activeChild?.();

  const dob = useMemo(() => {
    const raw =
      child?.dob ??
      child?.birthDate ??
      child?.dateOfBirth ??
      child?.naissance ??
      child?.birth ??
      state?.children?.find?.((c) => c.id === child?.id)?.dob;
    return parseDob(raw);
  }, [child, state]);

  const ageM = useMemo(() => ageInMonths(dob), [dob]);

  /** ✅ Mode automatique selon âge */
  const stage = useMemo(() => {
    if (ageM == null) return "unknown";
    if (ageM < 72) return "primary"; // 0–6
    if (ageM < 144) return "mixed"; // 6–12
    return "permanent"; // 12+
  }, [ageM]);

  /** Sélection = { dsKey, group } */
  const [selection, setSelection] = useState({ dsKey: null, group: null });

  /** Datasets visibles selon stage */
  const visibleDatasets = useMemo(() => {
    if (stage === "primary") return [DATASETS.primaryEruption];
    if (stage === "permanent") return [DATASETS.permanentEruption];
    if (stage === "mixed") return [DATASETS.primaryShedding, DATASETS.permanentEruption];
    return [DATASETS.primaryEruption];
  }, [stage]);

  const summaries = useMemo(() => {
    if (!dob) return null;
    return visibleDatasets.map((ds) => ({ ds, ...summarize(ds, ageM) }));
  }, [dob, visibleDatasets, ageM]);

  const highlightByDs = useMemo(() => {
    const m = new Map();
    for (const ds of visibleDatasets) {
      const fU = pickFocusGroup(ds.groups, ageM, "upper");
      const fL = pickFocusGroup(ds.groups, ageM, "lower");
      const sU = pickSoonGroup(ds.groups, ageM, "upper", ds.horizonSoon);
      const sL = pickSoonGroup(ds.groups, ageM, "lower", ds.horizonSoon);

      m.set(ds.key, {
        focusSet: new Set([fU, fL].filter(Boolean)),
        soonSet: new Set([sU, sL].filter(Boolean)),
      });
    }
    return m;
  }, [visibleDatasets, ageM]);

  const selectedDs = selection.dsKey
    ? visibleDatasets.find((d) => d.key === selection.dsKey)
    : null;

  const selected =
    selectedDs && selection.group ? selectedDs.groups[selection.group] : null;

  function archesFor(ds) {
    const isPrimary = ds.arches === "primary";
    return isPrimary
      ? {
          upperImg: ARCH_IMG.primaryUpper,
          lowerImg: ARCH_IMG.primaryLower,
          upperPts: PRIMARY_UPPER_POINTS,
          lowerPts: PRIMARY_LOWER_POINTS,
        }
      : {
          upperImg: ARCH_IMG.permanentUpper,
          lowerImg: ARCH_IMG.permanentLower,
          upperPts: PERM_UPPER_POINTS,
          lowerPts: PERM_LOWER_POINTS,
        };
  }

  return (
    <div className="mt-4 rounded-3xl border border-[rgba(17,24,39,0.10)] bg-white/70 backdrop-blur p-4">
      <div className="font-serif text-xl font-bold">Dentition</div>

      {!dob ? (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white/70 p-4">
          <div className="font-semibold">Ajoute la date de naissance</div>
          <div className="text-gray-600 mt-1">
            Pour afficher les repères “À surveiller” et “À venir”, renseigne la date de naissance dans Profil.
          </div>
        </div>
      ) : (
        <>
          {/* À surveiller / À venir (sans distinction) */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-3xl border border-sky-200 bg-sky-50/50 p-4">
              <div className="relative w-full">
               <div className="font-serif text-2xl font-bold leading-tight pr-28">
                À surveiller
               </div>

                <span className="absolute right-0 top-0 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold whitespace-nowrap">
                Focus
               </span>
              </div>


              <div className="mt-3 rounded-2xl border border-sky-200 bg-white/70 p-3">
                {summaries?.some((s) => s.focusLabels.length) ? (
                  <ul className="space-y-2">
                    {summaries
                      .flatMap((s) => s.focusLabels)
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((t, i) => (
                        <li key={`f-${i}`} className="font-semibold">• {t}</li>
                      ))}
                  </ul>
                ) : (
                  <div className="text-gray-600">Rien de notable actuellement.</div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-sky-200 bg-sky-50/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="font-serif text-2xl font-bold leading-tight">À venir</div>
                <span className="px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800 font-semibold">
                  Bientôt
                </span>
              </div>

              <div className="mt-3 rounded-2xl border border-sky-200 bg-white/70 p-3">
                {summaries?.some((s) => s.soonLabels.length) ? (
                  <ul className="space-y-2">
                    {summaries
                      .flatMap((s) => s.soonLabels)
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((t, i) => (
                        <li key={`s-${i}`} className="font-semibold">• {t}</li>
                      ))}
                  </ul>
                ) : (
                  <div className="text-gray-600">Rien de notable dans les prochains mois.</div>
                )}
              </div>
            </div>
          </div>

          {/* Arcades automatiques */}
          <div className="mt-4 space-y-4">
            {visibleDatasets.map((ds) => {
              const arches = archesFor(ds);
              const hl = highlightByDs.get(ds.key);
              const isSelectedHere = selection.dsKey === ds.key ? selection.group : null;

              const exportUpper =
                ds.arches === "primary" ? "PRIMARY_UPPER_POINTS" : "PERM_UPPER_POINTS";
              const exportLower =
                ds.arches === "primary" ? "PRIMARY_LOWER_POINTS" : "PERM_LOWER_POINTS";

              return (
                <div key={ds.key} className="rounded-3xl border border-sky-200 bg-sky-50/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-serif text-xl font-bold">{ds.title}</div>
                      <div className="text-gray-600">{ds.subtitle}</div>
                    </div>
                    <div className="h-11 w-11 rounded-2xl border border-sky-200 bg-white/70 flex items-center justify-center text-sky-700">
                      <span className="text-lg">🦷</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Arch
                      imgSrc={arches.upperImg}
                      points={arches.upperPts}
                      selectedGroup={isSelectedHere}
                      focusGroups={hl?.focusSet}
                      soonGroups={hl?.soonSet}
                      onPick={(g) => setSelection({ dsKey: ds.key, group: g })}
                      calibrate={CALIBRATE}
                      titleForExport={exportUpper}
                    />

                    <div className="mt-2">
                      <Arch
                        imgSrc={arches.lowerImg}
                        points={arches.lowerPts}
                        selectedGroup={isSelectedHere}
                        focusGroups={hl?.focusSet}
                        soonGroups={hl?.soonSet}
                        onPick={(g) => setSelection({ dsKey: ds.key, group: g })}
                        calibrate={CALIBRATE}
                        titleForExport={exportLower}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <span className="px-4 py-2 rounded-full border border-gray-200 bg-white/70 font-semibold">
                        Clique une dent
                      </span>
                      <span className="px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 font-semibold text-emerald-800">
                        Focus
                      </span>
                      <span className="px-4 py-2 rounded-full border border-amber-200 bg-amber-50 font-semibold text-amber-800">
                        Bientôt
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Détail dent */}
          {selected && selectedDs && (
            <div className="mt-3 rounded-3xl border border-sky-200 bg-white/70 p-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl border border-sky-200 bg-sky-50 flex items-center justify-center">
                  🦷
                </div>

                <div className="flex-1">
                  {/* ✅ précision : temporaire/permanente + éruption/chute */}
                  <div className="text-gray-600 text-sm font-semibold">
                    {selectedDs.title} · {selectedDs.subtitle}
                  </div>

                  <div className="font-serif text-xl font-bold mt-1">{selected.label}</div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-gray-200 bg-white/70 p-3">
                      <div className="text-gray-600 text-sm">Haut</div>
                      <div className="font-bold">{fmtRangeMonths(selected.upper, selectedDs.unit)}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white/70 p-3">
                      <div className="text-gray-600 text-sm">Bas</div>
                      <div className="font-bold">{fmtRangeMonths(selected.lower, selectedDs.unit)}</div>
                    </div>
                  </div>

                  <div className="text-gray-600 mt-3">
                    Repères indicatifs. Un décalage modéré peut être normal.
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
