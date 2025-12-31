import { useContext, useMemo, useState } from "react";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  isToday,
  addMonths,
  startOfDay,
  isBefore,
  isAfter,
  isSameWeek,
} from "date-fns";
import { fr } from "date-fns/locale";

import Card from "../components/Card.jsx";
import ChildSwitcher from "../components/ChildSwitcher.jsx";
import DayEditModal from "../components/DayEditModal.jsx";
import TeethTimelineCard from "../components/TeethTimelineCard.jsx";
import { AppCtx } from "../app/AppShell.jsx";
import { applyGamiFromLogTransition } from "../lib/gamification.js";

/** ---------------- Helpers logs ---------------- **/
function dateKey(d) {
  return format(d, "yyyy-MM-dd");
}

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

/** ---------------- Helpers dentiste ---------------- **/
function parseDateFlexible(raw) {
  if (!raw) return null;

  // ISO yyyy-mm-dd
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }

  // dd/mm/yyyy
  if (typeof raw === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split("/").map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return isNaN(d.getTime()) ? null : d;
  }

  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;

  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function getLastDentalVisit(child) {
  // tu peux garder UNIQUEMENT lastDentalVisit si tu veux, ici je mets des fallbacks robustes
  return (
    child?.lastDentalVisit ??
    child?.lastDentistVisit ??
    child?.lastDentalCheckup ??
    child?.dentistLastVisit ??
    child?.lastDentist ??
    null
  );
}

function formatYYYYMMDD(d) {
  return format(d, "yyyyMMdd");
}

function escapeIcs(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildAllDayIcs({ title, date, description = "" }) {
  const start = formatYYYYMMDD(date);
  const end = formatYYYYMMDD(addDays(date, 1)); // DTEND est exclusif

  const uid =
    (globalThis.crypto?.randomUUID?.() || `leo-${Date.now()}-${Math.random().toString(16).slice(2)}`) + "@leo";

  // DTSTAMP en UTC
  const now = new Date();
  const dtstamp = `${format(now, "yyyyMMdd")}T${format(now, "HHmmss")}Z`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LEO//Calendar//FR
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART;VALUE=DATE:${start}
DTEND;VALUE=DATE:${end}
SUMMARY:${escapeIcs(title)}
DESCRIPTION:${escapeIcs(description)}
END:VEVENT
END:VCALENDAR`;
}

function downloadIcs(icsText, filename) {
  const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** ======================= Component ======================= **/
export default function Calendar() {
  const { state, setState, activeChild } = useContext(AppCtx);
  const child = activeChild();

  const today0 = startOfDay(new Date());
  const minDate = subDays(today0, 7);
  const minWeekStart = startOfWeek(minDate, { weekStartsOn: 1 });
  const maxWeekStart = startOfWeek(today0, { weekStartsOn: 1 });

  const clampAnchor = (d) => {
    const w = startOfWeek(d, { weekStartsOn: 1 });
    if (isBefore(w, minWeekStart)) return minWeekStart;
    if (isAfter(w, maxWeekStart)) return maxWeekStart;
    return w;
  };

  const [anchor, setAnchor] = useState(() => clampAnchor(today0));
  const [selected, setSelected] = useState(null);

  const logsForChild = state.logs?.[child?.id] || {};

  const anchorWeekStart = useMemo(() => startOfWeek(anchor, { weekStartsOn: 1 }), [anchor]);
  const canPrev = anchorWeekStart.getTime() > minWeekStart.getTime();
  const canNext = anchorWeekStart.getTime() < maxWeekStart.getTime();

  /** ✅ 1 semaine (7 jours) */
  const days = useMemo(() => {
    const start = anchorWeekStart;
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [anchorWeekStart]);

  const setLog = (d, value) => {
    const k = dateKey(d);
    setState((s) => {
      const childId = child.id;
      const childLogs = s.logs?.[childId] || {};
      const prev = normalizeDayLog(childLogs[k]);
      const nextState = {
        ...s,
        logs: {
          ...s.logs,
          [childId]: {
            ...childLogs,
            [k]: { am: !!value.am, pm: !!value.pm },
          },
        },
      };

      // ✅ Gamification (si tranche 6–10, la fonction gère le “gate”)
      return applyGamiFromLogTransition({
        state: nextState,
        child,
        childId,
        dateKey: k,
        prevLog: prev,
        nextLog: { am: !!value.am, pm: !!value.pm },
      });
    });
  };

  const clearLog = (d) => {
    const k = dateKey(d);
    setState((s) => {
      const childId = child.id;
      const childLogs = { ...(s.logs?.[childId] || {}) };
      delete childLogs[k];
      return { ...s, logs: { ...s.logs, [childId]: childLogs } };
    });
  };

  const selectedKey = selected ? dateKey(selected) : null;
  const selectedValue = selectedKey ? normalizeDayLog(logsForChild[selectedKey]) : { am: false, pm: false };
  const selectedLabel = selected ? format(selected, "EEEE d MMMM", { locale: fr }) : "";

  const rangeLabel = useMemo(() => {
    const a = days[0];
    const b = days[days.length - 1];
    return `${format(a, "d MMM", { locale: fr })} – ${format(b, "d MMM", { locale: fr })}`;
  }, [days]);

  const stats = useMemo(() => {
    const entries = days.map((d) => {
      const log = normalizeDayLog(logsForChild[dateKey(d)]);
      return { am: log.am, pm: log.pm };
    });

    const amDone = entries.filter((x) => x.am).length;
    const pmDone = entries.filter((x) => x.pm).length;
    const fullDays = entries.filter((x) => x.am && x.pm).length;

    const totalSlots = entries.length * 2;
    const doneSlots = amDone + pmDone;
    const rate = totalSlots ? Math.round((doneSlots / totalSlots) * 100) : 0;

    return { amDone, pmDone, fullDays, rate };
  }, [days, logsForChild]);

  /** ✅ Prochain RDV dentiste */
  const dentalInfo = useMemo(() => {
    const lastRaw = getLastDentalVisit(child);
    const last = parseDateFlexible(lastRaw);

    const rawRecall = Number(child?.dentalRecallMonths ?? 6);
    const recallMonths = Number.isFinite(rawRecall) && rawRecall > 0 ? rawRecall : 6;

    if (!last) return { last: null, next: null, overdue: false, recallMonths };

    const nextCandidate = startOfDay(addMonths(last, recallMonths));
    if (isNaN(nextCandidate.getTime())) {
      return { last: startOfDay(last), next: null, overdue: false, recallMonths };
    }

    const overdue = isBefore(nextCandidate, startOfDay(new Date()));
    return { last: startOfDay(last), next: nextCandidate, overdue, recallMonths };
  }, [child]);

  const showDentalCard = useMemo(() => {
    // "page Aujourd’hui" -> on l’affiche quand la semaine affichée contient aujourd’hui
    return isSameWeek(anchor, new Date(), { weekStartsOn: 1 });
  }, [anchor]);

  const onAddDentalToCalendar = () => {
    if (!child || !dentalInfo.next) return;

    const childName = child?.firstName ?? child?.name ?? "Enfant";
    const title = `Rendez-vous dentiste — ${childName}`;
    const description = `Rappel automatique.\nDernier RDV : ${
      dentalInfo.last ? format(dentalInfo.last, "dd/MM/yyyy") : "—"
    }\nFréquence : ${dentalInfo.recallMonths} mois.`;

    const ics = buildAllDayIcs({
      title,
      date: dentalInfo.next,
      description,
    });

    const filename = `rdv-dentiste-${childName}-${formatYYYYMMDD(dentalInfo.next)}.ics`.replace(/\s+/g, "-");
    downloadIcs(ics, filename);
  };

  const pillBase =
    "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-extrabold leading-none shrink-0";
  const pillOff = "border border-gray-200 text-gray-700 bg-white";
  const pillOn = "bg-emerald-500 text-white border border-emerald-500";

  const renderWeek = (weekDays) => (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {weekDays.map((d) => {
        const k = dateKey(d);
        const log = normalizeDayLog(logsForChild[k]);
        const complete = log.am && log.pm;
        const today = isToday(d);
        const allowed = !isAfter(startOfDay(d), today0) && !isBefore(startOfDay(d), minDate);

        return (
          <button
            key={k}
            type="button"
            onClick={() => (allowed ? setSelected(d) : null)}
            disabled={!allowed}
            className={[
              "rounded-2xl border transition overflow-hidden",
              "p-1 sm:p-2",
              "min-h-[78px] sm:min-h-[88px]",
              "text-center",
              complete ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white",
              today ? "ring-2 ring-gray-900/10" : "",
              !allowed ? "opacity-40 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <div className="text-base sm:text-sm font-extrabold">{format(d, "d")}</div>

            <div className="mt-2 flex flex-col items-center gap-1">
              <span className={[pillBase, log.am ? pillOn : pillOff].join(" ")} title="Matin" aria-label="Matin">
                M
              </span>
              <span className={[pillBase, log.pm ? pillOn : pillOff].join(" ")} title="Soir" aria-label="Soir">
                S
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="mb-4">
        <ChildSwitcher />
      </div>

      <Card
        title="Calendrier"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-ghost" type="button" disabled={!canPrev} onClick={() => setAnchor((d) => clampAnchor(subDays(d, 7)))}>
              ←
            </button>
            <button className="btn-ghost" type="button" onClick={() => setAnchor(maxWeekStart)}>
              Aujourd’hui
            </button>
            <button className="btn-ghost" type="button" disabled={!canNext} onClick={() => setAnchor((d) => clampAnchor(addDays(d, 7)))}>
              →
            </button>
          </div>
        }
      >
        {/* ✅ Prochain RDV dentiste (uniquement sur la “semaine actuelle”) */}
        {showDentalCard && (
          <div className="mb-4 rounded-3xl border border-sky-200 bg-white/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-serif text-lg font-bold">Prochain rendez-vous dentiste</div>

                {!dentalInfo.last ? (
                  <div className="text-gray-600 mt-1">
                    Ajoute la date du <b>dernier</b> rendez-vous dans le profil de l’enfant (champ{" "}
                    <code className="px-1 py-0.5 rounded bg-gray-100">lastDentalVisit</code>) pour calculer le prochain.
                  </div>
                ) : (
                  <>
                    <div className="mt-2 font-semibold">
                      {format(dentalInfo.next, "EEEE d MMMM yyyy", { locale: fr })}
                    </div>
                    <div className="text-gray-600 mt-1">
                      Dernier RDV : {format(dentalInfo.last, "dd/MM/yyyy")} • Rappel : {dentalInfo.recallMonths} mois
                    </div>

                    {dentalInfo.overdue && (
                      <div className="mt-2 inline-flex px-3 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-800 font-semibold">
                        En retard
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                type="button"
                className="px-4 py-2 rounded-full border border-gray-200 bg-white/80 font-semibold"
                onClick={onAddDentalToCalendar}
                disabled={!dentalInfo.next}
                title={!dentalInfo.next ? "Renseigne le dernier RDV dans le profil" : "Ajouter au calendrier"}
              >
                Ajouter
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
          <div className="font-medium">{rangeLabel}</div>
          <div className="muted">Clique un jour pour modifier</div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-xs text-gray-500 mb-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="text-center">
              {d}
            </div>
          ))}
        </div>

        {renderWeek(days)}

        <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-4">
          <div className="font-serif text-lg font-bold">Progression (semaine)</div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-200 p-3">
              <div className="muted">Matins</div>
              <div className="text-xl font-bold">{stats.amDone}/7</div>
            </div>
            <div className="rounded-2xl border border-gray-200 p-3">
              <div className="muted">Soirs</div>
              <div className="text-xl font-bold">{stats.pmDone}/7</div>
            </div>
            <div className="rounded-2xl border border-gray-200 p-3">
              <div className="muted">Jours complets</div>
              <div className="text-xl font-bold">{stats.fullDays}/7</div>
            </div>
            <div className="rounded-2xl border border-gray-200 p-3">
              <div className="muted">Taux</div>
              <div className="text-xl font-bold">{stats.rate}%</div>
            </div>
          </div>

          <div className="muted mt-3">Clique sur une date pour corriger / compléter.</div>
        </div>

        {/* ✅ Repères dentition */}
        <TeethTimelineCard childDob={child?.dob} />
      </Card>

      <DayEditModal
        open={!!selected}
        dateLabel={selectedLabel}
        value={selectedValue}
        onClose={() => setSelected(null)}
        onSave={(val) => selected && setLog(selected, val)}
        onClear={() => selected && clearLog(selected)}
      />
    </>
  );
}
