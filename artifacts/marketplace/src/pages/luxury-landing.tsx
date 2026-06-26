/*
 * luxury-landing.tsx  (route: /luxury)
 * ─────────────────────────────────────────────────────────────────────────────
 * SYANO — Editorial-grade luxury dark landing page.
 * Inspired by MIRA Jewels: matte charcoal bg, white capsule navbar,
 * 3-column animated product grid, infinite staggered reveal loop.
 *
 * ISOLATION GUARANTEE: Zero imports from existing app components.
 * Only external deps: framer-motion, react-i18next, wouter.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

/* ─── Font injection ─────────────────────────────────────────────────────────*/
const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
  .lux-root *, .lux-root { box-sizing: border-box; }
  .lux-root button { cursor: pointer; border: none; outline: none; }
  .lux-root button:focus-visible { outline: 2px solid rgba(124,58,237,0.7); outline-offset: 2px; border-radius: 9999px; }
`;

/* ─── Brand tokens ────────────────────────────────────────────────────────────*/
const C = {
  bg:          "#0B0B0C",
  card:        "#111113",
  white:       "#FFFFFF",
  offWhite:    "#F2F2F0",
  muted:       "rgba(255,255,255,0.52)",
  dimmed:      "rgba(255,255,255,0.28)",
  border:      "rgba(255,255,255,0.08)",
  borderHov:   "rgba(255,255,255,0.16)",
  purple:      "#7C3AED",
  purpleAlpha: "rgba(124,58,237,0.18)",
  purpleGlow:  "rgba(124,58,237,0.40)",
  green:       "#16A34A",
  greenAlpha:  "rgba(22,163,74,0.16)",
} as const;

/* ─── Fonts ───────────────────────────────────────────────────────────────────*/
const F = {
  naskh: "'Noto Naskh Arabic', serif",
  sans:  "'Noto Sans Arabic', sans-serif",
} as const;

/* ─── Product stack data ──────────────────────────────────────────────────────*/
interface StackItem {
  id:        string;
  label:     string;
  sublabel:  string;
  badge:     string;
  imageUrl:  string;
  accent:    string;
}

const LEFT_STACK: StackItem[] = [
  {
    id:       "l0",
    label:    "lux.left.l0.label",
    sublabel: "lux.left.l0.sublabel",
    badge:    "lux.left.l0.badge",
    // Luxury dark editorial fashion — deep tones, elegant pose
    imageUrl: "https://images.pexels.com/photos/2220329/pexels-photo-2220329.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent:   "#A78BFA",
  },
  {
    id:       "l1",
    label:    "lux.left.l1.label",
    sublabel: "lux.left.l1.sublabel",
    badge:    "lux.left.l1.badge",
    // High-end leather shoes on dark neutral background
    imageUrl: "https://images.pexels.com/photos/267320/pexels-photo-267320.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent:   "#FBBF24",
  },
  {
    id:       "l2",
    label:    "lux.left.l2.label",
    sublabel: "lux.left.l2.sublabel",
    badge:    "lux.left.l2.badge",
    // Perfume bottles — dark moody studio shot
    imageUrl: "https://images.pexels.com/photos/755992/pexels-photo-755992.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent:   "#818CF8",
  },
];

const RIGHT_STACK: StackItem[] = [
  {
    id:       "r0",
    label:    "lux.right.r0.label",
    sublabel: "lux.right.r0.sublabel",
    badge:    "lux.right.r0.badge",
    // Luxurious fabric / silk textures — deep, jewel-toned
    imageUrl: "https://images.pexels.com/photos/4210342/pexels-photo-4210342.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent:   "#34D399",
  },
  {
    id:       "r1",
    label:    "lux.right.r1.label",
    sublabel: "lux.right.r1.sublabel",
    badge:    "lux.right.r1.badge",
    // Artisan pottery / ceramics — earthy dark background
    imageUrl: "https://images.pexels.com/photos/2162938/pexels-photo-2162938.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent:   "#FB923C",
  },
  {
    id:       "r2",
    label:    "lux.right.r2.label",
    sublabel: "lux.right.r2.sublabel",
    badge:    "lux.right.r2.badge",
    // Brass metalwork / decorative crafts — dark dramatic lighting
    imageUrl: "https://images.pexels.com/photos/4226879/pexels-photo-4226879.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent:   "#38BDF8",
  },
];

/* ─── Motion variants ─────────────────────────────────────────────────────────*/
const SPRING: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fromBottom = { opacity: 0, scale: 0.91, y: 54  };
const fromTop    = { opacity: 0, scale: 0.91, y: -54 };
const visible    = { opacity: 1, scale: 1,    y: 0   };
const toTop      = { opacity: 0, scale: 0.87, y: -54 };
const toBottom   = { opacity: 0, scale: 0.87, y: 54  };

/* ─── Product card (fills its container absolutely) ──────────────────────────*/
function ProductCard({
  item,
}: {
  item: StackItem; reduced: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        overflow: "hidden",
      }}
    >
      {/* Full-bleed product photo — darkened + desaturated for luxury editorial feel */}
      <img
        src={item.imageUrl}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          filter: "brightness(0.75) saturate(0.82)",
        }}
      />

      {/* Top gradient scrim — keeps badge readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 38%)",
          borderRadius: "inherit",
        }}
      />

      {/* Bottom gradient scrim — keeps text readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.40) 42%, transparent 72%)",
          borderRadius: "inherit",
        }}
      />

      {/* Subtle accent halo at top-center */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${item.accent}22 0%, transparent 65%)`,
          pointerEvents: "none",
          borderRadius: "inherit",
        }}
      />

      {/* Badge — top */}
      <div
        style={{
          position: "absolute",
          top: "clamp(0.75rem, 2vw, 1.25rem)",
          insetInlineStart: "clamp(0.75rem, 2vw, 1.25rem)",
        }}
      >
        <span
          style={{
            fontFamily: F.sans,
            fontSize: "0.68rem",
            fontWeight: 500,
            padding: "0.3rem 0.85rem",
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: C.white,
            border: "1px solid rgba(255,255,255,0.25)",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {t(item.badge)}
        </span>
      </div>

      {/* Label row — bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(0.75rem, 2vw, 1.25rem)",
          insetInlineStart: "clamp(0.75rem, 2vw, 1.25rem)",
          insetInlineEnd: "clamp(0.75rem, 2vw, 1.25rem)",
        }}
      >
        <p
          style={{
            fontFamily: F.naskh,
            fontSize: "clamp(0.9rem, 1.6vw, 1.15rem)",
            fontWeight: 700,
            color: C.white,
            lineHeight: 1.4,
            marginBottom: "0.25rem",
            margin: 0,
            textShadow: "0 1px 8px rgba(0,0,0,0.6)",
          }}
        >
          {t(item.label)}
        </p>
        <p
          style={{
            fontFamily: F.sans,
            fontSize: "clamp(0.62rem, 1vw, 0.78rem)",
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.5,
            margin: 0,
            marginTop: "0.2rem",
          }}
        >
          {t(item.sublabel)}
        </p>
      </div>
    </div>
  );
}

/* ─── Center hero card ────────────────────────────────────────────────────────*/
function CenterCard({ reduced, onShop, onSell }: {
  reduced: boolean;
  onShop: () => void;
  onSell: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(158deg, #180650 0%, #2D0F88 28%, #1B0B60 58%, #08040D 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "clamp(1.25rem, 3vw, 2rem)",
        borderRadius: "inherit",
      }}
    >
      {/* Purple radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 75% 55% at 50% 38%, ${C.purpleGlow} 0%, transparent 68%)`,
          pointerEvents: "none",
          borderRadius: "inherit",
        }}
      />

      {/* Top badge */}
      <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
        <span
          style={{
            fontFamily: F.sans,
            fontSize: "0.7rem",
            fontWeight: 500,
            padding: "0.35rem 1rem",
            borderRadius: "9999px",
            background: C.purpleAlpha,
            color: "#C4B5FD",
            border: `1px solid ${C.purple}42`,
          }}
        >
          🇸🇾 {t("lux.center.badge")}
        </span>
      </div>

      {/* Main title + tagline */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "1rem",
        }}
      >
        <motion.h1
          animate={reduced ? {} : { scale: [1, 1.025, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          style={{
            fontFamily: F.naskh,
            fontSize: "clamp(2rem, 4.5vw, 4rem)",
            fontWeight: 700,
            color: C.white,
            lineHeight: 1.15,
            textShadow: `0 0 90px ${C.purple}80`,
            margin: 0,
          }}
        >
          {t("lux.center.title")}
        </motion.h1>

        <p
          style={{
            fontFamily: F.sans,
            fontSize: "clamp(0.7rem, 1.1vw, 0.9rem)",
            color: C.muted,
            maxWidth: "26ch",
            lineHeight: 1.75,
            margin: 0,
          }}
        >
          {t("lux.center.tagline")}
        </p>

        {/* Decorative dots */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: i === 2 ? 22 : 7,
                height: 2,
                borderRadius: 9999,
                background: i === 2 ? C.purple : C.dimmed,
                transition: "width 0.3s",
              }}
            />
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.65rem",
        }}
      >
        <motion.button
          onClick={onShop}
          whileHover={reduced ? {} : { scale: 1.04 }}
          whileTap={reduced ? {} : { scale: 0.96 }}
          style={{
            fontFamily: F.sans,
            fontSize: "0.85rem",
            fontWeight: 600,
            padding: "0.75rem 2rem",
            borderRadius: "9999px",
            background: C.green,
            color: C.white,
            width: "100%",
            maxWidth: "220px",
          }}
        >
          {t("lux.center.cta_shop")}
        </motion.button>

        <motion.button
          onClick={onSell}
          whileHover={reduced ? {} : { scale: 1.03 }}
          whileTap={reduced ? {} : { scale: 0.97 }}
          style={{
            fontFamily: F.sans,
            fontSize: "0.82rem",
            fontWeight: 500,
            padding: "0.65rem 1.75rem",
            borderRadius: "9999px",
            background: "transparent",
            color: C.dimmed,
            border: `1px solid ${C.border}`,
            width: "100%",
            maxWidth: "220px",
          }}
        >
          {t("lux.center.cta_sell")}
        </motion.button>
      </div>
    </div>
  );
}

/* ─── Capsule Navbar ──────────────────────────────────────────────────────────*/
function LuxuryNav({ onContact }: { onContact: () => void }) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.65rem 0.9rem",
        flexShrink: 0,
      }}
    >
      {/* Start: brand pill */}
      <motion.button
        onClick={() => navigate("/")}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{
          fontFamily: F.naskh,
          fontSize: "1.05rem",
          fontWeight: 700,
          color: C.bg,
          padding: "0.55rem 1.25rem",
          borderRadius: "9999px",
          background: C.white,
        }}
      >
        {t("lux.nav.brand")}
      </motion.button>

      {/* End: icon capsules + contact split capsule */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Search */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          aria-label={t("lux.nav.search")}
          onClick={() => navigate("/search")}
          style={{
            width: 40, height: 40,
            borderRadius: "9999px",
            background: C.white,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke={C.bg} strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </motion.button>

        {/* Cart */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          aria-label={t("lux.nav.cart")}
          onClick={() => navigate("/cart")}
          style={{
            width: 40, height: 40,
            borderRadius: "9999px",
            background: C.white,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke={C.bg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </motion.button>

        {/* Contact — split capsule: [green circle icon] + [text pill]
            In RTL flex the DOM order is reversed visually:
            DOM=[icon][text] → displayed as [text (start/right)] [icon (end/left)]
            We use dir="ltr" on this element so CSS border-radius is predictable */}
        <motion.button
          onClick={onContact}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            borderRadius: "9999px",
            overflow: "hidden",
            /* keep internal LTR so the two pills join correctly */
            direction: "ltr",
          }}
        >
          {/* Green icon half */}
          <div
            style={{
              width: 40, height: 40,
              borderRadius: "9999px 0 0 9999px",
              background: C.green,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={C.white} strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.07a16 16 0 0 0 5.94 5.94l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 15.35z" />
            </svg>
          </div>
          {/* White text half */}
          <div
            style={{
              height: 40,
              padding: "0 1rem 0 0.75rem",
              borderRadius: "0 9999px 9999px 0",
              background: C.white,
              display: "flex", alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: F.sans,
                fontSize: "0.78rem",
                fontWeight: 600,
                color: C.bg,
                whiteSpace: "nowrap",
              }}
            >
              {t("lux.nav.contact")}
            </span>
          </div>
        </motion.button>
      </div>
    </nav>
  );
}

/* ─── Bottom branding strip ────────────────────────────────────────────────────*/
function BottomStrip({ onExplore }: { onExplore: () => void }) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.9rem 1.25rem",
        flexShrink: 0,
        borderTop: `1px solid ${C.border}`,
        background: C.bg,
        gap: "1rem",
      }}
    >
      {/* Brand wordmark */}
      <span
        style={{
          fontFamily: F.naskh,
          fontSize: "clamp(1rem, 2vw, 1.4rem)",
          fontWeight: 700,
          color: C.white,
          letterSpacing: "-0.01em",
          flexShrink: 0,
        }}
      >
        {t("lux.strip.brand")}
      </span>

      {/* Tagline — hidden on narrow screens */}
      <p
        style={{
          fontFamily: F.sans,
          fontSize: "clamp(0.65rem, 1vw, 0.82rem)",
          color: C.muted,
          lineHeight: 1.65,
          textAlign: "center",
          flex: 1,
          display: "none",
          maxWidth: "36ch",
          margin: "0 auto",
        }}
        className="lux-strip-tagline"
      >
        {t("lux.strip.tagline")}
      </p>

      {/* "Explore More" split capsule — direction:ltr so radius works */}
      <motion.button
        onClick={onExplore}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          borderRadius: "9999px",
          overflow: "hidden",
          direction: "ltr",
          flexShrink: 0,
        }}
      >
        {/* Text half */}
        <div
          style={{
            height: 44,
            padding: "0 1.25rem",
            background: C.white,
            borderRadius: "9999px 0 0 9999px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: F.sans,
              fontSize: "0.82rem",
              fontWeight: 600,
              color: C.bg,
              whiteSpace: "nowrap",
            }}
          >
            {t("lux.strip.explore")}
          </span>
        </div>
        {/* Arrow half */}
        <div
          style={{
            width: 44, height: 44,
            background: C.white,
            borderRadius: "0 9999px 9999px 0",
            marginInlineStart: "1px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={C.bg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Arrow pointing left = "forward" in RTL */}
            <path d="M19 12H5m7-7-7 7 7 7" />
          </svg>
        </div>
      </motion.button>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────────*/
export default function LuxuryLandingPage() {
  const reduced = useReducedMotion() ?? false;
  const [, navigate] = useLocation();

  const [leftIdx, setLeftIdx]   = useState(0);
  const [rightIdx, setRightIdx] = useState(0);
  // Ref tracks which column changes next — avoids an extra re-render
  const rightTurn = useRef(true);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      if (rightTurn.current) {
        setRightIdx((i) => (i + 1) % RIGHT_STACK.length);
      } else {
        setLeftIdx((i) => (i + 1) % LEFT_STACK.length);
      }
      rightTurn.current = !rightTurn.current;
    }, 2500);
    return () => clearInterval(id);
  }, [reduced]);

  const leftItem  = LEFT_STACK[leftIdx];
  const rightItem = RIGHT_STACK[rightIdx];

  return (
    <>
      <style>{FONT_CSS}</style>
      {/* Responsive tagline visibility */}
      <style>{`@media (min-width: 768px) { .lux-strip-tagline { display: block !important; } }`}</style>

      <div
        className="lux-root"
        dir="rtl"
        lang="ar"
        style={{
          background: C.bg,
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: F.sans,
        }}
      >
        {/* ── Navbar ─────────────────────────────────────────────────────── */}
        <LuxuryNav onContact={() => navigate("/contact")} />

        {/* ── 3-Column animated card grid ────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1.48fr 1fr",
            gap: "10px",
            padding: "0 10px",
            minHeight: 0,
          }}
        >
          {/* LEFT COLUMN — enters from bottom, exits to top */}
          <div
            style={{
              position: "relative",
              borderRadius: "24px",
              overflow: "hidden",
              background: C.card,
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={leftItem.id}
                style={{ position: "absolute", inset: 0 }}
                initial={reduced ? false : fromBottom}
                animate={visible}
                exit={reduced ? {} : toTop}
                transition={{ duration: 0.55, ease: SPRING }}
              >
                <ProductCard item={leftItem} reduced={reduced} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CENTER COLUMN — always visible, no swap animation */}
          <div
            style={{
              position: "relative",
              borderRadius: "24px",
              overflow: "hidden",
              background: C.card,
            }}
          >
            <CenterCard
              reduced={reduced}
              onShop={() => navigate("/shop")}
              onSell={() => navigate("/seller/apply")}
            />
          </div>

          {/* RIGHT COLUMN — enters from top, exits to bottom */}
          <div
            style={{
              position: "relative",
              borderRadius: "24px",
              overflow: "hidden",
              background: C.card,
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={rightItem.id}
                style={{ position: "absolute", inset: 0 }}
                initial={reduced ? false : fromTop}
                animate={visible}
                exit={reduced ? {} : toBottom}
                transition={{ duration: 0.55, ease: SPRING }}
              >
                <ProductCard item={rightItem} reduced={reduced} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Bottom strip ───────────────────────────────────────────────── */}
        <BottomStrip onExplore={() => navigate("/shop")} />
      </div>
    </>
  );
}
