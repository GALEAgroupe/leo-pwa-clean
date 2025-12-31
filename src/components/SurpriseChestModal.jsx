import React, { useEffect, useMemo, useState } from "react";

/**
 * Fun "boîte surprise" modal + vraie animation d'ouverture.
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - locked?: boolean
 * - alreadyOpened?: boolean
 * - choices: [{ id, kind, title, subtitle }]
 * - onPick: (choiceId) => void
 */

const PARTICLES = [
  { x: 18, y: 6, dx: -42, dy: -88, r: -40, d: 0 },
  { x: 30, y: 4, dx: -14, dy: -98, r: 18, d: 60 },
  { x: 42, y: 6, dx: 14, dy: -86, r: 36, d: 80 },
  { x: 54, y: 4, dx: 46, dy: -96, r: 60, d: 30 },
  { x: 66, y: 8, dx: 62, dy: -72, r: 90, d: 90 },
  { x: 22, y: 14, dx: -72, dy: -46, r: -80, d: 40 },
  { x: 34, y: 16, dx: -34, dy: -56, r: 20, d: 120 },
  { x: 50, y: 14, dx: 26, dy: -52, r: 55, d: 70 },
  { x: 70, y: 16, dx: 74, dy: -46, r: 120, d: 110 },
  { x: 26, y: 22, dx: -66, dy: -18, r: -40, d: 160 },
  { x: 44, y: 22, dx: -22, dy: -26, r: 30, d: 200 },
  { x: 58, y: 22, dx: 28, dy: -24, r: 40, d: 180 },
  { x: 74, y: 22, dx: 68, dy: -18, r: 70, d: 210 },
];

export default function SurpriseChestModal({
  open,
  onClose,
  locked = false,
  alreadyOpened = false,
  choices = [],
  onPick,
}) {
  const canPick = !locked && !alreadyOpened && Array.isArray(choices) && choices.length;

  // stages: closed -> opening -> opened
  const [stage, setStage] = useState("closed");

  useEffect(() => {
    if (!open) return;
    setStage(locked || alreadyOpened ? "closed" : "closed");
  }, [open, locked, alreadyOpened]);

  const openChest = () => {
    if (!canPick) return;
    if (stage !== "closed") return;
    setStage("opening");
    window.setTimeout(() => setStage("opened"), 950);
  };

  const subtitle = useMemo(() => {
    if (locked) return "Fais matin + soir pour le déverrouiller.";
    if (alreadyOpened) return "Coffre déjà ouvert aujourd’hui.";
    if (stage === "opened") return "Choisis ta récompense 🎁";
    return "Appuie sur le coffre pour l’ouvrir ✨";
  }, [locked, alreadyOpened, stage]);

  if (!open) return null;

  const showChoices = canPick && stage === "opened";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
        aria-label="Fermer"
      />

      <div className="leo-sheet leo-sheet--chest" role="dialog" aria-modal="true">
        <div className="leo-sheet-header leo-sheet-header--chest">
          <div className="leo-sheet-header-row">
            <div className="min-w-0">
              <div className="leo-sheet-title">Coffre surprise</div>
              <div className="leo-sheet-sub">{subtitle}</div>
            </div>
            <button
              className="btn-ghost text-white border-white/20 bg-white/10 hover:bg-white/20"
              type="button"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>

          <div className="leo-chest-wrap">
            <button
              type="button"
              className="leo-chest-btn"
              onClick={openChest}
              disabled={!canPick || stage !== "closed"}
              aria-label={locked ? "Coffre verrouillé" : "Ouvrir le coffre"}
              title={locked ? "Verrouillé" : stage === "opened" ? "Ouvert" : "Appuie pour ouvrir"}
            >
              <div
                className={[
                  "leo-chest",
                  locked ? "leo-chest--locked" : "",
                  stage === "opening" ? "leo-chest--opening" : "",
                  stage === "opened" ? "leo-chest--opened" : "",
                ].join(" ")}
                aria-hidden="true"
              >
                <div className="leo-chest-top" />
                <div className="leo-chest-body" />
                <div className="leo-chest-glow" />

                {/* particles burst */}
                <div className="leo-chest-particles" aria-hidden>
                  {PARTICLES.map((p, i) => (
                    <span
                      key={i}
                      className="leo-particle"
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        "--dx": `${p.dx}px`,
                        "--dy": `${p.dy}px`,
                        "--rot": `${p.r}deg`,
                        "--del": `${p.d}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {locked ? (
                <div className="leo-chest-lock" aria-hidden>
                  🔒
                </div>
              ) : null}
            </button>

            {!locked && !alreadyOpened && stage === "closed" ? (
              <div className="leo-chest-hint">Appuie pour ouvrir !</div>
            ) : null}
            {showChoices ? <div className="leo-chest-hint leo-chest-hint--done">Choisis 1 récompense 👇</div> : null}
          </div>
        </div>

        <div className="leo-sheet-body">
          {alreadyOpened ? (
            <div className="leo-card p-4">
              <div className="font-extrabold">Déjà ouvert ✅</div>
              <div className="muted mt-1">Reviens demain pour un nouveau coffre.</div>
            </div>
          ) : null}

          <div
            className={[
              "leo-choice-grid",
              showChoices ? "is-show" : "",
            ].join(" ")}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={!showChoices}
                  onClick={() => onPick?.(c.id)}
                  className={[
                    "leo-reward-card",
                    !showChoices ? "opacity-60 cursor-not-allowed" : "hover:translate-y-[-2px]",
                  ].join(" ")}
                >
                  <div className="leo-reward-kind">{(c.kind || "").toUpperCase()}</div>
                  <div className="leo-reward-title">{c.title}</div>
                  <div className="leo-reward-sub">{c.subtitle}</div>
                  <div className="mt-3">
                    <span className="chip">Choisir</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {locked ? (
            <div className="mt-4 leo-card p-4">
              <div className="font-extrabold">Astuce</div>
              <div className="muted mt-1">Deux brossages = coffre. On garde ça simple.</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
