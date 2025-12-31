import { useEffect, useMemo, useRef, useState } from "react";

const MIN_SEC = 15;
const MAX_SEC = 120; // 2 min
const STEP_SEC = 1;

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function fmt(sec) {
  const s = Math.max(0, Math.round(sec));
  const mm = String(Math.floor(s / 60)).padStart(1, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function ToothMascot({ className = "" }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="toothG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,1)" />
          <stop offset="1" stopColor="rgba(241,245,249,1)" />
        </linearGradient>
      </defs>
      <path
        d="M60 18c18 0 34 12 34 30 0 10-4 19-8 26-5 10-6 28-10 35-3 6-12 7-16-2-2-4-3-10-4-16-1 6-2 12-4 16-4 9-13 8-16 2-4-7-5-25-10-35-4-7-8-16-8-26 0-18 16-30 34-30z"
        fill="url(#toothG)"
        stroke="rgba(15,23,42,0.10)"
        strokeWidth="2"
      />
      <circle cx="44" cy="58" r="4" fill="rgba(15,23,42,0.65)" />
      <circle cx="76" cy="58" r="4" fill="rgba(15,23,42,0.65)" />
      <path d="M48 74c8 8 16 8 24 0" fill="none" stroke="rgba(15,23,42,0.55)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="34" cy="66" r="6" fill="rgba(244,63,94,0.18)" />
      <circle cx="86" cy="66" r="6" fill="rgba(244,63,94,0.18)" />
    </svg>
  );
}

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - videos: [{ id, title, url, mood?, durationLabel? }]
 * - initialSeconds?: number
 * - onSaveSeconds?: (sec:number) => void
 * - selectedVideoId?: string|null
 * - onSelectVideo?: (id:string|null) => void
 *
 * Compat legacy:
 * - defaultSeconds?: number
 */
export default function BrushingTimerModal({
  open,
  onClose,
  videos = [],
  initialSeconds,
  onSaveSeconds,
  selectedVideoId,
  onSelectVideo,
  // ✅ Step 2: called once when the timer reaches 0 naturally
  onComplete,
  defaultSeconds = 120,
}) {
  const initSec = clamp(
    typeof initialSeconds === "number" ? initialSeconds : defaultSeconds,
    MIN_SEC,
    MAX_SEC
  );

  const [seconds, setSeconds] = useState(initSec);
  const [localVideoId, setLocalVideoId] = useState(videos?.[0]?.id ?? null);

  const effectiveVideoId = selectedVideoId ?? localVideoId;

  const [running, setRunning] = useState(false);
  const [endAt, setEndAt] = useState(null);
  const [remaining, setRemaining] = useState(seconds);
  const [showVideo, setShowVideo] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const videoRef = useRef(null);
  const tickRef = useRef(null);

  // ✅ completion guards (avoid double-calls on iOS)
  const completedRef = useRef(false);
  const startedSecondsRef = useRef(initSec);
  const startedVideoIdRef = useRef(null);

  // Reset when modal opens
  useEffect(() => {
    if (!open) return;
    setSeconds(initSec);
    setRemaining(initSec);

    const nextId =
      (selectedVideoId ?? null) ||
      (videos?.[0]?.id ?? null);
    setLocalVideoId(nextId);

    setRunning(false);
    setEndAt(null);
    setShowVideo(false);

    completedRef.current = false;
    startedSecondsRef.current = initSec;
    startedVideoIdRef.current = (selectedVideoId ?? null) || (videos?.[0]?.id ?? null);
  }, [open, initSec, selectedVideoId, videos]);

  const selectedVideo = useMemo(
    () => videos.find((v) => v.id === effectiveVideoId) || null,
    [videos, effectiveVideoId]
  );

  const pct = useMemo(() => {
    const range = MAX_SEC - MIN_SEC;
    const val = clamp(seconds, MIN_SEC, MAX_SEC) - MIN_SEC;
    return range ? (val / range) * 100 : 0;
  }, [seconds]);

  // reset remaining when user changes duration (only if not running)
  useEffect(() => {
    if (!running) setRemaining(seconds);
  }, [seconds, running]);

  // ticking (more accurate than 1s interval)
  useEffect(() => {
    if (!running || !endAt) return;

    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(left);

      if (left <= 0) {
        stopAll(false, true);
      }
    }, 200);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, endAt]);

  const stopAll = (silent = false, didComplete = false) => {
    setRunning(false);
    setEndAt(null);
    setRemaining((r) => (silent ? r : 0));

    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;

    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {}
    }
    if (!silent) setShowVideo(false);

    if (didComplete && !silent) {
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1600);
    }

    // petite célébration visuelle
    if (didComplete) {
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1600);
    }

    // ✅ notify completion once
    if (didComplete && typeof onComplete === "function" && !completedRef.current) {
      completedRef.current = true;
      try {
        onComplete({
          seconds: startedSecondsRef.current,
          targetSeconds: startedSecondsRef.current,
          videoId: startedVideoIdRef.current,
          finishedAt: new Date().toISOString(),
        });
      } catch {
        // noop
      }
    }
  };

  const reset = () => {
    stopAll(true);
    setRemaining(seconds);
    setShowVideo(false);
  };

  const persistSettings = () => {
    const sec = clamp(seconds, MIN_SEC, MAX_SEC);
    if (typeof onSaveSeconds === "function") onSaveSeconds(sec);
    if (typeof onSelectVideo === "function") onSelectVideo(effectiveVideoId ?? null);
  };

  const closeAndSave = () => {
    persistSettings();
    stopAll(true);
    onClose?.();
  };

  const startTimerOnly = () => {
    const dur = clamp(seconds, MIN_SEC, MAX_SEC);
    completedRef.current = false;
    startedSecondsRef.current = dur;
    startedVideoIdRef.current = effectiveVideoId ?? null;
    setRemaining(dur);
    setEndAt(Date.now() + dur * 1000);
    setRunning(true);
    setShowVideo(false);
    persistSettings();
  };

  /**
   * Important iPhone:
   * - play() doit être appelé DANS le handler du click utilisateur
   * - le <video> doit déjà être monté
   */
  const startWithVideo = async () => {
    const dur = clamp(seconds, MIN_SEC, MAX_SEC);
    completedRef.current = false;
    startedSecondsRef.current = dur;
    startedVideoIdRef.current = effectiveVideoId ?? null;
    setRemaining(dur);
    setEndAt(Date.now() + dur * 1000);
    setRunning(true);
    setShowVideo(true);
    persistSettings();

    const v = videoRef.current;
    if (v && selectedVideo?.url) {
      try {
        if (v.src !== selectedVideo.url) v.src = selectedVideo.url;
        v.currentTime = 0;
        const p = v.play();
        if (p && typeof p.then === "function") await p;
      } catch {
        // Safari peut bloquer; timer reste OK
      }
    }
  };

  const dec15 = () => setSeconds((s) => clamp(s - 15, MIN_SEC, MAX_SEC));
  const inc15 = () => setSeconds((s) => clamp(s + 15, MIN_SEC, MAX_SEC));

  const setVideoId = (id) => {
    if (typeof onSelectVideo === "function") {
      onSelectVideo(id);
    } else {
      setLocalVideoId(id);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        onClick={closeAndSave}
        aria-label="Fermer"
      />

      <div className="leo-sheet leo-sheet--timer" role="dialog" aria-modal="true">
        {/* Header fun */}
        <div className="leo-sheet-header leo-sheet-header--timer">
          <div className="leo-bubbles" aria-hidden>
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="leo-bubble" style={{ "--i": i }} />
            ))}
          </div>

          <div className="leo-sheet-header-row">
            <div className="min-w-0">
              <div className="leo-sheet-title">Timer brossage</div>
              <div className="leo-sheet-sub">2 minutes = super sourire ✨</div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" type="button" onClick={persistSettings}>
                Enregistrer
              </button>
              <button className="btn-ghost" type="button" onClick={closeAndSave}>
                Fermer
              </button>
            </div>
          </div>

          <div className="leo-timer-hero">
            {celebrate ? (
              <div className="leo-confetti" aria-hidden>
                {Array.from({ length: 18 }).map((_, i) => (
                  <span key={i} className="leo-confetti-bit" style={{ "--i": i }} />
                ))}
              </div>
            ) : null}
            <div className="leo-timer-sticker leo-timer-sticker--left" aria-hidden>
              🪥
            </div>
            <div className="leo-timer-sticker leo-timer-sticker--right" aria-hidden>
              🫧
            </div>

            <div className="leo-timer-ring leo-timer-ring--lg" aria-hidden>
              <div className="leo-timer-ring-inner">
                <ToothMascot className="leo-tooth-svg" />
                <div className="leo-timer-ring-time tabular-nums">{fmt(running ? remaining : seconds)}</div>
                <div className="leo-timer-ring-sub">{running ? "On brosse !" : "Prêt ?"}</div>
              </div>
            </div>

            <div className="leo-timer-hero-chips">
              <span className="chip">⏱ {fmt(seconds)}</span>
              <span className="chip">🎬 {selectedVideo?.title ? selectedVideo.title : "Sans vidéo"}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="leo-sheet-body">
          {/* Durée */}
          <div className="leo-card-inner leo-section">
            <div className="flex items-center justify-between">
              <div className="leo-kicker">DURÉE</div>
              <span className="chip">{fmt(seconds)}</span>
            </div>

            <div className="mt-3">
              <input
                type="range"
                min={MIN_SEC}
                max={MAX_SEC}
                step={STEP_SEC}
                value={seconds}
                onChange={(e) => setSeconds(clamp(Number(e.target.value), MIN_SEC, MAX_SEC))}
                className="leo-range leo-range--fun"
                style={{ "--p": `${pct}%` }}
                aria-label="Durée brossage"
              />

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button className="btn-ghost" type="button" onClick={dec15} disabled={running}>
                  − 15s
                </button>
                <button className="btn-ghost" type="button" onClick={inc15} disabled={running}>
                  + 15s
                </button>
                <button className="btn-ghost" type="button" onClick={reset}>
                  Reset
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <span className="chip">⏳ {fmt(running ? remaining : seconds)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vidéo */}
          <div className="leo-card-inner leo-section mt-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="leo-kicker">VIDÉO (OPTIONNEL)</div>
                <div className="leo-title" style={{ fontSize: 16 }}>Choisir une vidéo</div>
              </div>
              <span className="chip">🎬</span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                {videos.length === 0 ? (
                  <div className="muted">Aucune vidéo configurée.</div>
                ) : (
                  videos.map((v) => {
                    const active = v.id === effectiveVideoId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVideoId(v.id)}
                        className={[
                          "leo-video-pill",
                          active ? "is-on" : "",
                        ].join(" ")}
                      >
                        <div className="leo-video-pill-title">{v.title}</div>
                        <div className="leo-video-pill-sub">
                          {v.mood ? v.mood : "Calme"} • {v.durationLabel ? v.durationLabel : "2 min"}
                        </div>
                      </button>
                    );
                  })
                )}
                <button type="button" className="btn-ghost" onClick={() => setVideoId(null)}>
                  Sans vidéo
                </button>
              </div>

              <div className="leo-video-preview">
                <div className="leo-kicker">APERÇU</div>
                {showVideo ? (
                  <>
                    <video
                      ref={videoRef}
                      src={selectedVideo?.url || ""}
                      preload="auto"
                      playsInline
                      controls
                      className="w-full rounded-2xl border border-gray-200 bg-black"
                    />
                    <div className="muted text-xs mt-2">
                      Sur iPhone, la lecture doit être déclenchée par un clic (OK avec “Démarrer avec vidéo”).
                    </div>
                  </>
                ) : (
                  <div className="muted">
                    Appuie sur “Démarrer avec vidéo” pour lancer la vidéo + le timer ensemble.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="leo-timer-actions mt-3">
            {!running ? (
              <>
                <button
                  className="btn-primary leo-cta-big"
                  type="button"
                  onClick={startWithVideo}
                  disabled={!selectedVideo?.url}
                  title={!selectedVideo?.url ? "Choisis une vidéo" : ""}
                >
                  Démarrer (avec vidéo) 🎬
                </button>
                <button className="btn-ghost leo-cta-big" type="button" onClick={startTimerOnly}>
                  Démarrer seul 🪥
                </button>
              </>
            ) : (
              <>
                <button className="btn-primary leo-cta-big" type="button" onClick={() => stopAll()}>
                  Stop ⏹️
                </button>
                <button className="btn-ghost leo-cta-big" type="button" onClick={reset}>
                  Reset
                </button>
              </>
            )}
          </div>
        </div>

        <style>{`
          .leo-range {
            --track: #e5e7eb;
            --fill: #0f766e;
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 10px;
            border-radius: 9999px;
            background: linear-gradient(to right, var(--fill) var(--p), var(--track) var(--p));
            outline: none;
          }
          .leo-range--fun { --fill: rgba(29, 78, 216, 0.95); }
          .leo-range::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 22px;
            height: 22px;
            border-radius: 9999px;
            background: white;
            border: 2px solid var(--fill);
            box-shadow: 0 2px 10px rgba(0,0,0,.12);
            cursor: pointer;
          }
          .leo-range::-moz-range-thumb {
            width: 22px;
            height: 22px;
            border-radius: 9999px;
            background: white;
            border: 2px solid var(--fill);
            box-shadow: 0 2px 10px rgba(0,0,0,.12);
            cursor: pointer;
          }
          .leo-range::-moz-range-track {
            height: 10px;
            border-radius: 9999px;
            background: var(--track);
          }
        `}</style>
      </div>
    </div>
  );
}
