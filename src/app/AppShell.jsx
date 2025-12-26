import React, { useEffect, useMemo, useState, useContext, useRef } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { routes } from "./routes.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { loadState, saveState } from "../lib/storage.js";
import { AuthCtx } from "./AuthProvider.jsx";

export const AppCtx = React.createContext(null);

export default function AppShell() {
  const { user, ready, logout } = useContext(AuthCtx);
  const location = useLocation();

  if (!ready) return null;
  if (!user && location.pathname !== "/login") return <Navigate to="/login" replace />;

  const [state, setState] = useState(loadState());

  const uid = user?.uid || null;
  const uidRef = useRef("__init__");

  // ✅ Charge/Sauvegarde le state par utilisateur (persistant entre connexions)
  useEffect(() => {
    if (!ready) return;
    if (uidRef.current === uid) return;
    uidRef.current = uid;
    setState(loadState(uid));
  }, [ready, uid]);

  useEffect(() => {
    saveState(state, uid);
  }, [state, uid]);

  const api = useMemo(
    () => ({
      state,
      setState,
      activeChild() {
        return state.children.find((c) => c.id === state.activeChildId) || state.children[0];
      },
      setActiveChild(id) {
        setState((s) => ({ ...s, activeChildId: id }));
      },
    }),
    [state]
  );

  const getTitle = (pathname) => {
    if (pathname === "/") return "Aujourd’hui";
    if (pathname.startsWith("/calendar")) return "Calendrier";
    if (pathname.startsWith("/videos")) return "Vidéos";
    if (pathname.startsWith("/articles")) return "Articles";
    if (pathname.startsWith("/urgence")) return "Urgences";
    if (pathname.startsWith("/profile")) return "Profil";
    if (pathname.startsWith("/login")) return "Connexion";
    return "LEO";
  };

  return (
    <AppCtx.Provider value={api}>
      {/* ✅ background already handled by body; wrapper just ensures full height */}
      <div className="min-h-screen">
        {/* ✅ Safe-area top via padding inline */}
        <header
          className="sticky top-0 z-20"
          style={{ paddingTop: "var(--safe-top)" }}
        >
          <div className="container-app">
            <div className="leo-card mt-3 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs tracking-wide text-[rgba(15,45,42,0.55)]">LEO</div>
                  <div className="h1">{getTitle(location.pathname)}</div>
                </div>

                {user ? (
                  <button className="btn-ghost" type="button" onClick={logout}>
                    Déconnexion
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="container-app pt-4 pb-28">
          <Routes>
            {routes.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
          </Routes>
        </main>

        <BottomNav />
      </div>
    </AppCtx.Provider>
  );
}
