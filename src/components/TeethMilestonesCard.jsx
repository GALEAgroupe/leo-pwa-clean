// src/components/TeethMilestonesCard.jsx
import { useMemo, useState } from "react";
import { PRIMARY_ERUPTION, PRIMARY_SHEDDING, PERMANENT_ERUPTION } from "../data/teethMilestones.js";

export default function TeethMilestonesCard() {
  const tabs = useMemo(
    () => [
      { id: "milk-erupt", label: "Dents de lait • Éruption", data: PRIMARY_ERUPTION },
      { id: "milk-shed", label: "Dents de lait • Chute", data: PRIMARY_SHEDDING },
      { id: "perm-erupt", label: "Dents définitives • Éruption", data: PERMANENT_ERUPTION },
    ],
    []
  );

  const [tab, setTab] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === tab) || tabs[0];

  return (
    <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-serif text-lg font-bold">Repères dentaires</div>
          <div className="muted mt-1">
            Âges indicatifs (variations normales). Si doute, retard marqué ou douleur inhabituelle → avis dentiste.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-semibold border transition",
              tab === t.id ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-white border-gray-200 text-gray-700",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Desktop/tablet table */}
      <div className="mt-4 hidden sm:block">
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Dent</th>
                <th className="px-4 py-3 font-semibold">Maxillaire (haut)</th>
                <th className="px-4 py-3 font-semibold">Mandibulaire (bas)</th>
              </tr>
            </thead>
            <tbody>
              {current.data.map((row) => (
                <tr key={row.tooth} className="border-t border-gray-200">
                  <td className="px-4 py-3 font-medium">{row.tooth}</td>
                  <td className="px-4 py-3">{row.upper}</td>
                  <td className="px-4 py-3">{row.lower}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 grid gap-2 sm:hidden">
        {current.data.map((row) => (
          <div key={row.tooth} className="rounded-2xl border border-gray-200 p-3">
            <div className="font-semibold">{row.tooth}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-gray-50 p-2">
                <div className="muted">Haut</div>
                <div className="font-semibold">{row.upper}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-2">
                <div className="muted">Bas</div>
                <div className="font-semibold">{row.lower}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
