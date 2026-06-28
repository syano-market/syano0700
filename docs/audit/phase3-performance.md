# Phase 3 — Performance Audit

**Date:** 2026-06-28  
**Scope:** `artifacts/marketplace/src/` · `artifacts/api-server/src/lib/searchCache.ts` · `artifacts/mobile/app/` · `artifacts/mobile/src/`  
**Method:** All findings verified by reading source files. Patterns not directly observed are not reported.

> **Global staleTime note:** `App.tsx` configures `QueryClient` with `staleTime: 5 * 60 * 1000` (5 min) as the global default. All `useQuery` calls that do not set their own `staleTime` inherit this value. For most data this is correct. Findings below only flag cases where the inherited 5-min value is a real problem given what the data represents.

---

## Summary

| Task | Findings | High | Medium | Low |
|------|----------|------|--------|-----|
| Re-render Causes | 4 | 2 | 2 | 0 |
| TanStack Query | 3 | 1 | 2 | 0 |
| Bundle Bloat | 0 | 0 | 0 | 0 |
| Search Performance | 1 | 0 | 0 | 1 |
| Mobile Performance | 3 | 1 | 1 | 1 |
| **TOTAL** | **11** | **4** | **5** | **2** |

---

## Top 5 Highest Impact Fixes

1. **`LocationContext.Provider` creates a new value object every render** — every component consuming `useLocation()` re-renders on every `LocationProvider` parent render, regardless of whether location data changed. Affects Navbar, checkout, search, courier workspace simultaneously.

2. **`TrendingCard` is not wrapped in `React.memo`** — used on the homepage in grids of 10–50+ cards. Any state change in the parent (search input, filter toggle, notification badge) re-renders every card. `ProductCard` is correctly memoized; `TrendingCard` is not.

3. **Courier workspace real-time queries inherit 5-min `staleTime`** — `["mission-offers"]` and `["courier-assignments"]` at `courier/workspace.tsx` have no local `staleTime` override and inherit the 5-min global. A courier may miss a mission offer for up to 5 minutes if they have the tab open. These queries need `staleTime: 0` or a very short interval.

4. **`ScrollView` + `.map()` over product arrays on mobile** — three product sections in `(tabs)/index.tsx` render all items simultaneously inside a `ScrollView`. On a device with 42 products this means up to 126 product cards mounted and kept in memory at once.

5. **`usePatchSellerReviewReply` mutation has no cache invalidation** — after a seller successfully posts a review reply, the reviews list is not invalidated. The UI continues showing the old (pre-reply) state until the user navigates away and back.

---

## Task 1 — Re-render Causes

---
TYPE: CONTEXT_VALUE
FILE: artifacts/marketplace/src/contexts/LocationContext.tsx
LINE: 86–88
CODE: <LocationContext.Provider value={{ location, setZoneName }}>
ISSUE: Inline object literal `{{ location, setZoneName }}` creates a new reference on
       every render of LocationProvider. Every consumer of useLocation() re-renders
       even when location has not changed.
IMPACT: HIGH — LocationContext is consumed in Navbar, checkout, courier workspace,
        search page, and map components simultaneously.
FIX_DIRECTION: const value = useMemo(() => ({ location, setZoneName }), [location, setZoneName]);
               <LocationContext.Provider value={value}>
PRIORITY: HIGH
---

---
TYPE: MISSING_MEMO
FILE: artifacts/marketplace/src/components/TrendingCard.tsx
LINE: 54
CODE: export function TrendingCard({ product, ... }) { ... }
ISSUE: TrendingCard is NOT wrapped in React.memo. ProductCard (the other grid
       component) IS correctly memoized at line 48. TrendingCard is used on the
       homepage in grids of 10–50+ items. Any parent state change (notification
       count, search input, currency selector) triggers a full re-render of every
       card in the trending grid.
IMPACT: HIGH — homepage is the most-visited page; trending grids are always mounted.
FIX_DIRECTION: export const TrendingCard = React.memo(function TrendingCard(...) { ... });
               Ensure all props are stable (primitives or memoized objects).
PRIORITY: HIGH
---

---
TYPE: MISSING_MEMO
FILE: artifacts/marketplace/src/components/HomeSections/FeaturedDeals.tsx
LINE: 56
CODE: function DealCard({ deal, i }) { ... }
ISSUE: DealCard is a local function inside FeaturedDeals — not wrapped in React.memo.
       FeaturedDeals contains a countdown timer that fires a state update every second
       (to update h/m/s). Every second this causes every DealCard to re-render even
       though deal data has not changed.
IMPACT: MEDIUM — one re-render per second × N deal cards while the deals section is
        visible. On low-end devices common in the target market (Syria/Aleppo) this
        adds measurable main-thread pressure.
FIX_DIRECTION: Extract DealCard outside FeaturedDeals function scope and wrap in
               React.memo. Pass only primitive deal fields as props to keep
               memo comparison cheap.
PRIORITY: MEDIUM
---

---
TYPE: INLINE_ARRAY
FILE: artifacts/marketplace/src/components/TrendingCard.tsx
LINE: 233
CODE: {[...Array(5)].map((_, j) => <StarIcon key={j} ... />)}
ISSUE: Creates a new 5-element array on every render of every TrendingCard.
       Combined with the MISSING_MEMO issue above, this runs on every parent
       state change for every card in the grid.
IMPACT: MEDIUM — minor allocations per card, but multiplied by 40+ cards and
        frequent parent re-renders adds up in product grids.
FIX_DIRECTION: const STAR_INDICES = [0, 1, 2, 3, 4]; // module-level constant
               {STAR_INDICES.map(j => <StarIcon key={j} ... />)}
PRIORITY: MEDIUM
---

**Context providers verified OPTIMIZED (no changes needed):**
- `AuthContext.tsx` — uses `useMemo` ✅
- `CurrencyContext.tsx` — uses `useMemo` ✅
- `GuestCartContext.tsx` — uses `useMemo` ✅
- `WishlistContext.tsx` — uses `useMemo` ✅

**List item memoization verified:**
- `ProductCard.tsx` — `React.memo` at line 48 ✅
- `TrendingCard.tsx` — **NOT memoized** ❌ (see finding above)

---

## Task 2 — TanStack Query Patterns

**No HOOK_IN_LOOP violations found.** All `useQuery` calls are at the top level of components/hooks.  
**No DUPLICATE_KEY cache collisions found.** Shared keys like `["courier-profile"]` across workspace/profile/dashboard are intentional cache-sharing (same endpoint, same data) — this is correct.

---
TYPE: MISSING_STALETIME
FILE: artifacts/marketplace/src/pages/courier/workspace.tsx
LINE: 894 (mission-offers) · 886 (courier-assignments) · 910 (courier-trail)
CODE: useQuery({ queryKey: ["mission-offers"], queryFn: ... })
      useQuery({ queryKey: ["courier-assignments"], queryFn: ... })
      useQuery({ queryKey: ["courier-trail"], queryFn: ... })
ISSUE: These queries inherit the global 5-min staleTime. Courier workspace is a
       real-time operational view. A courier who keeps the tab open will not see
       new mission offers for up to 5 minutes after they appear. Missed offers
       cannot be recovered — they expire.
IMPACT: HIGH — directly affects courier revenue and order fulfillment rate.
FIX_DIRECTION: Add staleTime: 0 (always refetch on focus) and a short
               refetchInterval (e.g. 15_000) on mission-offers and assignments.
               Alternatively, invalidate these keys when the SSE notification
               stream fires a relevant event.
PRIORITY: HIGH
---

---
TYPE: MISSING_INVALIDATE
FILE: artifacts/marketplace/src/pages/seller/reviews.tsx
LINE: 57 (usePatchSellerReviewReply mutation)
CODE: usePatchSellerReviewReply({ onSuccess: () => toast(...) })
ISSUE: The mutation's onSuccess only shows a toast notification. It does NOT call
       queryClient.invalidateQueries() for the seller reviews query. After a seller
       posts a reply, the review card in the UI continues showing "No reply yet"
       until the user hard-navigates away and back.
IMPACT: MEDIUM — sellers see stale reviews immediately after replying; confusing UX.
FIX_DIRECTION: onSuccess: () => {
                 toast(...);
                 queryClient.invalidateQueries({ queryKey: ["seller-reviews"] });
               }
PRIORITY: MEDIUM
---

---
TYPE: MISSING_ERROR_HANDLING
FILE: Multiple files
AFFECTED:
  - hooks/useNotifications.ts (lines 49, 61) — no error state; badge silently shows nothing
  - components/AdminLayout.tsx (line 123) — admin sidebar badges fail silently
  - pages/seller/products/index.tsx (line 60) — quality report fails silently
  - pages/courier/workspace.tsx (multiple queries) — courier sees blank workspace on failure
  - pages/courier/dashboard.tsx (multiple queries) — dashboard fails silently
ISSUE: useQuery calls in these files destructure only `data` from the query result.
       When the network request fails (common on mobile in Aleppo), the user sees
       a blank/empty state with no explanation. isError / error are not checked.
IMPACT: MEDIUM — silent failures create confusion, especially on the courier workspace
        where an error means no assignments are visible.
FIX_DIRECTION: Destructure error and isError from useQuery result:
               const { data, isError, error } = useQuery(...)
               if (isError) return <ErrorMessage message={error?.message} />
               Highest priority: courier/workspace.tsx and AdminLayout.tsx.
PRIORITY: MEDIUM
---

**Verified CORRECT — mutations that do invalidate cache:**
- `seller/apply.tsx` — `submitMutation` invalidates seller-application ✅
- `courier/wallet.tsx` — `submitPayout` invalidates courier-wallet + courier-payouts ✅
- `admin/verification.tsx` — verify/unverify invalidate admin-sellers ✅
- `admin/settings.tsx` — updateMutation invalidates admin-settings ✅
- `admin/sellers.tsx` — reviewMutation invalidates admin-sellers + seller-applications ✅
- `admin/hero-banners.tsx` — toggle/reorder/delete all invalidate admin-banners ✅
- `admin/courier-payouts.tsx` — approve/reject invalidate admin-courier-payouts ✅
- `pages/seller/products/index.tsx` — `useDeleteProduct` invalidates correctly ✅
- `pages/cart.tsx` — `useUpdateCartItem` invalidates cart ✅

---

## Task 3 — Bundle Bloat

**All four checks PASS. No findings.**

| Check | Status | Evidence |
|-------|--------|----------|
| Barrel imports | ✅ PASS | No `index.ts`/`index.tsx` barrel file exists in `src/components/` or `src/hooks/`. All imports are direct per-file. |
| Full library imports | ✅ PASS | `lodash` not used. `moment` not used. `lucide-react` used with destructured named imports throughout (e.g. `import { Heart, ShoppingCart } from "lucide-react"`). No `import * as` found. |
| Lazy loading | ✅ PASS | All pages use `lazy()` in App.tsx. The one eager import (`LuxuryLandingPage`) is intentional and documented — it is the primary LCP-critical landing page. All admin/seller/courier pages verified as lazy. |
| Static image imports | ✅ PASS | No `import foo from '*.png'` or similar found in `src/`. Images use `import.meta.env.BASE_URL` path strings or public URL references. |

---

## Task 4 — Search Performance

**Search cache verified CORRECT.**

`artifacts/api-server/src/services/searchCache.ts`:
- `MAX_SIZE = 500` ✅ (matches documentation)
- LRU implemented with **Map + doubly-linked list** (O(1) get, set, eviction) ✅
- Not replaced with a plain Map or simple array ✅
- Variable TTLs: TTL_NORMAL (5 min), TTL_SALE (1 min), TTL_FALLBACK_L4 (10 min) ✅

**Search debounce verified:**
- `pages/search/index.tsx` — `useDebounce(query, 350)` ✅ (exceeds 300ms minimum)
- `components/Navbar.tsx` — `useDebounce(searchQuery, 200)` — **200ms is below the 300ms minimum** (see finding below)

---
TYPE: MISSING_DEBOUNCE
FILE: artifacts/marketplace/src/components/Navbar.tsx
LINE: 110
CODE: const debouncedSearch = useDebounce(searchQuery, 200);
ISSUE: The navbar search overlay debounces at 200ms, below the recommended 300ms
       minimum. On every keystroke that fires within 200ms of the previous one,
       a request to GET /api/search/suggestions is triggered, passing through
       the 13-step NLP pipeline. Fast typists (especially Arabic RTL input which
       often involves character composition) can trigger 5–8 requests per word.
IMPACT: LOW — suggestions, not full results; the NLP cache (LRU 500) absorbs
        repeated identical queries. Borderline: may cause perceptible API load
        on slow connections.
FIX_DIRECTION: Change 200 → 300 in useDebounce(searchQuery, 200)
               Also consider useDeferredValue from React 19 as an alternative
               that defers without blocking the input field itself.
PRIORITY: LOW
---

**Note — `use-search.ts` correctly has no internal debounce.** It expects the caller to pass a pre-debounced string. Both callers (Navbar and SearchPage) do pass a debounced string. The pattern is correct; only the delay value on the Navbar side is below threshold.

---

## Task 5 — Mobile Performance

---
TYPE: SCROLLVIEW_INSTEAD_FLATLIST
FILE: artifacts/mobile/app/(tabs)/index.tsx
LINE: 504 · 793 · 856
CODE: Line 504:  {deals.map((p) => <DealMiniCard ... />)}
      Line 793:  {items.map((p) => <DealMiniCard ... />)}
      Line 856:  {rest.map((p)  => <DealMiniCard ... />)}
ISSUE: Three product sections use .map() inside a ScrollView. ScrollView renders
       ALL items immediately and keeps them in memory. With 42 products across
       three sections, up to 126 DealMiniCard instances may be mounted simultaneously.
       FlatList with numColumns={2} would virtualize rows, keeping only visible
       cards mounted.
IMPACT: HIGH — on low-end Android devices (common in the target market), this causes
        slow initial render and elevated memory usage; risk of OOM on older hardware.
FIX_DIRECTION: Replace .map() sections with <FlatList data={deals} keyExtractor={(p) => String(p.id)}
                 renderItem={({item}) => <DealMiniCard product={item} />}
                 numColumns={2} scrollEnabled={false} />
               (scrollEnabled={false} because the FlatList sits inside the outer ScrollView)
PRIORITY: HIGH
---

---
TYPE: MISSING_MEMO
FILE: artifacts/mobile/app/(tabs)/orders.tsx
LINE: 73
CODE: const filtered = orders.filter(o => o.status === activeTab);
ISSUE: `filtered` is recomputed on every render without useMemo. The orders screen
       re-renders on every tab press. On 100+ order histories this is wasteful.
IMPACT: LOW — orders.filter is fast for typical list sizes. Low priority but
        straightforward to fix.
FIX_DIRECTION: const filtered = useMemo(
                 () => orders.filter(o => o.status === activeTab),
                 [orders, activeTab]
               );
PRIORITY: LOW
---

---
TYPE: MISSING_EXPO_IMAGE
FILE: artifacts/mobile/app/(tabs)/index.tsx · product/[id].tsx · components/ProductCard.tsx · components/OrderCard.tsx
LINE: Multiple
CODE: import { Image } from 'react-native';
      <Image source={{ uri: product.imageUrl }} ... />
ISSUE: Standard react-native `Image` has no built-in disk cache. Every scroll that
       offscreens and re-enters a product image triggers a network re-fetch.
       expo-image provides disk caching, memory caching, blurhash placeholders,
       and faster decode via expo's native pipeline — all drop-in compatible with
       Expo 54.
IMPACT: MEDIUM — noticeable on product grids and product detail page on slower
        Syrian mobile networks. expo-image would eliminate re-fetching already-seen
        images.
FIX_DIRECTION: pnpm add expo-image (in artifacts/mobile)
               Replace: import { Image } from 'react-native'
               With:    import { Image } from 'expo-image'
               All other props (source, style, resizeMode) are compatible.
               Add blurhash prop for smoother skeleton transitions.
PRIORITY: MEDIUM
---

**Verified CORRECT — mobile list patterns:**
- `(tabs)/orders.tsx:181` — FlatList with `keyExtractor={(item) => String(item.id)}` ✅
- `(tabs)/cart.tsx:148` — FlatList with `keyExtractor={(item) => String(item.id)}` ✅
- `(tabs)/notifications.tsx:189` — FlatList with `keyExtractor={(item) => item.id}` ✅
- `product/[id].tsx:402` — FlatList with `keyExtractor={(_, i) => String(i)}` ✅
- `components/ProductCard` — wrapped in `React.memo` ✅
- `components/OrderCard` — wrapped in `React.memo` ✅
- No `JSON.parse` in component render body (only inside `useEffect` or initialization) ✅
