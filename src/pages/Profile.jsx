// src/pages/Profile.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { addMonths, format, startOfDay, isBefore } from "date-fns";
import { fr } from "date-fns/locale";

import Card from "../components/Card.jsx";
import ChildSwitcher from "../components/ChildSwitcher.jsx";
import { AppCtx } from "../app/AppShell.jsx";
import { getAgeBand } from "../lib/age.js";

/* ---------------------------
   Helpers
--------------------------- */
function makeId() {
  return globalThis.crypto?.randomUUID?.() || `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function parseDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDateFlexible(raw) {
  if (!raw) return null;

  // ISO yyyy-mm-dd (idéal pour <input type="date">)
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw + "T00:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // dd/mm/yyyy
  if (typeof raw === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split("/").map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;

  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function calcAgeLabel(dob) {
  const d = parseDob(dob);
  if (!d) return "Âge inconnu";

  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  const days = now.getDate() - d.getDate();

  if (days < 0) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return "Âge inconnu";

  if (years === 0) return `${months} mois`;
  if (months === 0) return `${years} an${years > 1 ? "s" : ""}`;
  return `${years} an${years > 1 ? "s" : ""} ${months} mois`;
}

/* ---------------------------
   Avatars (SVG simples)
--------------------------- */
function Icon({ name }) {
  const common = "h-6 w-6";
  switch (name) {
    case "tooth":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M7.5 3.5c-1.7 1-2.5 2.6-2.5 4.6 0 2.2.8 4.4 1.7 6.2.7 1.4 1.3 2.7 1.5 4 .3 1.8 1.2 2.7 2.3 2.7 1.1 0 1.6-1.1 1.9-2.5.2-1.1.5-2 1.1-2s.9.9 1.1 2c.3 1.4.8 2.5 1.9 2.5 1.1 0 2-.9 2.3-2.7.2-1.3.8-2.6 1.5-4C20.2 12.5 21 10.3 21 8.1c0-2-.8-3.6-2.5-4.6-1.6-.9-3.6-.8-5 .2-.8.6-1.6.6-2.4 0-1.4-1-3.4-1.1-5-.2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "spark":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l1.2 6.2L20 12l-6.8 3.8L12 22l-1.2-6.2L4 12l6.8-3.8L12 2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "star":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3.5l2.6 5.6 6.1.7-4.5 4 .9 6-5.1-2.9-5.1 2.9.9-6-4.5-4 6.1-.7L12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return <Icon name="tooth" />;
  }
}

const AVATARS = {
  "0-3": [
    { id: "tooth-mint", icon: "tooth", bg: "bg-emerald-100", fg: "text-emerald-900" },
    { id: "spark-sky", icon: "spark", bg: "bg-sky-100", fg: "text-sky-900" },
    { id: "star-lime", icon: "star", bg: "bg-lime-100", fg: "text-lime-900" },
  ],
  "3-6": [
    { id: "tooth-mint", icon: "tooth", bg: "bg-emerald-100", fg: "text-emerald-900" },
    { id: "spark-sky", icon: "spark", bg: "bg-sky-100", fg: "text-sky-900" },
    { id: "star-lime", icon: "star", bg: "bg-lime-100", fg: "text-lime-900" },
  ],
  "6-12": [
    { id: "tooth-mint", icon: "tooth", bg: "bg-emerald-100", fg: "text-emerald-900" },
    { id: "spark-sky", icon: "spark", bg: "bg-sky-100", fg: "text-sky-900" },
    { id: "star-lime", icon: "star", bg: "bg-lime-100", fg: "text-lime-900" },
  ],
};

function getPresetById(band, id) {
  const list = AVATARS[band] || [];
  return list.find((x) => x.id === id) || null;
}

/* ---------------------------
   Page Profil
--------------------------- */
export default function Profile() {
  const { state, setState, activeChild } = useContext(AppCtx);

  // ✅ MIGRATION: si des enfants n'ont pas d'id => on en ajoute automatiquement
  useEffect(() => {
    setState((s) => {
      const children = Array.isArray(s.children) ? s.children : [];
      if (children.length === 0) return s;

      let changed = false;
      const nextChildren = children.map((c) => {
        if (c?.id) return c;
        changed = true;
        return { ...c, id: makeId() };
      });

      const nextActive =
        (s.activeChildId && nextChildren.some((c) => c.id === s.activeChildId) && s.activeChildId) ||
        nextChildren[0]?.id ||
        null;

      if (!changed && nextActive === s.activeChildId) return s;
      return { ...s, children: nextChildren, activeChildId: nextActive };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const child = activeChild?.() || null;
  const childId = child?.id || state.activeChildId || null;

  // Draft local
  const [name, setName] = useState(child?.name || child?.firstName || "Enfant");
  const [dob, setDob] = useState(child?.dob || child?.birthDate || "");

  // ✅ Nouveau : suivi dentiste
  const [lastDentalVisit, setLastDentalVisit] = useState(
    child?.lastDentalVisit || child?.lastDentistVisit || ""
  );
  const [dentalRecallMonths, setDentalRecallMonths] = useState(() => {
    const v = Number(child?.dentalRecallMonths ?? 6);
    return Number.isFinite(v) && v > 0 ? v : 6;
  });

  useEffect(() => {
    setName(child?.name || child?.firstName || "Enfant");
    setDob(child?.dob || child?.birthDate || "");

    setLastDentalVisit(child?.lastDentalVisit || child?.lastDentistVisit || "");
    const v = Number(child?.dentalRecallMonths ?? 6);
    setDentalRecallMonths(Number.isFinite(v) && v > 0 ? v : 6);
  }, [childId]); // eslint-disable-line react-hooks/exhaustive-deps

  const band = useMemo(() => getAgeBand({ ...(child || {}), dob }), [child, dob]);
  const ageLabel = useMemo(() => calcAgeLabel(dob), [dob]);
  const suggestions = AVATARS[band] || AVATARS["3-6"];

  const dentalPreview = useMemo(() => {
    const last = parseDateFlexible(lastDentalVisit);
    if (!last) return { last: null, next: null, overdue: false };

    const next = startOfDay(addMonths(startOfDay(last), Number(dentalRecallMonths || 6)));
    const overdue = isBefore(next, startOfDay(new Date()));
    return { last: startOfDay(last), next, overdue };
  }, [lastDentalVisit, dentalRecallMonths]);

  const saveActiveChild = () => {
    if (!childId) return;
    const nextName = (name || "").trim() || "Enfant";
    const recall = Number(dentalRecallMonths || 6);

    setState((s) => {
      const children = (s.children || []).map((c) => {
        if (c.id !== childId) return c;
        return {
          ...c,
          name: nextName,
          firstName: nextName, // compat
          dob,
          birthDate: dob, // compat

          // ✅ champs dentiste
          lastDentalVisit: lastDentalVisit || "",
          dentalRecallMonths: Number.isFinite(recall) && recall > 0 ? recall : 6,

          // compat (si tu as déjà du code qui lit ça)
          lastDentistVisit: lastDentalVisit || "",
        };
      });
      return { ...s, children };
    });
  };

  const addChild = () => {
    const id = makeId();
    setState((s) => {
      const children = [...(s.children || [])];
      children.push({
        id,
        name: "Enfant",
        dob: "",
        avatarPreset: null,
        photo: null,

        // ✅ nouveau
        lastDentalVisit: "",
        dentalRecallMonths: 6,
      });
      return { ...s, children, activeChildId: id };
    });
  };

  const deleteChild = (id) => {
    const c = (state.children || []).find((x) => x.id === id);
    const label = c?.name || "cet enfant";

    if (!window.confirm(`Supprimer le profil "${label}" ?\n\nCette action est irréversible.`)) return;

    setState((s) => {
      const children = (s.children || []).filter((x) => x.id !== id);

      const logs = { ...(s.logs || {}) };
      delete logs[id];

      let activeChildId = s.activeChildId;
      if (activeChildId === id) activeChildId = children[0]?.id || null;

      return { ...s, children, logs, activeChildId };
    });
  };

  const setPreset = (presetId) => {
    if (!childId) return;
    setState((s) => {
      const children = (s.children || []).map((c) =>
        c.id === childId ? { ...c, avatarPreset: presetId, photo: null, photoDataUrl: null } : c
      );
      return { ...s, children };
    });
  };

  const setPhoto = (file) => {
    if (!childId || !file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setState((s) => {
        const children = (s.children || []).map((c) =>
          c.id === childId ? { ...c, photo: dataUrl, photoDataUrl: dataUrl, avatarPreset: null } : c
        );
        return { ...s, children };
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="mb-4">
        <ChildSwitcher />
      </div>

      <Card title="Profil enfant">
        <div className="grid gap-3">
          <div>
            <div className="text-sm font-semibold mb-1">Nom</div>
            <input
              className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Prénom"
            />
          </div>

          <div>
            <div className="text-sm font-semibold mb-1">Date de naissance</div>
            <input
              type="date"
              className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
            <div className="muted mt-2">
              Âge : <b>{ageLabel}</b> • Tranche : <b>{band}</b>
            </div>
          </div>

          {/* ✅ Nouveau : suivi dentiste */}
          <div className="mt-2 rounded-3xl border border-sky-200 bg-white/70 p-4">
            <div className="font-serif text-lg font-bold">Suivi dentiste</div>

            <div className="grid gap-3 mt-3">
              <div>
                <div className="text-sm font-semibold mb-1">Date du dernier rendez-vous</div>
                <input
                  type="date"
                  className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3"
                  value={lastDentalVisit}
                  onChange={(e) => setLastDentalVisit(e.target.value)}
                />
                <div className="muted mt-2">
                  Cette date sert à calculer automatiquement le prochain RDV sur la page Calendrier.
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold mb-1">Rappel</div>
                <select
                  className="w-full rounded-2xl border border-gray-200 bg-white/70 px-4 py-3"
                  value={String(dentalRecallMonths)}
                  onChange={(e) => setDentalRecallMonths(Number(e.target.value))}
                >
                  <option value="6">Tous les 6 mois (recommandé)</option>
                  <option value="12">Tous les 12 mois</option>
                  <option value="3">Tous les 3 mois</option>
                </select>
              </div>

              {/* Aperçu */}
              {dentalPreview.next ? (
                <div className="rounded-2xl border border-gray-200 bg-white/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-gray-600 text-sm">Prochain RDV estimé</div>
                      <div className="font-bold">
                        {format(dentalPreview.next, "EEEE d MMMM yyyy", { locale: fr })}
                      </div>
                      <div className="text-gray-600 text-sm mt-1">
                        (Dernier : {format(dentalPreview.last, "dd/MM/yyyy")} • {dentalRecallMonths} mois)
                      </div>
                    </div>

                    {dentalPreview.overdue && (
                      <span className="px-3 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-800 font-semibold">
                        En retard
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="muted">Renseigne la date du dernier RDV pour voir l’aperçu.</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button className="btn-primary" type="button" onClick={saveActiveChild}>
              Enregistrer
            </button>
            <button className="btn-ghost" type="button" onClick={addChild}>
              Ajouter un enfant
            </button>
          </div>
        </div>
      </Card>

      <div className="mt-4">
        <Card title="Avatar / photo">
          <div className="muted">Tu peux mettre une photo ou choisir un avatar “preset”.</div>

          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">Photo</div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0])}
              className="block w-full text-sm"
            />
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold mb-2">Avatars suggérés ({band})</div>

            <div className="grid grid-cols-3 gap-3">
              {suggestions.map((a) => {
                const selected = (child?.avatarPreset || null) === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setPreset(a.id)}
                    className={[
                      "rounded-3xl border p-3 flex items-center justify-center aspect-square transition",
                      selected ? "border-emerald-400 ring-2 ring-emerald-200" : "border-gray-200",
                      "bg-white/70",
                    ].join(" ")}
                  >
                    <div className={`rounded-full ${a.bg} ${a.fg} h-14 w-14 flex items-center justify-center`}>
                      <Icon name={a.icon} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Profils enfants">
          <div className="grid gap-3">
            {(state.children || []).map((c) => {
              const isActive = state.activeChildId === c.id;
              const cAge = calcAgeLabel(c.dob || c.birthDate || "");
              return (
                <div key={c.id} className="rounded-3xl border border-gray-200 bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{c.name || c.firstName || "Enfant"}</div>
                      <div className="muted text-xs">{cAge}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className={isActive ? "btn-primary" : "btn-ghost"}
                        type="button"
                        onClick={() => setState((s) => ({ ...s, activeChildId: c.id }))}
                      >
                        {isActive ? "Actif" : "Activer"}
                      </button>

                      <button className="btn-ghost" type="button" onClick={() => deleteChild(c.id)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {(state.children || []).length === 0 ? (
              <div className="muted">Aucun enfant. Clique sur “Ajouter un enfant”.</div>
            ) : null}
          </div>
        </Card>
      </div>
    </>
  );
}
