import { useEffect, useMemo, useRef, useState } from "react";

const MIN_SEC = 15;
const MAX_SEC = 120; // ✅ 2 min max
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

/**
 * Props attendues (adapte si besoin) :
 * - open: boolean
 * - onClose: () => void
 * - videos: [{ id, title, url, mood?, durationLabel? }]
 */
export default function BrushingTimerModal({
  open,
  onClose,
  videos = [],
  defaultSeconds = 120,
}) {
  const [seconds, setSeconds] = useState(clamp(defaultSeconds, MIN_SEC, MAX_SEC));
  const [selectedVideoId, setSelectedVideoId] = useState(videos?.[0]?.id ?? null);

  const [running, setRunning] = useState(false);
  const [endAt, setEndAt] = useState(null);
  const [remaining, setRemaining] = useState(seconds);

  const [showVideo, setShowVideo] = useState(false);

  const videoRef = useRef(null);
  const tickRef = useRef(null);

  const selectedVideo = useMemo(
    () => videos.find((v) => v.id === selectedVideoId) || null,
    [videos, selectedVideoId]
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
        stopAll();
      }
    }, 200);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, endAt]);

  // cleanup on close
  useEffect(() => {
    if (!open) {
      stopAll(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stopAll = (silent = false) => {
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
  };

  const reset = () => {
    stopAll(true);
    setRemaining(seconds);
    setShowVideo(false);
  };

  const startTimerOnly = () => {
    const dur = clamp(seconds, MIN_SEC, MAX_SEC);
    setRemaining(dur);
    setEndAt(Date.now() + dur * 1000);
    setRunning(true);
    setShowVideo(false);
  };

  /**
   * ✅ Important iPhone:
   * - play() doit être appelé DANS le handler du click utilisateur
   * - le <video> doit déjà être monté (on le garde monté et on cache via CSS)
   */
  const startWithVideo = async () => {
    const dur = clamp(seconds, MIN_SEC, MAX_SEC);
    setRemaining(dur);
    setEndAt(Date.now() + dur * 1000);
    setRunning(true);
    setShowVideo(true);

    const v = videoRef.current;
    if (v && selectedVideo?.url) {
      try {
        // force reload if url changed
        if (v.src !== selectedVideo.url) v.src = selectedVideo.url;

        v.currentTime = 0;

        // ⚠️ play() must happen here (user gesture)
        const p = v.play();
        if (p && typeof p.then === "function") await p;
      } catch (e) {
        // Si Safari bloque, on laisse quand même le timer démarrer
        // et l’utilisateur pourra appuyer sur la vidéo.
        // console.log(e);
      }
    }
  };

  const dec15 = () => setSeconds((s) => clamp(s - 15, MIN_SEC, MAX_SEC));
  const inc15 = () => setSeconds((s) => clamp(s + 15, MIN_SEC, MAX_SEC));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Fermer"
      />

      <div className="relative w-[min(920px,94vw)] max-h-[92vh] overflow-auto rounded-[28px] border border-gray-200 bg-white/90 backdrop-blur p-5 sm:p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-serif text-2xl font-bold text-[#0b2b22]">Timer brossage</div>
            <div className="text-gray-600">Durée + vidéo (optionnel)</div>
          </div>
          <button className="btn-ghost" type="button" onClick={onClose}>
            Fermer
          </button>
        </div>

        {/* Durée */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-[#0b2b22]">Durée</div>
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold">
              {fmt(seconds)}
            </span>
          </div>

          <div className="mt-3">
            <input
              type="range"
              min={MIN_SEC}
              max={MAX_SEC}
              step={STEP_SEC}
              value={seconds}
              onChange={(e) => setSeconds(clamp(Number(e.target.value), MIN_SEC, MAX_SEC))}
              className="leo-range"
              style={{ "--p": `${pct}%` }}
              aria-label="Durée brossage"
            />
            <div className="mt-3 flex items-center gap-3">
              <button className="btn-ghost" type="button" onClick={dec15}>
                − 15s
              </button>
              <button className="btn-ghost" type="button" onClick={inc15}>
                + 15s
              </button>

              <div className="ml-auto flex items-center gap-2">
                {!running ? (
                  <button className="btn-primary" type="button" onClick={startTimerOnly}>
                    Démarrer
                  </button>
                ) : (
                  <button className="btn-primary" type="button" onClick={() => stopAll()}>
                    Stop
                  </button>
                )}
                <button className="btn-ghost" type="button" onClick={reset}>
                  Reset
                </button>
              </div>
            </div>

            {/* Affichage chrono */}
            <div className="mt-3 rounded-2xl border border-gray-200 bg-white/70 p-3 flex items-center justify-between">
              <div className="text-gray-600">Temps restant</div>
              <div className="text-xl font-extrabold text-[#0b2b22] tabular-nums">
                {fmt(running ? remaining : seconds)}
              </div>
            </div>
          </div>
        </div>

        {/* Video */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-[#0b2b22]">Vidéo</div>
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold">
              Optionnel
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {/* Liste vidéos (tu peux garder ton design si tu en as déjà un) */}
            <div className="rounded-3xl border border-gray-200 bg-white/70 p-4">
              <div className="text-sm font-semibold mb-2">Choisir une vidéo</div>
              <div className="grid gap-2">
                {videos.length === 0 ? (
                  <div className="text-gray-600 text-sm">Aucune vidéo configurée.</div>
                ) : (
                  videos.map((v) => {
                    const active = v.id === selectedVideoId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVideoId(v.id)}
                        className={[
                          "w-full text-left rounded-2xl border px-3 py-3 transition",
                          active
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-gray-200 bg-white",
                        ].join(" ")}
                      >
                        <div className="font-semibold">{v.title}</div>
                        <div className="text-sm text-gray-600">
                          {v.mood ? v.mood : "Calme"} • {v.durationLabel ? v.durationLabel : "2 min"}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Preview vidéo (toujours monté, juste caché) */}
            <div className="rounded-3xl border border-gray-200 bg-white/70 p-4">
              <div className="text-sm font-semibold mb-2">Aperçu</div>

              <div className={showVideo ? "" : "hidden"}>
                <video
                  ref={videoRef}
                  src={selectedVideo?.url || ""}
                  preload="auto"
                  playsInline
                  controls
                  className="w-full rounded-2xl border border-gray-200 bg-black"
                />
                <div className="text-xs text-gray-600 mt-2">
                  Sur iPhone, la lecture doit être déclenchée par un clic (c’est le cas du bouton ci-dessous).
                </div>
              </div>

              {!showVideo ? (
                <div className="text-gray-600 text-sm">
                  Appuie sur “Démarrer (avec vidéo)” pour lancer la vidéo + le timer ensemble.
                </div>
              ) : null}
            </div>
          </div>

          {/* Boutons bas */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              className="btn-primary"
              type="button"
              onClick={startWithVideo}
              disabled={!selectedVideo?.url}
              title={!selectedVideo?.url ? "Choisis une vidéo" : ""}
            >
              Démarrer (avec vidéo)
            </button>

            <button className="btn-ghost" type="button" onClick={startTimerOnly}>
              Démarrer seul
            </button>
          </div>
        </div>

        {/* CSS Slider joli */}
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
