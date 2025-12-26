export default function DayEditModal({ open, dateLabel, value, onClose, onSave, onClear }) {
  if (!open) return null;

  const v = value || { am: false, pm: false };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-3">
      <div className="leo-card w-full max-w-[460px]">
        <div className="px-5 pt-5 flex items-start justify-between gap-3">
          <div>
            <div className="h2">{dateLabel}</div>
            <div className="muted">Brossage matin / soir</div>
          </div>
          <button className="btn-ghost" type="button" onClick={onClose}>
            Fermer
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={[
                "rounded-2xl px-4 py-3 font-semibold transition flex items-center justify-center gap-2",
                v.am ? "bg-emerald-600 text-white" : "bg-white/70 border border-[rgba(17,24,39,0.10)]",
              ].join(" ")}
              onClick={() => onSave?.({ ...v, am: !v.am })}
            >
              <span className="h-7 w-7 rounded-full border border-white/20 bg-white/10 flex items-center justify-center font-bold">
                M
              </span>
              Matin
            </button>

            <button
              type="button"
              className={[
                "rounded-2xl px-4 py-3 font-semibold transition flex items-center justify-center gap-2",
                v.pm ? "bg-emerald-600 text-white" : "bg-white/70 border border-[rgba(17,24,39,0.10)]",
              ].join(" ")}
              onClick={() => onSave?.({ ...v, pm: !v.pm })}
            >
              <span className="h-7 w-7 rounded-full border border-white/20 bg-white/10 flex items-center justify-center font-bold">
                S
              </span>
              Soir
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn-ghost" type="button" onClick={onClear}>
              Effacer
            </button>
            <button className="btn-primary" type="button" onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
