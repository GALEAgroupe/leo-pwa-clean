import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import HomeProfiles from "../components/HomeProfiles.jsx";
import TimerModal from "../components/TimerModal.jsx";

import { AppCtx } from "../app/AppShell.jsx";
import tips from "../data/tips.json";
import videosData from "../data/videos.json";
import { getAgeBand } from "../lib/age.js";
import { isRewardsEnabled } from "../lib/rewards.js";
import { LEVEL_MILESTONES } from "../lib/familyRewards.js";
import { MilestoneIcon } from "../components/icons/MilestoneIcons.jsx";
import {
  dateKey,
  getGamiForChild,
  getLevelInfo,
  applyGamiFromLogTransition,
  applyTimerComplete,
} from "../lib/gamification.js";

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

function fmtSec(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const mm = String(Math.floor(s / 60)).padStart(1, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function computeLast7DaysKeys(end = new Date()) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    out.push(dateKey(d));
  }
  return out;
}

export default function Today() {
  const { state, setState, activeChild } = useContext(AppCtx);
  const nav = useNavigate();

  const child = activeChild();
  const band = getAgeBand(child);

  const [timerOpen, setTimerOpen] = useState(false);

  const today = new Date();
  const k = dateKey(today);
  const todayLabel = format(today, "EEEE d MMMM", { locale: fr });

  const logsForChild = state.logs?.[child?.id] || {};
  const log = normalizeDayLog(logsForChild[k]);
  const doneCount = (log.am ? 1 : 0) + (log.pm ? 1 : 0);

  const prefSeconds = state.timerSeconds?.[child?.id] ?? 120;
  const selectedVideoId = state.timerVideoId?.[child?.id] ?? null;

  const showGami = useMemo(() => isRewardsEnabled(child), [child]);

  const gami = useMemo(() => {
    if (!showGami || !child?.id) return null;
    return getGamiForChild(state, child.id);
  }, [state, child?.id, showGami]);

  const levelInfo = useMemo(() => (gami ? getLevelInfo(gami.xp) : null), [gami]);

  const day = gami?.daily?.[k] || {};
  const timerDone = !!day.timerDone;

  const timerVideos = useMemo(() => {
    return videosData.filter((v) => v.ageTags?.includes(band)).slice(0, 12);
  }, [band]);

  const selectedVideo = useMemo(() => {
    return timerVideos.find((v) => v.id === selectedVideoId) || timerVideos[0] || null;
  }, [timerVideos, selectedVideoId]);



  const setTodayLog = (next) => {
    setState((s) => {
      const childId = child.id;
      const childLogs = s.logs?.[childId] || {};
      const prev = normalizeDayLog(childLogs[k]);
      const nextState = {
        ...s,
        logs: {
          ...s.logs,
          [childId]: { ...childLogs, [k]: { am: !!next.am, pm: !!next.pm } },
        },
      };
      return applyGamiFromLogTransition({
        state: nextState,
        child,
        childId,
        dateKey: k,
        prevLog: prev,
        nextLog: { am: !!next.am, pm: !!next.pm },
      });
    });
  };

  const toggleAM = () => setTodayLog({ ...log, am: !log.am });
  const togglePM = () => setTodayLog({ ...log, pm: !log.pm });

  // --- Dashboard KPIs (7 days) — utilisé pour la carte “Stats”.
  const weekly = useMemo(() => {
    if (!child?.id) return { points: 0, fullDays: 0, timers: 0, totalSessions: 0, pct: 0 };
    const keys = computeLast7DaysKeys(today);
    let fullDays = 0;
    let timers = 0;
    let sessions = 0;
    for (const dk of keys) {
      const l = normalizeDayLog(logsForChild[dk]);
      sessions += (l.am ? 1 : 0) + (l.pm ? 1 : 0);
      if (l.am && l.pm) fullDays += 1;
      const d = gami?.daily?.[dk] || {};
      if (d.timerDone) timers += 1;
    }

    const pointsRaw = fullDays * 7 + sessions * 2 + timers * 4;
    const points = Math.max(0, Math.min(50, pointsRaw));
    return { points, fullDays, timers, totalSessions: sessions, pct: points / 50 };
  }, [child?.id, today, logsForChild, gami]);

  // Progression dans le niveau (1000 points)
  const milestones = LEVEL_MILESTONES;
  const milestoneIcons = ["toolbox", "book", "cookie", "spark", "trophy"]; // 5 paliers

  const dailyTips = useMemo(() => {
    const list = tips.filter((t) => t.ageTags?.includes(band));
    const pick = [];
    for (const t of list) {
      if (pick.length >= 3) break;
      pick.push(t);
    }
    return pick;
  }, [band]);

  return (
    <>
      <div className="mb-3">
        <div className="muted capitalize">{todayLabel}</div>
      </div>

      {/* Profiles hero */}
      <div className="mb-4">
        <HomeProfiles />
      </div>

      {/* Smart Smile inspired dashboard (Rewards + Stats) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Rewards summary */}
        <button
          type="button"
          onClick={() => nav("/rewards")}
          className="leo-card p-4 text-left leo-clickable"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="leo-kicker">RÉCOMPENSES</div>
              <div className="leo-title">Ma progression</div>
            </div>
            <div className="leo-mini-icon" aria-hidden>
              🎁
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-[rgba(11,18,32,0.70)]">
              <span>Niveau {levelInfo?.level || 1}</span>
              <span className="font-extrabold">{levelInfo?.curInLevel ?? 0} / {levelInfo?.nextCost ?? 1000} points</span>
            </div>
            <div className="mt-2 leo-reward-track">
              <div className="leo-reward-fill" style={{ width: `${(levelInfo?.pct || 0) * 100}%` }} />
              <div className="leo-reward-star" style={{ left: `${(levelInfo?.pct || 0) * 100}%` }} aria-hidden>
                ✨
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              {milestones.map((m, idx) => (
                <div
                  key={m}
                  className={"leo-milestone " + ((levelInfo?.curInLevel ?? 0) >= m ? "is-on" : "")}
                  title={`${m} points`}
                >
                  <span aria-hidden className="inline-flex items-center justify-center">
                    <MilestoneIcon name={milestoneIcons[idx] || "trophy"} className="w-5 h-5" />
                  </span>
                  <div className="leo-milestone-num">
                    {m >= 1000 ? `${Math.round(m / 100) / 10}k` : m}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 leo-sub">Paliers famille + coffre du jour ✨</div>
        </button>

        {/* Stats summary */}
        <button
          type="button"
          onClick={() => nav("/calendar")}
          className="leo-card p-4 text-left leo-clickable"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="leo-kicker">STATISTIQUES</div>
              <div className="leo-title">Cette semaine</div>
            </div>
            <div className="leo-mini-icon" aria-hidden>
              📅
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="leo-stat-label">Jours complets</span>
              <span className="leo-stat-value">{weekly.fullDays}/7</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="leo-stat-label">Timers</span>
              <span className="leo-stat-value">{weekly.timers}/7</span>
            </div>
            {showGami && gami ? (
              <div className="flex items-center justify-between">
                <span className="leo-stat-label">Série</span>
                <span className="leo-stat-value">{gami.streak || 0}j</span>
              </div>
            ) : null}
          </div>

          <div className="mt-3 leo-sub">Voir le calendrier →</div>
        </button>
      </div>

      {/* Routine + Timer (cleaner) */}
      <section className="leo-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="leo-title" style={{ marginTop: 2 }}>Routine du jour</div>
            <div className="leo-sub">2 actions + 1 timer 🎯</div>
          </div>
          <div className="chip">{doneCount}/2</div>
        </div>

        <div className="mt-4 leo-seg">
          <button type="button" onClick={toggleAM} className={"leo-seg-btn " + (log.am ? "is-on" : "")}
            aria-pressed={log.am}
          >
            Matin
          </button>
          <button type="button" onClick={togglePM} className={"leo-seg-btn " + (log.pm ? "is-on" : "")}
            aria-pressed={log.pm}
          >
            Soir
          </button>
        </div>

        <div className="mt-4">
          {/* Timer card (full width) */}
          <div className="leo-card-inner leo-clickable leo-timer-card" role="button" tabIndex={0} onClick={() => setTimerOpen(true)}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="leo-kicker">CHRONOMÈTRE</div>
                <div className="leo-big">{fmtSec(prefSeconds)}</div>
                <div className="leo-sub">avec vidéo (optionnel)</div>
              </div>
              <span className="chip">Réglages</span>
            </div>

            <div className="mt-3">
              <div className="text-xs text-[rgba(11,18,32,0.70)]">Vidéo</div>
              <div className="font-extrabold text-sm mt-1 truncate">{selectedVideo?.title || "Aucune"}</div>
            </div>

            <div className="mt-4">
              <div className="leo-timer-ring" aria-hidden>
                <div className="leo-timer-ring-inner">
                  <div className="leo-timer-ring-time">{fmtSec(prefSeconds)}</div>
                  <div className="leo-timer-ring-sub">Démarrer</div>
                </div>
              </div>
            </div>

            {showGami ? (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-[rgba(11,18,32,0.70)]">
                  <span>Mission</span>
                  <span className="font-extrabold">{timerDone ? "OK" : "À faire"}</span>
                </div>
                <div className="mt-2 leo-progress" style={{ height: 10, background: "rgba(15,23,42,0.08)", borderColor: "rgba(15,23,42,0.10)" }}>
                  <div className="leo-progress-bar" style={{ width: `${timerDone ? 100 : 0}%` }} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Tips (keep lightweight) */}
      <div className="mt-5">
        <div className="flex items-end justify-between mb-3">
          <div className="h2">Conseils rapides</div>
          <div className="chip">{band}</div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {dailyTips.map((t) => (
            <div key={t.id} className="leo-card shrink-0 w-[290px]">
              <div className="px-5 pt-5">
                <div className="chip">{t.category || "Conseil"}</div>
                <div className="mt-3 leo-title" style={{ fontSize: 18 }}>{t.title}</div>
              </div>
              <div className="px-5 pb-5 pt-3">
                <div className="muted">{t.body}</div>
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
        onComplete={(payload) => {
          if (!showGami) return;
          setState((s) =>
            applyTimerComplete({
              state: s,
              child,
              childId: child.id,
              dateKey: k,
              seconds: payload?.seconds ?? prefSeconds,
              targetSeconds: payload?.targetSeconds ?? 120,
            })
          );
        }}
      />

    </>
  );
}
