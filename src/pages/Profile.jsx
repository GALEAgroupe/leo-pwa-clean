// src/pages/Profile.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { addMonths, format, startOfDay, isBefore } from "date-fns";
import { fr } from "date-fns/locale";

import Card from "../components/Card.jsx";
import ChildSwitcher from "../components/ChildSwitcher.jsx";
import KidAvatar from "../components/KidAvatar.jsx";
import KidPortrait from "../components/KidPortrait.jsx";
import { AppCtx } from "../app/AppShell.jsx";
import { getAgeBand } from "../lib/age.js";
import { fileToDisplayDataUrl } from "../lib/image.js";

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

  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw + "T00:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  }

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

const PRESETS_GIRLS = ["girl_beige", "girl_marron", "girl_jaune"];
const PRESETS_BOYS = ["boy_beige", "boy_marron", "boy_jaune"];

function presetLabel(id) {
  if (!id) return "Avatar";
  const gender = id.startsWith("girl") ? "Fille" : id.startsWith("boy") ? "Garçon" : "Avatar";
  const tone = id.endsWith("_beige") ? "Beige" : id.endsWith("_marron") ? "Marron" : id.endsWith("_jaune") ? "Jaune" : "";
  return tone ? `${gender} · ${tone}` : gender;
}

/* ---------------------------
   Page Profil
--------------------------- */
export default function Profile() {
  const { state, setState, activeChild } = useContext(AppCtx);

  // MIGRATION safety: children must have ids
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
  const [dob, setDob] = useState(child?.dob || child?.birthDate || child?.birthdate || "");

  // Suivi dentiste
  const [lastDentalVisit, setLastDentalVisit] = useState(child?.lastDentalVisit || child?.lastDentistVisit || "");
  const [dentalRecallMonths, setDentalRecallMonths] = useState(() => {
    const v = Number(child?.dentalRecallMonths ?? 6);
    return Number.isFinite(v) && v > 0 ? v : 6;
  });

  useEffect(() => {
    setName(child?.name || child?.firstName || "Enfant");
    setDob(child?.dob || child?.birthDate || child?.birthdate || "");

    setLastDentalVisit(child?.lastDentalVisit || child?.lastDentistVisit || "");
    const v = Number(child?.dentalRecallMonths ?? 6);
    setDentalRecallMonths(Number.isFinite(v) && v > 0 ? v : 6);
  }, [childId]); // eslint-disable-line react-hooks/exhaustive-deps

  const band = useMemo(() => getAgeBand({ ...(child || {}), dob }), [child, dob]);
  const ageLabel = useMemo(() => calcAgeLabel(dob), [dob]);

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
          firstName: nextName,
          dob,
          birthDate: dob,
          birthdate: dob,
          // champs dentiste
          lastDentalVisit: lastDentalVisit || "",
          dentalRecallMonths: Number.isFinite(recall) && recall > 0 ? recall : 6,
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
        avatar: { type: "preset", presetId: "girl_beige" },
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

      const rewards = { ...(s.rewards || {}) };
      delete rewards[id];

      let activeChildId = s.activeChildId;
      if (activeChildId === id) activeChildId = children[0]?.id || null;

      return { ...s, children, logs, rewards, activeChildId };
    });
  };

  const setPreset = (presetId) => {
    if (!childId) return;
    setState((s) => {
      const children = (s.children || []).map((c) =>
        c.id === childId ? { ...c, avatar: { type: "preset", presetId } } : c
      );
      return { ...s, children };
    });
  };

  const setPhoto = async (file) => {
    if (!childId || !file) return;
    const dataUrl = await fileToDisplayDataUrl(file, { maxDim: 720, quality: 0.88 });
    if (!dataUrl) return;
    setState((s) => {
      const children = (s.children || []).map((c) =>
        c.id === childId ? { ...c, avatar: { type: "photo", photoDataUrl: dataUrl } } : c
      );
      return { ...s, children };
    });
  };

  const normalizePresetId = (id) => {
    const map = { girl_1: "girl_beige", girl_2: "girl_marron", girl_3: "girl_jaune", boy_1: "boy_beige", boy_2: "boy_marron", boy_3: "boy_jaune" };
    return map[id] || id;
  };

  const currentPresetId = child?.avatar?.type === "preset" ? normalizePresetId(child.avatar.presetId) : null;

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

          {/* Suivi dentiste */}
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
                <div className="muted mt-2">Cette date sert à calculer automatiquement le prochain RDV sur la page Calendrier.</div>
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

              {dentalPreview.next ? (
                <div className="rounded-2xl border border-gray-200 bg-white/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-gray-600 text-sm">Prochain RDV estimé</div>
                      <div className="font-bold">{format(dentalPreview.next, "EEEE d MMMM yyyy", { locale: fr })}</div>
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
          <div className="flex items-center gap-4">
            <KidAvatar child={child || { name }} size={78} showPins={false} ring={true} />
            <div className="min-w-0">
              <div className="font-semibold">{name || "Enfant"}</div>
              <div className="muted text-sm">Choisis une photo ou un avatar (premium + fun).</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">Photo</div>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0])} className="block w-full text-sm" />
            <div className="muted mt-2">Conseil : une photo carrée, lumineuse. (On compresse automatiquement.)</div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold mb-2">Avatars — Filles</div>
            <div className="grid grid-cols-3 gap-3">
              {PRESETS_GIRLS.map((id) => {
                const selected = currentPresetId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPreset(id)}
                    className={[
                      "rounded-3xl border p-2 transition bg-white/70",
                      selected ? "border-emerald-400 ring-2 ring-emerald-200" : "border-gray-200",
                    ].join(" ")}
                    aria-label={id}
                  >
                    <KidPortrait presetId={id} className="w-full h-auto" />
                    <div className="mt-1 text-xs font-semibold opacity-70">{presetLabel(id)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold mb-2">Avatars — Garçons</div>
            <div className="grid grid-cols-3 gap-3">
              {PRESETS_BOYS.map((id) => {
                const selected = currentPresetId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPreset(id)}
                    className={[
                      "rounded-3xl border p-2 transition bg-white/70",
                      selected ? "border-emerald-400 ring-2 ring-emerald-200" : "border-gray-200",
                    ].join(" ")}
                    aria-label={id}
                  >
                    <KidPortrait presetId={id} className="w-full h-auto" />
                    <div className="mt-1 text-xs font-semibold opacity-70">{presetLabel(id)}</div>
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
              const cAge = calcAgeLabel(c.dob || c.birthDate || c.birthdate || "");
              return (
                <div key={c.id} className="rounded-3xl border border-gray-200 bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <KidAvatar child={c} size={46} showPins={false} ring={isActive} />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{c.name || c.firstName || "Enfant"}</div>
                        <div className="muted text-xs">{cAge}</div>
                      </div>
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
