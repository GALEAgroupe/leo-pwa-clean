import React, { useMemo, useState } from "react";
import { FAMILY_OPTIONS } from "../lib/familyRewards.js";
import { MilestoneIcon } from "./icons/MilestoneIcons.jsx";

/**
 * Modal “récompense parentale” : l’enfant choisit 1 option dans une liste validée.
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - title: string
 * - subtitle?: string
 * - category: "story"|"snack"|"activity"
 * - initialOptionId?: string|null
 * - onChoose: ({ optionId, optionLabel }) => void
 */
export default function FamilyRewardModal({
  open,
  onClose,
  title,
  subtitle,
  category,
  initialOptionId,
  onChoose,
}) {
  const options = useMemo(() => {
    const list = FAMILY_OPTIONS?.[category] || [];
    return Array.isArray(list) ? list : [];
  }, [category]);

  const [picked, setPicked] = useState(initialOptionId || options?.[0]?.id || null);

  // Reset when opening
  React.useEffect(() => {
    if (!open) return;
    setPicked(initialOptionId || options?.[0]?.id || null);
  }, [open, initialOptionId, options]);

  if (!open) return null;

  const iconName = category === "story" ? "book" : category === "snack" ? "cookie" : "spark";

  const submit = () => {
    const found = options.find((o) => o.id === picked) || null;
    if (!found) return;
    onChoose?.({ optionId: found.id, optionLabel: found.label });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
        aria-label="Fermer"
      />

      <div className="leo-sheet leo-sheet--family">
        <div className="leo-sheet-header leo-sheet-header--family">
          <div className="leo-bubbles" aria-hidden>
            <span className="leo-bubble" style={{ left: "10%", top: "35%", animationDelay: "0ms" }} />
            <span className="leo-bubble" style={{ left: "26%", top: "10%", width: 56, height: 56, animationDelay: "160ms" }} />
            <span className="leo-bubble" style={{ left: "78%", top: "18%", width: 48, height: 48, animationDelay: "220ms" }} />
            <span className="leo-bubble" style={{ left: "90%", top: "50%", width: 38, height: 38, animationDelay: "90ms" }} />
          </div>

          <div className="leo-sheet-header-row">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 border border-white/25">
                  <MilestoneIcon name={iconName} className="w-6 h-6" />
                </span>
                <div className="min-w-0">
                  <div className="leo-sheet-title truncate">{title}</div>
                  {subtitle ? <div className="leo-sheet-sub">{subtitle}</div> : null}
                </div>
              </div>
            </div>

            <button
              className="btn-ghost text-white border-white/20 bg-white/10 hover:bg-white/20"
              type="button"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>

        <div className="leo-sheet-body">
          <div className="leo-card p-4">
          <div className="font-extrabold">Choisis une option</div>
          <div className="mt-3 grid gap-2">
            {options.map((o) => {
              const active = o.id === picked;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setPicked(o.id)}
                  className={[
                    "w-full text-left rounded-2xl border px-4 py-3 transition",
                    active
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-gray-200 bg-white",
                  ].join(" ")}
                >
                  <div className="font-extrabold">{o.label}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button className="btn-primary" type="button" onClick={submit} disabled={!picked}>
              Valider
            </button>
            <button className="btn-ghost" type="button" onClick={onClose}>
              Annuler
            </button>
          </div>

          <div className="mt-3 muted text-xs">
            Le parent peut modifier les options dans <b>src/lib/familyRewards.js</b>.
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
