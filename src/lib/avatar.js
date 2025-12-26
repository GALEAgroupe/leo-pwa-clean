// src/lib/avatar.js
import { getAgeBand } from "./age.js";

export function getAvatarPreset(child) {
  const band = getAgeBand(child);

  // Palette douce & ludique (sans emoji)
  if (band === "0-3") {
    return { bg: "bg-violet-100", ring: "ring-violet-200", fg: "text-violet-900" };
  }
  if (band === "3-6") {
    return { bg: "bg-emerald-100", ring: "ring-emerald-200", fg: "text-emerald-900" };
  }
  return { bg: "bg-amber-100", ring: "ring-amber-200", fg: "text-amber-900" };
}

export function getInitials(name = "Enfant") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
