// src/pages/UrgenceTrauma.jsx
import { useContext, useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import ChildSwitcher from "../components/ChildSwitcher.jsx";
import { AppCtx } from "../app/AppShell.jsx";

/**
 * ⚠️ Disclaimer
 */
const DISCLAIMER =
  "Infos générales, ne remplace pas un avis médical. En cas de doute, contacte un professionnel. Si danger vital : 15 / 112.";

const DOCTOLIB_DENTIST_URL = "https://www.doctolib.fr/dentiste";

/* --------------------------------
   Helpers
--------------------------------- */
function nowPlusHours(h) {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d;
}

function formatDateFR(d) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(d);
  }
}

function makeId(prefix) {
  return globalThis.crypto?.randomUUID?.() || `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/* --------------------------------
   Rappels (in-app)
--------------------------------- */
function addReminder(setState, childId, { title, when, severity }) {
  const id = makeId("r");
  setState((s) => {
    const all = s.reminders || {};
    const list = Array.isArray(all[childId]) ? all[childId] : [];
    return {
      ...s,
      reminders: {
        ...all,
        [childId]: [
          ...list,
          { id, title, when: when.toISOString(), severity, createdAt: new Date().toISOString() },
        ],
      },
    };
  });
}

/* --------------------------------
   UI atoms (styles stables iPhone)
--------------------------------- */
function LevelBadge({ level }) {
  const cls =
    level === "danger"
      ? "border-red-200 bg-red-50 text-red-800"
      : level === "urgent"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : level === "soon"
      ? "border-sky-200 bg-sky-50 text-sky-800"
      : level === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-gray-200 bg-gray-50 text-gray-700";

  const label =
    level === "danger"
      ? "IMMÉDIAT"
      : level === "urgent"
      ? "24h"
      : level === "soon"
      ? "48h"
      : level === "ok"
      ? "Surveillance"
      : "Info";

  return (
    <span className={`px-3 py-1 rounded-full border text-xs font-extrabold ${cls}`}>
      {label}
    </span>
  );
}

function ChoiceButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full min-h-[54px]",
        "rounded-3xl border border-gray-200 bg-white",
        "px-4 py-4",
        "text-center font-semibold text-gray-900",
        "shadow-sm",
        "active:scale-[0.99] transition",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ActionLink({ href, children, variant = "primary" }) {
  const isHttp = String(href || "").startsWith("http");
  const isTel = String(href || "").startsWith("tel:");

  const base = [
    "w-full min-h-[48px]",
    "inline-flex items-center justify-center",
    "rounded-full border",
    "px-4 py-3",
    "text-sm font-semibold",
    "text-center leading-tight",
    "transition active:scale-[0.99]",
  ].join(" ");

  const cls =
    variant === "primary"
      ? "bg-[var(--leo-brand)] text-white border-[var(--leo-brand)]"
      : "bg-white text-gray-900 border-gray-200";

  if (!href) return null;

  return (
    <a
      className={`${base} ${cls}`}
      href={href}
      target={isHttp ? "_blank" : undefined}
      rel={isHttp ? "noreferrer" : undefined}
      // tel: sur iOS OK
      aria-label={isTel ? String(children) : undefined}
    >
      {children}
    </a>
  );
}

function ActionButton({ onClick, children, variant = "ghost" }) {
  const base = [
    "w-full min-h-[48px]",
    "inline-flex items-center justify-center",
    "rounded-full border",
    "px-4 py-3",
    "text-sm font-semibold",
    "text-center leading-tight",
    "transition active:scale-[0.99]",
  ].join(" ");

  const cls =
    variant === "primary"
      ? "bg-[var(--leo-brand)] text-white border-[var(--leo-brand)]"
      : "bg-white text-gray-900 border-gray-200";

  return (
    <button type="button" className={`${base} ${cls}`} onClick={onClick}>
      {children}
    </button>
  );
}

/* --------------------------------
   Arbre décisionnel — Douleur
   (clair + “quoi faire maintenant”)
--------------------------------- */
const PAIN_FLOW = {
  start: "p1",
  nodes: {
    p1: {
      type: "step",
      title: "Douleur / gonflement",
      question: "Difficulté à respirer, avaler, voix modifiée, bave inhabituelle ?",
      yes: "R_VITAL",
      no: "p2",
    },
    p2: {
      type: "step",
      title: "Douleur / gonflement",
      question: "Gonflement qui augmente (joue / bouche / cou), ou fièvre ?",
      yes: "R_URGENT_24H",
      no: "p3",
    },
    p3: {
      type: "step",
      title: "Douleur / gonflement",
      question: "Douleur très forte (réveille la nuit / pulsatile / empêche de manger) ?",
      yes: "R_RAPIDE_48H",
      no: "p4",
    },
    p4: {
      type: "step",
      title: "Douleur / gonflement",
      question: "Douleur brève au froid/sucré, sans gonflement ?",
      yes: "R_NON_URGENT",
      no: "R_DOUTE",
    },

    R_VITAL: {
      type: "result",
      level: "danger",
      title: "Urgence vitale",
      subtitle: "Appelle immédiatement le 15 ou le 112.",
      doNow: [
        "Reste avec l’enfant.",
        "Si gêne respiratoire : ne pas l’allonger complètement.",
        "Si gros gonflement du cou / bouche, difficulté à ouvrir les yeux : urgence.",
      ],
      avoid: ["Attendre “pour voir”.", "Donner à manger/boire si la déglutition est difficile."],
      actions: { kind: "vital" },
      reminder: null,
    },

    R_URGENT_24H: {
      type: "result",
      level: "urgent",
      title: "À voir en urgence (≤ 24h)",
      subtitle: "Gonflement/fièvre = avis dentaire rapide indispensable.",
      doNow: [
        "Prends RDV chez un dentiste aujourd’hui (ou au plus tard dans 24h).",
        "Froid local sur la joue (10 min, pause, 10 min).",
        "Alimentation molle, évite de mâcher du côté douloureux.",
        "Antalgique adapté à l’âge (ex : paracétamol/ibuprofène) selon notice ou avis pharmacien.",
        "Surveille : fièvre, gonflement qui augmente, difficulté à ouvrir la bouche.",
      ],
      avoid: [
        "Chaleur (bouillotte), sauna.",
        "Percer/“vider” le gonflement.",
        "Antibiotiques restants / automédication sans avis.",
      ],
      actions: { kind: "doctolib" },
      reminder: { hours: 6, title: "Douleur + gonflement/fièvre — prendre RDV urgent" },
    },

    R_RAPIDE_48H: {
      type: "result",
      level: "soon",
      title: "RDV rapide (24–48h)",
      subtitle: "Douleur forte persistante = à faire évaluer rapidement.",
      doNow: [
        "Prends RDV dans les 24–48h.",
        "Antalgique adapté à l’âge selon notice / avis pharmacien.",
        "Brossage doux + hygiène habituelle (sans “gratter” la zone).",
        "Évite les aliments très froids/chauds si ça déclenche.",
      ],
      avoid: ["Reporter plusieurs jours.", "Mâcher du côté douloureux."],
      actions: { kind: "doctolib" },
      reminder: { hours: 12, title: "Douleur forte — organiser RDV (48h)" },
    },

    R_NON_URGENT: {
      type: "result",
      level: "ok",
      title: "A priori non urgent",
      subtitle: "Surveille, et consulte si ça persiste ou s’aggrave.",
      doNow: [
        "Surveille 48–72h.",
        "Si la douleur devient plus fréquente / plus forte : prends RDV.",
        "Évite les déclencheurs (froid/sucré) temporairement.",
      ],
      avoid: ["Ignorer si ça change (gonflement, fièvre, douleur nocturne)."],
      actions: { kind: "doctolib" },
      reminder: { hours: 48, title: "Douleur dentaire — re-évaluer" },
    },

    R_DOUTE: {
      type: "result",
      level: "info",
      title: "En cas de doute",
      subtitle: "Si tu n’es pas sûr, mieux vaut demander un avis.",
      doNow: [
        "Si la douleur est notable : prends RDV.",
        "Si léger : surveille 24–48h.",
        "Si aggravation : RDV urgent.",
      ],
      avoid: [],
      actions: { kind: "doctolib" },
      reminder: { hours: 24, title: "Douleur dentaire — re-évaluer" },
    },
  },
};

/* --------------------------------
   Arbre décisionnel — Trauma
   (insistance : avis dentaire systématique)
--------------------------------- */
const TRAUMA_FLOW = {
  start: "t0",
  nodes: {
    t0: {
      type: "picker",
      title: "Trauma / choc",
      question: "Quel est le problème principal ?",
      options: [
        { id: "avulsion", label: "Dent sortie entièrement (expulsée)" },
        { id: "fracture", label: "Dent cassée / fêlée" },
        { id: "move", label: "Dent bougée / décalée / enfoncée" },
        { id: "soft", label: "Plaie lèvre / gencive (saignement)" },
      ],
      next: "t1",
    },
    t1: {
      type: "stepToothType",
      title: "Trauma / choc",
      question: "C’est une dent de lait ou une dent définitive ?",
      options: [
        { id: "perm", label: "Dent définitive" },
        { id: "prim", label: "Dent de lait" },
        { id: "unknown", label: "Je ne sais pas" },
      ],
      next: "t2",
    },
    t2: {
      type: "resultByScenario",
    },
  },
};

function buildTraumaResult({ toothType, scenario }) {
  // Message commun : avis dentaire fortement recommandé dans TOUS les traumas
  const always = [
    "⚠️ Après un choc, même si tout semble “ok”, un avis dentaire est recommandé : la dent peut souffrir sans que ça se voie tout de suite.",
    "Prends rendez-vous chez un dentiste dès que possible (idéalement aujourd’hui / sous 24h).",
  ];

  const base = {
    level: "soon",
    title: "Trauma dentaire",
    subtitle: "Un avis dentaire est recommandé.",
    doNow: [...always],
    avoid: [],
    actions: { kind: "doctolib_trauma" },
    reminder: { hours: 6, title: "Trauma dentaire — prendre RDV pour avis" },
  };

  if (scenario === "avulsion") {
    if (toothType === "perm") {
      return {
        level: "danger",
        title: "Dent définitive expulsée : URGENCE",
        subtitle: "Le temps compte : consulte immédiatement.",
        doNow: [
          "Si tu retrouves la dent : tiens-la par la couronne (pas la racine).",
          "Si elle est sale : rinçage TRÈS bref eau/sérum, sans frotter.",
          "Si possible et enfant coopératif : réinsérer doucement la dent dans l’alvéole (sinon ne force pas).",
          "Sinon : conserver la dent dans du lait (ou sérum physiologique).",
          "Va en urgence chez un dentiste / service adapté.",
        ],
        avoid: ["Frotter la racine.", "Laisser la dent sécher.", "Réimplanter si tu penses que c’est une dent de lait."],
        actions: { kind: "vital_plus_doctolib" },
        reminder: null,
      };
    }
    // dent de lait / inconnu
    return {
      ...base,
      level: "urgent",
      title: "Dent de lait expulsée",
      subtitle: "Ne pas réimplanter. Avis dentaire recommandé (aujourd’hui).",
      doNow: [
        ...always,
        "Compression douce si saignement.",
        "Froid sur la joue (10 min, pause, 10 min).",
      ],
      avoid: ["Réimplanter une dent de lait."],
    };
  }

  if (scenario === "fracture") {
    return {
      ...base,
      level: toothType === "perm" ? "urgent" : "soon",
      title: "Dent cassée / fêlée",
      subtitle: "Avis dentaire recommandé rapidement.",
      doNow: [
        ...always,
        "Si possible, récupère le morceau (conserve dans du lait/sérum).",
        "Évite de croquer du côté cassé.",
        "Si douleur forte ou point rouge visible au centre : RDV le jour même.",
      ],
      avoid: ["Mâcher du côté cassé.", "Toucher la zone avec des objets."],
    };
  }

  if (scenario === "move") {
    return {
      ...base,
      level: "urgent",
      title: "Dent déplacée / enfoncée / mobile",
      subtitle: "Avis dentaire rapide indispensable.",
      doNow: [
        ...always,
        "Ne manipule pas la dent, ne tente pas de la remettre en place.",
        "Alimentation molle, évite de mordre devant.",
        "Froid sur la joue (10 min, pause, 10 min).",
        "Si la dent gêne la fermeture de la bouche : RDV immédiat.",
      ],
      avoid: ["Forcer la dent à revenir.", "Mordre sur des aliments durs."],
    };
  }

  // soft tissue
  return {
    ...base,
    level: "soon",
    title: "Plaie lèvre / gencive",
    subtitle: "Souvent bénin, mais vérification recommandée.",
    doNow: [
      ...always,
      "Compression continue 10 minutes (sans relâcher) si ça saigne.",
      "Rinçage doux à l’eau après arrêt du saignement.",
      "Si la plaie est large, si la lèvre est ouverte, ou si le saignement ne s’arrête pas : urgence médicale.",
    ],
    avoid: ["Rincer fort / frotter.", "Relâcher la compression toutes les 30 secondes."],
  };
}

/* --------------------------------
   Page
--------------------------------- */
export default function UrgenceTrauma() {
  const { state, setState, activeChild } = useContext(AppCtx);
  const child = activeChild?.() || null;
  const childId = child?.id || state.activeChildId || null;

  // Parcours (arbre)
  const [mode, setMode] = useState(null); // "pain" | "trauma"
  const [nodeId, setNodeId] = useState(null);
  const [traumaScenario, setTraumaScenario] = useState(null);
  const [answers, setAnswers] = useState([]); // [{q,a}]
  const [history, setHistory] = useState([]); // snapshots for Back

  const flow = useMemo(() => (mode === "pain" ? PAIN_FLOW : mode === "trauma" ? TRAUMA_FLOW : null), [mode]);
  const node = useMemo(() => (flow && nodeId ? flow.nodes[nodeId] : null), [flow, nodeId]);

  const resetFlow = () => {
    setMode(null);
    setNodeId(null);
    setTraumaScenario(null);
    setAnswers([]);
    setHistory([]);
  };

  const startPain = () => {
    setMode("pain");
    setNodeId(PAIN_FLOW.start);
    setTraumaScenario(null);
    setAnswers([]);
    setHistory([]);
  };

  const startTrauma = () => {
    setMode("trauma");
    setNodeId(TRAUMA_FLOW.start);
    setTraumaScenario(null);
    setAnswers([]);
    setHistory([]);
  };

  const pushHistory = () => {
    setHistory((h) => [
      ...h,
      {
        nodeId,
        traumaScenario,
        answers: answers.slice(),
      },
    ]);
  };

  const goBack = () => {
    setHistory((h) => {
      const last = h[h.length - 1];
      if (!last) {
        resetFlow();
        return [];
      }
      setNodeId(last.nodeId);
      setTraumaScenario(last.traumaScenario);
      setAnswers(last.answers);
      return h.slice(0, -1);
    });
  };

  const saveReminderFromResult = (result) => {
    if (!childId) return;
    if (!result?.reminder) return;

    const when = nowPlusHours(result.reminder.hours);
    addReminder(setState, childId, {
      title: result.reminder.title,
      when,
      severity: result.level || "info",
    });
  };

  const renderNavRow = () => (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <ActionButton onClick={goBack} variant="ghost">
        ← Retour
      </ActionButton>
      <ActionButton onClick={resetFlow} variant="ghost">
        Recommencer
      </ActionButton>
    </div>
  );

  const renderResultActions = (result) => {
    const kind = result?.actions?.kind || "doctolib";

    // Vital-only
    if (kind === "vital") {
      return (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ActionLink href="tel:15" variant="primary">
              Appeler le 15
            </ActionLink>
            <ActionLink href="tel:112" variant="ghost">
              Appeler le 112
            </ActionLink>
          </div>
          {renderNavRow()}
        </>
      );
    }

    // Vital + optional doctolib (pour avulsion perm : urgence -> priorité 15/112, mais on laisse aussi le lien)
    if (kind === "vital_plus_doctolib") {
      return (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ActionLink href="tel:15" variant="primary">
              Appeler le 15
            </ActionLink>
            <ActionLink href="tel:112" variant="ghost">
              Appeler le 112
            </ActionLink>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2">
            <ActionLink href={DOCTOLIB_DENTIST_URL} variant="ghost">
              Trouver un dentiste (Doctolib)
            </ActionLink>
          </div>

          {renderNavRow()}
        </>
      );
    }

    // Doctolib (principal) + rappel (optionnel) + nav
    return (
      <>
        <div className="mt-4 grid grid-cols-1 gap-2">
          <ActionLink href={DOCTOLIB_DENTIST_URL} variant="primary">
            Prendre RDV chez un dentiste (Doctolib)
          </ActionLink>

          {result?.reminder ? (
            <ActionButton
              variant="ghost"
              onClick={() => {
                saveReminderFromResult(result);
                alert(
                  `Rappel créé : "${result.reminder.title}"\n\nPrévu : ${formatDateFR(nowPlusHours(result.reminder.hours))}`
                );
              }}
            >
              Créer un rappel
            </ActionButton>
          ) : null}
        </div>

        {renderNavRow()}
      </>
    );
  };

  const renderPainNode = () => {
    if (!node) return null;

    if (node.type === "step") {
      return (
        <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-serif text-xl font-bold">{node.title}</div>
              <div className="muted mt-1">{node.question}</div>
            </div>
            <LevelBadge level="info" />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ChoiceButton
              onClick={() => {
                pushHistory();
                setAnswers((prev) => [...prev, { q: node.question, a: "Oui" }]);
                setNodeId(node.yes);
              }}
            >
              Oui
            </ChoiceButton>
            <ChoiceButton
              onClick={() => {
                pushHistory();
                setAnswers((prev) => [...prev, { q: node.question, a: "Non" }]);
                setNodeId(node.no);
              }}
            >
              Non
            </ChoiceButton>
          </div>

          {history.length > 0 ? renderNavRow() : (
            <div className="mt-3">
              <ActionButton onClick={resetFlow} variant="ghost">Recommencer</ActionButton>
            </div>
          )}

          <div className="muted mt-4 text-xs">{DISCLAIMER}</div>
        </div>
      );
    }

    if (node.type === "result") {
      const result = node;
      return (
        <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-serif text-xl font-bold">{result.title}</div>
              <div className="muted mt-1">{result.subtitle}</div>
            </div>
            <LevelBadge level={result.level} />
          </div>

          {result.doNow?.length ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
              <div className="font-semibold mb-2">À faire maintenant ✅</div>
              <ul className="list-disc pl-5 space-y-1">
                {result.doNow.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.avoid?.length ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
              <div className="font-semibold mb-2">À éviter ❌</div>
              <ul className="list-disc pl-5 space-y-1">
                {result.avoid.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {renderResultActions(result)}

          <div className="muted mt-4 text-xs">{DISCLAIMER}</div>
        </div>
      );
    }

    return null;
  };

  const renderTraumaNode = () => {
    if (!node) return null;

    if (node.type === "picker") {
      return (
        <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-4">
          <div className="font-serif text-xl font-bold">{node.title}</div>
          <div className="muted mt-1">{node.question}</div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            {node.options.map((o) => (
              <ChoiceButton
                key={o.id}
                onClick={() => {
                  pushHistory();
                  setTraumaScenario(o.id);
                  setAnswers((prev) => [...prev, { q: node.question, a: o.label }]);
                  setNodeId(node.next);
                }}
              >
                {o.label}
              </ChoiceButton>
            ))}
          </div>

          {history.length > 0 ? renderNavRow() : (
            <div className="mt-3">
              <ActionButton onClick={resetFlow} variant="ghost">Recommencer</ActionButton>
            </div>
          )}

          <div className="muted mt-4 text-xs">{DISCLAIMER}</div>
        </div>
      );
    }

    if (node.type === "stepToothType") {
      return (
        <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-4">
          <div className="font-serif text-xl font-bold">{node.title}</div>
          <div className="muted mt-1">{node.question}</div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            {node.options.map((o) => (
              <ChoiceButton
                key={o.id}
                onClick={() => {
                  pushHistory();
                  setAnswers((prev) => [...prev, { q: node.question, a: o.label }]);
                  // on stocke le type (temporairement via nodeId t2)
                  setNodeId(node.next);
                  // on encode toothType via answers (ou état séparé si tu veux plus tard)
                  // ici on passe par un flag local : on met dans traumaScenario un objet, mais on garde simple :
                  setTraumaScenario((prevScenario) => {
                    // prevScenario est le "scenario" choisi à t0 (string). On le garde.
                    // le type de dent est récupéré plus bas via answers (dernier item) => ok.
                    return prevScenario;
                  });
                  // On ajoute un champ implicite via answers; plus bas on lit toothType dans answers.
                  // (Simple, sans ajouter un nouveau state)
                  // NOTE: toothType est déduit dans resultByScenario.
                  // -> rien d'autre ici.
                }}
              >
                {o.label}
              </ChoiceButton>
            ))}
          </div>

          {renderNavRow()}

          <div className="muted mt-4 text-xs">{DISCLAIMER}</div>
        </div>
      );
    }

    if (node.type === "resultByScenario") {
      // Déduire toothType depuis la dernière réponse (t1)
      const last = answers[answers.length - 1]?.a || "";
      const toothType =
        /définitive/i.test(last) ? "perm" : /lait/i.test(last) ? "prim" : "unknown";

      const toothLabel =
        toothType === "perm" ? "Dent définitive" : toothType === "prim" ? "Dent de lait" : "Type incertain";

      const result = buildTraumaResult({ toothType, scenario: traumaScenario });

      return (
        <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-serif text-xl font-bold">{result.title}</div>
              <div className="muted mt-1">{result.subtitle}</div>
              <div className="muted mt-1 text-sm">
                Contexte : <b>{toothLabel}</b>
              </div>
            </div>
            <LevelBadge level={result.level} />
          </div>

          {result.doNow?.length ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
              <div className="font-semibold mb-2">À faire maintenant ✅</div>
              <ul className="list-disc pl-5 space-y-1">
                {result.doNow.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.avoid?.length ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
              <div className="font-semibold mb-2">À éviter ❌</div>
              <ul className="list-disc pl-5 space-y-1">
                {result.avoid.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {renderResultActions(result)}

          <div className="muted mt-4 text-xs">{DISCLAIMER}</div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="grid gap-4">
      <div className="mb-1">
        <ChildSwitcher />
      </div>

      <Card title="Urgence & Trauma" right={<span className="muted text-sm">{child?.name || "Enfant"}</span>}>
        <div className="muted">
          ⚠️ Aide à la décision rapide. Si détresse respiratoire, saignement incontrôlable, malaise → 15 / 112.
        </div>

        {!mode ? (
          <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-4">
            <div className="font-serif text-xl font-bold">Choisis un parcours</div>
            <div className="muted mt-1">Objectif : savoir quoi faire maintenant, en 30 secondes.</div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ChoiceButton onClick={startPain}>Douleur / gonflement</ChoiceButton>
              <ChoiceButton onClick={startTrauma}>Trauma / choc</ChoiceButton>
            </div>

            <div className="muted mt-4 text-xs">{DISCLAIMER}</div>
          </div>
        ) : mode === "pain" ? (
          renderPainNode()
        ) : (
          renderTraumaNode()
        )}
      </Card>
    </div>
  );
}
