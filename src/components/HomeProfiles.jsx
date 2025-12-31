import React, { useContext, useMemo } from "react";
import { AppCtx } from "../app/AppShell.jsx";
import KidAvatar from "./KidAvatar.jsx";
import { isAge6to10, badgesToPins } from "../lib/rewards.js";
import { getGamiForChild, getLevelInfo } from "../lib/gamification.js";

function StarBadge({ text }) {
  return (
    <span className="leo-star-badge" aria-label={text}>
      <span className="leo-star">★</span>
      <span className="leo-star-text">{text}</span>
    </span>
  );
}

/**
 * HomeProfiles (Step 2 UI rewrite)
 * - Compact avatar row (Smart Smile inspired)
 * - Circle avatar + name underneath
 * - Reward badge overlay (pins count or level)
 */
export default function HomeProfiles() {
  const { state, setActiveChild, activeChild } = useContext(AppCtx);
  const current = activeChild();
  const children = state.children || [];

  const metaById = useMemo(() => {
    const map = {};
    for (const c of children) {
      const show = isAge6to10(c);
      const g = show ? getGamiForChild(state, c.id) : null;
      const pins = show ? badgesToPins(g?.inventory?.pins || [], 3) : [];
      const lvl = show ? getLevelInfo(g?.xp || 0) : null;
      map[c.id] = { show, g, pins, lvl };
    }
    return map;
  }, [state, children]);

  return (
    <div className="leo-hero">
      <div className="leo-hero-inner">
        <div className="flex items-center justify-between">
          <div className="text-white font-extrabold tracking-wide text-sm">Profils</div>
          <div className="text-white/80 text-xs">Choisis ton enfant</div>
        </div>

        <div className="mt-3 flex gap-4 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
          {children.map((c) => {
            const active = c.id === current?.id;
            const m = metaById[c.id] || {};
            const pinCount = m.show ? (m.g?.inventory?.pins?.length || 0) : 0;
            const badgeText = m.show ? `${pinCount}` : "";

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveChild(c.id)}
                className={["leo-profile-tile", active ? "is-active" : ""].join(" ")}
              >
                <div className="relative">
                  <KidAvatar
                    child={c}
                    size={64}
                    shape="circle"
                    ring={active}
                    pins={m.pins || []}
                    showPins={false}
                  />
                  {m.show ? (
                    <div className="absolute -bottom-2 -right-2">
                      <StarBadge text={badgeText} />
                    </div>
                  ) : null}
                </div>
                <div className="mt-2 text-[12px] font-extrabold text-white leading-none max-w-[86px] truncate">
                  {c.name || "Enfant"}
                </div>
                {m.show ? (
                  <div className="mt-1 text-[11px] text-white/80 leading-none">Niv. {m.lvl?.level || 1}</div>
                ) : (
                  <div className="mt-1 text-[11px] text-white/70 leading-none">—</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
