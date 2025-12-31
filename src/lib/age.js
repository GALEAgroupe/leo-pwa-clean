// src/lib/age.js

export function parseDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function ageInMonths(dob, now = new Date()) {
  const d = parseDob(dob);
  if (!d) return null;

  let months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (now.getDate() < d.getDate()) months -= 1;
  return Math.max(0, months);
}

function childDob(child) {
  return (
    child?.dob ||
    child?.birthDate ||
    child?.birthdate ||
    child?.birth_date ||
    child?.birthDateISO ||
    null
  );
}

export function getAgeLabel(child) {
  const m = ageInMonths(childDob(child));
  if (m == null) return "Âge inconnu";
  const years = Math.floor(m / 12);
  const rem = m % 12;
  if (years <= 0) return `${rem} mois`;
  if (rem === 0) return `${years} an${years > 1 ? "s" : ""}`;
  return `${years} an${years > 1 ? "s" : ""} ${rem} mois`;
}

export function getAgeBand(child) {
  const m = ageInMonths(childDob(child));
  if (m == null) return "3-6"; // fallback
  if (m < 36) return "0-3";
  if (m < 72) return "3-6";
  return "6-12";
}
