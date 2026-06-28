/*
 * luxury-landing.tsx  (route: / and /luxury)
 * ─────────────────────────────────────────────────────────────────────────────
 * SYANO — Luxury dark editorial homepage with full scrolling section suite.
 * Hero: 3-column animated product grid (100dvh, sticky navbar).
 * Below fold: Popular Categories · Featured Deals · Trusted Stores ·
 *             Trending Products · New Arrivals · Join CTA · Footer bar.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useMemo, memo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { LuxuryNavbar } from "@/components/LuxuryNavbar";
import {
  useListProducts,
  getListProductsQueryKey,
  useAddToCart,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSellerOnboarding } from "@/hooks/useSellerOnboarding";
import { useCourierOnboarding } from "@/hooks/useCourierOnboarding";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Store,
  Bike,
  Star,
  Timer,
  Zap,
  ArrowLeft,
  ShoppingBag,
  ExternalLink,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
} from "lucide-react";
import type { Product } from "@workspace/api-client-react";

/* ─── Font injection ─────────────────────────────────────────────────────────*/
const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
  .lux-root *, .lux-root { box-sizing: border-box; }
  .lux-root button { cursor: pointer; border: none; outline: none; }
  .lux-root button:focus-visible { outline: 2px solid rgba(124,58,237,0.7); outline-offset: 2px; border-radius: 9999px; }
`;

/* ─── Responsive section grid rules ─────────────────────────────────────────*/
const SECTION_CSS = `
  .lux-cat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  @media (min-width: 768px) { .lux-cat-grid { grid-template-columns: repeat(4, 1fr); } }

  .lux-deals-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  @media (min-width: 1024px) { .lux-deals-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; } }

  .lux-stores-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }
  @media (min-width: 640px)  { .lux-stores-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .lux-stores-grid { grid-template-columns: repeat(3, 1fr); } }

  .lux-trending-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  @media (min-width: 640px) { .lux-trending-grid { grid-template-columns: repeat(3, 1fr); gap: 18px; } }

  .lux-arrivals-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 640px) {
    .lux-arrivals-grid { grid-template-columns: repeat(2, 1fr); }
    .lux-arrival-main { grid-column: 1 / 3; }
  }
  @media (min-width: 1024px) {
    .lux-arrivals-grid {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, 1fr);
      height: 35rem;
    }
    .lux-arrival-main { grid-column: 1 / 3; grid-row: 1 / 3; }
  }

  .lux-join-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    max-width: 780px;
    margin: 0 auto;
  }
  @media (min-width: 640px) { .lux-join-grid { grid-template-columns: repeat(2, 1fr); } }

  .lux-section-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
  }
  @media (min-width: 768px) { .lux-section-inner { padding: 0 3rem; } }

  .lux-footer-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem 2rem;
    padding: 4rem 0 3rem;
  }
  @media (min-width: 640px) { .lux-footer-grid { grid-template-columns: repeat(4, 1fr); } }
  @media (min-width: 1024px) { .lux-footer-grid { grid-template-columns: 1.25fr 1fr 1fr 1fr 1fr 1.25fr; } }

  .lux-footer-brand, .lux-footer-newsletter { grid-column: 1 / -1; }
  @media (min-width: 640px) {
    .lux-footer-brand { grid-column: 1 / 3; }
    .lux-footer-newsletter { grid-column: 3 / 5; }
  }
  @media (min-width: 1024px) {
    .lux-footer-brand { grid-column: 1 / 2; }
    .lux-footer-newsletter { grid-column: 6 / 7; }
  }

  .lux-footer-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
    padding: 1.25rem 0 1.75rem;
    border-top: 1px solid rgba(255,255,255,0.07);
    text-align: center;
  }
  @media (min-width: 768px) {
    .lux-footer-bottom { flex-direction: row; justify-content: space-between; text-align: start; gap: 1rem; }
  }

  .lux-footer-link:hover { color: rgba(255,255,255,0.80) !important; }
  .lux-social-icon:hover { background: rgba(255,255,255,0.10) !important; border-color: rgba(255,255,255,0.18) !important; color: rgba(255,255,255,0.80) !important; }
  .lux-footer-input:focus { border-color: rgba(255,255,255,0.20) !important; }

  .lux-root { text-rendering: optimizeSpeed; }
  .lux-gpu-layer { transform: translateZ(0); backface-visibility: hidden; }
`;

/* ─── Brand tokens ────────────────────────────────────────────────────────────*/
const C = {
  bg:          "#0B0B0C",
  card:        "#111113",
  card2:       "#141416",
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

/* ─── Interfaces ──────────────────────────────────────────────────────────────*/
interface StackItem {
  id:       string;
  label:    string;
  sublabel: string;
  badge:    string;
  imageUrl: string;
  accent:   string;
}

interface DealData {
  id:             number;
  name:           string;
  category:       string;
  price:          number;
  originalPrice:  number | null;
  discountPercent: number | null;
  img:            string;
}

interface StoreDisplayData {
  id:           number;
  name:         string;
  tagline:      string;
  categoryLabel: string;
  rating:       number;
  reviews:      number;
  productCount: number;
  coverImg:     string;
  logoColor:    string;
  logoInitial:  string;
  verified:     boolean;
  slug:         string | null;
}

interface FeaturedStoreAPI {
  sellerId:      number;
  storeName:     string;
  storeSlug:     string | null;
  storeLogo:     string | null;
  storeBanner:   string | null;
  accentColor:   string | null;
  categories:    string[];
  isVerified:    boolean;
  productsCount: number;
  averageRating: number;
  reviewsCount:  number;
}

/* ─── Hero card stacks ────────────────────────────────────────────────────────*/
const LEFT_STACK: StackItem[] = [
  { id: "l0", label: "lux.left.l0.label", sublabel: "lux.left.l0.sublabel", badge: "lux.left.l0.badge",
    imageUrl: "https://images.pexels.com/photos/2220329/pexels-photo-2220329.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent: "#A78BFA" },
  { id: "l1", label: "lux.left.l1.label", sublabel: "lux.left.l1.sublabel", badge: "lux.left.l1.badge",
    imageUrl: "https://images.pexels.com/photos/267320/pexels-photo-267320.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent: "#FBBF24" },
  { id: "l2", label: "lux.left.l2.label", sublabel: "lux.left.l2.sublabel", badge: "lux.left.l2.badge",
    imageUrl: "https://images.pexels.com/photos/755992/pexels-photo-755992.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent: "#818CF8" },
];

const RIGHT_STACK: StackItem[] = [
  { id: "r0", label: "lux.right.r0.label", sublabel: "lux.right.r0.sublabel", badge: "lux.right.r0.badge",
    imageUrl: "https://images.pexels.com/photos/4210342/pexels-photo-4210342.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent: "#34D399" },
  { id: "r1", label: "lux.right.r1.label", sublabel: "lux.right.r1.sublabel", badge: "lux.right.r1.badge",
    imageUrl: "https://images.pexels.com/photos/2162938/pexels-photo-2162938.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent: "#FB923C" },
  { id: "r2", label: "lux.right.r2.label", sublabel: "lux.right.r2.sublabel", badge: "lux.right.r2.badge",
    imageUrl: "https://images.pexels.com/photos/4226879/pexels-photo-4226879.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent: "#38BDF8" },
];

/* ─── Cinematic center-card background images ────────────────────────────────*/
const CENTER_SLIDE_IMAGES = [
  "https://images.pexels.com/photos/3771813/pexels-photo-3771813.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
  "https://images.pexels.com/photos/5632395/pexels-photo-5632395.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
  "https://images.pexels.com/photos/3738090/pexels-photo-3738090.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
  "https://images.pexels.com/photos/4215110/pexels-photo-4215110.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
];

/* ─── Category definitions ────────────────────────────────────────────────────*/
const CATEGORY_DEFS = [
  { nameKey: "home.categories.electronics", countKey: "home.categories.count_electronics", img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&h=360&fit=crop&auto=format&q=85", accent: "#3b82f6", slug: "Electronics" },
  { nameKey: "home.categories.fashion",     countKey: "home.categories.count_fashion",     img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=360&fit=crop&auto=format&q=85", accent: "#ec4899", slug: "Fashion" },
  { nameKey: "home.categories.beauty",      countKey: "home.categories.count_beauty",      img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=360&fit=crop&auto=format&q=85", accent: "#f59e0b", slug: "Beauty & Personal Care" },
  { nameKey: "home.categories.home_decor",  countKey: "home.categories.count_home_decor",  img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=360&fit=crop&auto=format&q=85", accent: "#8b5cf6", slug: "Home & Kitchen" },
  { nameKey: "home.categories.sports",      countKey: "home.categories.count_sports",      img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=500&h=360&fit=crop&auto=format&q=85", accent: "#276221", slug: "Sports & Fitness" },
  { nameKey: "home.categories.watches",     countKey: "home.categories.count_watches",     img: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=500&h=360&fit=crop&auto=format&q=85", accent: "#f97316", slug: "Accessories" },
  { nameKey: "home.categories.phones",      countKey: "home.categories.count_phones",      img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=360&fit=crop&auto=format&q=85", accent: "#06b6d4", slug: "Electronics" },
  { nameKey: "home.categories.computers",   countKey: "home.categories.count_computers",   img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=360&fit=crop&auto=format&q=85", accent: "#a855f7", slug: "Electronics" },
];

/* ─── Static store fallback data ─────────────────────────────────────────────*/
const STATIC_STORES = [
  { id: 1, name: "تك ستور سوريا", taglineAr: "أحدث الإلكترونيات والأجهزة الذكية", categoryKey: "home.categories.electronics", rating: 4.9, reviews: 1840, productCount: 3240, coverImg: "https://images.unsplash.com/photo-1684395882817-030e24c0322a?w=700&h=220&fit=crop&auto=format&q=80", logoColor: "#3b82f6", logoInitial: "ت", verified: true, slug: null },
  { id: 2, name: "دار الأناقة",   taglineAr: "أزياء فاخرة وموضة معاصرة للجميع",   categoryKey: "home.categories.fashion",     rating: 4.8, reviews: 2210, productCount: 1890, coverImg: "https://images.unsplash.com/photo-1768745294179-693a07a3f054?w=700&h=220&fit=crop&auto=format&q=80", logoColor: "#ec4899", logoInitial: "د", verified: true, slug: null },
  { id: 3, name: "بيت الديكور",   taglineAr: "أثاث عصري وإكسسوارات منزلية راقية",  categoryKey: "home.categories.home_decor",  rating: 4.7, reviews: 956,  productCount: 2140, coverImg: "https://images.unsplash.com/photo-1724582586529-62622e50c0b3?w=700&h=220&fit=crop&auto=format&q=80", logoColor: "#8b5cf6", logoInitial: "ب", verified: true, slug: null },
];

/* ─── Motion spring ───────────────────────────────────────────────────────────*/
const SPRING: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fadeEase = [0.25, 0.46, 0.45, 0.94] as const;

const fromBottom = { opacity: 0, scale: 0.91, y: 54  };
const fromTop    = { opacity: 0, scale: 0.91, y: -54 };
const visible    = { opacity: 1, scale: 1,    y: 0   };
const toTop      = { opacity: 0, scale: 0.87, y: -54 };
const toBottom   = { opacity: 0, scale: 0.87, y: 54  };

/* ─── Hero banner entrance variants (staggered slide-down) ───────────────────*/
const heroContainerVariants = {
  hidden:   {},
  visible:  { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
} as const;

const bannerVariant = {
  hidden:   { y: "-100%", opacity: 0, filter: "blur(10px)" },
  visible:  { y: 0, opacity: 1, filter: "blur(0px)", transition: { duration: 0.3, ease: "easeOut" } },
} as const;

// Exact ms when the LAST (right/3rd) banner finishes its phase-1 drop-in:
//   delayChildren(150) + 2×staggerChildren(100) + duration(300) = 650ms
const PHASE1_END_MS =
  heroContainerVariants.visible.transition.delayChildren * 1000 +
  (3 - 1) * heroContainerVariants.visible.transition.staggerChildren * 1000 +
  bannerVariant.visible.transition.duration * 1000; // = 650

/* ═══════════════════════════════════════════════════════════════════════════
   HERO COMPONENTS (existing — unchanged)
═══════════════════════════════════════════════════════════════════════════*/

function ProductCard({ item }: { item: StackItem }) {
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden" }}>
      <img src={item.imageUrl} alt="" aria-hidden="true" fetchPriority="high" decoding="async"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.82)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 38%)", borderRadius: "inherit" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.40) 42%, transparent 72%)", borderRadius: "inherit" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${item.accent}22 0%, transparent 65%)`, pointerEvents: "none", borderRadius: "inherit" }} />
    </div>
  );
}

const CenterCard = memo(function CenterCard({ reduced }: { reduced: boolean }) {
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setImgIdx(i => (i + 1) % CENTER_SLIDE_IMAGES.length), 4200);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit" }}>

      {/* Cinematic background image cross-fade */}
      <AnimatePresence>
        <motion.img
          key={CENTER_SLIDE_IMAGES[imgIdx]}
          src={CENTER_SLIDE_IMAGES[imgIdx]}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.50) saturate(0.65) contrast(1.10)", willChange: "opacity", backfaceVisibility: "hidden" }}
        />
      </AnimatePresence>

      {/* Dark cinematic gradient */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(8,3,24,0.56) 44%, rgba(4,1,14,0.90) 100%)", pointerEvents: "none", borderRadius: "inherit" }} />

      {/* Purple spectral glow */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 72% 52% at 50% 40%, ${C.purpleGlow} 0%, transparent 66%)`, pointerEvents: "none", borderRadius: "inherit", opacity: 0.44 }} />
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   LUXURY SECTION HELPERS
═══════════════════════════════════════════════════════════════════════════*/

/** Reusable section header: eyebrow + heading + "see all" link */
function LuxSectionHeader({
  eyebrowKey,
  titleKey,
  seeAllKey,
  seeAllHref,
  extra,
}: {
  eyebrowKey: string;
  titleKey:   string;
  seeAllKey:  string;
  seeAllHref: string;
  extra?: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", marginBottom: "3rem" }}>
      <div>
        <p style={{ fontFamily: F.sans, fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.14em", color: "rgba(255,255,255,0.38)", textTransform: "uppercase", marginBottom: "0.6rem", margin: "0 0 0.6rem" }}>
          {t(eyebrowKey)}
        </p>
        <h2 style={{ fontFamily: F.naskh, fontWeight: 700, fontSize: "clamp(1.5rem,3vw,2.4rem)", letterSpacing: "-0.02em", lineHeight: 1.2, color: C.white, margin: 0 }}>
          {t(titleKey)}
        </h2>
        {extra}
      </div>
      <Link href={seeAllHref}
        style={{ fontFamily: F.sans, fontWeight: 600, fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.4rem", color: C.muted, textDecoration: "none", paddingBottom: "0.25rem", borderBottom: "1px solid rgba(255,255,255,0.15)", transition: "color 0.2s" }}>
        {t(seeAllKey)} <ArrowLeft style={{ width: 14, height: 14 }} />
      </Link>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Countdown timer for deals section */
function LuxCountdownTimer() {
  const { t } = useTranslation();
  const [time, setTime] = useState({ h: 8, m: 24, s: 37 });
  useEffect(() => {
    const id = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
      <Timer style={{ width: 13, height: 13, color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
      <span style={{ fontFamily: F.sans, fontSize: "0.75rem", color: "rgba(255,255,255,0.38)" }}>{t("home.deals.ends_in")}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {[pad(time.h), pad(time.m), pad(time.s)].map((val, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontWeight: 700, fontSize: "0.78rem", fontVariantNumeric: "tabular-nums", color: C.white, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", padding: "2px 8px", borderRadius: "6px", minWidth: "2rem", textAlign: "center", letterSpacing: "0.04em" }}>
              {val}
            </span>
            {i < 2 && <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 700, fontSize: "0.8rem" }}>:</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Luxury deal card (needs cart hooks → separate component) ────────────────*/
const LuxDealCard = memo(function LuxDealCard({ deal, index }: { deal: DealData; index: number }) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const [, navigate] = useLocation();
  const { isAuthenticated, isCustomer, isSeller, isAdmin, isCourier } = useAuth();
  const { addGuestItem } = useGuestCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const addToCartMutation = useAddToCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: t("cart.added_title", "Added to cart ✓"), description: deal.name });
      },
      onError: () => {
        toast({ title: t("common.error"), description: t("cart.add_error", "Could not add to cart"), variant: "destructive" });
      },
    },
  });

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (deal.id === 0) { navigate("/shop"); return; }
    if (isSeller || isAdmin || isCourier) return;
    setAdding(true);
    if (isAuthenticated && isCustomer) {
      addToCartMutation.mutate({ data: { productId: deal.id, quantity: 1, variantId: null } });
    } else {
      addGuestItem(deal.id, null, 1);
      toast({ title: t("cart.added_title", "Added to cart ✓"), description: deal.name });
    }
    setTimeout(() => setAdding(false), 800);
  };

  const href = deal.id > 0 ? `/products/${deal.id}` : "/products";
  const hasDiscount = !!(deal.originalPrice && deal.discountPercent && deal.discountPercent > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: fadeEase }}
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Link href={href} style={{ display: "block", position: "relative", aspectRatio: "1 / 1", overflow: "hidden", background: C.card2 }}>
        {deal.img && <img src={deal.img} alt={deal.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.88) contrast(1.05)" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)" }} />
        {hasDiscount && (
          <div style={{ position: "absolute", top: "10px", insetInlineEnd: "10px" }}>
            <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: "0.75rem", background: C.green, color: C.white, padding: "3px 10px", borderRadius: "9999px" }}>
              -{deal.discountPercent}%
            </span>
          </div>
        )}
      </Link>
      <div style={{ padding: "1rem 1.1rem 1.1rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: "10px", color: C.dimmed, marginBottom: "0.4rem", margin: "0 0 0.4rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {deal.category}
        </p>
        <Link href={href}>
          <h3 style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.4, color: C.white, margin: "0 0 0.85rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {deal.name}
          </h3>
        </Link>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
          <div>
            <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em", color: C.white }} translate="no">
              {format(deal.price)}
            </div>
            {hasDiscount && (
              <div style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "11px", color: C.dimmed, textDecoration: "line-through", marginTop: "2px" }} translate="no">
                {format(deal.originalPrice!)}
              </div>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: F.sans, fontWeight: 600, fontSize: "0.75rem", background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, color: C.muted, padding: "12px 14px", borderRadius: "9999px", flexShrink: 0, opacity: adding ? 0.5 : 1 }}>
            {adding
              ? <div style={{ width: 12, height: 12, border: "1.5px solid rgba(255,255,255,0.5)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              : <ShoppingCart style={{ width: 12, height: 12 }} />}
            {t("home.deals.add")}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

/* ─── Luxury store card ───────────────────────────────────────────────────────*/
const LuxStoreCard = memo(function LuxStoreCard({ store, index }: { store: StoreDisplayData; index: number }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: fadeEase }}
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "20px", overflow: "hidden" }}>
      <div style={{ position: "relative", height: "10rem", overflow: "hidden", background: C.card2 }}>
        <img src={store.coverImg} alt={store.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.78) contrast(1.1)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)" }} />
        {store.verified && (
          <div style={{ position: "absolute", top: "12px", insetInlineStart: "12px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: F.sans, fontWeight: 600, fontSize: "10px", background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)", color: "#4ade80", padding: "3px 10px", borderRadius: "9999px" }}>
              <span style={{ width: 5, height: 5, background: "#4ade80", borderRadius: "50%", display: "inline-block" }} />
              {t("home.stores.verified")}
            </span>
          </div>
        )}
      </div>
      <div style={{ padding: "0 1.5rem 1.5rem", marginTop: "-2.25rem", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "0.85rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", background: `${store.logoColor}18`, border: `2px solid ${store.logoColor}30`, boxShadow: `0 4px 24px ${store.logoColor}20` }}>
            <span style={{ fontFamily: F.naskh, fontWeight: 900, fontSize: "1.35rem", color: store.logoColor }}>{store.logoInitial}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
            <Star style={{ width: 13, height: 13, fill: "#fbbf24", color: "#fbbf24" }} />
            <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.85rem", color: C.white }}>{store.rating}</span>
            <span style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "11px", color: C.dimmed }}>({store.reviews.toLocaleString()})</span>
          </div>
        </div>
        <h3 style={{ fontFamily: F.naskh, fontWeight: 800, fontSize: "1.1rem", color: C.white, margin: "0 0 0.35rem" }}>{store.name}</h3>
        <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.8rem", color: C.dimmed, lineHeight: 1.6, margin: "0 0 1rem" }}>{store.tagline}</p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 0", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, marginBottom: "1rem" }}>
          <ShoppingBag style={{ width: 13, height: 13, color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
          <span style={{ fontFamily: F.sans, fontWeight: 600, fontSize: "0.8rem", color: C.muted }}>
            {t("home.stores.products_count", { count: store.productCount.toLocaleString() })}
          </span>
          <span style={{ width: 3, height: 3, background: C.dimmed, borderRadius: "50%", flexShrink: 0 }} />
          <span style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.8rem", color: C.dimmed }}>{store.categoryLabel}</span>
        </div>
        <Link
          href={store.slug ? `/store/${store.slug}` : "/sellers/directory"}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontFamily: F.sans, fontWeight: 700, fontSize: "0.82rem", width: "100%", padding: "0.7rem", borderRadius: "9999px", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, textDecoration: "none" }}>
          <ExternalLink style={{ width: 13, height: 13 }} /> {t("home.stores.visit")}
        </Link>
      </div>
    </motion.div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   LUXURY SECTION COMPONENTS
═══════════════════════════════════════════════════════════════════════════*/

/** Section wrapper style helper */
const sectionStyle = (alt = false): React.CSSProperties => ({
  background: alt ? C.card2 : C.bg,
  paddingTop: "5rem",
  paddingBottom: "5rem",
  borderTop: `1px solid ${C.border}`,
});

/* ── 1. Popular Categories ───────────────────────────────────────────────────*/
const LuxCategoriesSection = memo(function LuxCategoriesSection() {
  const { t, i18n } = useTranslation();
  return (
    <section style={sectionStyle(false)} dir={i18n.dir()}>
      <div className="lux-section-inner">
        <LuxSectionHeader eyebrowKey="home.categories.eyebrow" titleKey="home.categories.title" seeAllKey="home.categories.see_all" seeAllHref="/shop" />
        <div className="lux-cat-grid">
          {CATEGORY_DEFS.map((cat, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.48, delay: i * 0.05, ease: fadeEase }}>
              <Link href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                style={{ display: "block", position: "relative", overflow: "hidden", borderRadius: "16px", aspectRatio: "4 / 3", background: C.card }}>
                <img src={cat.img} alt={t(cat.nameKey)} loading="lazy" decoding="async"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.72) saturate(0.80)", transition: "transform 0.6s ease" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.20) 55%, transparent 100%)" }} />
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 65% 45% at 50% 0%, ${cat.accent}22 0%, transparent 60%)` }} />
                <div style={{ position: "absolute", bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, padding: "1.1rem 1rem 1rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.accent, marginBottom: "0.45rem" }} />
                  <h3 style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.95rem", color: C.white, margin: "0 0 0.2rem" }}>
                    {t(cat.nameKey)}
                  </h3>
                  <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", margin: 0 }}>
                    {t(cat.countKey)}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

/* ── 2. Featured Deals ───────────────────────────────────────────────────────*/
const LuxDealsSection = memo(function LuxDealsSection({ deals }: { deals: DealData[] }) {
  const { i18n } = useTranslation();
  if (deals.length === 0) return null;
  return (
    <section style={sectionStyle(true)} dir={i18n.dir()}>
      <div className="lux-section-inner">
        <LuxSectionHeader eyebrowKey="home.deals.eyebrow" titleKey="home.deals.title" seeAllKey="home.deals.see_all" seeAllHref="/shop?hasDiscount=true" extra={<LuxCountdownTimer />} />
        <div className="lux-deals-grid">
          {deals.map((deal, i) => <LuxDealCard key={`${deal.id}-${i}`} deal={deal} index={i} />)}
        </div>
      </div>
    </section>
  );
});

/* ── 3. Trusted Stores ───────────────────────────────────────────────────────*/
const LuxStoresSection = memo(function LuxStoresSection() {
  const { t, i18n } = useTranslation();

  const [stores, setStores] = useState<StoreDisplayData[]>(() =>
    STATIC_STORES.map(s => ({
      id: s.id, name: s.name, tagline: s.taglineAr,
      categoryLabel: s.categoryKey,
      rating: s.rating, reviews: s.reviews, productCount: s.productCount,
      coverImg: s.coverImg, logoColor: s.logoColor, logoInitial: s.logoInitial,
      verified: s.verified, slug: s.slug,
    }))
  );

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/sellers/featured`)
      .then(r => r.ok ? r.json() : null)
      .then((data: FeaturedStoreAPI[] | null) => {
        if (!data || !Array.isArray(data) || data.length === 0) return;
        const mapped: StoreDisplayData[] = data.slice(0, 3).map((s, i) => ({
          id: s.sellerId, name: s.storeName,
          tagline: (s.categories ?? []).join(" · ") || t("home.stores.fallback_tagline"),
          categoryLabel: (s.categories ?? [])[0] || "",
          rating: Math.round((s.averageRating || 4.5) * 10) / 10,
          reviews: s.reviewsCount, productCount: s.productsCount ?? 0,
          coverImg: s.storeBanner ?? s.storeLogo ?? STATIC_STORES[i % 3].coverImg,
          logoColor: s.accentColor ?? STATIC_STORES[i % 3].logoColor,
          logoInitial: s.storeName.charAt(0), verified: s.isVerified, slug: s.storeSlug,
        }));
        setStores(mapped);
      })
      .catch(() => {});
  }, [t]);

  const displayStores = useMemo(() => stores.map(s => ({
    ...s,
    categoryLabel: STATIC_STORES.find(st => st.id === s.id)
      ? t(STATIC_STORES.find(st => st.id === s.id)!.categoryKey)
      : s.categoryLabel,
  })), [stores, t]);

  return (
    <section style={sectionStyle(false)} dir={i18n.dir()}>
      <div className="lux-section-inner">
        <LuxSectionHeader eyebrowKey="home.stores.eyebrow" titleKey="home.stores.title" seeAllKey="home.stores.see_all" seeAllHref="/sellers/directory" />
        <div className="lux-stores-grid">
          {displayStores.map((store, i) => <LuxStoreCard key={store.id} store={store} index={i} />)}
        </div>
      </div>
    </section>
  );
});

/* ── 4. Trending Products ────────────────────────────────────────────────────*/
const LuxTrendingSection = memo(function LuxTrendingSection({ products }: { products: Product[] }) {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();
  if (products.length === 0) return null;

  return (
    <section style={sectionStyle(true)} dir={i18n.dir()}>
      <div className="lux-section-inner">
        <LuxSectionHeader eyebrowKey="home.trending.eyebrow" titleKey="home.trending.title" seeAllKey="home.trending.see_all" seeAllHref="/shop" />
        <div className="lux-trending-grid">
          {products.slice(0, 6).map((p, i) => {
            const imgs = (p as { imageUrls?: string[] }).imageUrls;
            const finalPrice = (p as { finalPrice?: number }).finalPrice ? Number((p as { finalPrice?: number }).finalPrice) : Number(p.price);
            const compareAt  = (p as { compareAtPrice?: number }).compareAtPrice ? Number((p as { compareAtPrice?: number }).compareAtPrice) : undefined;
            const discPct    = (p as { discountPercent?: number }).discountPercent ? Number((p as { discountPercent?: number }).discountPercent) : undefined;
            const storeName  = (p as { storeName?: string; sellerName?: string }).storeName ?? (p as { storeName?: string; sellerName?: string }).sellerName ?? "";
            const isTrending = i % 3 !== 2;

            return (
              <motion.div key={`${p.id}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.48, delay: i * 0.06, ease: fadeEase }}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden" }}>
                <Link href={`/products/${p.id}`} style={{ display: "block", position: "relative", aspectRatio: "1 / 1", overflow: "hidden", background: C.card2 }}>
                  {imgs?.[0] && <img src={imgs[0]} alt={p.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.88)" }} />}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)" }} />
                  {isTrending && (
                    <div style={{ position: "absolute", top: "10px", insetInlineStart: "10px" }}>
                      <span style={{ fontFamily: F.sans, fontWeight: 600, fontSize: "10px", background: "rgba(124,58,237,0.25)", border: "1px solid rgba(124,58,237,0.40)", color: "#c4b5fd", padding: "3px 9px", borderRadius: "9999px", letterSpacing: "0.04em" }}>
                        {t("home.trending.trending_badge")}
                      </span>
                    </div>
                  )}
                  {discPct && discPct > 0 && (
                    <div style={{ position: "absolute", top: "10px", insetInlineEnd: "10px" }}>
                      <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: "0.72rem", background: C.green, color: C.white, padding: "2px 8px", borderRadius: "9999px" }}>
                        -{discPct}%
                      </span>
                    </div>
                  )}
                </Link>
                <div style={{ padding: "0.85rem 1rem 1rem" }}>
                  {storeName && <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: "10px", color: C.dimmed, margin: "0 0 0.3rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>{storeName}</p>}
                  <Link href={`/products/${p.id}`}>
                    <h3 style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.4, color: C.white, margin: "0 0 0.6rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.name}
                    </h3>
                  </Link>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                    <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: "1rem", color: C.white }} translate="no">{format(finalPrice)}</span>
                    {compareAt && <span style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "11px", color: C.dimmed, textDecoration: "line-through" }} translate="no">{format(compareAt)}</span>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

/* ── 5. New Arrivals ─────────────────────────────────────────────────────────*/
const LuxArrivalsSection = memo(function LuxArrivalsSection({ products }: { products: Product[] }) {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();
  if (products.length < 4) return null;

  const items = products.slice(0, 4).map((p, i) => {
    const imgs = (p as { imageUrls?: string[] }).imageUrls;
    return {
      id: p.id,
      name: p.name,
      category: p.category ?? "",
      price: (p as { finalPrice?: number }).finalPrice ? Number((p as { finalPrice?: number }).finalPrice) : Number(p.price),
      daysAgo: Math.floor(i / 2) + 1,
      img: imgs?.[0] ?? "",
    };
  });

  const main = items[0];
  const rest = items.slice(1);

  return (
    <section style={sectionStyle(false)} dir={i18n.dir()}>
      <div className="lux-section-inner">
        <LuxSectionHeader eyebrowKey="home.arrivals.eyebrow" titleKey="home.arrivals.title" seeAllKey="home.arrivals.see_all" seeAllHref="/shop" />
        <div className="lux-arrivals-grid">
          {/* Main large card */}
          <motion.div className="lux-arrival-main"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease: fadeEase }}
            style={{ position: "relative", borderRadius: "20px", overflow: "hidden", background: C.card, minHeight: "280px" }}>
            <Link href={`/products/${main.id}`} style={{ display: "block", width: "100%", height: "100%" }}>
              {main.img && <img src={main.img} alt={main.name} loading="lazy" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.78) contrast(1.08)" }} />}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.30) 50%, transparent 80%)" }} />
              <div style={{ position: "absolute", top: "1.25rem", insetInlineStart: "1.25rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: F.sans, fontWeight: 700, fontSize: "0.72rem", background: C.green, color: C.white, padding: "5px 12px", borderRadius: "9999px" }}>
                  <Zap style={{ width: 11, height: 11 }} /> {t("home.arrivals.new_since", { count: main.daysAgo })}
                </span>
              </div>
              <div style={{ position: "absolute", bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, padding: "1.75rem" }}>
                {main.category && <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: "0.7rem", letterSpacing: "0.08em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", margin: "0 0 0.5rem" }}>{main.category}</p>}
                <h3 style={{ fontFamily: F.naskh, fontWeight: 800, fontSize: "1.55rem", lineHeight: 1.3, letterSpacing: "-0.01em", color: C.white, margin: "0 0 0.65rem" }}>{main.name}</h3>
                <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: "1.3rem", color: C.white }} translate="no">{format(main.price)}</span>
              </div>
            </Link>
          </motion.div>

          {/* Small cards */}
          {rest.map((item, i) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: fadeEase }}
              style={{ position: "relative", borderRadius: "16px", overflow: "hidden", background: C.card, minHeight: "180px" }}>
              <Link href={`/products/${item.id}`} style={{ display: "block", width: "100%", height: "100%" }}>
                {item.img && <img src={item.img} alt={item.name} loading="lazy" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.75) contrast(1.08)" }} />}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 65%)" }} />
                <div style={{ position: "absolute", top: "10px", insetInlineStart: "10px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: F.sans, fontWeight: 700, fontSize: "9px", background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.65)", padding: "3px 8px", borderRadius: "9999px", backdropFilter: "blur(6px)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                    {t("home.arrivals.ago", { count: item.daysAgo })}
                  </span>
                </div>
                <div style={{ position: "absolute", bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, padding: "0.85rem 1rem" }}>
                  {item.category && <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: "9px", color: "rgba(255,255,255,0.50)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 0.3rem" }}>{item.category}</p>}
                  <h3 style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.3, color: C.white, margin: "0 0 0.4rem" }}>{item.name}</h3>
                  <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: "1rem", color: C.white }} translate="no">{format(item.price)}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

/* ── 6. Join Section ─────────────────────────────────────────────────────────*/
const LuxJoinSection = memo(function LuxJoinSection() {
  const { t, i18n } = useTranslation();
  const { handleOpenYourStore } = useSellerOnboarding();
  const { handleBecomeCourier } = useCourierOnboarding();

  return (
    <section style={sectionStyle(true)} dir={i18n.dir()}>
      <div className="lux-section-inner">
        <div style={{ position: "relative", borderRadius: "24px", overflow: "hidden", background: C.card, border: `1px solid ${C.border}` }}>
          {/* Background glows */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "600px", height: "280px", borderRadius: "50%", background: "rgba(124,58,237,0.06)", filter: "blur(100px)" }} />
          </div>

          <div style={{ position: "relative", zIndex: 1, padding: "4rem 2rem" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: fadeEase }}
              style={{ textAlign: "center", marginBottom: "3rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: F.sans, fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, padding: "5px 14px", borderRadius: "9999px", marginBottom: "1.25rem" }}>
                {t("home.join.badge")}
              </span>
              <h2 style={{ fontFamily: F.naskh, fontWeight: 700, fontSize: "clamp(1.5rem,3.5vw,2.75rem)", letterSpacing: "-0.02em", lineHeight: 1.2, color: C.white, margin: "0 0 1rem" }}>
                {t("home.join.title")}
              </h2>
              <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.95rem", lineHeight: 1.7, color: C.muted, maxWidth: "480px", margin: "0 auto" }}>
                {t("home.join.subtitle")}
              </p>
            </motion.div>

            <div className="lux-join-grid">
              {/* Seller card */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1, ease: fadeEase }}
                onClick={handleOpenYourStore}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleOpenYourStore(); } }}
                role="button"
                tabIndex={0}
                style={{ background: C.card2, border: `1px solid rgba(124,58,237,0.20)`, borderRadius: "18px", padding: "1.75rem", cursor: "pointer", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 110%, rgba(124,58,237,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "14px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                    <Store style={{ width: 22, height: 22, color: "#a78bfa" }} />
                  </div>
                  <h3 style={{ fontFamily: F.naskh, fontWeight: 800, fontSize: "1.2rem", color: C.white, margin: "0 0 0.5rem" }}>{t("home.join.seller_title")}</h3>
                  <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.85rem", lineHeight: 1.65, color: C.muted, margin: "0 0 1.25rem" }}>{t("home.join.seller_desc")}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#c4b5fd" }}>
                    <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.85rem" }}>{t("home.join.seller_cta")}</span>
                    <ArrowLeft style={{ width: 14, height: 14 }} />
                  </div>
                </div>
              </motion.div>

              {/* Courier card */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.2, ease: fadeEase }}
                onClick={handleBecomeCourier}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleBecomeCourier(); } }}
                role="button"
                tabIndex={0}
                style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: "18px", padding: "1.75rem", cursor: "pointer" }}>
                <div style={{ width: 48, height: 48, borderRadius: "14px", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                  <Bike style={{ width: 22, height: 22, color: C.muted }} />
                </div>
                <h3 style={{ fontFamily: F.naskh, fontWeight: 800, fontSize: "1.2rem", color: C.white, margin: "0 0 0.5rem" }}>{t("home.join.courier_title")}</h3>
                <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.85rem", lineHeight: 1.65, color: C.muted, margin: "0 0 1.25rem" }}>{t("home.join.courier_desc")}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: C.dimmed }}>
                  <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.85rem" }}>{t("home.join.courier_cta")}</span>
                  <ArrowLeft style={{ width: 14, height: 14 }} />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

/* ── 7. Full luxury footer ───────────────────────────────────────────────────*/

const LUX_SOCIAL_LINKS = [
  { Icon: Instagram, label: "Instagram", href: "https://www.instagram.com/syano.market/" },
  { Icon: Twitter,   label: "X (Twitter)", href: "https://x.com/Syanomarket" },
  { Icon: Facebook,  label: "Facebook",   href: "https://www.facebook.com/SyanoMarket" },
  { Icon: Youtube,   label: "YouTube",    href: "#" },
];

const LUX_PAYMENT_METHODS = ["VISA", "MasterCard", "PayPal", "SyriaTel Cash"];

const LUX_FOOTER_COLS = [
  {
    titleKey: "home.footer.marketplace_title",
    links: [
      { labelKey: "home.footer.link_all_products",   href: "/shop" },
      { labelKey: "home.footer.link_deals",          href: "/shop?hasDiscount=true" },
      { labelKey: "home.footer.link_bestsellers",    href: "/shop?sortBy=best_selling" },
      { labelKey: "home.footer.link_new_products",   href: "/shop?sortBy=newest" },
      { labelKey: "home.footer.link_categories",     href: "/categories" },
      { labelKey: "home.footer.link_trusted_stores", href: "/stores" },
      { labelKey: "home.footer.link_wishlist",       href: "/wishlist" },
      { labelKey: "home.footer.link_cart",           href: "/cart" },
    ],
  },
  {
    titleKey: "home.footer.sellers_title",
    links: [
      { labelKey: "home.footer.link_open_store",       href: "/seller/apply" },
      { labelKey: "home.footer.link_seller_dashboard", href: "/seller/dashboard" },
      { labelKey: "home.footer.link_seller_center",    href: "/seller/center" },
      { labelKey: "home.footer.link_seller_how",       href: "/seller/how-to-sell" },
      { labelKey: "home.footer.link_commission",       href: "/seller/commission" },
      { labelKey: "home.footer.link_seller_faq",       href: "/seller/faq" },
      { labelKey: "home.footer.link_seller_terms",     href: "/seller/terms" },
      { labelKey: "home.footer.link_returns",          href: "/returns-policy" },
    ],
  },
  {
    titleKey: "home.footer.s_courier",
    links: [
      { labelKey: "home.footer.link_courier_apply",       href: "/courier/apply" },
      { labelKey: "home.footer.link_courier_workspace",   href: "/courier" },
      { labelKey: "home.footer.link_courier_earnings",    href: "/courier/earnings" },
      { labelKey: "home.footer.link_courier_wallet",      href: "/courier/wallet" },
      { labelKey: "home.footer.link_courier_performance", href: "/courier/performance" },
      { labelKey: "home.footer.link_courier_history",     href: "/courier/history" },
    ],
  },
  {
    titleKey: "home.footer.company_title",
    links: [
      { labelKey: "home.footer.link_about",       href: "/about" },
      { labelKey: "home.footer.link_about_story", href: "/about/story" },
      { labelKey: "home.footer.link_about_team",  href: "/about/team" },
      { labelKey: "home.footer.link_contact",     href: "/contact" },
      { labelKey: "home.footer.link_shipping",    href: "/shipping" },
      { labelKey: "home.footer.link_guarantee",   href: "/syano-guarantee" },
      { labelKey: "home.footer.link_loyalty",     href: "/loyalty" },
      { labelKey: "home.footer.link_payment",     href: "/payment-methods" },
      { labelKey: "home.footer.link_help",        href: "/help" },
      { labelKey: "home.footer.link_privacy",     href: "/privacy-policy" },
      { labelKey: "home.footer.link_terms_page",  href: "/terms-of-use" },
    ],
  },
];

const LUX_LEGAL_LINKS = [
  { labelKey: "home.footer.privacy",      href: "/privacy-policy" },
  { labelKey: "home.footer.terms",        href: "/terms-of-use" },
  { labelKey: "home.footer.cookies",      href: "/cookies" },
  { labelKey: "home.footer.link_returns", href: "/returns-policy" },
];

const LuxFooterBar = memo(function LuxFooterBar() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const colHeadStyle: React.CSSProperties = {
    fontFamily: F.naskh,
    fontWeight: 700,
    fontSize: "0.92rem",
    color: C.white,
    margin: "0 0 1.1rem",
    letterSpacing: "0.01em",
  };

  const linkStyle: React.CSSProperties = {
    fontFamily: F.sans,
    fontWeight: 400,
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.38)",
    textDecoration: "none",
    display: "block",
    lineHeight: 1,
    transition: "color 0.2s",
  };

  return (
    <footer style={{ background: C.bg, borderTop: `1px solid ${C.border}` }} dir={i18n.dir()}>
      <div className="lux-section-inner">

        {/* ── Main grid ── */}
        <div className="lux-footer-grid">

          {/* Brand block */}
          <div className="lux-footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.1rem" }}>
              <img
                src="/syano-logo.png"
                alt="SYANO"
                width={36}
                height={36}
                style={{ width: 36, height: 36, objectFit: "contain",
                  filter: "brightness(1.15) drop-shadow(0 1px 4px rgba(0,0,0,0.5))" }}
              />
              <div>
                <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: "1rem", letterSpacing: "0.08em", color: C.white }}>SYANO</div>
                <div style={{ fontFamily: F.naskh, fontWeight: 400, fontSize: "0.72rem", color: "rgba(255,255,255,0.38)", letterSpacing: "0.12em" }}>سوق سوريا</div>
              </div>
            </div>
            <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.82rem", lineHeight: 1.8, color: "rgba(255,255,255,0.36)", maxWidth: "280px", margin: "0 0 1.5rem" }}>
              {t("home.footer.tagline")}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              {LUX_SOCIAL_LINKS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lux-social-icon"
                  style={{ width: 36, height: 36, borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.38)", textDecoration: "none", transition: "background 0.2s, color 0.2s, border-color 0.2s" }}
                >
                  <Icon style={{ width: 15, height: 15 }} />
                </a>
              ))}
            </div>
          </div>

          {/* 4 link columns */}
          {LUX_FOOTER_COLS.map((col) => (
            <div key={col.titleKey}>
              <h4 style={colHeadStyle}>{t(col.titleKey)}</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                {col.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link href={link.href} className="lux-footer-link" style={linkStyle}>
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div className="lux-footer-newsletter">
            <h4 style={colHeadStyle}>{t("home.footer.newsletter_title")}</h4>
            <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.8rem", lineHeight: 1.75, color: "rgba(255,255,255,0.36)", margin: "0 0 1rem" }}>
              {t("home.footer.newsletter_desc")}
            </p>

            {subscribed ? (
              <div aria-live="polite" style={{ fontFamily: F.sans, fontWeight: 600, fontSize: "0.82rem", color: "#4ade80", padding: "0.8rem 1rem", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.20)", borderRadius: "12px" }}>
                ✓ {t("home.footer.subscribed", "تم الاشتراك!")}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) { setSubscribed(true); setEmail(""); }
                }}
                style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("home.footer.newsletter_placeholder")}
                  aria-label={t("home.footer.newsletter_placeholder")}
                  className="lux-footer-input"
                  style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.8rem", width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: "12px", padding: "0.72rem 1rem", color: C.white, outline: "none", transition: "border-color 0.2s" }}
                />
                <button
                  type="submit"
                  style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: C.white, color: C.bg, width: "100%", padding: "0.72rem", borderRadius: "9999px", transition: "opacity 0.2s" }}
                >
                  {t("home.footer.subscribe")} <ArrowLeft style={{ width: 13, height: 13 }} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="lux-footer-bottom">
          <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.75rem", color: "rgba(255,255,255,0.22)", margin: 0, flexShrink: 0 }}>
            {t("home.footer.copyright")}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
            {LUX_PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "10px", letterSpacing: "0.05em", padding: "3px 10px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: "rgba(255,255,255,0.28)", borderRadius: "6px" }}
              >
                {method}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap", justifyContent: "center" }}>
            {LUX_LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="lux-footer-link"
                style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.75rem", color: "rgba(255,255,255,0.26)", textDecoration: "none", transition: "color 0.2s" }}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════*/
export default function LuxuryLandingPage() {
  const reduced = useReducedMotion() ?? false;

  /* Hero carousel state */
  const [leftIdx,  setLeftIdx]  = useState(0);
  const [rightIdx, setRightIdx] = useState(0);
  const rightTurn = useRef(true);

  /* Phase-2 split state — triggers (PHASE1_END_MS + 4000ms) after mount */
  const [splitTriggered, setSplitTriggered] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      if (rightTurn.current) setRightIdx(i => (i + 1) % RIGHT_STACK.length);
      else                   setLeftIdx(i  => (i + 1) % LEFT_STACK.length);
      rightTurn.current = !rightTurn.current;
    }, 2500);
    return () => clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    // PHASE1_END_MS = 650ms (right banner drop-in completes at mount + 650ms).
    // Wait an additional 4000ms after that → total 4650ms from mount.
    const id = setTimeout(() => setSplitTriggered(true), PHASE1_END_MS + 4000);
    return () => clearTimeout(id);
  }, [reduced]);

  /* Product data */
  const { data: products } = useListProducts({}, {
    query: {
      staleTime: 3 * 60 * 1000,
      gcTime:    10 * 60 * 1000,
      queryKey:  getListProductsQueryKey({}),
    },
  });

  const hotDeals = useMemo<DealData[]>(() =>
    (products?.filter((p) => (p as { isBestDeal?: boolean }).isBestDeal) ?? [])
      .slice(0, 4)
      .map(p => {
        const imgs = (p as { imageUrls?: string[] }).imageUrls;
        return {
          id: p.id,
          name: p.name,
          category: p.category ?? "",
          price:          (p as { finalPrice?: number }).finalPrice ? Number((p as { finalPrice?: number }).finalPrice) : Number(p.price),
          originalPrice:  (p as { compareAtPrice?: number }).compareAtPrice  ? Number((p as { compareAtPrice?: number }).compareAtPrice)  : null,
          discountPercent:(p as { discountPercent?: number }).discountPercent ? Number((p as { discountPercent?: number }).discountPercent) : null,
          img: imgs?.[0] ?? "",
        };
      }), [products]);

  const trending    = useMemo(() => products?.slice(0, 6) ?? [], [products]);
  const newArrivals = useMemo(() => products?.slice(0, 4) ?? [], [products]);

  const leftItem      = LEFT_STACK[leftIdx];
  const rightItem     = RIGHT_STACK[rightIdx];
  const nextLeftItem  = LEFT_STACK[(leftIdx + 1) % LEFT_STACK.length];
  const nextRightItem = RIGHT_STACK[(rightIdx + 1) % RIGHT_STACK.length];


  return (
    <>
      <style>{FONT_CSS}</style>
      <style>{SECTION_CSS}</style>
      {/* Spinner keyframe for cart button */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div
        className="lux-root"
        dir="rtl"
        lang="ar"
        style={{
          background: C.bg,
          minHeight: "100dvh",
          fontFamily: F.sans,
          scrollbarWidth: "thin",
          scrollbarColor: `${C.border} transparent`,
        }}
      >
        {/* ── Sticky navbar ──────────────────────────────────────────────── */}
        <div style={{ position: "sticky", top: 0, zIndex: 1000, background: C.bg, transform: "translateZ(0)", isolation: "isolate" }}>
          <LuxuryNavbar />
        </div>

        {/* ── Hero section — fills exactly one viewport height ───────────── */}
        <motion.section
          variants={heroContainerVariants}
          initial={reduced ? false : "hidden"}
          animate="visible"
          style={{
            position: "relative",
            zIndex: 0,
            height: "calc(100dvh - 3.75rem)",
            display: "grid",
            gridTemplateColumns: "1fr 1.48fr 1fr",
            gap: "16px",
            padding: "0 20px",
            overflow: "hidden",
          }}
        >
            {/* LEFT — phase 1: slides down; phase 2: real flex split into two independent cards */}
            <motion.div variants={bannerVariant} style={{ display: "flex", flexDirection: "column", gap: "16px", transform: "translateZ(0)" }}>
              {/* Top card — always present; layout prop animates real height change when sibling is added */}
              <motion.div
                layout
                transition={{ layout: { duration: 0.45, ease: "easeOut" } }}
                style={{ flex: "1 1 0", position: "relative", borderRadius: "24px", overflow: "hidden", background: C.card, minHeight: 0 }}
              >
                {!splitTriggered ? (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={leftItem.id} style={{ position: "absolute", inset: 0, willChange: "transform, opacity", backfaceVisibility: "hidden" }}
                      initial={reduced ? false : fromBottom} animate={visible} exit={reduced ? {} : toTop}
                      transition={{ duration: 0.55, ease: SPRING }}>
                      <ProductCard item={leftItem} />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div style={{ position: "absolute", inset: 0 }}>
                    <ProductCard item={leftItem} />
                  </div>
                )}
              </motion.div>
              {/* Bottom new card — independent card, slides up from below into freed space */}
              <AnimatePresence>
                {splitTriggered && (
                  <motion.div
                    layout
                    initial={{ y: "100%", opacity: 0, filter: "blur(8px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    style={{ flex: "1 1 0", position: "relative", borderRadius: "24px", overflow: "hidden", background: C.card, minHeight: 0 }}
                  >
                    <div style={{ position: "absolute", inset: 0 }}>
                      <ProductCard item={nextLeftItem} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* CENTER — entrance: slides down; unchanged in phase 2 */}
            <motion.div variants={bannerVariant} style={{ position: "relative", borderRadius: "24px", overflow: "hidden", background: C.card }}>
              <CenterCard reduced={reduced} />
            </motion.div>

            {/* RIGHT — phase 1: slides down; phase 2: real flex split into two independent cards */}
            <motion.div variants={bannerVariant} style={{ display: "flex", flexDirection: "column", gap: "16px", transform: "translateZ(0)" }}>
              {/* Top new card — independent card, slides down from above into freed space */}
              <AnimatePresence>
                {splitTriggered && (
                  <motion.div
                    layout
                    initial={{ y: "-100%", opacity: 0, filter: "blur(8px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    style={{ flex: "1 1 0", position: "relative", borderRadius: "24px", overflow: "hidden", background: C.card, minHeight: 0 }}
                  >
                    <div style={{ position: "absolute", inset: 0 }}>
                      <ProductCard item={nextRightItem} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Bottom card — always present; layout prop animates real height change when sibling is added */}
              <motion.div
                layout
                transition={{ layout: { duration: 0.45, ease: "easeOut" } }}
                style={{ flex: "1 1 0", position: "relative", borderRadius: "24px", overflow: "hidden", background: C.card, minHeight: 0 }}
              >
                {!splitTriggered ? (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={rightItem.id} style={{ position: "absolute", inset: 0, willChange: "transform, opacity", backfaceVisibility: "hidden" }}
                      initial={reduced ? false : fromTop} animate={visible} exit={reduced ? {} : toBottom}
                      transition={{ duration: 0.55, ease: SPRING }}>
                      <ProductCard item={rightItem} />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div style={{ position: "absolute", inset: 0 }}>
                    <ProductCard item={rightItem} />
                  </div>
                )}
              </motion.div>
            </motion.div>
        </motion.section>

        {/* ── Below-fold sections ────────────────────────────────────────── */}
        <LuxCategoriesSection />
        <LuxDealsSection deals={hotDeals} />
        <LuxStoresSection />
        <LuxTrendingSection products={trending} />
        <LuxArrivalsSection products={newArrivals} />
        <LuxJoinSection />
        <LuxFooterBar />
      </div>
    </>
  );
}
