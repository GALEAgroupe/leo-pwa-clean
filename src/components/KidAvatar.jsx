import React from "react";
import KidPortrait from "./KidPortrait.jsx";

function initials(name = "Enfant") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function KidAvatar({
  child,
  size = 64,
  pins = [],
  showPins = true,
  ring = false,
  shape = "squircle", // 'squircle' | 'circle'
  className = "",
}) {
  const a = child?.avatar || {};

  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-[22px]";

  return (
    <div
      className={["relative inline-flex", className].join(" ")}
      style={{ width: size, height: size }}
    >
      {a.type === "photo" && a.photoDataUrl ? (
        <img
          src={a.photoDataUrl}
          alt=""
          className={[
            "h-full w-full object-cover",
            radiusClass,
            ring ? "ring-2 ring-[var(--leo-brand)]" : "ring-1 ring-black/10",
          ].join(" ")}
        />
      ) : a.type === "preset" && a.presetId ? (
        <KidPortrait
          presetId={a.presetId}
          className={[
            "h-full w-full",
            ring ? "ring-2 ring-[var(--leo-brand)]" : "ring-1 ring-black/10",
            radiusClass,
          ].join(" ")}
        />
      ) : (
        <div
          className={[
            `h-full w-full ${radiusClass} bg-white/70 grid place-items-center font-extrabold`,
            ring ? "ring-2 ring-[var(--leo-brand)]" : "ring-1 ring-black/10",
          ].join(" ")}
          style={{ fontSize: Math.max(12, Math.round(size * 0.28)) }}
        >
          {initials(child?.name)}
        </div>
      )}

      {showPins && Array.isArray(pins) && pins.length ? (
        <div className="leo-badge-pins">
          {pins.slice(0, 3).map((p) => (
            <span
              key={p.id}
              className={["leo-badge-pin", p.variant === "gold" ? "leo-badge-pin--gold" : ""].join(" ")}
              title={p.id}
            >
              {p.text}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
