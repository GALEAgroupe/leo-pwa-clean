import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { AppCtx } from "../app/AppShell.jsx";
import { isRewardsEnabled, badgeLabel, badgesToPins } from "../lib/rewards.js";
import { getLevelProgress, LEVEL_MILESTONES, FAMILY_MILESTONES, LEVEL_POINTS } from "../lib/familyRewards.js";
import { MilestoneIcon } from "../components/icons/MilestoneIcons.jsx";
import {
  dateKey,
  getGamiForChild,
  getLevelInfo,
  getDailyChestChoices,
  openDailyChest,
  claimFamilyReward,
} from "../lib/gamification.js";

import SurpriseChestModal from "../components/SurpriseChestModal.jsx";
import FamilyRewardModal from "../components/FamilyRewardModal.jsx";
import KidAvatar from "../components/KidAvatar.jsx";

function kFormat(n) {
  const x = Number(n || 0);
  return x >= 1000 ? `${Math.round(x / 100) / 10}k` : String(x);
}

function RewardsBannerArt() {
  // Simple illustrated banner: tooth mascot + clouds (inline SVG, no assets)
  return (
    <svg viewBox="0 0 520 220" className="leo-rewards-art-svg" aria-hidden="true">
      <defs>
        <linearGradient id="leoCloud" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.25)" />
        </linearGradient>
        <linearGradient id="leoTooth" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.65)" />
        </linearGradient>
        <linearGradient id="leoBrush" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="rgba(59,130,246,0.95)" />
          <stop offset="1" stopColor="rgba(34,197,94,0.90)" />
        </linearGradient>
      </defs>

      {/* sparkles */}
      <g opacity="0.95">
        <text x="40" y="42" fontSize="18" fill="rgba(255,255,255,0.88)">✦</text>
        <text x="82" y="28" fontSize="12" fill="rgba(255,255,255,0.78)">✦</text>
        <text x="260" y="34" fontSize="14" fill="rgba(255,255,255,0.78)">✦</text>
        <text x="468" y="60" fontSize="16" fill="rgba(255,255,255,0.86)">✦</text>
      </g>

      {/* clouds */}
      <g opacity="0.9">
        <path
          d="M78 160c0-18 15-33 33-33 6 0 12 2 17 5 6-15 21-25 38-25 23 0 42 19 42 42 0 1 0 3 0 4h2c18 0 33 15 33 33 0 18-15 33-33 33H111c-18 0-33-15-33-33z"
          fill="url(#leoCloud)"
        />
        <path
          d="M290 78c0-16 13-29 29-29 5 0 10 1 14 4 5-13 17-22 31-22 19 0 35 16 35 35 0 1 0 2 0 3h2c16 0 29 13 29 29 0 16-13 29-29 29H319c-16 0-29-13-29-29z"
          fill="url(#leoCloud)"
        />
      </g>

      {/* tooth mascot */}
      <g transform="translate(330 85)">
        <path
          d="M58 0c20 0 36 16 36 36 0 30-12 93-28 111-6 7-16 9-25 4-8-4-14-4-22 0-9 5-19 3-25-4C-21 129-33 66-33 36-33 16-17 0 3 0c12 0 22 5 28 13C36 5 46 0 58 0z"
          fill="url(#leoTooth)"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="3"
        />
        <circle cx="18" cy="45" r="5" fill="rgba(11,18,32,0.72)" />
        <circle cx="46" cy="45" r="5" fill="rgba(11,18,32,0.72)" />
        <path d="M28 62c6 6 12 6 18 0" stroke="rgba(11,18,32,0.65)" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* tiny toothbrush */}
      <g transform="translate(180 150) rotate(-8)">
        <rect x="0" y="0" rx="10" ry="10" width="120" height="20" fill="url(#leoBrush)" opacity="0.95" />
        <rect x="108" y="-2" rx="6" ry="6" width="24" height="24" fill="rgba(255,255,255,0.85)" />
        <rect x="112" y="2" rx="4" ry="4" width="16" height="16" fill="rgba(255,255,255,0.55)" />
      </g>
    </svg>
  );
}

export default function Rewards() {
  const { state, setState, activeChild } = useContext(AppCtx);
  const nav = useNavigate();

  const child = activeChild();
  const showGami = isRewardsEnabled(child);

  const [chestOpen, setChestOpen] = useState(false);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [familyMilestone, setFamilyMilestone] = useState(null);

  const today = new Date();
  const k = dateKey(today);
  const label = format(today, "EEEE d MMMM", { locale: fr });

  const gami = useMemo(() => (showGami && child?.id ? getGamiForChild(state, child.id) : null), [state, child?.id, showGami]);
  const levelInfo = useMemo(() => (gami ? getLevelInfo(gami.xp) : null), [gami]);

  const day = gami?.daily?.[k] || {};
  const chestUnlocked = !!day.chestUnlocked;
  const chestOpened = !!day.chestOpened;

  const logsForChild = state.logs?.[child?.id] || {};

  const lvl = useMemo(() => getLevelProgress(gami?.xp || 0), [gami]);
  const milestones = LEVEL_MILESTONES;
  const milestoneIcons = ["toolbox", "book", "cookie", "spark", "trophy"]; // 5 paliers
  const familyClaims = gami?.familyClaims || {};
  const familyClaimKey = (id) => `${id}_l${lvl.level}`;

  const chestChoices = useMemo(() => {
    if (!showGami || !child?.id) return [];
    return getDailyChestChoices({ childId: child.id, dateKey: k });
  }, [showGami, child?.id, k]);

  const pins = useMemo(() => {
    if (!showGami || !gami) return [];
    return badgesToPins(gami.inventory?.pins || [], 6);
  }, [showGami, gami]);

  if (!showGami) {
    return (
      <div className="leo-card p-5">
        <div className="h2">Récompenses</div>
        <p className="muted mt-2">
          La gamification est activée dès 3 ans.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3">
        <div className="muted capitalize">{label}</div>
      </div>

      {/* Hero */}
      <section className="leo-rewards-hero">
        <div className="leo-rewards-hero-inner">
          <div className="leo-rewards-art" aria-hidden>
            <RewardsBannerArt />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="leo-rewards-title">Page de Récompenses</div>
              <div className="leo-rewards-sub">Badges, coffres et objets à collectionner ✨</div>
            </div>
            <button type="button" className="btn-hero" onClick={() => nav("/")}>Retour</button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <KidAvatar child={child} size={56} shape="circle" ring={true} showPins={false} />
            <div className="min-w-0">
              <div className="text-white font-extrabold truncate">{child?.name || "Enfant"}</div>
              <div className="text-white/80 text-sm">
                Niveau {levelInfo?.level || 1} • {gami?.league || "Bronze"} • Série {gami?.streak || 0}j
              </div>
            </div>
          </div>

          {/* Big progress (long “saison”) */}
          <div className="mt-5 leo-rewards-panel">
            <div className="flex items-center justify-between">
              <div className="text-white font-extrabold">Progrès</div>
              <div className="text-white/90 font-extrabold">Niveau {lvl.level} • {lvl.current} / {lvl.target} points</div>
            </div>

            <div className="mt-3 leo-reward-track leo-reward-track--xl">
              <div className="leo-reward-fill" style={{ width: `${lvl.pct * 100}%` }} />
              <div className="leo-reward-star" style={{ left: `${lvl.pct * 100}%` }} aria-hidden>
                ✨
              </div>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-2">
              {milestones.map((m, idx) => (
                <div
                  key={m}
                  className={"leo-milestone-xl " + (lvl.current >= m ? "is-on" : "")}
                  title={`${m} points`}
                >
                  <div className="leo-milestone-xl-icon" aria-hidden>
                    <MilestoneIcon name={milestoneIcons[idx] || "trophy"} className="w-6 h-6" />
                  </div>
                  <div className="leo-milestone-xl-num">{kFormat(m)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Unlocks / Collection */}
      <section className="leo-card p-5 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="leo-title">Ma collection</div>
            <div className="leo-sub">Les badges gagnés s’ajoutent au profil de l’enfant.</div>
          </div>
          <div className="chip">{Array.isArray(gami?.inventory?.pins) ? gami.inventory.pins.length : 0} pins</div>
        </div>

        {/* Family rewards (real-life privileges) */}
        <div className="mt-4 leo-card-inner">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="leo-kicker">RÉCOMPENSES FAMILLE</div>
              <div className="leo-title" style={{ fontSize: 18 }}>Récompenses “réelles” validées par le parent</div>
              <div className="leo-sub">À certains paliers, l’enfant choisit une option.</div>
            </div>
            <div className="chip">Niveau {lvl.level}</div>
          </div>

          <div className="mt-3 grid gap-2">
            {FAMILY_MILESTONES.map((m) => {
              const reached = lvl.current >= m.at;
              const key = familyClaimKey(m.id);
              const claim = familyClaims?.[key] || null;
              const iconName = m.category === "story" ? "book" : m.category === "snack" ? "cookie" : "spark";
              return (
                <button
                  key={m.id}
                  type="button"
                  className={[
                    "leo-family-row",
                    reached ? "is-unlocked" : "is-locked",
                    claim ? "is-claimed" : "",
                  ].join(" ")}
                  disabled={!reached}
                  onClick={() => {
                    setFamilyMilestone({ ...m, _claimKey: key, _iconName: iconName });
                    setFamilyOpen(true);
                  }}
                  title={!reached ? `Déverrouillable à ${kFormat(m.at)} points` : "Choisir une récompense"}
                >
                  <span className="leo-family-icon" aria-hidden>
                    <MilestoneIcon name={iconName} className="w-6 h-6" />
                  </span>
                  <span className="min-w-0">
                    <div className="leo-family-title">{m.title}</div>
                    <div className="leo-family-sub">
                      {claim ? `Choisi : ${claim.optionLabel}` : reached ? "Déverrouillé" : `À ${kFormat(m.at)} points`}
                    </div>
                  </span>
                  <span className="leo-family-badge">
                    {claim ? "✅" : reached ? "Choisir" : "🔒"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coffre du jour + accès stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setChestOpen(true)}
            className={["leo-reward-cta", !chestUnlocked ? "is-locked" : ""].join(" ")}
            disabled={!chestUnlocked || chestOpened}
            title={!chestUnlocked ? "Déverrouillage : Matin + Soir (aujourd’hui)" : chestOpened ? "Déjà ouvert aujourd’hui" : "Ouvre le coffre"}
          >
            <div className="leo-reward-cta-title">Coffre du jour</div>
            <div className="leo-reward-cta-sub">
              {chestUnlocked
                ? chestOpened
                  ? "Déjà ouvert aujourd’hui ✅ (reviens demain)"
                  : "Ouvre → choisis 1 récompense (pin / sticker / points)"
                : "Fais Matin + Soir pour l’ouvrir"}
            </div>
            <div className="mt-3 text-xs font-extrabold text-[rgba(11,18,32,0.72)]">
              1 choix parmi : <span aria-hidden>📌</span> Pin • <span aria-hidden>🧩</span> Sticker • <span aria-hidden>⭐</span> Points
            </div>
            <div className="mt-1 text-xs font-extrabold text-[rgba(11,18,32,0.55)]">
              Ta collection de pins est juste en dessous 👇
            </div>
          </button>

          <button type="button" onClick={() => nav("/calendar")} className="leo-reward-cta">
            <div className="leo-reward-cta-title">Mes stats</div>
            <div className="leo-reward-cta-sub">Voir la semaine dans le calendrier 📅</div>
            <div className="mt-3 text-xs font-extrabold text-[rgba(11,18,32,0.72)]">Suivi Matin/Soir + Timers</div>
          </button>
        </div>

        {/* Collection de pins (badges) */}
        <div className="mt-5 leo-card-inner">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="leo-kicker">COLLECTION</div>
              <div className="leo-title" style={{ fontSize: 18 }}>Pins & badges gagnés</div>
              <div className="leo-sub">Ils apparaissent aussi sur l’avatar.</div>
            </div>
            <div className="chip">{Array.isArray(gami?.inventory?.pins) ? gami.inventory.pins.length : 0} pins</div>
          </div>

          {pins.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {pins.map((p) => (
                <span
                  key={p.id}
                  className={"leo-pin-chip " + (p.variant === "gold" ? "is-gold" : "")}
                  title={badgeLabel(p.id)}
                >
                  <span className="leo-pin-chip-emoji" aria-hidden>{p.text}</span>
                  <span className="leo-pin-chip-label">{badgeLabel(p.id)}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-3 muted">Pas encore de pins. Termine Matin + Soir pour ouvrir ton premier coffre 🎁</div>
          )}
        </div>
      </section>

      <SurpriseChestModal
        open={chestOpen}
        onClose={() => setChestOpen(false)}
        locked={!chestUnlocked}
        alreadyOpened={chestOpened}
        choices={chestChoices}
        onPick={(choiceId) => {
          setState((s) => openDailyChest({ state: s, child, childId: child.id, dateKey: k, choiceId }));
          setChestOpen(false);
        }}
      />

      <FamilyRewardModal
        open={familyOpen}
        onClose={() => {
          setFamilyOpen(false);
          setFamilyMilestone(null);
        }}
        title={familyMilestone?.title || "Récompense"}
        subtitle={familyMilestone?.at ? `Palier ${kFormat(familyMilestone.at)} points (dans le niveau)` : ""}
        category={familyMilestone?.category || "activity"}
        initialOptionId={
          familyMilestone?._claimKey && familyClaims?.[familyMilestone._claimKey]
            ? familyClaims[familyMilestone._claimKey].optionId
            : null
        }
        onChoose={({ optionId, optionLabel }) => {
          if (!familyMilestone?._claimKey) return;
          setState((s) =>
            claimFamilyReward({
              state: s,
              child,
              childId: child.id,
              milestoneId: familyMilestone._claimKey,
              optionId,
              optionLabel,
            })
          );
          setFamilyOpen(false);
          setFamilyMilestone(null);
        }}
      />
    </>
  );
}
