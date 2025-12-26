import { useContext } from "react";
import { AppCtx } from "../app/AppShell.jsx";
import { getAgeLabel, getAgeBand } from "../lib/age.js";

function initials(name = "Enfant") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function PresetIcon({ name }) {
  const cls = "h-4 w-4";
  switch (name) {
    case "spark":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l1.6 6.2L20 10l-6.4 1.8L12 18l-1.6-6.2L4 10l6.4-1.8L12 2Z" />
        </svg>
      );
    case "tooth":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 4c-2 0-4 1.6-4 4.1 0 2.3 1.1 3.4 2 4.3.8.8 1.4 1.5 1.6 2.8l.7 4.1c.2 1 1 1.7 2 1.7.9 0 1.7-.6 2-1.4l.6-2.2.6 2.2c.3.8 1.1 1.4 2 1.4 1 0 1.8-.7 2-1.7l.7-4.1c.2-1.3.8-2 1.6-2.8.9-.9 2-2 2-4.3C20 5.6 18 4 16 4c-1.2 0-2.2.4-3 .9-.7.5-1.3.5-2 0C10.2 4.4 9.2 4 8 4Z" />
        </svg>
      );
    case "leaf":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 4c-7 1-12 6-13 13 7-1 12-6 13-13Z" />
          <path d="M7 17c-1 1-2 2-3 3" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

function presetStyle(child) {
  // On suggère une vibe selon tranche d’âge
  const band = getAgeBand(child);
  if (band === "0-3") return { bg: "bg-purple-200", fg: "text-purple-900", icon: "spark" };
  if (band === "3-6") return { bg: "bg-emerald-200", fg: "text-emerald-900", icon: "tooth" };
  return { bg: "bg-indigo-200", fg: "text-indigo-900", icon: "leaf" };
}

function Avatar({ child, active }) {
  const a = child?.avatar || {};

  if (a.type === "photo" && a.photoDataUrl) {
    return (
      <img
        src={a.photoDataUrl}
        alt=""
        className={[
          "h-8 w-8 rounded-full object-cover",
          active ? "ring-2 ring-[var(--leo-brand)]" : "ring-1 ring-black/10",
        ].join(" ")}
      />
    );
  }

  // preset : rond pastel + icône (May-like)
  const st = presetStyle(child);
  return (
    <span
      className={[
        "h-8 w-8 rounded-full flex items-center justify-center",
        st.bg,
        st.fg,
        active ? "ring-2 ring-[var(--leo-brand)]" : "ring-1 ring-black/10",
      ].join(" ")}
      aria-hidden
      title={child?.name || "Enfant"}
    >
      <PresetIcon name={st.icon} />
    </span>
  );
}

export default function ChildSwitcher() {
  const { state, setActiveChild, activeChild } = useContext(AppCtx);
  const child = activeChild();
  const children = state.children || [];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {children.map((c) => {
        const active = c.id === child?.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveChild(c.id)}
            className={[
              "chip shrink-0 flex items-center gap-2 px-3 py-2",
              active
                ? "bg-[rgba(15,59,54,0.10)] border-[rgba(15,59,54,0.22)] text-[var(--leo-brand)]"
                : "",
            ].join(" ")}
          >
            <Avatar child={c} active={active} />
            <span className="whitespace-nowrap">
              {c.name}{" "}
              <span className="opacity-60 font-semibold">
                ({getAgeLabel(c)})
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
