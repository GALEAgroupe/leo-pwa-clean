import { NavLink } from "react-router-dom";

function Icon({ name }) {
  const common = "h-6 w-6";
  switch (name) {
    case "home":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      );
    case "cal":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 3v3M17 3v3" />
          <path d="M4 7h16" />
          <rect x="4" y="6" width="16" height="15" rx="2" />
        </svg>
      );
    case "gift":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20 12v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9" />
          <path d="M2 7h20v5H2z" />
          <path d="M12 22V7" />
          <path d="M12 7c0-3 2-4 4-4 1.7 0 3 1.3 3 3 0 1.1-.6 2-1.5 2H12Z" />
          <path d="M12 7c0-3-2-4-4-4-1.7 0-3 1.3-3 3 0 1.1.6 2 1.5 2H12Z" />
        </svg>
      );
    case "spark":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2l1.6 6.2L20 10l-6.4 1.8L12 18l-1.6-6.2L4 10l6.4-1.8L12 2Z" />
        </svg>
      );
    case "shield":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3l8 4v6c0 5-3.4 8.3-8 9-4.6-.7-8-4-8-9V7l8-4Z" />
        </svg>
      );
    case "user":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20 21a8 8 0 1 0-16 0" />
          <circle cx="12" cy="8" r="3.5" />
        </svg>
      );
    default:
      return null;
  }
}

function Item({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-2xl min-w-[64px]",
          isActive ? "bg-[rgba(15,59,54,0.10)] text-[var(--leo-brand)]" : "text-gray-500",
        ].join(" ")
      }
    >
      <Icon name={icon} />
      <span className="text-[11px] font-medium">{label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="container-app">
        <div className="bottom-nav-pill">
          <Item to="/" icon="home" label="Aujourd’hui" />
          <Item to="/calendar" icon="cal" label="Calendrier" />
          <Item to="/rewards" icon="gift" label="Récompenses" />
          <Item to="/articles" icon="spark" label="Articles" />
          <Item to="/urgence" icon="shield" label="Urgence" />
          <Item to="/profile" icon="user" label="Profil" />
        </div>
      </div>
    </nav>
  );
}
