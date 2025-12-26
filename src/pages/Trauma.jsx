import { useContext, useState } from "react";
import Card from "../components/Card.jsx";
import { AppCtx } from "../app/AppShell.jsx";
import guides from "../data/trauma.json";

export default function Trauma() {
  const { state } = useContext(AppCtx);
  const [selected, setSelected] = useState(guides[0]);

  return (
    <>
      <Card title="Trauma (guidage parents)">
        <p className="muted">Infos générales. En cas de doute, consulte. Ne remplace pas un avis médical.</p>
        <div className="mt-4 grid gap-2">
          {guides.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelected(g)}
              className={selected?.id === g.id ? "btn-primary w-full justify-between" : "btn-ghost w-full justify-between"}
            >
              <span className="text-left">{g.title}</span>
              <span className="chip">{g.emergencyLevel}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="h-4" />

      {selected && (
        <Card title={selected.title} right={<a className="btn-primary" href={`tel:${state.settings?.cabinetPhone || ""}`}>Appeler</a>}>
          <div className="muted">{selected.type}</div>

          <div className="mt-4">
            <div className="font-medium">À faire</div>
            <ol className="mt-2 list-decimal pl-5 text-sm text-gray-700 space-y-2">
              {selected.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>

          <div className="mt-4">
            <div className="font-medium">À éviter</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-2">
              {selected.doNot.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </Card>
      )}
    </>
  );
}
