# Phase 5 — Mobile Parity Audit

**Audited:** 2026-06-28  
**Auditor:** Agent (read-only scan — no files modified, no commands run)  
**Scope:** `artifacts/mobile/app/`, `artifacts/mobile/src/`, `artifacts/marketplace/src/App.tsx`, `artifacts/mobile/src/i18n/index.ts`

---

## Summary

| Task | Web | Mobile | Gaps |
|---|---|---|---|
| Screen Count | 75 operational routes | ~50 distinct screens | 18 operationally significant missing, 13 marketing/info missing |
| Feature Gaps | 5 screens compared | 4 fully matching | 1 partial (hero banners hardcoded) |
| API Consistency | Shared hooks via @workspace/api-client-react | Mostly consistent | 1 gap (hero banners not fetched from API) |
| UX Anti-patterns | — | 3 found | 2 broken navigation, 1 hardcoded string |
| i18n Parity | ~2000+ keys | ~2006 lines, comprehensive | 1 hardcoded string, RTL not using I18nManager |

---

## Missing Screens — Operationally Significant (❌)

These are working features on web that have no mobile screen at all:

| Web Route | Description | Impact |
|---|---|---|
| `/seller/inventory` | Stock level management per product | Sellers cannot manage inventory on mobile |
| `/seller/messages` | Seller-specific message inbox | Sellers must use general messages tab (OK for reading, not role-filtered) |
| `/courier/earnings` | Courier earnings breakdown | Couriers cannot see earnings on mobile |
| `/courier/performance` | Delivery performance stats | Couriers cannot review performance on mobile |
| `/courier/wallet` | Courier wallet + payout requests | Couriers cannot request payouts on mobile |
| `/admin/logs` | Audit log viewer | Admins cannot review audit logs on mobile |
| `/admin/settings` | Platform settings (exchange rate, flash sale) | Admins cannot change settings on mobile |
| `/admin/analytics` | Order/user analytics dashboard | Admins cannot view analytics on mobile |
| `/admin/search-analytics` | Search query analytics | Admins cannot view search analytics on mobile |
| `/admin/delivery` | Full delivery management hub | Admins only have `/admin/delivery-missions` on mobile |
| `/admin/courier-availability` | Courier availability toggle panel | Admins cannot manage courier availability on mobile |
| `/admin/courier-locations` | Live courier location map | Admins cannot view courier map on mobile |
| `/admin/tracking-monitor` | Tracking session monitor | Admins cannot monitor tracking on mobile |
| `/admin/routing` | OSRM routing diagnostics | Admins cannot run routing diagnostics on mobile |
| `/admin/dispatch-center` | Mission dispatch UI | Admins cannot dispatch missions on mobile |
| `/admin/messages` | Admin message management | Admins cannot manage messages on mobile |
| `/admin/courier-payouts` | Courier payout approval | Admins cannot approve payouts on mobile |
| `/admin/courier-applications/:id` | Individual application detail | Only the list exists; detail view is missing |

---

## Missing Screens — Informational/Marketing (❌ — lower priority)

These are static/marketing pages. Mobile omission is lower severity.

| Web Route | Mobile Status |
|---|---|
| `/about/story` | ❌ Missing (`about.tsx` covers only the main about page) |
| `/about/team` | ❌ Missing |
| `/seller/how-to-sell` | ❌ Missing |
| `/seller/terms` | ❌ Missing |
| `/seller/center` | ❌ Missing |
| `/seller/commission` | ❌ Missing |
| `/seller/faq` | ❌ Missing |
| `/shipping` | ❌ Missing |
| `/shipping/nationwide` | ❌ Missing |
| `/payment-methods` | ❌ Missing |
| `/syano-guarantee` | ❌ Missing |
| `/loyalty` | ❌ Missing |
| `/sellers/directory` | ⚠️ Covered by `/stores` |

---

## Task 1 — Screen Inventory

### Complete Route Comparison

| Web Route | Mobile Screen File | Status |
|---|---|---|
| `/` | `(tabs)/index.tsx` | ✅ |
| `/login` | `(auth)/login.tsx` | ✅ |
| `/register` | `(auth)/register.tsx` | ✅ |
| `/verify` | `verify.tsx` | ✅ |
| `/forgot-password` | `(auth)/forgot-password.tsx` | ✅ |
| `/shop` + `/search` + `/products` | `(tabs)/index.tsx` (search bar inline) | ✅ |
| `/categories` | `categories.tsx` | ✅ |
| `/products/:id` | `product/[id].tsx` | ✅ |
| `/cart` | `(tabs)/cart.tsx` | ✅ |
| `/checkout` | `checkout.tsx` | ✅ |
| `/orders` | `(tabs)/orders.tsx` | ✅ |
| `/orders/:id` | `order/[id].tsx` | ✅ |
| `/customer/dashboard` | `customer-dashboard.tsx` | ✅ |
| `/account` | `(tabs)/profile.tsx` + `settings.tsx` | ✅ |
| `/messages` | `(tabs)/messages.tsx` | ✅ |
| `/support` | `support.tsx` | ✅ |
| `/wishlist` | `(tabs)/wishlist.tsx` | ✅ |
| `/store/:slug` | `store/[slug].tsx` | ✅ |
| `/stores` + `/sellers/directory` | `stores/index.tsx` | ✅ |
| `/tracking/:missionId` | `tracking/[missionId].tsx` | ✅ |
| `/account-suspended` | `account-suspended.tsx` | ✅ |
| `/privacy-policy` | `privacy-policy.tsx` | ✅ |
| `/terms-of-use` | `terms.tsx` | ✅ |
| `/returns-policy` | `returns.tsx` | ✅ |
| `/cookies` | `cookies.tsx` | ✅ |
| `/contact` | `contact.tsx` | ✅ |
| `/help` | `help.tsx` | ✅ |
| `/about` | `about.tsx` | ✅ |
| `/seller/apply` | `seller-apply.tsx` | ✅ |
| `/seller/application-status` | `seller-application-status.tsx` | ✅ |
| `/seller/dashboard` | `(tabs)/index.tsx` (isSeller branch) | ⚠️ Partial — not a dedicated route |
| `/seller/products` | `seller/products.tsx` | ✅ |
| `/seller/products/new` | `seller/products/new.tsx` | ✅ |
| `/seller/products/:id/edit` | `seller/products/[id]/edit.tsx` | ✅ |
| `/seller/orders` | `seller/orders.tsx` | ✅ |
| `/seller/orders/:id` | `seller/orders/[id].tsx` | ✅ |
| `/seller/analytics` | `seller/analytics.tsx` | ✅ |
| `/seller/reviews` | `seller/reviews.tsx` | ✅ |
| `/seller/store-settings` | `seller/store-settings.tsx` | ✅ |
| `/seller/trust` | `seller/trust.tsx` | ✅ |
| `/seller/inventory` | — | ❌ Missing |
| `/seller/messages` | — | ❌ Missing |
| `/courier/apply` | `courier-apply.tsx` | ✅ |
| `/courier/application-status` | `courier-application-status.tsx` | ✅ |
| `/courier` (workspace) | `(courier-tabs)/workspace.tsx` | ✅ |
| `/courier/dashboard` | `courier/dashboard.tsx` (legacy) | ✅ |
| `/courier/history` | `(courier-tabs)/history.tsx` | ✅ |
| `/courier/profile` | `(courier-tabs)/profile.tsx` | ✅ |
| `/courier/earnings` | — | ❌ Missing |
| `/courier/performance` | — | ❌ Missing |
| `/courier/wallet` | — | ❌ Missing |
| `/admin` | `admin/index.tsx` | ✅ |
| `/admin/users` | `admin/users.tsx` | ✅ |
| `/admin/orders` | `admin/orders.tsx` | ✅ |
| `/admin/sellers` | `admin/sellers.tsx` | ✅ |
| `/admin/courier-applications` | `admin/courier-applications.tsx` | ✅ |
| `/admin/courier-applications/:id` | — | ❌ Missing (only list) |
| `/admin/delivery-missions` | `admin/delivery-missions.tsx` | ✅ |
| `/admin/hero-banners` | `admin/hero-banners.tsx` | ✅ |
| `/admin/support` | `admin/support.tsx` | ✅ |
| `/admin/verification` | `admin/verification.tsx` | ✅ |
| `/admin/logs` | — | ❌ Missing |
| `/admin/settings` | — | ❌ Missing |
| `/admin/analytics` | — | ❌ Missing |
| `/admin/search-analytics` | — | ❌ Missing |
| `/admin/delivery` | — | ❌ Missing |
| `/admin/courier-availability` | — | ❌ Missing |
| `/admin/courier-locations` | — | ❌ Missing |
| `/admin/tracking-monitor` | — | ❌ Missing |
| `/admin/routing` | — | ❌ Missing |
| `/admin/dispatch-center` | — | ❌ Missing |
| `/admin/messages` | — | ❌ Missing |
| `/admin/courier-payouts` | — | ❌ Missing |

**Totals:** 75 operational web routes · ~50 distinct mobile screens · 18 operationally significant gaps

---

## Task 2 — Feature Gaps

### A) Home Screen (`/` ↔ `(tabs)/index.tsx`)

| Feature | Web | Mobile | Notes |
|---|---|---|---|
| Product grid | ✅ | ✅ | `useListProducts` + `FlatList` with `ProductCard` |
| Category browsing | ✅ | ✅ | `useListCategories` + `HeroBannerSection` |
| Hero banners (admin-driven) | ✅ | ❌ | **Gap — see below** |
| Search bar | ✅ | ✅ | Inline search with autocomplete in `CustomerShop` |
| Sort options | ✅ | ✅ | `MOBILE_SORT_LABELS` (newest, price asc/desc, top rated) |

---
SCREEN: Home  
FEATURE: Hero banners not fetched from admin API  
WEB: ✅ Dynamic banners managed via `/admin/hero-banners` → `GET /api/hero-banners`  
MOBILE: ❌ Hardcoded static Pexels images (`HERO_IMAGES` array at `(tabs)/index.tsx:119–125`)  
IMPACT: Admin-created hero banners are invisible on mobile; promotions and featured content set in the admin panel do not reach mobile users  
PRIORITY: HIGH  

---

### B) Product Detail (`/products/:id` ↔ `product/[id].tsx`)

| Feature | Web | Mobile | Notes |
|---|---|---|---|
| Product images (gallery) | ✅ | ✅ | `galleryImages` from `imageUrl` + `imageUrls[]` |
| Add to cart | ✅ | ✅ | `useAddToCart` |
| Variants (color/size selection) | ✅ | ✅ | Full variant resolution, option availability check |
| Reviews section | ✅ | ✅ | `useListReviews` |
| Seller info | ✅ | ✅ | `useGetStorePreview`, "View Store" link |
| Related products | ✅ | ✅ | `useListProducts({category})` filtered by category |
| Message seller | ✅ | ✅ | `useStartConversation` |
| Recently viewed | ✅ | ✅ | `AsyncStorage` `syano_recently_viewed` |

**Result: Full parity on product detail.**

---

### C) Cart (`/cart` ↔ `(tabs)/cart.tsx`)

| Feature | Web | Mobile | Notes |
|---|---|---|---|
| Item list | ✅ | ✅ | `useGetCart` |
| Quantity adjust | ✅ | ✅ | `useUpdateCartItem` |
| Remove item | ✅ | ✅ | `useRemoveFromCart` |
| Clear cart | ✅ | ✅ | `useClearCart` |
| Total calculation | ✅ | ✅ | i18n keys: `cart.subtotal`, `cart.total` |
| Checkout button | ✅ | ✅ | `router.push("/checkout")` |
| Seller account placeholder | ✅ | ✅ | `isSeller` branch shows `SellerProductsPlaceholder` |

**Result: Full parity on cart.**

---

### D) Seller Dashboard (`/seller/dashboard` ↔ `(tabs)/index.tsx` isSeller branch)

| Feature | Web | Mobile | Notes |
|---|---|---|---|
| Revenue stats | ✅ | ✅ | `useGetSellerDashboard` imported in `(tabs)/index.tsx` |
| Order count | ✅ | ✅ | Part of seller dashboard data |
| Recent orders list | ✅ | ✅ | `profile.recent_orders` key present in mobile i18n |
| Low stock warnings | ✅ | ✅ | `profile.low_stock` key in mobile i18n |
| Product management link | ✅ | ✅ | `router.push("/seller/products")` in profile tab |

**Result: Functionally covered, but implementation note:**
The seller dashboard is not a dedicated route on mobile — it is the home tab's alternate render branch (`isSeller ? <SellerDashboard /> : <CustomerShop />`). This means a seller user never sees the customer home screen (no discovery). This is intentional design but different from the web where `/seller/dashboard` and `/` are separate routes and sellers can browse as customers.

---

### E) Courier Workspace (`/courier` ↔ `(courier-tabs)/workspace.tsx`)

| Feature | Web | Mobile | Notes |
|---|---|---|---|
| Active mission display | ✅ | ✅ | `Assignment` type with full mission data |
| Mission offers (accept/reject) | ✅ | ✅ | `MissionOffer` type, offer handling present |
| Map | ✅ (Leaflet) | ⚠️ WebView | Mobile uses `react-native-webview` — acceptable, intentional |
| Navigation to address | ✅ | ✅ | `Linking.openURL` for external navigation |
| Status updates (picked up, delivered) | ✅ | ✅ | Status state machine in workspace |
| Wallet balance display | ✅ | ✅ | `walletBalance` in `CourierProfile` type |
| Location reporting | ✅ | ✅ | `useLocationReporting` hook |

**Result: Near-full parity. Maps via WebView is acceptable per project design.**

---

## Task 3 — API Consistency

SYANO uses a shared `@workspace/api-client-react` hook library. All mobile screens that have web equivalents import the identical hooks (`useGetProduct`, `useListProducts`, `useGetCart`, etc.), ensuring endpoint parity by construction.

**One gap found:**

---
TYPE: MISSING_API_CALL  
SCREEN: Home  
WEB_CALL: `GET /api/hero-banners` (via hero banners hook)  
MOBILE_CALL: None — hardcoded `HERO_IMAGES` static array  
IMPACT: Dynamic hero banners set by admin are never shown on mobile; mobile always shows the same 5 static Pexels photos  
PRIORITY: HIGH  

---

No other API consistency gaps were found. Pagination, auth headers, and query parameters are handled identically because both platforms use the same generated hooks.

---

## Task 4 — Mobile UX Issues

### UX-1 — "Shop Now" CTA has no navigation
---
TYPE: BROKEN_NAVIGATION  
FILE: `artifacts/mobile/app/(tabs)/index.tsx`  
LINE: 186–191  
CODE:
```tsx
<Pressable
  onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
>
  <Text>{t("home.shop_now")}</Text>
</Pressable>
```
ISSUE: The primary hero CTA "Shop Now" only triggers haptic feedback. It does not navigate anywhere. Users who tap "Shop Now" stay on the same screen with no visible response except a vibration.  
FIX: Add `router.push("/(tabs)")` (scrolling down to the product section) or `router.push("/categories")` after the haptic call.  
PRIORITY: HIGH  

---

### UX-2 — "Explore Stores" routes to a non-existent route
---
TYPE: BROKEN_NAVIGATION  
FILE: `artifacts/mobile/app/(tabs)/index.tsx`  
LINE: 194  
CODE:
```tsx
onPress={() => router.push("/store-directory" as any)}
```
ISSUE: `/store-directory` does not exist in the mobile router. The `as any` cast suppresses the TypeScript error. Tapping "Explore Stores" will navigate to the 404 `+not-found.tsx` screen.  
FIX: Change to `router.push("/stores")` which maps to `stores/index.tsx`.  
PRIORITY: HIGH  

---

### UX-3 — Hardcoded discount string bypasses i18n
---
TYPE: HARDCODED_STRING  
FILE: `artifacts/mobile/app/(tabs)/index.tsx`  
LINE: 226  
CODE:
```tsx
<Text>{isAr ? "خصم لغاية 50%" : "Up to 50% Off"}</Text>
```
ISSUE: This discount badge text is hardcoded directly in JSX instead of using `t()`. It cannot be updated via i18n without a code change, and it will never pick up any future locale additions.  
FIX: Add keys `home.hero_discount_ar` / `home.hero_discount_en` (or a single `home.hero_discount` with the English value) to both locale objects and use `t("home.hero_discount")`.  
PRIORITY: MEDIUM  

---

**No localhost URLs found** in `artifacts/mobile/app/` — all API calls correctly use `getBaseUrl()`. ✅  
**No `AsyncStorage.getItem()` without `await`** found — all AsyncStorage access is properly async. ✅  
**router.push vs router.replace** — pattern is used correctly throughout: post-login flows use `router.replace`, link navigation uses `router.push`. ✅  

---

## Task 5 — Mobile i18n

### Coverage Assessment

The mobile i18n file (`artifacts/mobile/src/i18n/index.ts`, 2006 lines) covers all major UI sections:

| Section | Status |
|---|---|
| `common` | ✅ |
| `cart` | ✅ |
| `checkout` | ✅ |
| `order_success` | ✅ |
| `orders` | ✅ |
| `messages` | ✅ |
| `profile` | ✅ |
| `product` | ✅ |
| `trust` | ✅ |
| `shop` | ✅ |
| `auth` | ✅ (including OTP, password reset, Google sign-in) |
| `nav` | ✅ |
| `wishlist` | ✅ |
| `home` | ✅ (comprehensive hero, stats, section labels, footer links) |
| `store` | ✅ |
| Courier workspace keys | UNCERTAIN — not fully read; courier tabs exist |
| Seller dashboard keys (`seller_dash.*`) | ✅ (referenced in `profile.tsx`) |

### RTL Handling
---
TYPE: MISSING_RTL  
FINDING: `I18nManager.forceRTL()` is not called anywhere in the mobile codebase.  
CURRENT_APPROACH: RTL is handled manually via inline `isAr ? "row-reverse" : "row"` direction checks and `textAlign: isAr ? "right" : "left"` spread throughout components.  
RISK: Without `I18nManager.forceRTL(true)` when Arabic is active, React Native does not flip the layout engine. Native components (ScrollView momentum, gesture directions, OS-level text rendering) will behave LTR even when the UI text is RTL. The manual inline fixes address visual alignment but not layout engine RTL.  
FIX: In `artifacts/mobile/src/i18n/index.ts` or the root layout, call `I18nManager.forceRTL(true)` when `getLocale() === "ar"` and `I18nManager.forceRTL(false)` otherwise. Note: a reload is required after calling `forceRTL`; pair this with `Updates.reloadAsync()` from `expo-updates`.  
PRIORITY: MEDIUM  

---

### Hardcoded strings
One found (already reported as UX-3): `"Up to 50% Off"` / `"خصم لغاية 50%"` inline in hero — not going through `t()`.

No other user-visible hardcoded English strings were found in the screens examined.

---

## Priority Summary

| Priority | Finding | File |
|---|---|---|
| HIGH | Hero banners not fetched from API — admin banners invisible on mobile | `(tabs)/index.tsx` |
| HIGH | "Shop Now" CTA has no navigation action | `(tabs)/index.tsx:188` |
| HIGH | "Explore Stores" routes to `/store-directory` (broken — 404) | `(tabs)/index.tsx:194` |
| HIGH | Missing: `/courier/earnings`, `/courier/performance`, `/courier/wallet` | — |
| HIGH | Missing: `/seller/inventory` | — |
| MEDIUM | Missing: 9 admin-only screens (analytics, delivery, courier tools, etc.) | — |
| MEDIUM | RTL not enforced via `I18nManager.forceRTL()` | Mobile root layout |
| MEDIUM | Hardcoded discount badge string bypasses i18n | `(tabs)/index.tsx:226` |
| LOW | 13 marketing/info pages missing (shipping, loyalty, seller info pages, etc.) | — |
