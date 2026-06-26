// @refresh reset
/**
 * LuxuryNavbar.tsx
 * Full-featured navbar with ALL original interactive elements, skinned in the
 * luxury dark design: charcoal #0B0B0C background, white capsule buttons,
 * Noto Naskh Arabic branding, Noto Sans Arabic for links.
 *
 * Restores: Search (with suggestions/trending/recent), Location selector,
 * Auth (Login/Register + user avatar dropdown with role-based links),
 * Wishlist, Cart (with count badges), Notifications, Messages,
 * Language switcher, Currency toggle, Theme toggle, Mobile Sheet sidebar.
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import {
  Sheet, SheetContent, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingCart, LogOut, LayoutDashboard, Search, X, Globe, Sun,
  DollarSign, Menu, Home, Package, ClipboardList, Warehouse, Clock,
  MessageCircle, Users, Store, BarChart2, ScrollText, Settings,
  Heart, ChevronDown, Bike, TrendingUp, Layers, MapPin, User, Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  useGetCart, getGetCartQueryKey, useGetUnreadCount, useGetDeliveryZones,
} from "@workspace/api-client-react";
import { LocationMapModal } from "@/components/LocationMapModal";
import { loadSavedZoneId } from "@/lib/location-storage";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useWishlist } from "@/contexts/WishlistContext";
import { useTranslation } from "react-i18next";
import { applyDirection } from "@/i18n";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import {
  useSearchSuggestions, useSearchTrending, trackSearchClick,
} from "@/hooks/use-search";

/* ── Brand tokens ─────────────────────────────────────────────────────────────*/
const BG        = "#0B0B0C";
const WHITE     = "#FFFFFF";
const MUTED     = "rgba(255,255,255,0.52)";
const DIMMED    = "rgba(255,255,255,0.28)";
const BORDER    = "rgba(255,255,255,0.08)";
const BORDER_H  = "rgba(255,255,255,0.16)";
const GREEN     = "#16A34A";
const DROP_BG   = "rgba(14,14,16,0.98)";

/* ── Fonts ────────────────────────────────────────────────────────────────────*/
const F_NASKH = "'Noto Naskh Arabic', serif";
const F_SANS  = "'Noto Sans Arabic', sans-serif";

/* ── Mobile nav link ──────────────────────────────────────────────────────────*/
interface MobLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  loc: string;
  onClose: () => void;
}
const MobLink = React.memo(function MobLink({ href, icon: Icon, label, loc, onClose }: MobLinkProps) {
  const active = loc === href || (href !== "/" && loc.startsWith(href));
  return (
    <Link href={href} onClick={onClose}>
      <div className={cn(
        "flex items-center gap-3 px-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]",
        active
          ? "bg-white/[0.08] text-white"
          : "text-white/55 hover:text-white hover:bg-white/[0.05]",
      )}
        style={{ fontFamily: F_SANS }}
      >
        <Icon className="h-[1.0625rem] w-[1.0625rem] shrink-0" />
        {label}
      </div>
    </Link>
  );
});

/* ── Icon capsule button ──────────────────────────────────────────────────────*/
const IconCapsule = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { badge?: number | string }
>(function IconCapsule({ children, badge, className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "relative h-9 w-9 flex items-center justify-center rounded-full",
        "bg-white text-[#0B0B0C]",
        "hover:scale-105 active:scale-95 transition-transform duration-150",
        className,
      )}
      {...rest}
    >
      {children}
      {badge !== undefined && Number(badge) > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-2px",
            insetInlineEnd: "-2px",
            minWidth: "1rem",
            height: "1rem",
            borderRadius: "9999px",
            background: GREEN,
            color: WHITE,
            fontSize: "8px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
            pointerEvents: "none",
          }}
        >
          {Number(badge) > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
});

/* ── Main component ───────────────────────────────────────────────────────────*/
export function LuxuryNavbar() {
  const [location, navigate] = useLocation();
  const { user, logout, isAuthenticated, isCustomer, isSeller, isAdmin, isCourier } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const { count: wishlistCount } = useWishlist();
  const { setTheme, theme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRtl = lang === "ar";

  /* ── State ── */
  const [searchOpen,      setSearchOpen]      = useState(false);
  const [searchQuery,     setSearchQuery]     = useState("");
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedZoneId,  setSelectedZoneId]  = useState<number | null>(loadSavedZoneId);
  const [highlightedIdx,  setHighlightedIdx]  = useState(-1);

  const debouncedQ    = useDebounce(searchQuery, 200);
  const searchRef     = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);
  const flatItemsRef  = useRef<Array<{ id: string; action: () => void }>>([]);
  const closeMobile   = useCallback(() => setMobileMenuOpen(false), []);

  /* ── Data ── */
  const { data: zones = [] }  = useGetDeliveryZones({ staleTime: 10 * 60 * 1000 });
  const selectedZone           = zones.find(z => z.id === selectedZoneId) ?? null;
  const { data: cart }         = useGetCart({ query: { queryKey: getGetCartQueryKey(), enabled: isCustomer } });
  const cartCount              = cart?.itemCount ?? 0;
  const { guestTotal }         = useGuestCart();
  const visibleCart            = isAuthenticated ? cartCount : guestTotal;
  const { data: unreadData }   = useGetUnreadCount({
    query: { queryKey: ["/api/conversations/unread-count"] as const, enabled: isAuthenticated, refetchInterval: 15_000 },
  });
  const unreadMsgs             = unreadData?.unread ?? 0;
  const { suggestions, isLoading: searchLoading } = useSearchSuggestions(debouncedQ);
  const trending               = useSearchTrending();

  /* ── Recent searches ── */
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("syano_recent_searches") || "[]"); } catch { return []; }
  });

  const saveRecent = useCallback((q: string) => {
    const t = q.trim();
    if (!t || t.length < 2) return;
    setRecentSearches(prev => {
      const next = [t, ...prev.filter(s => s !== t)].slice(0, 6);
      try { localStorage.setItem("syano_recent_searches", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    try { localStorage.removeItem("syano_recent_searches"); } catch {}
  }, []);
  const removeRecent = useCallback((q: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(s => s !== q);
      try { localStorage.setItem("syano_recent_searches", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  /* ── Handlers ── */
  const switchLang = (l: string) => { i18n.changeLanguage(l); applyDirection(l); };
  useEffect(() => { applyDirection(i18n.language); }, [i18n.language]);
  useEffect(() => { if (searchOpen && inputRef.current) inputRef.current.focus(); }, [searchOpen]);

  /* Mobile scroll-lock */
  useEffect(() => {
    if (!window.matchMedia("(max-width:767px)").matches) return;
    document.body.style.overflow = searchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [searchOpen]);

  /* Close search on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) { setSearchOpen(false); setSearchQuery(""); }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* Sync zone from modal */
  useEffect(() => {
    const h = (e: Event) => setSelectedZoneId((e as CustomEvent<{ zoneId: number | null }>).detail.zoneId);
    window.addEventListener("syano:location-updated", h);
    return () => window.removeEventListener("syano:location-updated", h);
  }, []);

  /* Reset highlight when query changes */
  useEffect(() => { setHighlightedIdx(-1); }, [debouncedQ]);

  /* Scroll highlighted item */
  useEffect(() => {
    if (highlightedIdx >= 0) {
      const id = flatItemsRef.current[highlightedIdx]?.id;
      if (id) document.getElementById(id)?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIdx]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecent(searchQuery.trim());
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false); setSearchQuery("");
    }
  }, [searchQuery, navigate, saveRecent]);

  const handleSuggClick = useCallback((text: string, type: "suggestion" | "category" | "store" = "suggestion") => {
    saveRecent(text);
    trackSearchClick(text, type);
    navigate(`/shop?q=${encodeURIComponent(text)}`);
    setSearchOpen(false); setSearchQuery("");
  }, [navigate, saveRecent]);

  const handleSearchKD = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); setHighlightedIdx(-1); return; }
    const items = flatItemsRef.current;
    if (!searchOpen || !items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightedIdx(p => Math.min(p + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightedIdx(p => Math.max(p - 1, -1)); }
    else if (e.key === "Enter" && highlightedIdx >= 0 && items[highlightedIdx]) { e.preventDefault(); items[highlightedIdx].action(); }
  }, [searchOpen, highlightedIdx]);

  /* Flat items for keyboard nav */
  const _suggs = (suggestions.suggestions ?? []).slice(0, 6);
  const _stores = (suggestions.stores ?? []).slice(0, 3);

  useEffect(() => {
    if (!searchOpen) { flatItemsRef.current = []; return; }
    if (debouncedQ.length < 2) {
      flatItemsRef.current = recentSearches.map((s, i) => ({ id: `lnav-opt-${i}`, action: () => setSearchQuery(s) }));
      return;
    }
    const items: Array<{ id: string; action: () => void }> = [];
    _suggs.forEach((s, i) => {
      const text = isRtl && s.textAr ? s.textAr : s.text;
      items.push({ id: `lnav-opt-${i}`, action: () => handleSuggClick(text) });
    });
    _stores.forEach((s, i) => {
      items.push({
        id: `lnav-opt-${_suggs.length + i}`,
        action: () => {
          trackSearchClick(s.storeName, "store");
          navigate(s.storeSlug ? `/store/${s.storeSlug}` : `/shop?sellerId=${s.userId}`);
          setSearchOpen(false); setSearchQuery("");
        },
      });
    });
    items.push({
      id: `lnav-opt-${_suggs.length + _stores.length}`,
      action: () => {
        if (debouncedQ.trim()) { saveRecent(debouncedQ.trim()); navigate(`/shop?q=${encodeURIComponent(debouncedQ.trim())}`); setSearchOpen(false); setSearchQuery(""); }
      },
    });
    flatItemsRef.current = items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen, debouncedQ, suggestions, recentSearches, isRtl]);

  /* ── Role-based links ── */
  const sellerLinks = useMemo(() => [
    { href: "/seller/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { href: "/seller/products",  icon: Package,          label: t("nav.products")  },
    { href: "/seller/orders",    icon: ClipboardList,    label: t("nav.orders")    },
    { href: "/seller/inventory", icon: Warehouse,        label: t("nav.inventory") },
  ], [t]);

  const adminLinks = useMemo(() => [
    { href: "/admin",          icon: LayoutDashboard, label: t("admin.nav_dashboard") },
    { href: "/admin/users",    icon: Users,           label: t("admin.nav_users")    },
    { href: "/admin/sellers",  icon: Store,           label: t("admin.nav_sellers")  },
    { href: "/admin/products", icon: Package,         label: t("admin.nav_products") },
    { href: "/admin/orders",   icon: ShoppingCart,    label: t("admin.nav_orders")   },
    { href: "/admin/analytics",icon: BarChart2,       label: t("admin.nav_analytics")},
    { href: "/admin/logs",     icon: ScrollText,      label: t("admin.nav_logs")     },
    { href: "/admin/settings", icon: Settings,        label: t("admin.nav_settings") },
  ], [t]);

  const customerLinks = useMemo(() => [
    { href: "/customer/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { href: "/orders",             icon: ClipboardList,   label: t("nav.orders")    },
  ], [t]);

  const navLinks = isRtl
    ? [
        { href: "/",                      label: "الرئيسية" },
        { href: "/shop",                  label: "تسوق"      },
        { href: "/categories",            label: "الفئات"    },
        { href: "/sellers/directory",     label: "المتاجر"   },
        { href: "/shop?hasDiscount=true", label: "العروض"    },
      ]
    : [
        { href: "/",                      label: "Home"       },
        { href: "/shop",                  label: "Shop"       },
        { href: "/categories",            label: "Categories" },
        { href: "/sellers/directory",     label: "Stores"     },
        { href: "/shop?hasDiscount=true", label: "Deals"      },
      ];

  /* ── Shared dropdown token ── */
  const dropStyle: React.CSSProperties = {
    background: DROP_BG,
    border: `1px solid ${BORDER_H}`,
  };

  return (
    <>
      {/* Floating header */}
      <header
        style={{
          position: "relative",
          zIndex: 10,
          fontFamily: F_SANS,
          flexShrink: 0,
        }}
      >
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>

          {/* ══ MOBILE TOP BAR (< md) ════════════════════════════════════════ */}
          <div
            className="md:hidden flex h-[3.75rem] items-center justify-between px-4 gap-2"
            dir={isRtl ? "rtl" : "ltr"}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Syano home">
              <img
                src="/syano-logo.png" alt="" width={30} height={30}
                className="h-[1.875rem] w-[1.875rem] object-contain"
                style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.15))" }}
                loading="eager"
              />
              <span style={{ fontFamily: F_NASKH, fontWeight: 800, letterSpacing: "0.1em", fontSize: "1rem", color: WHITE }}>
                SYANO
              </span>
            </Link>

            {/* Right icons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label={t("a11y.search")}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-white/[0.10] hover:bg-white/[0.16] transition-colors"
              >
                <Search className="h-4 w-4 text-white" />
              </button>
              {isAuthenticated && (
                <NotificationCenter btnClassName="h-9 w-9 flex items-center justify-center rounded-full bg-white/[0.10] hover:bg-white/[0.16] transition-colors text-white" />
              )}
              {isAuthenticated && !isCourier && (
                <Link
                  href={isAdmin ? "/admin/messages" : isSeller ? "/seller/messages" : "/messages"}
                  className="relative h-9 w-9 flex items-center justify-center rounded-full bg-white/[0.10] hover:bg-white/[0.16] transition-colors"
                  aria-label={isRtl ? "الرسائل" : "Messages"}
                >
                  <MessageCircle className="h-4 w-4 text-white" />
                  {unreadMsgs > 0 && (
                    <span style={{ position: "absolute", top: -2, insetInlineEnd: -2, minWidth: "1rem", height: "1rem", borderRadius: 9999, background: GREEN, color: WHITE, fontSize: "8px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {unreadMsgs > 9 ? "9+" : unreadMsgs}
                    </span>
                  )}
                </Link>
              )}
              {!isSeller && !isAdmin && !isCourier && (
                <Link href="/wishlist" aria-label={t("a11y.wishlist")}
                  className="relative h-9 w-9 flex items-center justify-center rounded-full bg-white/[0.10] hover:bg-white/[0.16] transition-colors">
                  <Heart className="h-4 w-4 text-white" />
                  {wishlistCount > 0 && (
                    <span style={{ position: "absolute", top: -2, insetInlineEnd: -2, minWidth: "1rem", height: "1rem", borderRadius: 9999, background: "#f43f5e", color: WHITE, fontSize: "8px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                </Link>
              )}
              {!isSeller && !isAdmin && !isCourier && (
                <Link href="/cart" aria-label={t("a11y.openCart")}
                  className="relative h-9 w-9 flex items-center justify-center rounded-full bg-white/[0.10] hover:bg-white/[0.16] transition-colors">
                  <ShoppingCart className="h-4 w-4 text-white" />
                  {visibleCart > 0 && (
                    <span style={{ position: "absolute", top: -2, insetInlineEnd: -2, minWidth: "1rem", height: "1rem", borderRadius: 9999, background: GREEN, color: WHITE, fontSize: "8px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {visibleCart}
                    </span>
                  )}
                </Link>
              )}
              <SheetTrigger asChild>
                <button aria-label={t("a11y.openMenu")}
                  className="h-9 w-9 flex items-center justify-center rounded-full bg-white/[0.10] hover:bg-white/[0.16] transition-colors">
                  <Menu className="h-4 w-4 text-white" />
                </button>
              </SheetTrigger>
            </div>
          </div>

          {/* ══ DESKTOP NAV (≥ md) ════════════════════════════════════════════ */}
          <div
            className="hidden md:grid h-[3.75rem] items-center gap-3 px-4"
            style={{ gridTemplateColumns: "auto 1fr auto" }}
            dir={isRtl ? "rtl" : "ltr"}
          >

            {/* ── COL 1: Brand + Location ─────────────────────────────────── */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Brand pill */}
              <motion.a
                href="/"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => { e.preventDefault(); navigate("/"); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.45rem 1.1rem 0.45rem 0.6rem",
                  borderRadius: "9999px",
                  background: WHITE,
                  textDecoration: "none",
                }}
              >
                <img
                  src="/syano-logo.png" alt="Syano" width={28} height={28}
                  style={{ height: 28, width: 28, objectFit: "contain" }}
                  loading="eager"
                />
                <div>
                  <div style={{ fontFamily: F_NASKH, fontWeight: 900, letterSpacing: "0.1em", fontSize: "0.875rem", lineHeight: 1, color: BG }}>
                    SYANO
                  </div>
                  <div style={{ fontFamily: F_SANS, fontWeight: 500, fontSize: "7px", letterSpacing: "0.18em", color: "rgba(11,11,12,0.55)" }}>
                    سوق سوريا
                  </div>
                </div>
              </motion.a>

              {/* Location selector */}
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="hidden lg:flex items-center gap-1.5 h-9 ps-2.5 pe-3 rounded-full transition-all duration-150"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: `1px solid ${BORDER}`,
                }}
                aria-label={isRtl ? "تحديد موقع التوصيل" : "Set delivery location"}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.13)"; (e.currentTarget as HTMLElement).style.borderColor = BORDER_H; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
              >
                <MapPin style={{ height: 13, width: 13, color: GREEN, flexShrink: 0 }} />
                <div style={{ textAlign: "start" }}>
                  <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.06em", color: MUTED, lineHeight: 1.2 }}>
                    {t("nav.deliver_to")}
                  </div>
                  <div style={{ fontFamily: F_SANS, fontSize: "11px", fontWeight: 700, color: WHITE, lineHeight: 1.3, maxWidth: 100 }} className="truncate">
                    {selectedZone ? (isRtl ? selectedZone.nameAr : selectedZone.nameEn) : t("nav.select_location")}
                  </div>
                </div>
              </button>
            </div>

            {/* ── COL 2: Nav links + Search ────────────────────────────────── */}
            <div className="flex items-center justify-center gap-1" ref={searchRef}>
              {/* Nav links */}
              <nav className="hidden lg:flex items-center gap-0.5 me-2">
                {navLinks.map(link => {
                  const active = link.href === "/" ? location === "/" : location.startsWith(link.href.split("?")[0]);
                  return (
                    <Link key={link.href} href={link.href}>
                      <span
                        style={{
                          fontFamily: F_SANS,
                          fontSize: "0.8125rem",
                          fontWeight: active ? 700 : 500,
                          color: active ? WHITE : MUTED,
                          padding: "0.35rem 0.75rem",
                          borderRadius: "9999px",
                          display: "block",
                          transition: "color 0.15s, background 0.15s",
                          background: active ? "rgba(255,255,255,0.09)" : "transparent",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = WHITE; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}}
                        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = MUTED; (e.currentTarget as HTMLElement).style.background = "transparent"; }}}
                      >
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {/* Search bar */}
              <div className="relative">
                <form onSubmit={handleSearchSubmit}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      height: "2.25rem",
                      padding: "0 0.875rem",
                      borderRadius: "9999px",
                      background: "rgba(255,255,255,0.10)",
                      border: `1px solid ${searchOpen ? BORDER_H : BORDER}`,
                      transition: "background 0.2s, border-color 0.2s",
                      minWidth: "clamp(180px, 20vw, 280px)",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.13)"; }}
                    onMouseLeave={e => { if (!searchOpen) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; }}
                  >
                    <Search style={{ height: 14, width: 14, color: searchOpen ? WHITE : MUTED, flexShrink: 0, transition: "color 0.2s" }} />
                    <input
                      ref={inputRef}
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                      onFocus={() => setSearchOpen(true)}
                      onKeyDown={handleSearchKD}
                      placeholder={isRtl ? "ابحث..." : "Search..."}
                      role="combobox"
                      aria-expanded={searchOpen}
                      aria-autocomplete="list"
                      aria-controls="lnav-search-listbox"
                      aria-activedescendant={highlightedIdx >= 0 ? (flatItemsRef.current[highlightedIdx]?.id ?? undefined) : undefined}
                      style={{
                        fontFamily: F_SANS,
                        fontSize: "0.8125rem",
                        background: "transparent",
                        outline: "none",
                        border: "none",
                        color: WHITE,
                        flex: 1,
                        minWidth: 0,
                      }}
                    />
                    {searchQuery && (
                      <button type="button" aria-label={t("a11y.close")}
                        onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                        style={{ color: MUTED, display: "flex", alignItems: "center" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = WHITE; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = MUTED; }}
                      >
                        <X style={{ height: 13, width: 13 }} />
                      </button>
                    )}
                  </div>
                </form>

                {/* Search dropdown */}
                {searchOpen && (debouncedQ.length >= 2 || recentSearches.length > 0 || trending.length > 0) && (
                  <div
                    id="lnav-search-listbox"
                    role="listbox"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      insetInlineStart: 0,
                      width: "min(360px, 90vw)",
                      ...dropStyle,
                      borderRadius: "1rem",
                      boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
                      overflow: "hidden",
                      zIndex: 60,
                    }}
                  >
                    {debouncedQ.length >= 2 ? (
                      searchLoading ? (
                        <div style={{ padding: "0.5rem 0" }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 1rem" }}>
                              <div style={{ height: 12, width: 12, borderRadius: "50%", background: BORDER, flexShrink: 0 }} />
                              <div style={{ height: 10, borderRadius: 6, background: BORDER, width: `${50 + i * 18}%` }} />
                            </div>
                          ))}
                        </div>
                      ) : (suggestions.suggestions?.length ?? 0) === 0 && (suggestions.stores?.length ?? 0) === 0 ? (
                        <div style={{ padding: "1rem", fontSize: "0.8125rem", color: DIMMED, textAlign: "center" }}>
                          {isRtl ? "لا توجد نتائج" : "No results found"}
                        </div>
                      ) : (
                        <div style={{ maxHeight: "22rem", overflowY: "auto" }}>
                          {/* Suggestions */}
                          {_suggs.map((s, i) => {
                            const text = isRtl && s.textAr ? s.textAr : s.text;
                            const isHl = highlightedIdx === i;
                            return (
                              <button key={i} id={flatItemsRef.current[i]?.id ?? `lnav-opt-${i}`}
                                role="option" aria-selected={isHl}
                                onClick={() => handleSuggClick(text)}
                                style={{
                                  width: "100%", display: "flex", alignItems: "center", gap: "0.625rem",
                                  padding: "0.6rem 1rem", background: isHl ? "rgba(255,255,255,0.06)" : "transparent",
                                  textAlign: isRtl ? "right" : "left", cursor: "pointer",
                                  transition: "background 0.12s",
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isHl ? "rgba(255,255,255,0.06)" : "transparent"; }}
                              >
                                <Search style={{ height: 13, width: 13, color: DIMMED, flexShrink: 0 }} />
                                <span style={{ fontFamily: F_SANS, fontSize: "0.8125rem", color: "rgba(255,255,255,0.85)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {text}
                                </span>
                              </button>
                            );
                          })}
                          {/* Stores */}
                          {_stores.length > 0 && (
                            <>
                              <div style={{ padding: "0.5rem 1rem 0.3rem", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                                <Store style={{ height: 11, width: 11, color: DIMMED }} />
                                <span style={{ fontFamily: F_SANS, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: DIMMED, textTransform: "uppercase" }}>
                                  {isRtl ? "متاجر" : "Stores"}
                                </span>
                              </div>
                              {_stores.map((s, i) => {
                                const sIdx = _suggs.length + i;
                                const isHl = highlightedIdx === sIdx;
                                return (
                                  <button key={s.userId} id={flatItemsRef.current[sIdx]?.id ?? `lnav-opt-${sIdx}`}
                                    role="option" aria-selected={isHl}
                                    onClick={() => { trackSearchClick(s.storeName, "store"); navigate(s.storeSlug ? `/store/${s.storeSlug}` : `/shop?sellerId=${s.userId}`); setSearchOpen(false); setSearchQuery(""); }}
                                    style={{
                                      width: "100%", display: "flex", alignItems: "center", gap: "0.625rem",
                                      padding: "0.5rem 1rem", background: isHl ? "rgba(255,255,255,0.06)" : "transparent",
                                      cursor: "pointer", transition: "background 0.12s",
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isHl ? "rgba(255,255,255,0.06)" : "transparent"; }}
                                  >
                                    {s.storeLogo
                                      ? <img src={s.storeLogo} alt="" style={{ height: 28, width: 28, borderRadius: 8, objectFit: "cover", border: `1px solid ${BORDER}`, flexShrink: 0 }} />
                                      : <div style={{ height: 28, width: 28, borderRadius: 8, background: "rgba(22,163,74,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Store style={{ height: 13, width: 13, color: GREEN }} /></div>
                                    }
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontFamily: F_SANS, fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.storeName}</div>
                                      {s.city && <div style={{ fontSize: 11, color: MUTED }}>{s.city}</div>}
                                    </div>
                                  </button>
                                );
                              })}
                            </>
                          )}
                          {/* See all */}
                          <button
                            onClick={handleSearchSubmit as React.MouseEventHandler}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
                              padding: "0.75rem 1rem", borderTop: `1px solid ${BORDER}`,
                              color: GREEN, fontFamily: F_SANS, fontSize: "0.8125rem", fontWeight: 600,
                              cursor: "pointer", background: "transparent", transition: "background 0.12s",
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <Search style={{ height: 13, width: 13 }} />
                            {isRtl ? `عرض جميع النتائج لـ "${debouncedQ}"` : `See all results for "${debouncedQ}"`}
                          </button>
                        </div>
                      )
                    ) : (
                      /* Recent + trending */
                      <div style={{ paddingBottom: "0.5rem" }}>
                        {recentSearches.length > 0 && (
                          <>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 1rem 0.3rem" }}>
                              <span style={{ fontFamily: F_SANS, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: DIMMED, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <Clock style={{ height: 11, width: 11 }} /> {isRtl ? "البحث السابق" : "Recent"}
                              </span>
                              <button onClick={clearRecent} style={{ fontFamily: F_SANS, fontSize: "11px", color: MUTED, cursor: "pointer", background: "none", border: "none" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = WHITE; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = MUTED; }}>
                                {isRtl ? "مسح الكل" : "Clear all"}
                              </button>
                            </div>
                            {recentSearches.map(s => (
                              <div key={s} style={{ display: "flex", alignItems: "center" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                <button onClick={() => setSearchQuery(s)} style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 1rem", background: "none", border: "none", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>
                                  <Clock style={{ height: 13, width: 13, color: DIMMED, flexShrink: 0 }} />
                                  <span style={{ fontFamily: F_SANS, fontSize: "0.8125rem", color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
                                </button>
                                <button onClick={() => removeRecent(s)} style={{ padding: "0.5rem 0.875rem", color: DIMMED, background: "none", border: "none", cursor: "pointer" }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = WHITE; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DIMMED; }}>
                                  <X style={{ height: 12, width: 12 }} />
                                </button>
                              </div>
                            ))}
                          </>
                        )}
                        {trending.length > 0 && (
                          <>
                            <div style={{ padding: "0.5rem 1rem 0.3rem", borderTop: recentSearches.length > 0 ? `1px solid ${BORDER}` : "none", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                              <TrendingUp style={{ height: 11, width: 11, color: DIMMED }} />
                              <span style={{ fontFamily: F_SANS, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: DIMMED, textTransform: "uppercase" }}>
                                {isRtl ? "الأكثر بحثاً" : "Popular"}
                              </span>
                            </div>
                            <div style={{ padding: "0 1rem 0.5rem", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                              {trending.slice(0, 8).map(tr => (
                                <button key={tr.query}
                                  onClick={() => { navigate(`/shop?q=${encodeURIComponent(tr.query)}`); setSearchOpen(false); setSearchQuery(""); }}
                                  style={{
                                    fontFamily: F_SANS, fontSize: "0.75rem", fontWeight: 500,
                                    padding: "0.25rem 0.75rem", borderRadius: 9999,
                                    background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`,
                                    color: "rgba(255,255,255,0.7)", cursor: "pointer", transition: "background 0.12s",
                                  }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = WHITE; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}>
                                  {tr.query}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── COL 3: Utilities + Auth ──────────────────────────────────── */}
            <div className="flex items-center shrink-0" style={{ gap: "0.5rem" }}>

              {/* Notifications */}
              {isAuthenticated && (
                <NotificationCenter btnClassName="h-9 w-9 flex items-center justify-center rounded-full bg-white/[0.09] hover:bg-white/[0.15] transition-colors text-white" />
              )}

              {/* Messages */}
              {isAuthenticated && !isCourier && (
                <Link
                  href={isAdmin ? "/admin/messages" : isSeller ? "/seller/messages" : "/messages"}
                  className="relative h-9 w-9 flex items-center justify-center rounded-full bg-white/[0.09] hover:bg-white/[0.15] transition-colors"
                  aria-label={t("nav.messages")}
                  style={{ color: WHITE }}
                >
                  <MessageCircle style={{ height: 16, width: 16 }} />
                  {unreadMsgs > 0 && (
                    <span style={{ position: "absolute", top: -2, insetInlineEnd: -2, minWidth: "1rem", height: "1rem", borderRadius: 9999, background: GREEN, color: WHITE, fontSize: "8px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {unreadMsgs > 9 ? "9+" : unreadMsgs}
                    </span>
                  )}
                </Link>
              )}

              {/* Wishlist */}
              {!isSeller && !isAdmin && !isCourier && (
                <Link href="/wishlist" aria-label={t("a11y.wishlist")} style={{ display: "block" }}>
                  <IconCapsule badge={wishlistCount} style={{ background: "rgba(255,255,255,0.09)" }} className="!bg-white/[0.09] hover:!bg-white !text-white hover:!text-[#0B0B0C]">
                    <Heart style={{ height: 15, width: 15 }} />
                  </IconCapsule>
                </Link>
              )}

              {/* Cart */}
              {!isSeller && !isAdmin && !isCourier && (
                <Link href="/cart" aria-label={t("a11y.openCart")} style={{ display: "block" }}>
                  <IconCapsule badge={visibleCart} style={{ background: "rgba(255,255,255,0.09)" }} className="!bg-white/[0.09] hover:!bg-white !text-white hover:!text-[#0B0B0C]">
                    <ShoppingCart style={{ height: 15, width: 15 }} />
                  </IconCapsule>
                </Link>
              )}

              {/* Settings dropdown (Theme / Language / Currency) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label={t("nav.settings")}
                    className="h-9 w-9 flex items-center justify-center rounded-full bg-white/[0.09] hover:bg-white/[0.15] transition-colors"
                    style={{ color: WHITE }}
                  >
                    <Settings style={{ height: 15, width: 15 }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="p-0 overflow-hidden rounded-2xl w-52 shadow-2xl"
                  style={dropStyle}>

                  {/* Theme */}
                  <div style={{ padding: "0.75rem 0.875rem 0.625rem" }}>
                    <p style={{ fontFamily: F_SANS, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: DIMMED, textTransform: "uppercase", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Sun style={{ height: 11, width: 11 }} /> {isRtl ? "المظهر" : "Theme"}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.25rem" }}>
                      {([
                        { val: "light" as const, ar: "فاتح",  en: "Light"  },
                        { val: "dark"  as const, ar: "داكن",  en: "Dark"   },
                        { val: "system"as const, ar: "تلقائي",en: "Auto"   },
                      ]).map(opt => (
                        <button key={opt.val} onClick={() => setTheme(opt.val)}
                          style={{
                            fontFamily: F_SANS, fontSize: "11px", fontWeight: 600,
                            padding: "0.375rem 0.25rem", borderRadius: 8, cursor: "pointer", border: "none",
                            background: theme === opt.val ? WHITE : "rgba(255,255,255,0.07)",
                            color: theme === opt.val ? BG : MUTED,
                            transition: "background 0.15s, color 0.15s",
                          }}
                          onMouseEnter={e => { if (theme !== opt.val) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = WHITE; }}}
                          onMouseLeave={e => { if (theme !== opt.val) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = MUTED; }}}>
                          {isRtl ? opt.ar : opt.en}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: 1, background: BORDER, margin: "0 0.875rem" }} />

                  {/* Language */}
                  <div style={{ padding: "0.625rem 0.875rem" }}>
                    <p style={{ fontFamily: F_SANS, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: DIMMED, textTransform: "uppercase", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Globe style={{ height: 11, width: 11 }} /> {isRtl ? "اللغة" : "Language"}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.25rem" }}>
                      {[{ val: "ar", label: "العربية" }, { val: "en", label: "English" }].map(opt => (
                        <button key={opt.val} onClick={() => switchLang(opt.val)}
                          style={{
                            fontFamily: F_SANS, fontSize: "11px", fontWeight: 600,
                            padding: "0.375rem 0.25rem", borderRadius: 8, cursor: "pointer", border: "none",
                            background: lang === opt.val ? WHITE : "rgba(255,255,255,0.07)",
                            color: lang === opt.val ? BG : MUTED,
                            transition: "background 0.15s, color 0.15s",
                          }}
                          onMouseEnter={e => { if (lang !== opt.val) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = WHITE; }}}
                          onMouseLeave={e => { if (lang !== opt.val) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = MUTED; }}}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: 1, background: BORDER, margin: "0 0.875rem" }} />

                  {/* Currency */}
                  <div style={{ padding: "0.625rem 0.875rem 0.875rem" }}>
                    <p style={{ fontFamily: F_SANS, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: DIMMED, textTransform: "uppercase", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <DollarSign style={{ height: 11, width: 11 }} /> {isRtl ? "العملة" : "Currency"}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.25rem" }}>
                      {([{ val: "SYP" as const, label: "ل.س SYP" }, { val: "USD" as const, label: "$ USD" }]).map(opt => (
                        <button key={opt.val} onClick={() => setCurrency(opt.val)}
                          style={{
                            fontFamily: F_SANS, fontSize: "11px", fontWeight: 600,
                            padding: "0.375rem 0.25rem", borderRadius: 8, cursor: "pointer", border: "none",
                            background: currency === opt.val ? WHITE : "rgba(255,255,255,0.07)",
                            color: currency === opt.val ? BG : MUTED,
                            transition: "background 0.15s, color 0.15s",
                          }}
                          onMouseEnter={e => { if (currency !== opt.val) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = WHITE; }}}
                          onMouseLeave={e => { if (currency !== opt.val) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = MUTED; }}}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: BORDER, flexShrink: 0 }} />

              {/* Auth */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        height: 36, padding: "0 0.875rem 0 0.375rem",
                        borderRadius: 9999,
                        background: "rgba(255,255,255,0.10)",
                        border: `1px solid ${BORDER}`,
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.borderColor = BORDER_H; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
                    >
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: WHITE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: F_NASKH, fontSize: "11px", fontWeight: 900, color: BG }}>
                          {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </span>
                      </div>
                      <span style={{ fontFamily: F_SANS, fontSize: "0.8125rem", fontWeight: 600, color: WHITE, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user?.name}
                      </span>
                      <ChevronDown style={{ height: 13, width: 13, color: MUTED }} />
                    </motion.button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} className="w-52 p-0 overflow-hidden rounded-2xl shadow-2xl" style={dropStyle}>
                    <div style={{ padding: "0.75rem 0.875rem", borderBottom: `1px solid ${BORDER}` }}>
                      <p style={{ fontFamily: F_SANS, fontSize: "0.8125rem", fontWeight: 700, color: WHITE }}>{user?.name}</p>
                      <p style={{ fontFamily: F_SANS, fontSize: "11px", color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} translate="no">{user?.email}</p>
                    </div>
                    <div style={{ padding: "0.25rem 0" }}>
                      <DropdownMenuItem asChild>
                        <Link href={isAdmin ? "/admin" : isSeller ? "/seller/dashboard" : isCourier ? "/courier" : "/customer/dashboard"}
                          className="flex items-center gap-2 cursor-pointer" style={{ fontFamily: F_SANS, fontSize: "0.8125rem", color: "rgba(255,255,255,0.8)", padding: "0.5rem 0.875rem" }}>
                          <LayoutDashboard style={{ height: 14, width: 14 }} /> {t("nav.dashboard")}
                        </Link>
                      </DropdownMenuItem>
                      {isCustomer && (
                        <DropdownMenuItem asChild>
                          <Link href="/orders" className="flex items-center gap-2 cursor-pointer" style={{ fontFamily: F_SANS, fontSize: "0.8125rem", color: "rgba(255,255,255,0.8)", padding: "0.5rem 0.875rem" }}>
                            <ClipboardList style={{ height: 14, width: 14 }} /> {t("nav.orders")}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isCustomer && (
                        <DropdownMenuItem asChild>
                          <Link href="/account" className="flex items-center gap-2 cursor-pointer" style={{ fontFamily: F_SANS, fontSize: "0.8125rem", color: "rgba(255,255,255,0.8)", padding: "0.5rem 0.875rem" }}>
                            <User style={{ height: 14, width: 14 }} /> {t("account.title")}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isSeller && sellerLinks.map(l => (
                        <DropdownMenuItem key={l.href} asChild>
                          <Link href={l.href} className="flex items-center gap-2 cursor-pointer" style={{ fontFamily: F_SANS, fontSize: "0.8125rem", color: "rgba(255,255,255,0.8)", padding: "0.5rem 0.875rem" }}>
                            <l.icon style={{ height: 14, width: 14 }} /> {l.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      {isAdmin && adminLinks.slice(0, 4).map(l => (
                        <DropdownMenuItem key={l.href} asChild>
                          <Link href={l.href} className="flex items-center gap-2 cursor-pointer" style={{ fontFamily: F_SANS, fontSize: "0.8125rem", color: "rgba(255,255,255,0.8)", padding: "0.5rem 0.875rem" }}>
                            <l.icon style={{ height: 14, width: 14 }} /> {l.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      {isCourier && (
                        <DropdownMenuItem asChild>
                          <Link href="/courier" className="flex items-center gap-2 cursor-pointer" style={{ fontFamily: F_SANS, fontSize: "0.8125rem", color: "rgba(255,255,255,0.8)", padding: "0.5rem 0.875rem" }}>
                            <Bike style={{ height: 14, width: 14 }} /> {isRtl ? "مساحة العمل" : "Workspace"}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator style={{ background: BORDER, margin: "0.25rem 0.875rem" }} />
                      <DropdownMenuItem onClick={logout} style={{ fontFamily: F_SANS, fontSize: "0.8125rem", color: "#f87171", padding: "0.5rem 0.875rem", cursor: "pointer" }}
                        className="focus:bg-red-500/10">
                        <LogOut style={{ height: 14, width: 14, marginInlineEnd: "0.5rem" }} /> {t("nav.logout")}
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <motion.button
                    onClick={openLogin}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      fontFamily: F_SANS, fontSize: "0.8125rem", fontWeight: 600,
                      padding: "0.45rem 1.1rem", borderRadius: 9999,
                      background: "rgba(255,255,255,0.10)", border: `1px solid ${BORDER}`,
                      color: WHITE, cursor: "pointer", whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.16)"; (e.currentTarget as HTMLElement).style.borderColor = BORDER_H; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}
                  >
                    {t("nav.login")}
                  </motion.button>
                  <motion.button
                    onClick={openRegister}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      fontFamily: F_SANS, fontSize: "0.8125rem", fontWeight: 700,
                      padding: "0.45rem 1.1rem", borderRadius: 9999,
                      background: WHITE, color: BG, cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {t("nav.register")}
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* ══ MOBILE DRAWER ════════════════════════════════════════════════ */}
          <SheetContent
            side={isRtl ? "right" : "left"}
            className="w-[min(300px,78vw)] p-0 flex flex-col"
            style={{ background: "#0C0C0E", borderColor: BORDER }}
            aria-describedby={undefined}
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>

            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: "2.5rem", paddingBottom: "1.75rem", borderBottom: `1px solid ${BORDER}`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "1.5rem", left: "50%", transform: "translateX(-50%)", height: 80, width: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)", filter: "blur(20px)", pointerEvents: "none" }} />
              <img src="/syano-logo.png" alt="Syano" width={56} height={56}
                style={{ position: "relative", height: 56, width: 56, objectFit: "contain", filter: "drop-shadow(0 0 16px rgba(255,255,255,0.12))" }} loading="eager" />
              <p style={{ fontFamily: F_NASKH, fontWeight: 900, letterSpacing: "0.28em", fontSize: "1.125rem", color: WHITE, marginTop: "0.75rem" }}>SYANO</p>
              <p style={{ fontFamily: F_SANS, fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", color: DIMMED, textTransform: "uppercase", marginTop: "0.25rem" }}>سوق سوريا</p>
            </div>

            {/* Nav links */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
              <MobLink href="/"                      icon={Home}        label={isRtl ? "الرئيسية" : "Home"}       loc={location} onClose={closeMobile} />
              <MobLink href="/shop"                  icon={Package}     label={isRtl ? "تسوق"      : "Shop"}       loc={location} onClose={closeMobile} />
              <MobLink href="/categories"            icon={Layers}      label={isRtl ? "الفئات"    : "Categories"} loc={location} onClose={closeMobile} />
              <MobLink href="/sellers/directory"     icon={Store}       label={isRtl ? "المتاجر"   : "Stores"}     loc={location} onClose={closeMobile} />
              <MobLink href="/shop?hasDiscount=true" icon={TrendingUp}  label={isRtl ? "العروض"    : "Deals"}      loc={location} onClose={closeMobile} />
              {isAdmin      && adminLinks.map(l   => <MobLink key={l.href} {...l} loc={location} onClose={closeMobile} />)}
              {isSeller     && sellerLinks.map(l  => <MobLink key={l.href} {...l} loc={location} onClose={closeMobile} />)}
              {isCourier    && <MobLink href="/courier"           icon={Bike}        label={isRtl ? "مساحة العمل" : "Workspace"} loc={location} onClose={closeMobile} />}
              {isCustomer   && customerLinks.map(l => <MobLink key={l.href} {...l} loc={location} onClose={closeMobile} />)}
              {isCustomer   && <MobLink href="/account"          icon={User}        label={t("account.title")} loc={location} onClose={closeMobile} />}
              {!isSeller && !isAdmin && !isCourier && <MobLink href="/cart"     icon={ShoppingCart} label={isRtl ? "السلة" : "Cart"}     loc={location} onClose={closeMobile} />}
              {!isSeller && !isAdmin && !isCourier && <MobLink href="/wishlist" icon={Heart}        label={isRtl ? "المفضلة" : "Wishlist"} loc={location} onClose={closeMobile} />}
              {isAuthenticated && !isCourier && (
                <MobLink
                  href={isAdmin ? "/admin/messages" : isSeller ? "/seller/messages" : "/messages"}
                  icon={MessageCircle}
                  label={isRtl ? "الرسائل" : "Messages"}
                  loc={location}
                  onClose={closeMobile}
                />
              )}
            </div>

            {/* Preferences */}
            <div style={{ padding: "0.75rem", borderTop: `1px solid ${BORDER}` }}>
              <p style={{ fontFamily: F_SANS, fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: DIMMED, textTransform: "uppercase", padding: "0.25rem 0.75rem 0.5rem" }}>
                {isRtl ? "التفضيلات" : "Preferences"}
              </p>
              {/* Language */}
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: "0.75rem", padding: "0.375rem 0.75rem", minHeight: 44 }}>
                <Globe style={{ height: 16, width: 16, color: DIMMED }} />
                <span style={{ fontFamily: F_SANS, fontSize: "0.875rem", fontWeight: 500, color: MUTED }}>{isRtl ? "اللغة" : "Language"}</span>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {["en", "ar"].map(l => (
                    <button key={l} onClick={() => switchLang(l)}
                      style={{ fontFamily: F_SANS, fontSize: "11px", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: 6, border: "none", cursor: "pointer", background: lang === l ? WHITE : "rgba(255,255,255,0.07)", color: lang === l ? BG : MUTED, transition: "background 0.15s" }}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              {/* Currency */}
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: "0.75rem", padding: "0.375rem 0.75rem", minHeight: 44 }}>
                <DollarSign style={{ height: 16, width: 16, color: DIMMED }} />
                <span style={{ fontFamily: F_SANS, fontSize: "0.875rem", fontWeight: 500, color: MUTED }}>{isRtl ? "العملة" : "Currency"}</span>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {(["USD", "SYP"] as const).map(c => (
                    <button key={c} onClick={() => setCurrency(c)}
                      style={{ fontFamily: F_SANS, fontSize: "11px", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: 6, border: "none", cursor: "pointer", background: currency === c ? WHITE : "rgba(255,255,255,0.07)", color: currency === c ? BG : MUTED, transition: "background 0.15s" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {/* Theme */}
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: "0.75rem", padding: "0.375rem 0.75rem", minHeight: 44 }}>
                {theme === "dark" ? <Moon style={{ height: 16, width: 16, color: DIMMED }} /> : <Sun style={{ height: 16, width: 16, color: DIMMED }} />}
                <span style={{ fontFamily: F_SANS, fontSize: "0.875rem", fontWeight: 500, color: MUTED }}>{isRtl ? "المظهر" : "Theme"}</span>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {(["light", "dark", "system"] as const).map(tm => (
                    <button key={tm} onClick={() => setTheme(tm)}
                      style={{ fontFamily: F_SANS, fontSize: "10px", fontWeight: 700, padding: "0.2rem 0.4rem", borderRadius: 6, border: "none", cursor: "pointer", background: theme === tm ? WHITE : "rgba(255,255,255,0.07)", color: theme === tm ? BG : MUTED, transition: "background 0.15s" }}>
                      {tm[0].toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Auth footer */}
            <div style={{ padding: "0.75rem", borderTop: `1px solid ${BORDER}` }}>
              {isAuthenticated ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem 0.75rem" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.10)", border: `1px solid ${BORDER_H}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: F_NASKH, fontSize: "14px", fontWeight: 900, color: WHITE }}>
                        {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: F_SANS, fontSize: "0.875rem", fontWeight: 600, color: WHITE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</p>
                      <p style={{ fontFamily: F_SANS, fontSize: "11px", color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} translate="no">{user?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { logout(); closeMobile(); }}
                    style={{ fontFamily: F_SANS, display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.625rem 0.75rem", borderRadius: 12, background: "none", border: "none", fontSize: "0.875rem", fontWeight: 600, color: "#f87171", cursor: "pointer", minHeight: 44, transition: "background 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}>
                    <LogOut style={{ height: 17, width: 17 }} />
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <button onClick={() => { closeMobile(); openLogin(); }}
                  style={{ fontFamily: F_SANS, fontWeight: 700, fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: 44, borderRadius: 12, background: WHITE, color: BG, border: "none", cursor: "pointer" }}>
                  {t("nav.login")}
                </button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* ══ MOBILE SEARCH OVERLAY (portal) ══════════════════════════════════ */}
        {searchOpen && createPortal(
          <>
            <style>{`
              @keyframes lnav-backdrop { from { opacity:0 } to { opacity:1 } }
              @keyframes lnav-panel    { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
              .lnav-backdrop { animation: lnav-backdrop 180ms ease forwards; }
              .lnav-panel    { animation: lnav-panel 180ms ease forwards; }
            `}</style>
            <div
              className="lnav-backdrop md:hidden fixed inset-0 z-[9999]"
              role="dialog" aria-modal="true" aria-label={isRtl ? "البحث" : "Search"}
              dir={isRtl ? "rtl" : "ltr"}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }} aria-hidden="true" />
              <div className="lnav-panel relative" style={{ background: "#0C0C0E", boxShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>
                <div aria-hidden="true" style={{ height: "env(safe-area-inset-top, 0px)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 0.75rem", height: "3.75rem" }}>
                  <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.08)", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "0 0.75rem", height: 40 }}>
                    <Search style={{ height: 15, width: 15, color: MUTED, flexShrink: 0 }} />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKD}
                      placeholder={isRtl ? "ابحث عن منتجات، متاجر..." : "Search products, stores..."}
                      style={{ fontFamily: F_SANS, fontSize: "0.875rem", flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: WHITE }}
                      autoFocus autoComplete="off" spellCheck={false}
                    />
                    {searchQuery && (
                      <button type="button" aria-label={t("a11y.close")} onClick={() => setSearchQuery("")}
                        style={{ color: MUTED, background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                        <X style={{ height: 14, width: 14 }} />
                      </button>
                    )}
                  </form>
                  <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    style={{ fontFamily: F_SANS, fontSize: "0.875rem", fontWeight: 600, color: MUTED, background: "none", border: "none", cursor: "pointer", minHeight: 44, padding: "0 0.25rem", display: "flex", alignItems: "center" }}>
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                </div>
                <div style={{ overflowY: "auto", maxHeight: "calc(85vh - 3.75rem)" }}>
                  {debouncedQ.length >= 2 ? (
                    searchLoading ? (
                      <div style={{ padding: "0.5rem 0" }}>
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem" }}>
                            <div style={{ height: 13, width: 13, borderRadius: "50%", background: BORDER }} />
                            <div style={{ height: 10, borderRadius: 6, background: BORDER, width: `${45 + i * 15}%` }} />
                          </div>
                        ))}
                      </div>
                    ) : (suggestions.suggestions?.length ?? 0) === 0 && (suggestions.stores?.length ?? 0) === 0 ? (
                      <div style={{ padding: "1.5rem", textAlign: "center", fontFamily: F_SANS, fontSize: "0.875rem", color: DIMMED }}>
                        {isRtl ? "لا توجد نتائج" : "No results found"}
                      </div>
                    ) : (
                      <>
                        {(suggestions.suggestions ?? []).slice(0, 6).map((s, i) => {
                          const text = isRtl && s.textAr ? s.textAr : s.text;
                          return (
                            <button key={i} onClick={() => handleSuggClick(text)}
                              style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "none", border: "none", cursor: "pointer", textAlign: isRtl ? "right" : "left", transition: "background 0.12s" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}>
                              <Search style={{ height: 14, width: 14, color: DIMMED, flexShrink: 0 }} />
                              <span style={{ fontFamily: F_SANS, fontSize: "0.875rem", color: "rgba(255,255,255,0.8)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
                            </button>
                          );
                        })}
                        <button onClick={handleSearchSubmit as React.MouseEventHandler}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.875rem 1rem", borderTop: `1px solid ${BORDER}`, background: "none", border: "none", borderTopColor: BORDER, borderTopWidth: 1, borderTopStyle: "solid", color: GREEN, fontFamily: F_SANS, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                          <Search style={{ height: 14, width: 14 }} />
                          {isRtl ? `عرض النتائج لـ "${debouncedQ}"` : `See results for "${debouncedQ}"`}
                        </button>
                      </>
                    )
                  ) : (
                    <>
                      {recentSearches.length > 0 && (
                        <>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1rem 0.375rem" }}>
                            <span style={{ fontFamily: F_SANS, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: DIMMED, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <Clock style={{ height: 12, width: 12 }} /> {isRtl ? "البحث السابق" : "Recent searches"}
                            </span>
                            <button onClick={clearRecent} style={{ fontFamily: F_SANS, fontSize: "12px", color: MUTED, background: "none", border: "none", cursor: "pointer" }}>
                              {isRtl ? "مسح الكل" : "Clear all"}
                            </button>
                          </div>
                          {recentSearches.map(s => (
                            <div key={s} style={{ display: "flex", alignItems: "center" }}>
                              <button onClick={() => setSearchQuery(s)}
                                style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 1rem", background: "none", border: "none", cursor: "pointer", textAlign: isRtl ? "right" : "left" }}>
                                <Clock style={{ height: 14, width: 14, color: DIMMED, flexShrink: 0 }} />
                                <span style={{ fontFamily: F_SANS, fontSize: "0.875rem", color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
                              </button>
                              <button onClick={() => removeRecent(s)} style={{ padding: "0.625rem 1rem", color: DIMMED, background: "none", border: "none", cursor: "pointer" }}>
                                <X style={{ height: 13, width: 13 }} />
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                      {trending.length > 0 && (
                        <>
                          <div style={{ padding: "0.75rem 1rem 0.375rem", borderTop: recentSearches.length > 0 ? `1px solid ${BORDER}` : "none", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                            <TrendingUp style={{ height: 12, width: 12, color: DIMMED }} />
                            <span style={{ fontFamily: F_SANS, fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: DIMMED, textTransform: "uppercase" }}>
                              {isRtl ? "الأكثر بحثاً" : "Popular searches"}
                            </span>
                          </div>
                          <div style={{ padding: "0 1rem 1rem", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                            {trending.slice(0, 10).map(tr => (
                              <button key={tr.query}
                                onClick={() => { navigate(`/shop?q=${encodeURIComponent(tr.query)}`); setSearchOpen(false); setSearchQuery(""); }}
                                style={{ fontFamily: F_SANS, fontSize: "0.8125rem", fontWeight: 500, padding: "0.3rem 0.875rem", borderRadius: 9999, background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
                                {tr.query}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
      </header>

      {/* Location modal */}
      <LocationMapModal open={locationModalOpen} onClose={() => setLocationModalOpen(false)} />
    </>
  );
}
