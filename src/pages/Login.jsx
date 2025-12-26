import { useContext, useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import { AuthCtx } from "../app/AuthProvider.jsx";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, signup, resetPassword } = useContext(AuthCtx);
  const nav = useNavigate();

  const [mode, setMode] = useState("login"); // login | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const title = useMemo(() => {
    if (mode === "signup") return "Créer un compte";
    if (mode === "reset") return "Mot de passe oublié";
    return "Connexion";
  }, [mode]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
        nav("/", { replace: true });
      } else if (mode === "signup") {
        await signup(email, password);
        nav("/", { replace: true });
      } else {
        await resetPassword(email);
        setMsg("Email envoyé. Vérifie ta boîte mail.");
        setMode("login");
      }
    } catch (err) {
      setMsg(err?.message || "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={title}>
      <div className="flex gap-2 mb-4">
        <button className={mode === "login" ? "btn-primary" : "btn-ghost"} onClick={() => setMode("login")}>
          Se connecter
        </button>
        <button className={mode === "signup" ? "btn-primary" : "btn-ghost"} onClick={() => setMode("signup")}>
          Créer
        </button>
        <button className={mode === "reset" ? "btn-primary" : "btn-ghost"} onClick={() => setMode("reset")}>
          Oublié
        </button>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="text-sm text-gray-600">Email</label>
        <input
          className="rounded-xl border-gray-200"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="parent@email.com"
        />

        {mode !== "reset" && (
          <>
            <label className="text-sm text-gray-600">Mot de passe</label>
            <input
              className="rounded-xl border-gray-200"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
          </>
        )}

        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "…" : mode === "signup" ? "Créer le compte" : mode === "reset" ? "Envoyer l’email" : "Se connecter"}
        </button>

        {msg && <p className="muted">{msg}</p>}
      </form>
    </Card>
  );
}
