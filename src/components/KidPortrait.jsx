import React from "react";

// 6 avatars "réalistes" (sans assets externes), avec 3 teintes de peau
// demandées (beige / marron / jaune) et 3 variantes fille + 3 variantes garçon.

const LEGACY_MAP = {
  girl_1: "girl_beige",
  girl_2: "girl_marron",
  girl_3: "girl_jaune",
  boy_1: "boy_beige",
  boy_2: "boy_marron",
  boy_3: "boy_jaune",
};

const PRESETS = {
  // Girls
  girl_beige: {
    bg1: "#e0f2fe",
    bg2: "#fae8ff",
    skin: "#F4C7A2",
    hair: "#3A2B20",
    shirt: "#2563eb",
    accent: "#f472b6",
    hairStyle: "ponytail",
  },
  girl_marron: {
    bg1: "#dcfce7",
    bg2: "#e0e7ff",
    skin: "#C68642",
    hair: "#1f2937",
    shirt: "#06b6d4",
    accent: "#fb7185",
    hairStyle: "curly",
  },
  girl_jaune: {
    bg1: "#ffedd5",
    bg2: "#e0f2fe",
    skin: "#F1D0A5",
    hair: "#2b1f1a",
    shirt: "#f59e0b",
    accent: "#a78bfa",
    hairStyle: "bob",
  },

  // Boys
  boy_beige: {
    bg1: "#e0e7ff",
    bg2: "#cffafe",
    skin: "#F4C7A2",
    hair: "#1f2937",
    shirt: "#0ea5e9",
    accent: "#34d399",
    hairStyle: "sidepart",
  },
  boy_marron: {
    bg1: "#dcfce7",
    bg2: "#fee2e2",
    skin: "#C68642",
    hair: "#111827",
    shirt: "#10b981",
    accent: "#f59e0b",
    hairStyle: "shortcurls",
  },
  boy_jaune: {
    bg1: "#fde68a",
    bg2: "#e0f2fe",
    skin: "#F1D0A5",
    hair: "#2a201a",
    shirt: "#6366f1",
    accent: "#60a5fa",
    hairStyle: "straight",
  },
};

function Face({ skin, accent = "rgba(244,114,182,0.20)" }) {
  return (
    <>
      {/* face */}
      <path
        d="M64 34c15 0 28 12 28 32 0 14-6 26-16 34-3 3-8 5-12 5s-9-2-12-5c-10-8-16-20-16-34 0-20 13-32 28-32Z"
        fill={skin}
      />

      {/* soft shadow */}
      <ellipse cx="74" cy="72" rx="18" ry="22" fill="rgba(2,6,23,0.05)" />

      {/* ears */}
      <ellipse cx="36" cy="64" rx="5" ry="7" fill={skin} opacity="0.95" />
      <ellipse cx="92" cy="64" rx="5" ry="7" fill={skin} opacity="0.95" />

      {/* cheeks */}
      <circle cx="50" cy="74" r="4.2" fill={accent} />
      <circle cx="78" cy="74" r="4.2" fill={accent} />

      {/* eyes */}
      <ellipse cx="54" cy="62" rx="5" ry="4" fill="rgba(255,255,255,0.90)" />
      <ellipse cx="74" cy="62" rx="5" ry="4" fill="rgba(255,255,255,0.90)" />
      <circle cx="54" cy="62" r="2.2" fill="rgba(2,6,23,0.78)" />
      <circle cx="74" cy="62" r="2.2" fill="rgba(2,6,23,0.78)" />
      <circle cx="53.2" cy="61.2" r="0.9" fill="rgba(255,255,255,0.85)" />
      <circle cx="73.2" cy="61.2" r="0.9" fill="rgba(255,255,255,0.85)" />

      {/* eyebrows */}
      <path d="M49 55c2-2 6-3 10 0" fill="none" stroke="rgba(2,6,23,0.35)" strokeWidth="2" strokeLinecap="round" />
      <path d="M69 55c2-2 6-3 10 0" fill="none" stroke="rgba(2,6,23,0.35)" strokeWidth="2" strokeLinecap="round" />

      {/* nose */}
      <path d="M64 64c-1 3-1 5 1 6" fill="none" stroke="rgba(2,6,23,0.20)" strokeWidth="2" strokeLinecap="round" />

      {/* smile */}
      <path
        d="M56 77c5 6 15 6 20 0"
        fill="none"
        stroke="rgba(2,6,23,0.55)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </>
  );
}

function Hair({ hair, style }) {
  if (style === "ponytail") {
    return (
      <>
        <path
          d="M34 56c1-18 14-30 30-30s29 12 30 30c-7-10-16-14-30-14S41 46 34 56Z"
          fill={hair}
        />
        <path d="M42 56c-7 14-6 33 4 45 6 7 14 10 18 11-10-16-11-36-5-56-7-4-11-4-17 0Z" fill={hair} opacity="0.95" />
        <path d="M86 60c10 6 16 18 16 30 0 11-6 19-14 24 2-12-2-25-8-36 2-8 4-14 6-18Z" fill={hair} opacity="0.92" />
      </>
    );
  }
  if (style === "curly") {
    return (
      <>
        <path d="M32 58c2-20 18-32 32-32s30 12 32 32c-7-10-18-15-32-15s-25 5-32 15Z" fill={hair} />
        {Array.from({ length: 10 }).map((_, i) => {
          const x = 38 + i * 6;
          const y = 42 + (i % 2) * 3;
          return <circle key={i} cx={x} cy={y} r={6} fill={hair} opacity="0.95" />;
        })}
        <path d="M38 60c-8 12-8 30-1 40 3 4 7 7 11 9-6-14-5-31 0-49-5-2-7-1-10 0Z" fill={hair} opacity="0.92" />
        <path d="M90 60c8 12 8 30 1 40-3 4-7 7-11 9 6-14 5-31 0-49 5-2 7-1 10 0Z" fill={hair} opacity="0.92" />
      </>
    );
  }
  if (style === "bob") {
    return (
      <>
        <path
          d="M34 58c2-18 16-30 30-30s28 12 30 30c-7-9-16-14-30-14S41 49 34 58Z"
          fill={hair}
        />
        <path d="M36 62c-7 12-7 28 2 38 6 7 16 10 26 10s20-3 26-10c9-10 9-26 2-38-6 18-17 22-30 22s-24-4-30-22Z" fill={hair} opacity="0.95" />
        <path d="M52 44c3-4 8-6 12-6s9 2 12 6" stroke="rgba(255,255,255,0.22)" strokeWidth="4" strokeLinecap="round" />
      </>
    );
  }

  if (style === "sidepart") {
    return (
      <>
        <path d="M36 58c2-16 16-28 28-28s25 10 28 24c-9-7-17-10-26-10-12 0-22 6-30 14Z" fill={hair} />
        <path d="M44 50c4-8 12-12 20-12 10 0 20 6 22 14-10-6-17-8-22-8-6 0-12 2-20 6Z" fill={hair} opacity="0.95" />
        <path d="M54 40c6-6 18-6 26 0" stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeLinecap="round" />
      </>
    );
  }
  if (style === "shortcurls") {
    return (
      <>
        <path d="M36 58c2-16 16-28 28-28s26 10 28 24c-10-7-18-10-28-10-12 0-22 6-28 14Z" fill={hair} />
        {Array.from({ length: 8 }).map((_, i) => {
          const x = 44 + (i % 4) * 10;
          const y = 38 + Math.floor(i / 4) * 10;
          return <circle key={i} cx={x} cy={y} r={5.2} fill={hair} opacity="0.95" />;
        })}
      </>
    );
  }

  // straight
  return (
    <>
      <path d="M36 58c2-16 16-28 28-28s26 10 28 24c-10-7-18-10-28-10-12 0-22 6-28 14Z" fill={hair} />
      <path d="M42 50c6-10 16-14 22-14 11 0 21 7 24 16-11-6-18-8-24-8-6 0-12 1-22 6Z" fill={hair} opacity="0.94" />
    </>
  );
}

export default function KidPortrait({ presetId = "girl_beige", className = "" }) {
  const normalized = LEGACY_MAP[presetId] || presetId;
  const p = PRESETS[normalized] || PRESETS.girl_beige;

  return (
    <svg
      viewBox="0 0 128 128"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={`bg_${normalized}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.bg1} />
          <stop offset="1" stopColor={p.bg2} />
        </linearGradient>
      </defs>

      {/* background */}
      <rect x="6" y="6" width="116" height="116" rx="30" fill={`url(#bg_${normalized})`} />
      <rect x="6" y="6" width="116" height="116" rx="30" fill="rgba(255,255,255,0.35)" />

      {/* shirt */}
      <path
        d="M28 122c2-18 18-32 36-32s34 14 36 32H28Z"
        fill={p.shirt}
        opacity="0.95"
      />
      {/* collar accent */}
      <path d="M50 92c4 6 10 8 14 8s10-2 14-8" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="5" strokeLinecap="round" />

      {/* neck */}
      <path d="M56 86h16v10c0 6-5 11-11 11h-5c-6 0-11-5-11-11V86Z" fill={p.skin} opacity="0.96" />

      {/* hair + face */}
      <Hair hair={p.hair} style={p.hairStyle} />
      <Face skin={p.skin} accent={`rgba(244,114,182,0.18)`} />

      {/* subtle highlight */}
      <path d="M30 38c10-10 22-16 34-16" stroke="rgba(255,255,255,0.35)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
