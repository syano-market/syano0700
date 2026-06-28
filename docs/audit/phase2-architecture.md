# Phase 2 — Architecture + Routes Audit

**Date:** 2026-06-28  
**Scope:** `artifacts/marketplace/src/App.tsx` · `artifacts/api-server/src/routes/` · `lib/api-client-react/` · `artifacts/marketplace/vite.config.ts` · `artifacts/api-server/src/app.ts` · `artifacts/mobile/`  
**Method:** Every finding verified by reading the actual source files and cross-referencing against the stated facts in SYANO_MASTER_RECOVERY.md.

---

## Summary

| Task | Findings | Critical 🔴 | High 🟠 | Review 🟡 |
|------|----------|------------|--------|----------|
| Web Routes | 1 | 0 | 0 | 1 |
| API Endpoints | 1 | 0 | 0 | 1 |
| Vite Proxy | 1 | 0 | 1 | 0 |
| Mobile API URLs | 0 | 0 | 0 | 0 |
| CORS Rule | PASS | — | — | — |
| Wouter Usage | 1 | 0 | 0 | 1 |
| **TOTAL** | **4** | **0** | **1** | **3** |

---

## Master API Endpoint List

> **IMPORTANT NOTE ON ADMIN ROUTE AUTH:** The explorer scan initially reported many `/api/admin/*` endpoints as "Public / None". This is **incorrect**. `artifacts/api-server/src/routes/admin.ts` line 74 defines:
> ```typescript
> router.use("/admin", requireAuth, requireRole("admin"));
> ```
> This router-level middleware applies to **every** route registered after it in that file, meaning all `/api/admin/*` endpoints served from `admin.ts` require authentication + admin role. The corrected auth status is shown below.

### Sitemap Routes (no prefix)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/sitemap.xml` | Public | None |
| GET | `/sitemap-index.xml` | Public | None |
| GET | `/sitemap-pages.xml` | Public | None |
| GET | `/sitemap-categories.xml` | Public | None |
| GET | `/sitemap-products.xml` | Public | None |
| GET | `/sitemap-stores.xml` | Public | None |
| GET | `/sitemap-cache` | Public | None |
| POST | `/sitemap-flush` | Public | None |

### Health

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/healthz` | Public | None |

### Auth (`routes/auth.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/auth/turnstile-config` | Public | None |
| POST | `/api/auth/register` | Public | None |
| POST | `/api/auth/login` | Public | None |
| POST | `/api/auth/send-otp` | Public | None |
| POST | `/api/auth/resend-otp` | Public | None |
| POST | `/api/auth/verify-otp` | Public | None |
| POST | `/api/auth/logout` | Public | None |
| GET | `/api/auth/me` | requireAuth | Any |
| PATCH | `/api/auth/me` | requireAuth | Any |
| POST | `/api/auth/reissue` | requireAuth | Any |
| POST | `/api/auth/forgot-password` | Public | None |
| POST | `/api/auth/verify-reset-otp` | Public | None |
| POST | `/api/auth/reset-password` | Public | None |
| GET | `/api/user/settings` | requireAuth | Any |
| PATCH | `/api/user/settings` | requireAuth | Any |
| GET | `/api/auth/google-client-id` | Public | None |
| POST | `/api/auth/google` | Public | None |
| GET | `/api/auth/facebook-app-id` | Public | None |
| POST | `/api/auth/facebook` | Public | None |

### Products & Variants (`routes/products.ts`, `routes/variants.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/products` | Public | None |
| GET | `/api/products/categories` | Public | None |
| GET | `/api/products/best-sellers` | Public | None |
| GET | `/api/products/:id` | Public | None |
| POST | `/api/products` | requireAuth + requireActiveAccount | seller |
| PATCH | `/api/products/:id` | requireAuth + requireActiveAccount | seller |
| DELETE | `/api/products/:id` | requireAuth + requireActiveAccount | seller |
| GET | `/api/products/:id/variants` | Public | None |
| POST | `/api/products/:id/variants/bulk` | requireAuth + requireActiveAccount | seller |
| PATCH | `/api/products/:id/variants/:variantId` | requireAuth + requireActiveAccount | seller |
| DELETE | `/api/products/:id/variants/:variantId` | requireAuth + requireActiveAccount | seller |
| DELETE | `/api/products/:id/variants` | requireAuth + requireActiveAccount | seller |

### Search (`routes/search.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/search` | Public | None |
| GET | `/api/search/suggestions` | Public | None |
| GET | `/api/search/results` | optionalAuth | None |
| GET | `/api/search/trending` | Public | None |
| POST | `/api/search/click` | Public | None |
| POST | `/api/search/track-click` | Public | None |
| GET | `/api/search/filter-options` | Public | None |
| GET | `/api/search/related` | Public | None |
| GET | `/api/search/suggestions/popular` | Public | None |
| POST | `/api/admin/search/reindex` | requireAuth | admin |
| GET | `/api/admin/search/cache` | requireAuth | admin |
| DELETE | `/api/admin/search/cache` | requireAuth | admin |
| GET | `/api/admin/search/health` | requireAuth | admin |
| GET | `/api/admin/search/cache-stats` | requireAuth | admin |
| GET | `/api/admin/cache-stats` | requireAuth | admin |

### Reviews (`routes/reviews.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/products/:id/reviews` | Public | None |
| POST | `/api/products/:id/reviews` | requireAuth + requireActiveAccount | customer |

### Cart (`routes/cart.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/cart` | requireAuth + requireActiveAccount | customer |
| POST | `/api/cart/items` | requireAuth + requireActiveAccount | customer |
| PATCH | `/api/cart/items` | requireAuth + requireActiveAccount | customer |
| PATCH | `/api/cart/items/:cartItemId` | requireAuth + requireActiveAccount | customer |
| DELETE | `/api/cart/items/:cartItemId` | requireAuth + requireActiveAccount | customer |
| DELETE | `/api/cart/clear` | requireAuth + requireActiveAccount | customer |

### Orders (`routes/orders.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/orders` | requireAuth + requireActiveAccount | any (role-filtered inside) |
| POST | `/api/orders` | requireAuth + requireActiveAccount | customer |
| GET | `/api/orders/:id` | requireAuth + requireActiveAccount | any |
| GET | `/api/orders/:id/history` | requireAuth + requireActiveAccount | any |
| PATCH | `/api/orders/:id/status` | requireAuth + requireActiveAccount | any (role-filtered inside) |

### Dashboard (`routes/dashboard.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/dashboard/seller` | requireAuth | seller |
| GET | `/api/dashboard/customer` | requireAuth | customer |
| GET | `/api/dashboard/seller/analytics` | requireAuth | seller |

### Settings (`routes/settings.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/settings` | Public | None |

### Sellers (`routes/sellers.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/sellers/featured` | Public | None |
| GET | `/api/sellers/directory` | Public | None |
| GET | `/api/sellers/store/:slug` | Public | None |
| GET | `/api/sellers/:id/store-preview` | Public | None |
| POST | `/api/sellers/:id/follow` | requireAuth + requireActiveAccount | customer |
| DELETE | `/api/sellers/:id/follow` | requireAuth + requireActiveAccount | customer |
| GET | `/api/sellers/:id/follow-status` | requireAuth | Any |
| GET | `/api/me/following-stores` | requireAuth | Any |
| GET | `/api/sellers/:id/reviews` | Public | None |
| GET | `/api/sellers/:id/review-status` | requireAuth + requireActiveAccount | Any |
| POST | `/api/sellers/:id/reviews` | requireAuth + requireActiveAccount | customer |
| PATCH | `/api/sellers/store/branding` | requireAuth + requireActiveAccount | seller |
| GET | `/api/sellers/store/:slug/metrics` | Public | None |
| PATCH | `/api/sellers/reviews/:reviewId/reply` | requireAuth + requireActiveAccount | seller |
| GET | `/api/sellers/store/:slug/reviews` | Public | None |
| GET | `/api/sellers/store/:slug/categories` | Public | None |
| GET | `/api/sellers/store/:slug/featured` | Public | None |
| GET | `/api/sellers/:id/trust` | Public | None |
| GET | `/api/seller/products/quality-report` | requireAuth | seller |

### Seller Applications (`routes/seller-applications.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/seller-applications/my` | requireAuth | Any |
| PATCH | `/api/seller-applications/draft` | requireAuth + requireActiveAccount | Any |
| DELETE | `/api/seller-applications/my` | requireAuth + requireActiveAccount | Any |
| POST | `/api/seller-applications` | requireAuth + requireActiveAccount | Any |
| GET | `/api/seller-applications` | requireAuth | admin |
| PATCH | `/api/seller-applications/:id/status` | requireAuth | admin |

### Couriers (`routes/couriers.ts`, `routes/courier-availability.ts`, `routes/courier-ops.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | `/api/couriers/apply` | requireAuth + requireActiveAccount | Any |
| GET | `/api/couriers/profile` | requireAuth | Any |
| PATCH | `/api/couriers/profile/toggle` | requireAuth + requireActiveAccount | Any |
| GET | `/api/couriers/assignments` | requireAuth + requireActiveAccount | Any |
| PATCH | `/api/couriers/assignments/:id/pickup` | requireAuth + requireActiveAccount | Any |
| PATCH | `/api/couriers/assignments/:id/start-delivery` | requireAuth + requireActiveAccount | Any |
| PATCH | `/api/couriers/assignments/:id/deliver` | requireAuth + requireActiveAccount | Any |
| PATCH | `/api/couriers/assignments/:id/fail-delivery` | requireAuth + requireActiveAccount | Any |
| GET | `/api/couriers/earnings` | requireAuth | Any |
| GET | `/api/couriers/history` | requireAuth | Any |
| PATCH | `/api/seller/orders/:id/ready` | requireAuth + requireActiveAccount | Any |
| PATCH | `/api/courier/location` | requireAuth + requireActiveAccount | courier |
| GET | `/api/courier/location` | requireAuth | courier |
| PATCH | `/api/courier/availability` | requireAuth + requireActiveAccount | courier |
| GET | `/api/courier/availability` | requireAuth | courier |
| GET | `/api/courier/wallet` | requireAuth | courier |
| GET | `/api/courier/wallet/transactions` | requireAuth | courier |
| POST | `/api/courier/payouts` | requireAuth | courier |
| GET | `/api/courier/payouts` | requireAuth | courier |
| GET | `/api/courier/navigation-preference` | requireAuth | courier |
| PATCH | `/api/courier/navigation-preference` | requireAuth | courier |
| POST | `/api/courier/missions/:id/proof` | requireAuth | courier |
| POST | `/api/courier/missions/:id/failure` | requireAuth | courier |
| POST | `/api/courier/missions/:id/reschedule` | requireAuth | courier |
| POST | `/api/courier/missions/:id/safety-event` | requireAuth | courier |
| GET | `/api/courier/performance` | requireAuth | courier |
| GET | `/api/courier/ratings` | requireAuth | courier |
| GET | `/api/courier/missions/offers` | requireAuth + requireActiveAccount | Any |
| POST | `/api/courier/missions/offers/:offerId/accept` | requireAuth + requireActiveAccount | Any |
| POST | `/api/courier/missions/offers/:offerId/decline` | requireAuth + requireActiveAccount | Any |
| POST | `/api/missions/:id/rate` | requireAuth | customer |

### Delivery Missions & Tracking (`routes/tracking.ts`, `routes/delivery-missions.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/tracking/:missionId` | requireAuth | Any |
| GET | `/api/tracking/:missionId/positions` | requireAuth | Any |
| GET | `/api/tracking/:missionId/events` | requireAuth | Any |
| GET | `/api/delivery-missions/:id` | requireAuth | Any |
| GET | `/api/seller/delivery-missions` | requireAuth | seller |
| GET | `/api/delivery-zones` | Public | None |

### Notifications, Wishlist, Push

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/notifications` | requireAuth + requireActiveAccount | Any |
| GET | `/api/notifications/count` | requireAuth + requireActiveAccount | Any |
| GET | `/api/notifications/stream` | Public (token-based SSE) | Any |
| POST | `/api/notifications/read-all` | requireAuth | Any |
| POST | `/api/notifications/:id/read` | requireAuth | Any |
| GET | `/api/wishlist` | requireAuth + requireActiveAccount | Any |
| GET | `/api/wishlist/ids` | requireAuth + requireActiveAccount | Any |
| POST | `/api/wishlist` | requireAuth + requireActiveAccount | Any |
| DELETE | `/api/wishlist/:productId` | requireAuth + requireActiveAccount | Any |
| GET | `/api/push-subscriptions/vapid-public-key` | Public | None |
| POST | `/api/push-subscriptions` | requireAuth | Any |
| DELETE | `/api/push-subscriptions` | requireAuth | Any |

### Messaging & Conversations (`routes/messaging.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/conversations/unread-count` | requireAuth | Any |
| GET | `/api/conversations/search` | requireAuth | Any |
| POST | `/api/conversations` | requireAuth + requireActiveAccount | Any |
| GET | `/api/conversations` | requireAuth + requireActiveAccount | Any |
| GET | `/api/conversations/:id` | requireAuth | Any |
| GET | `/api/conversations/:id/messages` | requireAuth + requireActiveAccount | Any |
| POST | `/api/conversations/:id/messages` | requireAuth + requireActiveAccount | Any |
| DELETE | `/api/conversations/:id/messages/:msgId` | requireAuth | Any |
| PATCH | `/api/conversations/:id/read` | requireAuth + requireActiveAccount | Any |
| PATCH | `/api/conversations/:id/archive` | requireAuth + requireActiveAccount | Any |
| PATCH | `/api/conversations/:id/mute` | requireAuth + requireActiveAccount | Any |
| POST | `/api/conversations/:id/typing` | requireAuth | Any |
| GET | `/api/conversations/:id/typing` | requireAuth | Any |
| POST | `/api/conversations/:id/attachments` | requireAuth + requireActiveAccount | Any |
| GET | `/api/conversations/:id/attachments/:attachId` | requireAuth | Any |
| POST | `/api/conversations/:id/report` | requireAuth | Any |

### Support & Contact

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/support/conversation` | requireAuth + requireActiveAccount | Any |
| POST | `/api/support/message` | requireAuth + requireActiveAccount | Any |
| GET | `/api/support/tickets` | requireAuth + requireActiveAccount | Any |
| POST | `/api/support/escalate` | requireAuth + requireActiveAccount | Any |
| POST | `/api/contact` | Public | None |

### Banners (`routes/banners.ts`)

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/banners` | Public | None |
| GET | `/api/banners/side` | Public | None |
| POST | `/api/banners/:id/impression` | Public | None |
| POST | `/api/banners/:id/click` | Public | None |

### Admin Routes — all protected by `router.use("/admin", requireAuth, requireRole("admin"))` at line 74 of `admin.ts`

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/admin/stats` | requireAuth | admin |
| GET | `/api/admin/stats/timeseries` | requireAuth | admin |
| GET | `/api/admin/stats/extended` | requireAuth | admin |
| GET | `/api/admin/stats/top-performers` | requireAuth | admin |
| GET | `/api/admin/activity` | requireAuth | admin |
| GET | `/api/admin/users` | requireAuth | admin |
| POST | `/api/admin/users/:id/suspend` | requireAuth | admin |
| POST | `/api/admin/users/:id/reactivate` | requireAuth | admin |
| POST | `/api/admin/users/:id/verify` | requireAuth | admin |
| POST | `/api/admin/users/:id/unverify` | requireAuth | admin |
| DELETE | `/api/admin/users/:id` | requireAuth | admin |
| GET | `/api/admin/products` | requireAuth | admin |
| PATCH | `/api/admin/products/:id` | requireAuth | admin |
| DELETE | `/api/admin/products/:id` | requireAuth | admin |
| GET | `/api/admin/orders` | requireAuth | admin |
| PATCH | `/api/admin/orders/:id/status` | requireAuth | admin |
| GET | `/api/admin/logs` | requireAuth | admin |
| GET | `/api/admin/settings` | requireAuth | admin |
| PATCH | `/api/admin/settings` | requireAuth | admin |
| GET | `/api/admin/sellers/list` | requireAuth | admin |
| GET | `/api/admin/sellers/verification` | requireAuth | admin |
| PATCH | `/api/admin/sellers/:id/verification` | requireAuth | admin |
| GET | `/api/admin/sellers/:id/trust` | requireAuth | admin |
| POST | `/api/admin/sellers/:id/recompute-trust` | requireAuth | admin |
| GET | `/api/admin/trust/leaderboard` | requireAuth | admin |
| GET | `/api/admin/banners` | requireAuth | admin |
| GET | `/api/admin/banners/analytics` | requireAuth | admin |
| POST | `/api/admin/banners` | requireAuth | admin |
| PATCH | `/api/admin/banners/:id` | requireAuth | admin |
| DELETE | `/api/admin/banners/:id` | requireAuth | admin |
| GET | `/api/admin/health/alerts` | requireAuth | admin |
| GET | `/api/admin/operation-center` | requireAuth | admin |
| GET | `/api/admin/analytics/products` | requireAuth | admin |
| GET | `/api/admin/analytics/orders` | requireAuth | admin |
| GET | `/api/admin/analytics/categories` | requireAuth | admin |
| GET | `/api/admin/analytics/users` | requireAuth | admin |
| GET | `/api/admin/reports/export` | requireAuth | admin |
| GET | `/api/admin/store-health/:sellerId` | requireAuth | admin |
| GET | `/api/admin/store-settings-health/:sellerId` | requireAuth | admin |
| GET | `/api/admin/search-analytics/overview` | requireAuth | admin |
| GET | `/api/admin/search-analytics/top-queries` | requireAuth | admin |
| GET | `/api/admin/search-analytics/zero-results` | requireAuth | admin |
| GET | `/api/admin/search-analytics/trends` | requireAuth | admin |
| GET | `/api/admin/products/quality-report` | requireAuth | admin |
| GET | `/api/admin/stores/quality-report` | requireAuth | admin |
| GET | `/api/admin/delivery-zones` | requireAuth | admin |
| POST | `/api/admin/delivery-zones` | requireAuth | admin |
| PATCH | `/api/admin/delivery-zones/:id` | requireAuth | admin |
| DELETE | `/api/admin/delivery-zones/:id` | requireAuth | admin |
| GET | `/api/admin/tracking/sessions` | requireAuth | admin |
| POST | `/api/admin/routing/calculate` | requireAuth | admin |
| GET | `/api/admin/routing/status` | requireAuth | admin |
| GET | `/api/admin/couriers` | requireAuth | admin |
| GET | `/api/admin/couriers/:id` | requireAuth | admin |
| PATCH | `/api/admin/couriers/:id` | requireAuth | admin |
| GET | `/api/admin/couriers/live-locations` | requireAuth | admin |
| GET | `/api/admin/couriers/availability` | requireAuth | admin |
| POST | `/api/admin/orders/:id/assign-courier` | requireAuth | admin |
| DELETE | `/api/admin/orders/:id/assign-courier` | requireAuth | admin |
| GET | `/api/admin/delivery/stats` | requireAuth | admin |
| GET | `/api/admin/delivery/ready-orders` | requireAuth | admin |
| GET | `/api/admin/delivery/active` | requireAuth | admin |
| GET | `/api/admin/courier-payouts` | requireAuth | admin |
| POST | `/api/admin/courier-payouts/:id/approve` | requireAuth | admin |
| POST | `/api/admin/courier-payouts/:id/reject` | requireAuth | admin |
| GET | `/api/admin/delivery-missions/stats` | requireAuth | admin |
| GET | `/api/admin/delivery-missions` | requireAuth | admin |
| GET | `/api/admin/delivery-missions/:id/nearest-couriers` | requireAuth | admin |
| PATCH | `/api/admin/delivery-missions/:id/reschedule` | requireAuth | admin |
| GET | `/api/admin/delivery-missions/:missionId/offers` | requireAuth | admin |
| POST | `/api/admin/delivery-missions/:missionId/trigger-assignment` | requireAuth | admin |
| GET | `/api/admin/dispatch-center` | requireAuth | admin |
| GET | `/api/admin/missions/:id/operations` | requireAuth | admin |
| GET | `/api/admin/dispatch-alerts` | requireAuth | admin |
| PATCH | `/api/admin/dispatch-alerts/:id/resolve` | requireAuth | admin |
| GET | `/api/admin/conversations` | requireAuth | admin |
| POST | `/api/admin/conversations` | requireAuth | admin |
| PATCH | `/api/admin/conversations/:id/block` | requireAuth | admin |
| GET | `/api/admin/support/tickets` | requireAuth | admin |
| PATCH | `/api/admin/support/tickets/:id` | requireAuth | admin |
| GET | `/api/admin/support/stats` | requireAuth | admin |
| GET | `/api/admin/contact-submissions` | requireAuth | admin |
| DELETE | `/api/admin/contact-submissions/:id` | requireAuth | admin |
| GET | `/api/admin/recovery-check` | requireAuth | admin |

---

## Task 1 — Web Routes

**All 89 page files are routed.** No broken routes found. One orphaned import found.

---
TYPE: ORPHANED_PAGE
FILE: artifacts/marketplace/src/pages/products/index.tsx
ROUTE: None active
REASON: App.tsx line 44 defines `const Products = lazy(() => import("@/pages/products"))` but this component is never placed inside any `<Route>`. The routes `/products`, `/shop`, and `/search` all render `SearchPage` (from `@/pages/search`). The `Products` component and its backing page file are unreachable from any URL.
RISK: REVIEW_FIRST
---

**Complete web route table:**

| Path | Component file | Protection |
|------|---------------|------------|
| `/` | pages/luxury-landing.tsx | Public |
| `/luxury` | pages/luxury-landing.tsx | Public |
| `/new` | pages/new-landing.tsx | Public |
| `/account-suspended` | pages/account-suspended.tsx | Public |
| `/login` | pages/login.tsx | Public |
| `/register` | pages/register.tsx | Public |
| `/verify` | pages/verify.tsx | Public |
| `/forgot-password` | pages/forgot-password.tsx | Public |
| `/shop` | pages/search/index.tsx | Public |
| `/search` | pages/search/index.tsx | Public |
| `/products` | pages/search/index.tsx | Public |
| `/categories` | pages/Categories.tsx | Public |
| `/products/:id` | pages/products/[id].tsx | Public |
| `/cart` | pages/cart.tsx | Public |
| `/wishlist` | pages/wishlist.tsx | Public |
| `/store/:slug` | pages/store/[slug].tsx | Public |
| `/stores` | pages/stores.tsx | Public |
| `/sellers/directory` | pages/stores.tsx | Public |
| `/tracking/:missionId` | pages/tracking/[missionId].tsx | Public |
| `/about` | pages/about/index.tsx | Public |
| `/about/story` | pages/about/story.tsx | Public |
| `/about/team` | pages/about/team.tsx | Public |
| `/contact` | pages/contact.tsx | Public |
| `/help` | pages/help.tsx | Public |
| `/shipping` | pages/shipping/index.tsx | Public |
| `/shipping/nationwide` | pages/shipping/nationwide.tsx | Public |
| `/payment-methods` | pages/payment-methods.tsx | Public |
| `/syano-guarantee` | pages/syano-guarantee.tsx | Public |
| `/loyalty` | pages/loyalty.tsx | Public |
| `/privacy-policy` | pages/privacy-policy.tsx | Public |
| `/terms-of-use` | pages/terms-of-use.tsx | Public |
| `/returns-policy` | pages/returns-policy.tsx | Public |
| `/cookies` | pages/cookies.tsx | Public |
| `/seller/how-to-sell` | pages/seller/how-to-sell.tsx | Public |
| `/seller/terms` | pages/seller/terms.tsx | Public |
| `/seller/center` | pages/seller/center.tsx | Public |
| `/seller/commission` | pages/seller/commission.tsx | Public |
| `/seller/faq` | pages/seller/faq.tsx | Public |
| `/checkout` | pages/checkout.tsx | customer |
| `/orders` | pages/orders/index.tsx | customer |
| `/orders/:id` | pages/orders/[id].tsx | customer |
| `/customer/dashboard` | pages/customer/dashboard.tsx | customer |
| `/account` | pages/customer/account.tsx | any-auth |
| `/messages` | pages/messages/index.tsx | customer |
| `/support` | pages/customer/support.tsx | customer |
| `/seller/apply` | pages/seller/apply.tsx | customer |
| `/seller/application-status` | pages/seller/application-status.tsx | customer |
| `/seller/dashboard` | pages/seller/dashboard.tsx | seller |
| `/seller/products` | pages/seller/products/index.tsx | seller |
| `/seller/products/new` | pages/seller/products/new.tsx | seller |
| `/seller/products/:id/edit` | pages/seller/products/[id]/edit.tsx | seller |
| `/seller/orders` | pages/seller/orders.tsx | seller |
| `/seller/orders/:id` | pages/seller/orders/[id].tsx | seller |
| `/seller/inventory` | pages/seller/inventory.tsx | seller |
| `/seller/messages` | pages/seller/messages.tsx | seller |
| `/seller/analytics` | pages/seller/analytics.tsx | seller |
| `/seller/reviews` | pages/seller/reviews.tsx | seller |
| `/seller/store-settings` | pages/seller/store-settings.tsx | seller |
| `/seller/trust` | pages/seller/trust.tsx | seller |
| `/courier/apply` | pages/courier/apply.tsx | customer |
| `/courier/application-status` | pages/courier/application-status.tsx | any-auth |
| `/courier` | pages/courier/workspace.tsx | courier + admin |
| `/courier/history` | pages/courier/history.tsx | courier + admin |
| `/courier/earnings` | pages/courier/earnings.tsx | courier + admin |
| `/courier/profile` | pages/courier/profile.tsx | courier + admin |
| `/courier/performance` | pages/courier/performance.tsx | courier + admin |
| `/courier/wallet` | pages/courier/wallet.tsx | courier + admin |
| `/courier/dashboard` | pages/courier/dashboard.tsx | courier + admin |
| `/admin` | pages/admin/index.tsx | admin |
| `/admin/users` | pages/admin/users.tsx | admin |
| `/admin/products` | pages/admin/products.tsx | admin |
| `/admin/orders` | pages/admin/orders.tsx | admin |
| `/admin/logs` | pages/admin/logs.tsx | admin |
| `/admin/settings` | pages/admin/settings.tsx | admin |
| `/admin/sellers` | pages/admin/sellers.tsx | admin |
| `/admin/analytics` | pages/admin/analytics.tsx | admin |
| `/admin/search-analytics` | pages/admin/SearchAnalytics.tsx | admin |
| `/admin/courier-applications` | pages/admin/courier-applications.tsx | admin |
| `/admin/courier-applications/:id` | pages/admin/courier-application-detail.tsx | admin |
| `/admin/delivery` | pages/admin/delivery.tsx | admin |
| `/admin/delivery-missions` | pages/admin/delivery-missions.tsx | admin |
| `/admin/courier-availability` | pages/admin/courier-availability.tsx | admin |
| `/admin/courier-locations` | pages/admin/courier-locations.tsx | admin |
| `/admin/tracking-monitor` | pages/admin/tracking-monitor.tsx | admin |
| `/admin/routing` | pages/admin/routing.tsx | admin |
| `/admin/dispatch-center` | pages/admin/dispatch-center.tsx | admin |
| `/admin/verification` | pages/admin/verification.tsx | admin |
| `/admin/messages` | pages/admin/messages.tsx | admin |
| `/admin/hero-banners` | pages/admin/hero-banners.tsx | admin |
| `/admin/support` | pages/admin/support.tsx | admin |
| `/admin/courier-payouts` | pages/admin/courier-payouts.tsx | admin |
| *(catch-all)* | pages/not-found.tsx | Public |

---

## Task 2 — API Endpoints

**No PHANTOM_HOOKs found.**

`useGetOrderHistory` was initially flagged as suspect because its name suggests a standalone `/api/orders/history` path. Verified: the hook correctly calls `/api/orders/${id}/history` (taking an `id` parameter) which matches the backend endpoint `GET /api/orders/:id/history` at `routes/orders.ts:576`. No mismatch.

**UNHOOKED_ENDPOINTs** (backend endpoints with no corresponding hook in `lib/api-client-react`):

These endpoints are called directly from page components using `fetch(${getBaseUrl()}/api/...)` rather than through a shared hook. This is not a bug — it is intentional for specialized or one-off calls. Listed for completeness:

---
TYPE: UNHOOKED_ENDPOINT
METHOD: Multiple
PATH: /api/auth/send-otp · /api/auth/resend-otp · /api/auth/verify-otp · /api/auth/forgot-password · /api/auth/verify-reset-otp · /api/auth/reset-password · /api/auth/reissue
ROUTE_FILE: artifacts/api-server/src/routes/auth.ts
HOOK_EXISTS: NO — called directly from auth page components
RISK: LOW — intentional; auth flows are page-local
---

---
TYPE: UNHOOKED_ENDPOINT
METHOD: Multiple
PATH: /api/products/:id/variants (GET) · /api/products/:id/variants/bulk (POST) · /api/products/:id/variants/:variantId (PATCH/DELETE)
ROUTE_FILE: artifacts/api-server/src/routes/variants.ts
HOOK_EXISTS: NO
RISK: LOW — variant management is called directly from seller product pages
---

---
TYPE: UNHOOKED_ENDPOINT
METHOD: Multiple
PATH: /api/couriers/* · /api/courier/*
ROUTE_FILE: artifacts/api-server/src/routes/couriers.ts · courier-availability.ts · courier-ops.ts
HOOK_EXISTS: NO — courier workspace makes direct fetch calls
RISK: LOW — intentional; courier workspace is self-contained
---

---
TYPE: UNHOOKED_ENDPOINT
METHOD: Multiple
PATH: /api/admin/delivery/* · /api/admin/couriers/* · /api/admin/dispatch-center · /api/admin/delivery-missions/* · /api/admin/dispatch-alerts · /api/admin/routing/* · /api/admin/courier-payouts/*
ROUTE_FILE: artifacts/api-server/src/routes/admin.ts · courier-payouts.ts
HOOK_EXISTS: NO — admin delivery/dispatch pages make direct fetch calls
RISK: LOW — intentional; admin specialized views are self-contained
---

---
TYPE: UNHOOKED_ENDPOINT
METHOD: GET
PATH: /api/user/settings · PATCH /api/user/settings
ROUTE_FILE: artifacts/api-server/src/routes/auth.ts
HOOK_EXISTS: NO
RISK: LOW — user settings toggling called directly from account page
---

---

## Task 3 — Vite Proxy

**Status: PASS with one note**

`artifacts/marketplace/vite.config.ts` proxy configuration (lines 110–119):

```typescript
proxy: {
  "/api": { target: `http://localhost:${process.env.API_PORT ?? 8080}`, changeOrigin: true },
  "/sitemap.xml":            { target: `http://localhost:${process.env.API_PORT ?? 8080}`, changeOrigin: true },
  ...
}
```

✅ `/api/*` is correctly proxied to `localhost:${API_PORT ?? 8080}`  
✅ Uses `process.env.API_PORT` — not a hardcoded port  
✅ No conflicting proxy rules  
✅ No hardcoded `http://localhost:8080` found in any `artifacts/marketplace/src/` fetch call  

---
TYPE: PROXY_MISSING
FILE: artifacts/marketplace/vite.config.ts
LINE: 127–135 (preview block)
CODE: The `preview:` block proxies sitemaps but does NOT proxy `/api`
CORRECT: Add `"/api": { target: "http://localhost:8080", changeOrigin: true }` to the preview proxy block
RISK: HIGH — `pnpm vite preview` (used for staging/QA builds) has no API access; all API calls return 404 in preview mode
---

---

## Task 4 — Mobile API URLs

**Status: PASS — no hardcoded localhost found**

`getBaseUrl()` is exported from `lib/api-client-react/src/custom-fetch.ts`:

```typescript
let _baseUrl: string | null = null;

export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, "") : null;
}

export function getBaseUrl(): string {
  return _baseUrl ?? "";
}
```

The mobile app sets the base URL to `https://$REPLIT_DEV_DOMAIN` via `setBaseUrl()` before any API calls are made.

✅ No `fetch('http://localhost:...')` in `artifacts/mobile/app/` or `artifacts/mobile/src/`  
✅ No hardcoded IP addresses in application logic  
✅ All direct `fetch()` calls use `${getBaseUrl()}/api/...` pattern  
✅ All hook-based calls use `customFetch` which internally applies `_baseUrl`  

**Note:** `artifacts/mobile/scripts/build.js` contains `fetch("http://localhost:8081/status")` for checking Metro bundler status during build — this is a build tool, not application code, and is correct.

---

## Task 5 — CORS Rule Check

---
TYPE: CORS_CRITICAL_CHECK
STATUS: PASS
ISSUE: None
RISK: N/A
---

Verified in `artifacts/api-server/src/app.ts`:

```typescript
// Line 73–81
function isReplitOrigin(origin: string): boolean {
  return (
    origin.endsWith(".replit.dev") ||
    origin.endsWith(".replit.app") ||
    origin.endsWith(".janeway.replit.dev") ||
    origin.endsWith(".expo.janeway.replit.dev") ||
    origin === "https://replit.com"
  );
}

// Line 87 — called in CORS middleware
if (isReplitOrigin(origin)) return callback(null, true);
```

✅ `isReplitOrigin()` EXISTS  
✅ Allows `*.replit.dev`  
✅ Allows `*.replit.app`  
✅ Allows `*.janeway.replit.dev` (Expo dev tunnel)  
✅ Allows `*.expo.janeway.replit.dev` (Expo mobile preview)  
✅ Called in CORS middleware at line 87  
✅ Not commented out or bypassed  

---

## Task 6 — Wouter Usage

**No `react-router-dom` imports found anywhere in `artifacts/marketplace/src/`.**  
The entire codebase correctly uses Wouter.

---
TYPE: DIRECT_NAVIGATION
FILE: artifacts/marketplace/src/providers/NotificationProvider.tsx
LINE: 124
CODE: window.location.replace("/account-suspended");
CORRECT: const [, setLocation] = useLocation(); setLocation("/account-suspended");
RISK: REVIEW_FIRST — functionally correct (both redirect the user), but bypasses Wouter's navigation stack. Using `window.location.replace` causes a full page reload and loses React state/cache. Acceptable for account suspension (a hard stop) but diverges from the Wouter pattern used everywhere else.
---

**Note:** `artifacts/marketplace/src/components/SEO.tsx:26` reads `window.location.href` to build a canonical URL — this is a read, not navigation, and is correct.

---

## Key Observations

1. **Admin route auth is sound.** The `router.use("/admin", requireAuth, requireRole("admin"))` guard at line 74 of `admin.ts` covers all admin endpoints. There is no unprotected admin surface.

2. **The products/index.tsx page is unreachable.** The `Products` lazy import in App.tsx is never used in any `<Route>`. The file may be a legacy page from before search was unified, or a planned future page. It should be either removed or assigned a route.

3. **`vite preview` has no API proxy.** The `preview:` block in vite.config.ts doesn't proxy `/api`. Any CI/staging workflow using `vite preview` will see blank product lists and auth failures.

4. **Courier and admin delivery endpoints are intentionally unhooked.** These specialized endpoints are called directly from self-contained workspace pages. This is intentional architecture — no action needed.

5. **No phantom hooks.** Every hook in `lib/api-client-react` calls a real, verified backend endpoint.
