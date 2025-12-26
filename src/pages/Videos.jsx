import { useContext, useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import ChildSwitcher from "../components/ChildSwitcher.jsx";
import { AppCtx } from "../app/AppShell.jsx";
import data from "../data/videos.json";
import { getAgeBand } from "../lib/age.js";


export default function Videos() {
  const { state, setState, activeChild } = useContext(AppCtx);
  const child = activeChild();
  const band = getAgeBand(child);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Tous");

  const categories = ["Tous", ...Array.from(new Set(data.map((v) => v.category)))];

  const list = useMemo(() => {
  return data
    .filter((v) => v.ageTags.includes(band))
    .filter((v) => (cat === "Tous" ? true : v.category === cat))
    .filter((v) => v.title.toLowerCase().includes(q.toLowerCase()));
}, [band, cat, q]);


  const fav = state.favorites?.videos || {};
  const toggleFav = (id) => {
    setState((s) => ({
      ...s,
      favorites: { ...s.favorites, videos: { ...(s.favorites?.videos || {}), [id]: !((s.favorites?.videos || {})[id]) } },
    }));
  };

  return (
    <>
      <div className="mb-4">
        <ChildSwitcher />
      </div>

      <Card title="Vidéos">
        <div className="grid grid-cols-2 gap-2">
          <input className="rounded-xl border-gray-200" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="rounded-xl border-gray-200" value={cat} onChange={(e) => setCat(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="mt-4 grid gap-3">
          {list.map((v) => (
            <div key={v.id} className="rounded-2xl border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{v.title}</div>
                  <div className="muted">{v.category} • {Math.round(v.duration / 60)} min</div>
                </div>
                <button className={fav[v.id] ? "btn-primary" : "btn-ghost"} onClick={() => toggleFav(v.id)}>
                  {fav[v.id] ? "♥" : "♡"}
                </button>
              </div>

              <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200">
                <video controls playsInline style={{ width: "100%" }} src={v.url} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
