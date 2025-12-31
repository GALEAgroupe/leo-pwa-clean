import React from "react";

// Lightweight inline SVGs (premium feel, no external deps)
// Usage: <MilestoneIcon name="trophy" className="..." />

function S({ children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function MilestoneIcon({ name, className = "w-6 h-6" }) {
  switch (name) {
    case "toolbox":
      return (
        <S className={className}>
          <path d="M8 6V4h8v2" />
          <path d="M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9z" />
          <path d="M10 12h4" />
        </S>
      );
    case "gift":
      return (
        <S className={className}>
          <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
          <path d="M2 12h20" />
          <path d="M12 22V12" />
          <path d="M12 12V7" />
          <path d="M7 7c0 0 1-3 4-1 3-2 4 1 4 1" />
        </S>
      );
    case "game":
      return (
        <S className={className}>
          <rect x="4" y="10" width="16" height="9" rx="3" />
          <path d="M8 14h3" />
          <path d="M9.5 12.5v3" />
          <path d="M16 14h.01" />
          <path d="M18 15h.01" />
        </S>
      );
    case "ice":
      return (
        <S className={className}>
          <path d="M8 11a4 4 0 0 1 8 0v1H8v-1z" />
          <path d="M9 12l3 10 3-10" />
        </S>
      );
    case "trophy":
      return (
        <S className={className}>
          <path d="M8 4h8v3a4 4 0 0 1-8 0V4z" />
          <path d="M6 5H4v2a4 4 0 0 0 4 4" />
          <path d="M18 5h2v2a4 4 0 0 1-4 4" />
          <path d="M12 11v4" />
          <path d="M8 19h8" />
          <path d="M10 15h4" />
        </S>
      );
    case "book":
      return (
        <S className={className}>
          <path d="M4 19a2 2 0 0 0 2 2h14" />
          <path d="M6 2h14v17H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
          <path d="M8 6h8" />
          <path d="M8 10h8" />
        </S>
      );
    case "cookie":
      return (
        <S className={className}>
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M20 12a4 4 0 0 1-4-4" />
          <path d="M12 8h.01" />
          <path d="M8 12h.01" />
          <path d="M14 14h.01" />
          <path d="M16 10h.01" />
        </S>
      );
    case "spark":
      return (
        <S className={className}>
          <path d="M12 2l1.2 4.2L17 8l-3.8 1.8L12 14l-1.2-4.2L7 8l3.8-1.8L12 2z" />
          <path d="M19 13l.6 2.1L22 16l-2.4.9L19 19l-.6-2.1L16 16l2.4-.9L19 13z" />
        </S>
      );
    default:
      return (
        <S className={className}>
          <circle cx="12" cy="12" r="9" />
        </S>
      );
  }
}
