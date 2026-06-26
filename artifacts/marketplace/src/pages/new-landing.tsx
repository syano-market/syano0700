/*
 * new-landing.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * SYANO — Brand-new landing page, completely isolated from the existing design.
 * Route: /new
 *
 * Design spec (ui-ux-pro-max-skill):
 *   Pattern  : Marketplace / Directory
 *   Style    : Vibrant & Block-based
 *   Primary  : #7C3AED  |  CTA/Accent: #16A34A  |  BG: #FAF5FF
 *   Fonts    : Noto Naskh Arabic (headings) + Noto Sans Arabic (body)
 *   Motion   : ease-out, 150–300 ms, opacity + transform only
 *   Layout   : RTL, Tailwind logical classes (ms- ps- start- end-)
 *   Touch    : min 44×44 px on all interactive elements
 *   a11y     : WCAG AA, focus-visible rings, prefers-reduced-motion
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";

// ── Brand colour tokens ──────────────────────────────────────────────────────
const C = {
  purple:      "#7C3AED",
  purpleLight: "#A78BFA",
  purplePale:  "#EDE9FE",
  purpleBg:    "#FAF5FF",
  purpleFg:    "#4C1D95",
  purpleBorder:"#DDD6FE",
  purpleMuted: "#ECEEF9",
  green:       "#16A34A",
  greenLight:  "#DCFCE7",
  greenDark:   "#14532D",
  text:        "#1E1B4B",
  textMuted:   "#6B7280",
  white:       "#FFFFFF",
  card:        "#FFFFFF",
} as const;

// ── Reusable Framer Motion variants ─────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleIn = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

const stagger = (delay = 0.07) => ({
  visible: { transition: { staggerChildren: delay } },
});

const easeOut25: Record<string, unknown> = { duration: 0.25, ease: "easeOut" };
const easeOut20: Record<string, unknown> = { duration: 0.20, ease: "easeOut" };

// ── Animate-on-scroll wrapper ────────────────────────────────────────────────
function InView({
  children,
  className,
  style,
  variants = fadeUp,
  delay = 0,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variants?: typeof fadeUp;
  delay?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-60px 0px" });
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      variants={variants}
      initial="hidden"
      animate={inView || reduced ? "visible" : "hidden"}
      transition={{ ...easeOut25, delay }}
    >
      {children}
    </motion.div>
  );
}

// ── Stagger container ────────────────────────────────────────────────────────
function StaggerView({
  children,
  className,
  style,
  delay = 0.07,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-60px 0px" });
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      variants={stagger(delay)}
      initial="hidden"
      animate={inView || reduced ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LANDING NAVBAR
// ─────────────────────────────────────────────────────────────────────────────
function LandingNavbar() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label: t("newLanding.nav.shop"),    href: "/products" },
    { label: t("newLanding.nav.sellers"), href: "/seller/apply" },
    { label: t("newLanding.nav.about"),   href: "/about" },
  ];

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...easeOut25 }}
      style={{
        fontFamily: "'Noto Sans Arabic', sans-serif",
        position: "fixed",
        top: 0,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        zIndex: 50,
        backdropFilter: scrolled ? "blur(16px)" : "none",
        backgroundColor: scrolled ? "rgba(250,245,255,0.92)" : "transparent",
        borderBottom: scrolled ? `1px solid ${C.purpleBorder}` : "1px solid transparent",
        transition: "background-color 0.2s ease, border-color 0.2s ease, backdrop-filter 0.2s ease",
      }}
    >
      <nav
        className="mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8"
        style={{ maxWidth: 1280, height: 64 }}
        aria-label={t("newLanding.nav.tagline")}
      >
        {/* Brand */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={easeOut20}
          onClick={() => navigate("/new")}
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 rounded-lg"
          style={{
            color: C.purple,
            minHeight: 44,
            minWidth: 44,
            gap: 8,
          }}
          aria-label="SYANO Home"
        >
          {/* Logo mark — geometric diamond */}
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
            <rect x="2" y="2" width="30" height="30" rx="8" fill={C.purple} />
            <path d="M17 7L27 17L17 27L7 17Z" fill="white" opacity="0.9"/>
            <circle cx="17" cy="17" r="4" fill={C.purple} />
          </svg>
          <span
            style={{
              fontFamily: "'Noto Naskh Arabic', serif",
              fontWeight: 700,
              fontSize: 20,
              color: C.purple,
              letterSpacing: "-0.01em",
            }}
          >
            سيانو
          </span>
        </motion.button>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {navLinks.map((link) => (
            <li key={link.href}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={easeOut20}
                onClick={() => navigate(link.href)}
                className="rounded-lg px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"
                style={{
                  color: C.text,
                  minHeight: 44,
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.purple; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.text; }}
              >
                {link.label}
              </motion.button>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={easeOut20}
            onClick={() => navigate("/login")}
            className="rounded-lg px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"
            style={{
              color: C.purple,
              minHeight: 44,
              minWidth: 80,
              border: `1.5px solid ${C.purpleBorder}`,
              transition: "border-color 0.15s ease, background 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.purple; (e.currentTarget as HTMLElement).style.backgroundColor = C.purplePale; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.purpleBorder; (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
          >
            {t("newLanding.nav.login")}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={easeOut20}
            onClick={() => navigate("/register")}
            className="rounded-xl px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: `linear-gradient(135deg, ${C.purple} 0%, #6D28D9 100%)`,
              minHeight: 44,
              minWidth: 120,
              boxShadow: `0 4px 14px 0 ${C.purple}40`,
            }}
          >
            {t("newLanding.nav.register")}
          </motion.button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden rounded-lg p-2 focus-visible:outline-none focus-visible:ring-2"
          style={{ color: C.purple, minHeight: 44, minWidth: 44 }}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeOut20}
          style={{
            backgroundColor: C.white,
            borderBottom: `1px solid ${C.purpleBorder}`,
            padding: "12px 16px 16px",
            fontFamily: "'Noto Sans Arabic', sans-serif",
          }}
        >
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => { navigate(link.href); setMobileOpen(false); }}
              className="w-full text-start rounded-lg px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"
              style={{ color: C.text, minHeight: 44 }}
            >
              {link.label}
            </button>
          ))}
          <div className="flex flex-col gap-2 mt-3">
            <button onClick={() => navigate("/login")} className="w-full rounded-lg py-2.5 text-sm font-medium border focus-visible:outline-none" style={{ color: C.purple, borderColor: C.purpleBorder, minHeight: 44 }}>
              {t("newLanding.nav.login")}
            </button>
            <button onClick={() => navigate("/register")} className="w-full rounded-xl py-2.5 text-sm font-semibold text-white focus-visible:outline-none" style={{ background: `linear-gradient(135deg, ${C.purple}, #6D28D9)`, minHeight: 44 }}>
              {t("newLanding.nav.register")}
            </button>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HERO SECTION
// ─────────────────────────────────────────────────────────────────────────────
function HeroSection() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    },
    [query, navigate],
  );

  const stats = [
    { val: t("newLanding.hero.stat_sellers_val"), label: t("newLanding.hero.stat_sellers") },
    { val: t("newLanding.hero.stat_products_val"), label: t("newLanding.hero.stat_products") },
    { val: t("newLanding.hero.stat_cities_val"),   label: t("newLanding.hero.stat_cities") },
  ];

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(155deg, #1E1B4B 0%, ${C.purple} 45%, #5B21B6 70%, #7C3AED 100%)`,
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        fontFamily: "'Noto Sans Arabic', sans-serif",
      }}
      aria-label={t("newLanding.hero.title")}
    >
      {/* Decorative geometric orbs */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          top: "-15%",
          insetInlineEnd: "-5%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-10%",
          insetInlineStart: "-8%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(22,163,74,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      {/* Grid pattern overlay */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* Main content */}
      <div
        className="relative mx-auto w-full px-4 sm:px-6 lg:px-8"
        style={{ maxWidth: 1280, paddingTop: 80, paddingBottom: 80 }}
      >
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* ── Text & controls column ── */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-start gap-6">

            {/* Badge */}
            <InView delay={0.05}>
              <motion.div
                whileHover={{ scale: 1.04 }}
                transition={easeOut20}
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span style={{ fontSize: 16 }}>🏭</span>
                {t("newLanding.hero.badge")}
              </motion.div>
            </InView>

            {/* Title */}
            <InView delay={0.10}>
              <h1
                style={{
                  fontFamily: "'Noto Naskh Arabic', serif",
                  fontWeight: 700,
                  fontSize: "clamp(3rem, 8vw, 6.5rem)",
                  lineHeight: 1.1,
                  color: C.white,
                  letterSpacing: "-0.02em",
                  textShadow: "0 4px 32px rgba(0,0,0,0.3)",
                }}
              >
                {t("newLanding.hero.title")}
              </h1>
            </InView>

            {/* Subtitle */}
            <InView delay={0.15}>
              <p
                style={{
                  fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                  color: "rgba(255,255,255,0.82)",
                  maxWidth: 520,
                  lineHeight: 1.75,
                }}
              >
                {t("newLanding.hero.subtitle")}
              </p>
            </InView>

            {/* Search bar */}
            <InView delay={0.20} className="w-full" style={{ maxWidth: 560 }}>
              <form
                onSubmit={handleSearch}
                role="search"
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.97)",
                  borderRadius: 16,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                  overflow: "hidden",
                  height: 60,
                }}
              >
                <span
                  style={{
                    paddingInlineStart: 18,
                    paddingInlineEnd: 10,
                    color: C.textMuted,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-hidden
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("newLanding.hero.search_placeholder")}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{
                    color: C.text,
                    fontFamily: "'Noto Sans Arabic', sans-serif",
                    fontSize: 15,
                    minWidth: 0,
                    direction: "rtl",
                  }}
                  aria-label={t("newLanding.hero.search_placeholder")}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={easeOut20}
                  className="text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    background: `linear-gradient(135deg, ${C.purple}, #6D28D9)`,
                    height: "100%",
                    paddingInline: 24,
                    flexShrink: 0,
                    minWidth: 80,
                  }}
                >
                  {t("newLanding.hero.search_btn")}
                </motion.button>
              </form>
            </InView>

            {/* CTA buttons */}
            <InView delay={0.25} className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: `0 8px 24px ${C.green}55` }}
                whileTap={{ scale: 0.96 }}
                transition={easeOut20}
                onClick={() => navigate("/products")}
                className="rounded-xl text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: `linear-gradient(135deg, ${C.green}, #15803D)`,
                  paddingInline: 28,
                  paddingBlock: 14,
                  minHeight: 52,
                  boxShadow: `0 4px 16px ${C.green}44`,
                  letterSpacing: "0.01em",
                }}
              >
                {t("newLanding.hero.cta_primary")}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.2)" }}
                whileTap={{ scale: 0.96 }}
                transition={easeOut20}
                onClick={() => navigate("/seller/apply")}
                className="rounded-xl text-sm font-semibold focus-visible:outline-none focus-visible:ring-2"
                style={{
                  color: C.white,
                  border: "1.5px solid rgba(255,255,255,0.45)",
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(6px)",
                  paddingInline: 22,
                  paddingBlock: 14,
                  minHeight: 52,
                }}
              >
                {t("newLanding.hero.cta_secondary")}
              </motion.button>
            </InView>

            {/* Stats row */}
            <InView delay={0.30}>
              <div
                className="flex gap-8 flex-wrap justify-center lg:justify-start"
                style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 20 }}
              >
                {stats.map((s) => (
                  <div key={s.label} className="text-center lg:text-start">
                    <div
                      style={{
                        fontFamily: "'Noto Naskh Arabic', serif",
                        fontWeight: 800,
                        fontSize: "clamp(1.4rem, 3vw, 2rem)",
                        color: C.white,
                        lineHeight: 1.1,
                      }}
                    >
                      {s.val}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </InView>
          </div>

          {/* ── Visual column — floating product cards ── */}
          <div
            className="relative hidden lg:block"
            style={{ width: 420, height: 480, flexShrink: 0 }}
            aria-hidden
          >
            {/* Card 1 — large center */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                top: 60,
                insetInlineStart: 40,
                width: 220,
                borderRadius: 20,
                background: C.white,
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                overflow: "hidden",
              }}
            >
              <div style={{ height: 140, background: `linear-gradient(135deg, ${C.purplePale}, ${C.purpleMuted})`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 56 }}>👗</span>
                <div style={{ position: "absolute", top: 10, insetInlineEnd: 10, background: C.green, color: C.white, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>مباشر</div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontFamily: "'Noto Naskh Arabic', serif", fontWeight: 700, fontSize: 14, color: C.text }}>فستان حرير حلبي</div>
                <div style={{ color: C.purple, fontWeight: 800, fontSize: 16, marginTop: 4 }}>٨٥,٠٠٠ ل.س</div>
                <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>ورشة الأناقة - حلب</div>
              </div>
            </motion.div>

            {/* Card 2 — top right */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              style={{
                position: "absolute",
                top: 20,
                insetInlineEnd: 0,
                width: 160,
                borderRadius: 16,
                background: C.white,
                boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
                overflow: "hidden",
              }}
            >
              <div style={{ height: 100, background: `linear-gradient(135deg, #DCFCE7, #BBF7D0)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 44 }}>👟</span>
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontFamily: "'Noto Naskh Arabic', serif", fontWeight: 700, fontSize: 12, color: C.text }}>حذاء جلدي أصيل</div>
                <div style={{ color: C.green, fontWeight: 800, fontSize: 14, marginTop: 3 }}>١٢٠,٠٠٠ ل.س</div>
              </div>
            </motion.div>

            {/* Card 3 — bottom left */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              style={{
                position: "absolute",
                bottom: 40,
                insetInlineStart: 0,
                width: 180,
                borderRadius: 16,
                background: C.white,
                boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
                overflow: "hidden",
              }}
            >
              <div style={{ height: 110, background: `linear-gradient(135deg, #FEF3C7, #FDE68A)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 48 }}>🧴</span>
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontFamily: "'Noto Naskh Arabic', serif", fontWeight: 700, fontSize: 12, color: C.text }}>زيت زيتون حلبي</div>
                <div style={{ color: C.purple, fontWeight: 800, fontSize: 14, marginTop: 3 }}>٣٢,٠٠٠ ل.س</div>
              </div>
            </motion.div>

            {/* Card 4 — bottom right floating chip */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              style={{
                position: "absolute",
                bottom: 80,
                insetInlineEnd: 20,
                borderRadius: 14,
                background: C.white,
                boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${C.purple}, #6D28D9)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Noto Naskh Arabic', serif", fontWeight: 700, fontSize: 13, color: C.text }}>بائع موثق</div>
                <div style={{ color: C.textMuted, fontSize: 11 }}>ضمان SYANO</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom wave divider */}
      <div
        style={{ position: "absolute", bottom: -2, insetInlineStart: 0, insetInlineEnd: 0, lineHeight: 0 }}
        aria-hidden
      >
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: "100%", height: 80, display: "block" }}>
          <path d="M0,80 C360,0 1080,0 1440,80 L1440,80 L0,80 Z" fill={C.purpleBg}/>
        </svg>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CATEGORIES BENTO GRID
// ─────────────────────────────────────────────────────────────────────────────
function CategoriesSection() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  const categories = [
    {
      key:     "clothing",
      emoji:   "👗",
      color:   `linear-gradient(135deg, ${C.purple} 0%, #6D28D9 100%)`,
      textCol: C.white,
      large:   true,
      href:    "/products?category=Fashion",
    },
    {
      key:     "food",
      emoji:   "🫒",
      color:   "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
      textCol: C.white,
      large:   false,
      href:    "/products?category=Food",
    },
    {
      key:     "beauty",
      emoji:   "🧴",
      color:   "linear-gradient(135deg, #DB2777 0%, #9D174D 100%)",
      textCol: C.white,
      large:   false,
      href:    "/products?category=Beauty",
    },
    {
      key:     "shoes",
      emoji:   "👟",
      color:   "linear-gradient(135deg, #D97706 0%, #92400E 100%)",
      textCol: C.white,
      large:   false,
      href:    "/products?category=Shoes",
    },
    {
      key:     "craft",
      emoji:   "🪡",
      color:   "linear-gradient(135deg, #0891B2 0%, #0E7490 100%)",
      textCol: C.white,
      large:   false,
      href:    "/products?category=Crafts",
    },
    {
      key:     "electronics",
      emoji:   "📱",
      color:   "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)",
      textCol: C.white,
      large:   false,
      href:    "/products?category=Electronics",
    },
  ];

  return (
    <section
      style={{
        backgroundColor: C.purpleBg,
        paddingBlock: "80px",
        fontFamily: "'Noto Sans Arabic', sans-serif",
      }}
      aria-labelledby="categories-heading"
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: 1280 }}>

        {/* Section header */}
        <StaggerView className="text-center mb-12">
          <motion.p
            variants={fadeUp}
            transition={easeOut25}
            style={{ color: C.purple, fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}
          >
            {t("newLanding.categories.subtitle")}
          </motion.p>
          <motion.h2
            id="categories-heading"
            variants={fadeUp}
            transition={{ ...easeOut25, delay: 0.05 }}
            style={{
              fontFamily: "'Noto Naskh Arabic', serif",
              fontWeight: 700,
              fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
              color: C.purpleFg,
              letterSpacing: "-0.02em",
            }}
          >
            {t("newLanding.categories.title")}
          </motion.h2>
        </StaggerView>

        {/* Bento Grid — 3 cols × 3 rows */}
        <StaggerView
          delay={0.06}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "repeat(3, 180px)",
            gap: 16,
          }}
        >
          {categories.map((cat, i) => {
            const isLarge = cat.large;
            const gridStyle: React.CSSProperties = isLarge
              ? { gridColumn: "1 / span 2", gridRow: "1 / span 2" }
              : {};

            // Position the remaining 5 tiles:
            // Food: col3 row1, Beauty: col3 row2, Shoes: col1 row3, Craft: col2 row3, Electronics: col3 row3
            const positions: React.CSSProperties[] = [
              {},                                                      // clothing — large tile
              { gridColumn: 3, gridRow: 1 },                         // food
              { gridColumn: 3, gridRow: 2 },                         // beauty
              { gridColumn: 1, gridRow: 3 },                         // shoes
              { gridColumn: 2, gridRow: 3 },                         // craft
              { gridColumn: 3, gridRow: 3 },                         // electronics
            ];

            return (
              <motion.button
                key={cat.key}
                variants={scaleIn}
                transition={{ ...easeOut25, delay: i * 0.06 }}
                whileHover={{ scale: 1.03, transition: easeOut20 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(cat.href)}
                className="relative flex flex-col items-center justify-center rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-4 group"
                style={{
                  background: cat.color,
                  overflow: "hidden",
                  ...gridStyle,
                  ...positions[i],
                  boxShadow: `0 4px 20px rgba(0,0,0,0.12)`,
                  minHeight: 44,
                }}
                aria-label={`${t(`newLanding.categories.${cat.key}`)} — ${t(`newLanding.categories.${cat.key}_desc`)}`}
              >
                {/* Glow overlay on hover */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(255,255,255,0)",
                    transition: "background 0.2s ease",
                  }}
                  className="group-hover:bg-white/10"
                />

                {/* Emoji icon */}
                <motion.span
                  style={{ fontSize: isLarge ? 64 : 40, lineHeight: 1, marginBottom: 10 }}
                  whileHover={{ scale: 1.12 }}
                  transition={easeOut20}
                  aria-hidden
                >
                  {cat.emoji}
                </motion.span>

                {/* Category name */}
                <span
                  style={{
                    fontFamily: "'Noto Naskh Arabic', serif",
                    fontWeight: 700,
                    fontSize: isLarge ? 22 : 15,
                    color: cat.textCol,
                    textAlign: "center",
                    paddingInline: 12,
                  }}
                >
                  {t(`newLanding.categories.${cat.key}`)}
                </span>

                {/* Desc — shown for large tile or on hover */}
                <span
                  style={{
                    fontSize: isLarge ? 14 : 12,
                    color: "rgba(255,255,255,0.78)",
                    marginTop: 4,
                    paddingInline: 12,
                    textAlign: "center",
                  }}
                >
                  {t(`newLanding.categories.${cat.key}_desc`)}
                </span>

                {/* Arrow for large tile */}
                {isLarge && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 16,
                      insetInlineEnd: 16,
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-hidden
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                )}
              </motion.button>
            );
          })}
        </StaggerView>

        {/* See all button */}
        <InView delay={0.1} className="flex justify-center mt-8">
          <motion.button
            whileHover={{ scale: 1.04, backgroundColor: C.purple }}
            whileTap={{ scale: 0.96 }}
            transition={easeOut20}
            onClick={() => navigate("/categories")}
            className="rounded-xl px-8 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: C.purple,
              border: `2px solid ${C.purple}`,
              minHeight: 48,
              minWidth: 200,
              transition: "background-color 0.2s ease, color 0.2s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.white; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.purple; }}
          >
            {t("newLanding.categories.see_all")}
          </motion.button>
        </InView>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FEATURED PRODUCTS SECTION
// ─────────────────────────────────────────────────────────────────────────────
type ProductLike = {
  id: number;
  name: string;
  nameAr?: string | null;
  price: number;
  imageUrl?: string | null;
  category?: string | null;
};

function ProductCard({ product }: { product: ProductLike }) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [imgErr, setImgErr] = useState(false);

  const displayName = product.nameAr ?? product.name;
  const priceFormatted = new Intl.NumberFormat("ar-SY").format(product.price);

  const categoryEmojis: Record<string, string> = {
    Fashion: "👗",
    Electronics: "📱",
    Beauty: "🧴",
    "Home Decor": "🏠",
    Food: "🫒",
    Shoes: "👟",
  };
  const fallbackEmoji = categoryEmojis[product.category ?? ""] ?? "📦";

  return (
    <motion.article
      variants={fadeUp}
      transition={easeOut25}
      whileHover={{ y: -6, boxShadow: `0 20px 40px rgba(124,58,237,0.16)`, transition: easeOut20 }}
      className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer focus-within:ring-2 focus-within:ring-offset-2"
      style={{
        background: C.card,
        border: `1px solid ${C.purpleBorder}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
      onClick={() => navigate(`/products/${product.id}`)}
      role="article"
      aria-label={displayName}
    >
      {/* Image area — reserved height prevents layout shift */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 200,
          backgroundColor: C.purpleMuted,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {product.imageUrl && !imgErr ? (
          <img
            src={product.imageUrl}
            alt={displayName}
            loading="lazy"
            onError={() => setImgErr(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s ease",
            }}
            className="group-hover:scale-105"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>
            {fallbackEmoji}
          </div>
        )}

        {/* Factory Direct badge */}
        <div
          style={{
            position: "absolute",
            top: 10,
            insetInlineStart: 10,
            background: `linear-gradient(135deg, ${C.purple}, #6D28D9)`,
            color: C.white,
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "'Noto Sans Arabic', sans-serif",
          }}
        >
          {t("newLanding.products.factory_direct")}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, flex: 1, fontFamily: "'Noto Sans Arabic', sans-serif" }}>
        <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
          {product.category ?? ""}
        </span>
        <h3
          style={{
            fontFamily: "'Noto Naskh Arabic', serif",
            fontWeight: 700,
            fontSize: 15,
            color: C.text,
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {displayName}
        </h3>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 8 }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 18, color: C.purple }}>{priceFormatted}</span>
            <span style={{ fontSize: 12, color: C.textMuted, marginInlineStart: 4 }}>{t("newLanding.products.currency")}</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            transition={easeOut20}
            onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
            className="rounded-lg text-white text-xs font-bold focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: `linear-gradient(135deg, ${C.green}, #15803D)`,
              paddingInline: 14,
              paddingBlock: 8,
              minHeight: 36,
              minWidth: 80,
            }}
          >
            {t("newLanding.products.add_to_cart")}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

function FeaturedProductsSection() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  const { data: products, isLoading } = useListProducts(
    {},
    { query: { staleTime: 5 * 60 * 1000, queryKey: getListProductsQueryKey({}) } },
  );

  const featured = (products ?? []).slice(0, 6) as ProductLike[];

  const skeletonCount = 6;

  return (
    <section
      style={{
        backgroundColor: C.white,
        paddingBlock: "80px",
        fontFamily: "'Noto Sans Arabic', sans-serif",
      }}
      aria-labelledby="products-heading"
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: 1280 }}>

        {/* Header */}
        <StaggerView className="text-center mb-12">
          <motion.p
            variants={fadeUp}
            transition={easeOut25}
            style={{ color: C.green, fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}
          >
            {t("newLanding.products.subtitle")}
          </motion.p>
          <motion.h2
            id="products-heading"
            variants={fadeUp}
            transition={{ ...easeOut25, delay: 0.05 }}
            style={{
              fontFamily: "'Noto Naskh Arabic', serif",
              fontWeight: 700,
              fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
              color: C.purpleFg,
              letterSpacing: "-0.02em",
            }}
          >
            {t("newLanding.products.title")}
          </motion.h2>
        </StaggerView>

        {/* Grid */}
        {isLoading ? (
          /* Skeleton grid — reserves space to prevent layout shift */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 20,
            }}
            aria-busy="true"
            aria-label="Loading products"
          >
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 320,
                  borderRadius: 16,
                  background: `linear-gradient(90deg, ${C.purpleMuted} 0%, ${C.purpleBg} 50%, ${C.purpleMuted} 100%)`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : (
          <StaggerView
            delay={0.07}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </StaggerView>
        )}

        {/* See all button */}
        <InView delay={0.1} className="flex justify-center mt-10">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: `0 8px 24px ${C.purple}40` }}
            whileTap={{ scale: 0.96 }}
            transition={easeOut20}
            onClick={() => navigate("/products")}
            className="rounded-xl text-white text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: `linear-gradient(135deg, ${C.purple}, #6D28D9)`,
              paddingInline: 36,
              minHeight: 52,
              minWidth: 220,
              boxShadow: `0 4px 16px ${C.purple}40`,
            }}
          >
            {t("newLanding.products.see_all")} →
          </motion.button>
        </InView>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. VALUE PROPOSITION SECTION
// ─────────────────────────────────────────────────────────────────────────────
function ValuePropositionSection() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  const values = [
    {
      key:     "v1",
      icon:    "🏭",
      accent:  C.purple,
      accentBg: C.purplePale,
    },
    {
      key:     "v2",
      icon:    "🚀",
      accent:  C.green,
      accentBg: C.greenLight,
    },
    {
      key:     "v3",
      icon:    "🚚",
      accent:  "#0891B2",
      accentBg: "#ECFEFF",
    },
    {
      key:     "v4",
      icon:    "🛡️",
      accent:  "#D97706",
      accentBg: "#FEF3C7",
    },
  ];

  return (
    <section
      style={{
        background: `linear-gradient(160deg, #1E1B4B 0%, ${C.purple} 60%, #5B21B6 100%)`,
        paddingBlock: "96px",
        fontFamily: "'Noto Sans Arabic', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
      aria-labelledby="values-heading"
    >
      {/* Background grid pattern */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* Orb */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          top: "10%",
          insetInlineStart: "5%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(22,163,74,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: 1280 }}>

        {/* Header */}
        <StaggerView className="text-center mb-14">
          <motion.h2
            id="values-heading"
            variants={fadeUp}
            transition={easeOut25}
            style={{
              fontFamily: "'Noto Naskh Arabic', serif",
              fontWeight: 700,
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              color: C.white,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            {t("newLanding.values.title")}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ ...easeOut25, delay: 0.05 }}
            style={{ color: "rgba(255,255,255,0.72)", fontSize: "clamp(1rem, 2vw, 1.15rem)" }}
          >
            {t("newLanding.values.subtitle")}
          </motion.p>
        </StaggerView>

        {/* Value cards grid */}
        <StaggerView
          delay={0.08}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {values.map((v) => (
            <motion.div
              key={v.key}
              variants={fadeUp}
              transition={easeOut25}
              whileHover={{ y: -8, scale: 1.02, transition: easeOut20 }}
              style={{
                background: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 20,
                padding: "28px 24px",
                backdropFilter: "blur(10px)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Icon bubble */}
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  backgroundColor: v.accentBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  flexShrink: 0,
                }}
                aria-hidden
              >
                {v.icon}
              </div>

              <h3
                style={{
                  fontFamily: "'Noto Naskh Arabic', serif",
                  fontWeight: 700,
                  fontSize: 17,
                  color: C.white,
                  lineHeight: 1.45,
                }}
              >
                {t(`newLanding.values.${v.key}_title`)}
              </h3>

              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.72)",
                  lineHeight: 1.75,
                }}
              >
                {t(`newLanding.values.${v.key}_desc`)}
              </p>
            </motion.div>
          ))}
        </StaggerView>

        {/* CTA strip */}
        <InView delay={0.15} className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-14">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: `0 10px 30px ${C.green}55` }}
            whileTap={{ scale: 0.97 }}
            transition={easeOut20}
            onClick={() => navigate("/products")}
            className="rounded-xl text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: `linear-gradient(135deg, ${C.green}, #15803D)`,
              paddingInline: 36,
              minHeight: 56,
              minWidth: 200,
              boxShadow: `0 4px 20px ${C.green}55`,
              fontSize: 16,
            }}
          >
            {t("newLanding.hero.cta_primary")}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
            whileTap={{ scale: 0.97 }}
            transition={easeOut20}
            onClick={() => navigate("/seller/apply")}
            className="rounded-xl text-sm font-semibold focus-visible:outline-none focus-visible:ring-2"
            style={{
              color: C.white,
              border: "1.5px solid rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(6px)",
              paddingInline: 28,
              minHeight: 56,
              minWidth: 200,
              fontSize: 15,
            }}
          >
            {t("newLanding.hero.cta_secondary")}
          </motion.button>
        </InView>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. FOOTER
// ─────────────────────────────────────────────────────────────────────────────
function LandingFooter() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  const shopLinks = [
    { label: t("newLanding.footer.products_link"), href: "/products" },
    { label: t("newLanding.footer.categories_link"), href: "/categories" },
    { label: t("newLanding.footer.deals"), href: "/products?hot=true" },
    { label: t("newLanding.footer.stores"), href: "/stores" },
  ];

  const sellLinks = [
    { label: t("newLanding.footer.become_seller"), href: "/seller/apply" },
    { label: t("newLanding.footer.how_to_sell"), href: "/seller/how-to-sell" },
    { label: t("newLanding.footer.seller_center"), href: "/seller/center" },
    { label: t("newLanding.footer.commission"), href: "/seller/commission" },
  ];

  const companyLinks = [
    { label: t("newLanding.footer.about_link"), href: "/about" },
    { label: t("newLanding.footer.contact"), href: "/contact" },
    { label: t("newLanding.footer.privacy"), href: "/privacy-policy" },
    { label: t("newLanding.footer.terms"), href: "/terms-of-use" },
  ];

  const FooterCol = ({
    title,
    links,
  }: {
    title: string;
    links: { label: string; href: string }[];
  }) => (
    <div>
      <h4
        style={{
          fontFamily: "'Noto Naskh Arabic', serif",
          fontWeight: 700,
          fontSize: 16,
          color: C.white,
          marginBottom: 14,
        }}
      >
        {title}
      </h4>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {links.map((l) => (
          <li key={l.href}>
            <button
              onClick={() => navigate(l.href)}
              className="focus-visible:outline-none focus-visible:ring-1 rounded text-start"
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 14,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                minHeight: 32,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.white; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)"; }}
            >
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer
      style={{
        background: "#0F0B2D",
        fontFamily: "'Noto Sans Arabic', sans-serif",
        paddingTop: 64,
        paddingBottom: 32,
      }}
      aria-label="Footer"
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: 1280 }}>

        {/* Top row: brand + columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Brand column */}
          <div style={{ gridColumn: "1", minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <svg width="36" height="36" viewBox="0 0 34 34" fill="none" aria-hidden>
                <rect x="2" y="2" width="30" height="30" rx="8" fill={C.purple} />
                <path d="M17 7L27 17L17 27L7 17Z" fill="white" opacity="0.9"/>
                <circle cx="17" cy="17" r="4" fill={C.purple} />
              </svg>
              <span
                style={{
                  fontFamily: "'Noto Naskh Arabic', serif",
                  fontWeight: 700,
                  fontSize: 22,
                  color: C.white,
                }}
              >
                سيانو
              </span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.75, maxWidth: 220 }}>
              {t("newLanding.footer.tagline")}
            </p>

            {/* Social icons */}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              {[
                { label: "Facebook", path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
                { label: "Instagram", path: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a3 3 0 003-3v-11a3 3 0 00-3-3h-11a3 3 0 00-3 3v11a3 3 0 003 3z" },
                { label: "WhatsApp", path: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" },
              ].map((s) => (
                <button
                  key={s.label}
                  className="rounded-lg focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    width: 40,
                    height: 40,
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${C.purple}55`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                  aria-label={s.label}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <FooterCol title={t("newLanding.footer.shop")}    links={shopLinks} />
          <FooterCol title={t("newLanding.footer.sell")}    links={sellLinks} />
          <FooterCol title={t("newLanding.footer.company")} links={companyLinks} />
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
            {t("newLanding.footer.copyright")}
          </p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
            {t("newLanding.footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT — assembled page
// ─────────────────────────────────────────────────────────────────────────────
export default function NewLandingPage() {
  return (
    <>
      {/* ── Font injection — scoped to this page only ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');

        /* Shimmer keyframe for skeleton loading */
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }

        /* Reduce motion: disable all animations for accessibility */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div
        dir="rtl"
        lang="ar"
        style={{ minHeight: "100vh", backgroundColor: C.purpleBg, overflowX: "hidden" }}
      >
        <LandingNavbar />

        <main id="new-landing-main" tabIndex={-1} style={{ outline: "none" }}>
          <HeroSection />
          <CategoriesSection />
          <FeaturedProductsSection />
          <ValuePropositionSection />
        </main>

        <LandingFooter />
      </div>
    </>
  );
}
