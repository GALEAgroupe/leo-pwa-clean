import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../components/Card.jsx";
import ChildSwitcher from "../components/ChildSwitcher.jsx";
import { AppCtx } from "../app/AppShell.jsx";

import DEFAULT_ARTICLES from "../data/articles.json";

// Placeholder "photo" (random) shown while the real cover is loading.
// Uses Picsum with a deterministic seed per article id.
function placeholderCover(seed = "leo") {
  const safe = encodeURIComponent(String(seed || "leo"));
  return `https://picsum.photos/seed/${safe}/1200/600`;
}

function useCoverSrc(article) {
  const [src, setSrc] = useState(() => placeholderCover(article?.id || "leo"));

  useEffect(() => {
    let alive = true;
    const placeholder = placeholderCover(article?.id || "leo");
    setSrc(placeholder);

    const cover = article?.cover;
    if (!cover) return () => void 0;

    const img = new Image();
    img.src = cover;
    img.onload = () => {
      if (alive) setSrc(cover);
    };
    img.onerror = () => {
      // keep placeholder
    };

    return () => {
      alive = false;
    };
  }, [article?.id, article?.cover]);

  return src;
}

function toExcerpt(text, n = 140) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}

function fmtDate(iso) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(
      iso ? new Date(iso) : new Date()
    );
  } catch {
    return "";
  }
}

/* --------------------------------
   Page Articles (liste + détail)
--------------------------------- */
export default function Articles() {
  const { state, setState, activeChild } = useContext(AppCtx);
  const child = activeChild?.() || null;

  const navigate = useNavigate();
  const { id } = useParams();

  const [q, setQ] = useState("");

  // Init: injecte des articles par défaut si aucun n'existe encore
  useEffect(() => {
    setState((s) => {
      const list = Array.isArray(s.articles) ? s.articles : null;
      if (list && list.length) return s;
      return { ...s, articles: DEFAULT_ARTICLES };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const articles = useMemo(() => (Array.isArray(state.articles) ? state.articles : []), [state.articles]);

  const article = useMemo(() => {
    if (!id) return null;
    return articles.find((a) => String(a.id) === String(id)) || null;
  }, [articles, id]); 

  // Cover: show a random placeholder while the real image loads.
  const coverSrc = useCoverSrc(article);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return articles;
    return articles.filter((a) => {
      const t = String(a.title || "").toLowerCase();
      const c = String(a.content || "").toLowerCase();
      return t.includes(needle) || c.includes(needle);
    });
  }, [articles, q]);

  // --- Share (mobile)
  const shareArticle = async (a) => {
    const text = `${a.title}\n\n${toExcerpt(a.content, 260)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: a.title, text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Copié dans le presse-papiers.");
      }
    } catch {
      // ignore
    }
  };

  return (
    <>
      <div className="mb-4">
        <ChildSwitcher />
      </div>

      <Card
        title={id ? "Article" : "Articles"}
        right={<span className="muted text-sm">{child?.name || "Enfant"}</span>}
      >
        {/* DETAIL */}
        {id ? (
          <>
            {!article ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-4">
                <div className="font-semibold">Article introuvable</div>
                <div className="muted mt-2">Il a peut-être été supprimé.</div>
                <div className="mt-3">
                  <button className="btn-primary" type="button" onClick={() => navigate("/articles")}>Retour</button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-2">
                  <button className="btn-ghost" type="button" onClick={() => navigate("/articles")}>← Retour</button>

                  <div className="flex items-center gap-2">
                    <button className="btn-ghost" type="button" onClick={() => shareArticle(article)}>
                      Partager
                    </button>
                  </div>
                </div>

                <img
                  src={coverSrc}
                  alt={article.title || ""}
                  className="w-full h-60 sm:h-80 rounded-3xl object-cover bg-white border border-gray-200"
                  loading="lazy"
                />

                <div className="rounded-3xl border border-gray-200 bg-white p-4">
                  <div className="font-serif text-3xl font-bold leading-tight break-words">{article.title}</div>
                  <div className="muted mt-2 text-sm">{fmtDate(article.createdAt)}</div>

                  {/* Texte en grand, plein écran (scroll naturel de la page) */}
                  <div className="mt-4 whitespace-pre-wrap break-words text-base leading-7">
                    {article.content}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* LIST */
          <>
            <div className="flex flex-col gap-2">
              <input
                className="w-full min-w-0 rounded-2xl border border-gray-200 bg-white px-4 py-3"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un article…"
              />
            </div>

            <div className="muted mt-3">
              {filtered.length} article{filtered.length > 1 ? "s" : ""}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 w-full">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => navigate(`/articles/${a.id}`)}
                  className="w-full max-w-full overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 text-left hover:shadow-sm transition"
                >
                  <div className="min-w-0">
                    <div className="font-semibold break-words">{a.title}</div>
                    <div className="muted text-xs mt-1">{fmtDate(a.createdAt)}</div>
                    <div className="muted mt-2 text-sm break-words">{toExcerpt(a.content)}</div>
                  </div>
                </button>
              ))}

              {filtered.length === 0 ? <div className="muted">Aucun résultat.</div> : null}
            </div>
          </>
        )}
      </Card>
    </>
  );
}
