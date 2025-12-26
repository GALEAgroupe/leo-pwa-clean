import { SHOP_ITEMS } from "../lib/rewards.js";

export default function RewardShopModal({ open, onClose, tokens = 0, onRedeem }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-3">
      <div className="leo-card w-full max-w-[520px]">
        <div className="px-5 pt-5 flex items-start justify-between gap-3">
          <div>
            <div className="h2">Échanger mes jetons</div>
            <div className="muted">Tu as <b>{tokens}</b> jeton{tokens > 1 ? "s" : ""}.</div>
          </div>
          <button className="btn-ghost" type="button" onClick={onClose}>
            Fermer
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="grid gap-3">
            {SHOP_ITEMS.map((it) => {
              const can = tokens >= it.cost;
              return (
                <div key={it.id} className="rounded-3xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{it.title}</div>
                      <div className="muted text-sm mt-1">{it.subtitle}</div>
                    </div>
                    <div className="chip">{it.cost} jetons</div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      className={can ? "btn-primary w-full" : "btn-ghost w-full"}
                      disabled={!can}
                      onClick={() => onRedeem?.(it.id)}
                    >
                      {can ? "Échanger" : "Pas assez de jetons"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
