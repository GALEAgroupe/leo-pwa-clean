import { useContext, useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import ChildSwitcher from "../components/ChildSwitcher.jsx";
import { AppCtx } from "../app/AppShell.jsx";
import tips from "../data/tips.json";
import { getAgeBand } from "../lib/age.js";

function TipIcon({ name }) {
  const cls = "h-5 w-5";
  switch (name) {
    case "tooth":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 4c-2 0-4 1.6-4 4.1 0 2.3 1.1 3.4 2 4.3.8.8 1.4 1.5 1.6 2.8l.7 4.1c.2 1 1 1.7 2 1.7.9 0 1.7-.6 2-1.4l.6-2.2.6 2.2c.3.8 1.1 1.4 2 1.4 1 0 1.8-.7 2-1.7l.7-4.1c.2-1.3.8-2 1.6-2.8.9-.9 2-2 2-4.3C20 5.6 18 4 16 4c-1.2 0-2.2.4-3 .9-.7.5-1.3.5-2 0C10.2 4.4 9.2 4 8 4Z" />
        </svg>
      );
    case "apple":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 7c-3 0-6 2.2-6 7 0 4 2.4 8 6 8s6-4 6-8c0-4.8-3-7-6-7Z" />
          <path d="M13 5c1.5-2 4-2 5-1-1 3-3 4-5 4" />
          <path d="M10.5 5c-.8-1-2.4-1.3-3.5-.7" />
        </svg>
      );
    case "water":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12Z" />
        </svg>
      );
    case "clock":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
        </svg>
      );
    case "label":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 13l-7 7-11-11V2h7L20 13Z" />
          <circle cx="7.5" cy="7.5" r="1" />
        </svg>
      );
    case "night":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7.5 7.5 0 1 0 21 14.5Z" />
        </svg>
      );
    case "snack":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 3h10l-1 18H8L7 3Z" />
          <path d="M9 7h6" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l1.6 6.2L20 10l-6.4 1.8L12 18l-1.6-6.2L4 10l6.4-1.8L12 2Z" />
        </svg>
      );
  }
}

function pillStyle(category) {
  if (category === "Brossage") return { bg: "bg-emerald-100", fg: "text-emerald-900", border: "border-emerald-200" };
  if (category === "Alimentation") return { bg: "bg-purple-100", fg: "text-purple-900", border: "border-purple-200" };
  return { bg: "bg-gray-100", fg: "text-gray-900", border: "border-gray-200" };
}

function iconBg(category) {
  if (category === "Brossage") return "bg-emerald-200 text-emerald-900";
  if (category === "Alimentation") return "bg-purple-200 text-purple-900";
  return "bg-gray-200 text-gray-900";
}

export default function Tips() {
  const { activeChild } = useContext(AppCtx);
  const child = activeChild();
  const band = getAgeBand(child);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Tous");

  const categories = ["Tous", "Brossage", "Alimentation"];

  const list = useMemo(() => {
    return tips
      .filter((t) => t.ageTags?.includes(band))
      .filter((t) => (cat === "Tous" ? true : t.category === cat))
      .filter((t) => (t.title + " " + t.body + " " + (t.tags || []).join(" ")).toLowerCase().includes(q.toLowerCase()));
  }, [band, cat, q]);

  return (
    <>
      <div className="mb-4">
        <ChildSwitcher />
      </div>

      <Card title="Astuces">
        <input
          className="w-full rounded-xl border-gray-200"
          placeholder="Chercher…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {/* Catégories (sans emoji) */}
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => {
            const st = pillStyle(c);
            const active = cat === c;
            return (
              <button
                key={c}
                type="button"
                className={[
                  "chip",
                  active ? `${st.bg} ${st.fg} ${st.border}` : "",
                ].join(" ")}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3">
          {list.map((t) => (
            <div key={t.id} className="rounded-3xl border border-gray-200 bg-white p-4">
              <div className="flex items-start gap-3">
                {/* Pastille illustration */}
                <div className={["h-10 w-10 rounded-2xl flex items-center justify-center shrink-0", iconBg(t.category)].join(" ")}>
                  <TipIcon name={t.illustration} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={["chip", pillStyle(t.category).bg, pillStyle(t.category).fg, pillStyle(t.category).border].join(" ")}>
                      {t.category}
                    </span>
                  </div>

                  <div className="mt-2 font-serif text-lg font-bold leading-tight">{t.title}</div>
                  <p className="muted mt-2">{t.body}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(t.tags || []).slice(0, 4).map((tag) => (
                      <span key={tag} className="chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {list.length === 0 ? (
            <div className="muted mt-2">Aucune astuce ne correspond à ta recherche.</div>
          ) : null}
        </div>
      </Card>
    </>
  );
}
