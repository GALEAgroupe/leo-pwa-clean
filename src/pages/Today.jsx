import { useContext, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import Card from "../components/Card.jsx";
import ChildSwitcher from "../components/ChildSwitcher.jsx";
import TimerModal from "../components/TimerModal.jsx";
import RewardShopModal from "../components/RewardShopModal.jsx";

import { AppCtx } from "../app/AppShell.jsx";
import tips from "../data/tips.json";
import videosData from "../data/videos.json";
import { getAgeBand } from "../lib/age.js";
import { isAge6to10, getRewardsForChild, applyRewardsFromLogTransition, redeemShopItem } from "../lib/rewards.js";

function dateKey(d) {
  return format(d, "yyyy-MM-dd");
}

function normalizeDayLog(x) {
  if (!x) return { am: false, pm: false };
  if (typeof x === "boolean") return { am: x, pm: false };
  if (typeof x === "object") {
    return {
      am: !!(x.am ?? x.morning ?? x.matin ?? x.m),
      pm: !!(x.pm ?? x.evening ?? x.soir ?? x.s),
    };
  }
  return { am: false, pm: false };
}

export default function Today() {
  const { state, setState, activeChild } = useContext(AppCtx);
  const child = activeChild();
  const band = getAgeBand(child);

  const [shopOpen, setShopOpen] = useState(false);

  const [timerOpen, setTimerOpen] = useState(false);

  const today = new Date();
  const k = dateKey(today);
  const logsForChild = state.logs?.[child?.id] || {};
  const log = normalizeDayLog(logsForChild[k]);
  const doneCount = (log.am ? 1 : 0) + (log.pm ? 1 : 0);

  const prefSeconds = state.timerSeconds?.[child?.id] ?? 120;
  const selectedVideoId = state.timerVideoId?.[child?.id] ?? null;

  const setTodayLog = (next) => {
    setState((s) => {
      const childId = child.id;
      const childLogs = s.logs?.[childId] || {};
      const nextState = {
        ...s,
        logs: {
          ...s.logs,
          [childId]: { ...childLogs, [k]: { am: !!next.am, pm: !!next.pm } },
        },
      };

      // ✅ Récompenses 6–10 ans : 1 jeton par brossage + bonus jour complet + milestones
      return applyRewardsFromLogTransition({
        state: nextState,
        child,
        childId,
        dateKey: k,
        prevLog: log,
        nextLog: { am: !!next.am, pm: !!next.pm },
      });
    });
  };

  const toggleAM = () => setTodayLog({ ...log, am: !log.am });
  const togglePM = () => setTodayLog({ ...log, pm: !log.pm });

  const todayLabel = format(today, "EEEE d MMMM", { locale: fr });

  const dailyTips = useMemo(() => {
    const list = tips.filter((t) => t.ageTags?.includes(band));
    const brushing = list.filter((t) => t.category === "Brossage");
    const food = list.filter((t) => t.category === "Alimentation");
    const pick = [];
    if (brushing[0]) pick.push(brushing[0]);
    if (food[0]) pick.push(food[0]);
    for (const t of list) {
      if (pick.length >= 6) break;
      if (!pick.find((p) => p.id === t.id)) pick.push(t);
    }
    return pick.slice(0, 6);
  }, [band]);

  const timerVideos = useMemo(() => {
    return videosData.filter((v) => v.ageTags?.includes(band)).slice(0, 12);
  }, [band]);

  const rewards = useMemo(() => {
    if (!child?.id) return null;
    return getRewardsForChild(state, child.id);
  }, [state, child?.id]);

  const showRewards = useMemo(() => isAge6to10(child), [child]);

  return (
    <>
      <div className="mb-3">
        <div className="muted capitalize">{todayLabel}</div>
      </div>

      <div className="mb-4">
        <ChildSwitcher />
      </div>

      <Card title="Routine du jour" right={<div className="chip">{doneCount}/2</div>}>
        <div className="leo-card p-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleAM}
              className={[
                "rounded-2xl px-4 py-3 font-semibold transition flex items-center justify-center gap-2",
                log.am ? "bg-emerald-600 text-white" : "bg-white/70 border border-[rgba(17,24,39,0.10)]",
              ].join(" ")}
            >
              <span className={log.am ? "h-2 w-2 rounded-full bg-white" : "h-2 w-2 rounded-full bg-emerald-600"} />
              Matin
            </button>

            <button
              type="button"
              onClick={togglePM}
              className={[
                "rounded-2xl px-4 py-3 font-semibold transition flex items-center justify-center gap-2",
                log.pm ? "bg-emerald-600 text-white" : "bg-white/70 border border-[rgba(17,24,39,0.10)]",
              ].join(" ")}
            >
              <span className={log.pm ? "h-2 w-2 rounded-full bg-white" : "h-2 w-2 rounded-full bg-emerald-600"} />
              Soir
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button className="btn-primary col-span-2" type="button" onClick={() => setTimerOpen(true)}>
            Timer + vidéo
          </button>
          <button className="btn-ghost" type="button" onClick={() => setTimerOpen(true)}>
            Réglage
          </button>
        </div>

        <div className="mt-3 muted">Objectif : propre, simple, et sans dentifrice partout.</div>
      </Card>

      {showRewards && rewards ? (
        <div className="mt-4">
          <Card
            title="Récompenses"
            right={<div className="chip">{rewards.tokens} jeton{rewards.tokens > 1 ? "s" : ""}</div>}
          >
            <div className="leo-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">Série en cours</div>
                  <div className="muted text-sm">
                    {rewards.streak || 0} jour{(rewards.streak || 0) > 1 ? "s" : ""} complet{(rewards.streak || 0) > 1 ? "s" : ""}
                  </div>
                </div>
                <button className="btn-primary" type="button" onClick={() => setShopOpen(true)}>
                  Échanger
                </button>
              </div>

              {Array.isArray(rewards.badges) && rewards.badges.length ? (
                <div className="mt-4">
                  <div className="font-semibold">Badges</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {rewards.badges.slice(0, 8).map((b) => (
                      <span key={b} className="chip">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 muted text-sm">Fais une série de 3 jours pour débloquer ton premier badge.</div>
              )}
            </div>
          </Card>
        </div>
      ) : null}

      <div className="mt-5">
        <div className="flex items-end justify-between mb-3">
          <div className="h2">Mon conseil du jour</div>
          <div className="chip">À lire</div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {dailyTips.map((t) => (
            <div key={t.id} className="leo-card shrink-0 w-[290px]">
              <div className="px-5 pt-5">
                <div className="chip">{t.category || "Conseil"}</div>
                <div className="mt-3 font-serif text-xl font-bold leading-tight">{t.title}</div>
              </div>
              <div className="px-5 pb-5 pt-3">
                <div className="muted">{t.body}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.tags?.slice(0, 3)?.map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TimerModal
        open={timerOpen}
        onClose={() => setTimerOpen(false)}
        initialSeconds={prefSeconds}
        onSaveSeconds={(sec) => {
          setState((s) => ({
            ...s,
            timerSeconds: { ...(s.timerSeconds || {}), [child.id]: sec },
          }));
        }}
        videos={timerVideos}
        selectedVideoId={selectedVideoId}
        onSelectVideo={(id) => {
          setState((s) => ({
            ...s,
            timerVideoId: { ...(s.timerVideoId || {}), [child.id]: id },
          }));
        }}
      />

      <RewardShopModal
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        tokens={rewards?.tokens ?? 0}
        onRedeem={(itemId) => {
          setState((s) => redeemShopItem({ state: s, child, childId: child.id, itemId }));
        }}
      />
    </>
  );
}
