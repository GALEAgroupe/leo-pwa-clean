import { useContext, useMemo } from "react";
import { AppCtx } from "../app/AppShell.jsx";
import { getAgeLabel } from "../lib/age.js";
import { isRewardsEnabled } from "../lib/rewards.js";
import { getGamiForChild, getLevelInfo } from "../lib/gamification.js";
import KidAvatar from "./KidAvatar.jsx";

export default function ChildSwitcher() {
  const { state, setActiveChild, activeChild } = useContext(AppCtx);
  const child = activeChild();
  const children = state.children || [];

  const gamiById = useMemo(() => {
    const map = {};
    for (const c of children) map[c.id] = getGamiForChild(state, c.id);
    return map;
  }, [state, children]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {children.map((c) => {
        const active = c.id === child?.id;
        const enabled = isRewardsEnabled(c);
        const g = gamiById[c.id];
        const lvl = getLevelInfo(enabled ? (g?.xp || 0) : 0);

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveChild(c.id)}
            className={[
              "chip shrink-0 flex items-center gap-2 px-3 py-2",
              active
                ? "bg-[rgba(15,59,54,0.10)] border-[rgba(15,59,54,0.22)] text-[var(--leo-brand)]"
                : "",
            ].join(" ")}
          >
            <KidAvatar child={c} size={34} showPins={false} ring={active} />
            <span className="whitespace-nowrap">
              {c.name}{" "}
              <span className="opacity-60 font-semibold">({getAgeLabel(c)})</span>
            </span>
            <span className={"ml-1 font-semibold " + (enabled ? "opacity-70" : "opacity-50")}>· Niv. {lvl?.level || 1}</span>
          </button>
        );
      })}
    </div>
  );
}
