# Phase 4 — Security Audit

**Audited:** 2026-06-28  
**Auditor:** Agent (read-only scan — no files modified, no commands run, no secret values exposed)  
**Scope:** Full monorepo — `artifacts/marketplace/src/`, `artifacts/api-server/src/`, `artifacts/mobile/`, `lib/`, root config files

---

## 🚨 Critical Findings (Fix Immediately)

None found.

---

## ⚠️ High Findings

### H1 — Unsafe URL rendered in `href` without protocol check
**Task:** XSS (Task 2C)  
**File:** `artifacts/marketplace/src/pages/store/[slug].tsx`  
**Line:** 676  
**Code:**
```tsx
<a href={store.website} target="_blank" rel="noopener noreferrer">
  {store.website}
</a>
```
**Risk:** `store.website` is seller-supplied input stored in the database. A seller can set their website to `javascript:alert(document.cookie)`. When another user clicks the link, the browser executes the payload. `rel="noopener noreferrer"` prevents tab-napping but does **not** block the `javascript:` protocol.  
**Fix:** Validate the URL before rendering. Reject any value whose protocol is not `http:` or `https:`:
```ts
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
// In JSX:
{store.website && isSafeUrl(store.website) && (
  <a href={store.website} target="_blank" rel="noopener noreferrer">…</a>
)}
```
The same check should be added in `artifacts/api-server/src/routes/sellers.ts` on the PATCH store-settings endpoint to reject `javascript:` URLs at write time.

---

### H2 — `req.body` destructured without Zod in `couriers.ts`
**Task:** Input Validation (Task 4A)  
**File:** `artifacts/api-server/src/routes/couriers.ts`  
**Line:** 29  
**Code:**
```ts
const { phone, vehicleType, district } = req.body;
if (!phone) { res.status(400).json({ error: "Phone is required" }); return; }
```
**Risk:** `vehicleType` and `district` are written to the database without type validation. A crafted request could inject unexpected types (object, array) that survive the `??` defaults and reach Drizzle.  
**Fix:** Declare a Zod schema and call `safeParse(req.body)` before destructuring. Reject with 400 on parse failure.

---

### H3 — `req.body` destructured without Zod in `support.ts` (message send)
**Task:** Input Validation (Task 4A)  
**File:** `artifacts/api-server/src/routes/support.ts`  
**Lines:** 196–201  
**Code:**
```ts
const body      = String(req.body.message ?? "").trim();
const convId    = req.body.conversationId ? Number(req.body.conversationId) : null;
const source    = String(req.body.source ?? "page");
const orderId   = req.body.orderId   ? Number(req.body.orderId)   : undefined;
const productId = req.body.productId ? Number(req.body.productId) : undefined;
const storeSlug = req.body.storeSlug ? String(req.body.storeSlug) : undefined;
```
**Risk:** Manual casting with `String()` / `Number()` is not equivalent to Zod validation. No maximum length is enforced on `body` (could be used to send megabyte-sized messages to the DB). `source` accepts any arbitrary string.  
**Fix:** Add a Zod schema with `.max()` length limits and an enum for `source`.

---

### H4 — `req.body` destructured without Zod in `admin.ts` (product create)
**Task:** Input Validation (Task 4A)  
**File:** `artifacts/api-server/src/routes/admin.ts`  
**Line:** 554  
**Code:**
```ts
const { name, description, price, category, stock, discountPercent, imageUrl, featured } = req.body;
```
**Risk:** All fields arrive unvalidated. `price` and `stock` could be strings, negative numbers, or `NaN`, which Drizzle will coerce silently. `imageUrl` is not validated as a URL.  
**Fix:** Define and apply a Zod schema matching the same shape as `CreateProductBody` used in `products.ts`.

---

### H5 — `req.body` destructured without Zod in `admin.ts` (platform settings)
**Task:** Input Validation (Task 4A)  
**File:** `artifacts/api-server/src/routes/admin.ts`  
**Line:** 867  
**Code:**
```ts
const { exchangeRate, commissionRate, announcement, flashSaleEnd } = req.body;
```
**Risk:** `exchangeRate` and `commissionRate` reach the database without numeric range validation. A malicious admin (compromised account) could set `exchangeRate` to a non-numeric string, breaking currency display site-wide.  
**Fix:** Zod schema with `z.number().positive()` for numeric fields and `z.string().datetime()` for `flashSaleEnd`.

---

### H6 — Multiple `req.body` uses without Zod in `messaging.ts`
**Task:** Input Validation (Task 4A)  
**File:** `artifacts/api-server/src/routes/messaging.ts`  
**Lines:** 115, 457, 661, 745, 860  
**Risk:** Message body, attachment metadata, and conversation identifiers all arrive without schema validation. `size` (line 661) from attachment upload is user-supplied — no maximum enforced server-side.  
**Fix:** Add Zod schemas for each endpoint body. Enforce a `size` maximum (e.g. 5 MB) on the attachment endpoint.

---

## ℹ️ Medium Findings

### M1 — `process.env.PORT` referenced in Vite config (forbidden per SYANO docs)
**Task:** Environment Variables (Task 5)  
**File:** `artifacts/marketplace/vite.config.ts`  
**Line:** 7  
**Code:**
```ts
const rawPort = process.env.PORT ?? "5000";
```
**Risk:** This file runs in Node.js at dev-server startup — `process.env.PORT` is not exposed to the browser bundle, so there is no secret-leak risk. However, SYANO's permanent rule states `PORT` must NOT be set in the shared environment because its presence causes the API server to bind on 5000 instead of 8080. If `PORT` is ever set (e.g. by a platform update), the Vite dev server will silently use it and the API server will also grab it, causing a port conflict. The same pattern exists in `tools/mockup-sandbox/vite.config.ts` line 8 and `artifacts/mobile/server/serve.js` line 132.  
**Fix:** Replace `process.env.PORT` with a Vite-specific variable (e.g. `MARKETPLACE_PORT`) in the dev config, or remove the fallback entirely and let Replit assign the port. At minimum, add a comment warning that `PORT` must never be set in the shared env per SYANO workflow rules.

---

### M2 — `req.body` fields in OTP/password-reset auth routes use type assertions instead of Zod
**Task:** Input Validation (Task 4A) / JWT Security (Task 3)  
**File:** `artifacts/api-server/src/routes/auth.ts`  
**Lines:** 356, 395, 433, 511, 647, 707, 750, 793, 932  
**Code (example):**
```ts
const { identifier, locale } = req.body as { identifier?: string; locale?: string };
```
**Risk:** TypeScript `as` casts are compile-time only. At runtime, `identifier` could be any value. The login (`line 305`) and register (`line 179`) routes correctly use `LoginBody.safeParse(req.body)` and `RegisterBody.safeParse(req.body)`. The secondary auth flows (OTP send/verify, password reset, profile update, Google/Facebook token exchange) bypass this pattern.  
**Fix:** Extend the existing Zod schemas or create new ones for each secondary auth endpoint body. Use `safeParse` with 400 rejection consistent with the main login/register flow.

---

### M3 — `req.body` without Zod in `delivery-zones.ts`
**Task:** Input Validation (Task 4A)  
**File:** `artifacts/api-server/src/routes/delivery-zones.ts`  
**Lines:** 37, 51  
**Code:**
```ts
const { nameEn, nameAr, fee, active } = req.body;
if (!nameEn || !nameAr) { res.status(400).json({ error: "nameEn and nameAr are required" }); return; }
```
**Risk:** `fee` is cast to `String(fee ?? "0")` without validating it is a non-negative numeric string. `active` is not validated as a boolean.  
**Fix:** Add a small Zod schema. Severity is Medium because this route is admin-only (`requireRole("admin")` present).

---

## ✅ Clean Areas (No Findings)

### Task 1 — Hardcoded Secrets
Full scan of `artifacts/`, `lib/`, and root config files. Every sensitive value is accessed exclusively via `process.env.*`:
- `SESSION_SECRET` → `process.env.SESSION_SECRET` (auth.ts:33, middlewares/auth.ts:7, notifications.ts:11)
- `TURNSTILE_SECRET_KEY` → `process.env.TURNSTILE_SECRET_KEY` (turnstileService.ts:1, contact-form.ts:11)
- `RESEND_API_KEY` → `process.env.RESEND_API_KEY` (emailService.ts:5–6, verification.ts:39)
- `DATABASE_URL` → referenced only via Drizzle client config, not hardcoded
- No hardcoded JWT signing keys, database passwords, or private API keys found anywhere in the codebase.

Known-safe public values (GOOGLE_CLIENT_ID, TURNSTILE_SITE_KEY, VAPID_PUBLIC_KEY) are correctly placed in shared env / source where they belong and are **not flagged**.

Demo passwords (00Amer00, Seller@2026, Courier@2026) are documented demo credentials and are **not flagged**.

---

### Task 2 — XSS (remaining patterns)

**`dangerouslySetInnerHTML` in `chart.tsx` (line 79):**
The `__html` content is CSS variable declarations built entirely from an internal `THEMES` config object and a `colorConfig` array derived from chart configuration props — not from user input. Risk: **none**. This is the standard shadcn/ui chart pattern.

**`container.innerHTML = ""` in `AuthModal.tsx` (line 133):**
This clears a hidden `<div>` before Google's OAuth library injects its button into it. The assignment is a DOM reset, not injection of user content. Risk: **none**.

**No `eval()`, `new Function()`, or `document.write()` found** anywhere in `artifacts/marketplace/src/` or `artifacts/mobile/`.

**`tel:` links (`href="tel:${phone}"`):** Phone numbers come from the database (seller/customer phone on orders). Phone numbers stored via the auth flow are validated at registration. Risk: **low** — `tel:` protocol is browser-safe.

**`href={`mailto:${email}`}`:** Email is from server-controlled config const, not user input. Risk: **none**.

---

### Task 3 — JWT Security

**No JWT tokens logged to console** found in `artifacts/marketplace/src/` or `artifacts/api-server/src/`. The `console.log` matches in `searchProcessor.ts` log search query tokens (not auth tokens).

**No JWT decoded on frontend for access decisions.** The `atob()` call in `PushPermissionPrompt.tsx` (line 26) converts a VAPID public key from base64 for the Web Push API — not JWT decoding.

**Admin auth middleware is a router-level guard** — `admin.ts` line 74:
```ts
router.use("/admin", requireAuth, requireRole("admin"));
```
This single `router.use` intercepts **all** `/admin/*` routes defined after it. All admin routes listed after line 74 are protected. The two routes before line 74 (`GET /settings` and the closing `router.use`) are intentionally public (platform settings like exchange rate and flash sale end date — no sensitive data).

**Backend re-verifies JWT on every request** via `requireAuth` middleware (`middlewares/auth.ts`) which calls `jwt.verify()` with the server-side secret. Frontend role display from `useAuth()` hook does not make access decisions — backend always re-checks.

**Rate limiting** is imported and applied on primary auth routes: register (`checkRegisterRateLimit`) and login (`checkLoginRateLimit`). Additionally, Cloudflare Turnstile is required on register, login, and password reset — acting as a second layer of bot protection beyond IP rate limiting.

---

### Task 5 — Environment Variables (frontend)

`grep` of `process.env.*` in `artifacts/marketplace/src/` returned **zero matches** — no server env vars accessed in the browser bundle.

`grep` of `import.meta.env.*` in `artifacts/api-server/src/` returned **zero matches** — no Vite env vars accessed in the Node.js API server.

All `import.meta.env.*` usages in marketplace are Vite built-ins (`BASE_URL`, `DEV`, `PROD`) or correctly-prefixed `VITE_*` vars (`VITE_SUPPORT_PHONE`, `VITE_TURNSTILE_ENABLED`). No server secrets (`SESSION_SECRET`, `DATABASE_URL`, `TURNSTILE_SECRET_KEY`) are accessed via `import.meta.env`.

---

## Summary

| Task | Critical | High | Medium | Info |
|---|---|---|---|---|
| Task 1 — Hardcoded Secrets | 0 | 0 | 0 | 0 |
| Task 2 — XSS Vulnerabilities | 0 | 1 (H1) | 0 | 2 |
| Task 3 — JWT Security | 0 | 0 | 0 | 0 |
| Task 4 — Input Validation | 0 | 5 (H2–H6) | 2 (M2, M3) | 0 |
| Task 5 — Env Var Security | 0 | 0 | 1 (M1) | 0 |
| **TOTAL** | **0** | **6** | **3** | **2** |

### Priority order for remediation

1. **H1** — `href={store.website}` XSS via `javascript:` URL — fix at both API write time and render time
2. **H4** — Admin product creation unvalidated body — admin-only route but high data-integrity risk
3. **H5** — Platform settings unvalidated body — admin-only route but platform-wide impact if exploited
4. **H2** — Courier apply body unvalidated — user-facing route
5. **H3** — Support message body unvalidated — user-facing route, no length limit
6. **H6** — Messaging body unvalidated — user-facing route, attachment size unchecked
7. **M2** — Auth secondary routes (OTP, password reset) use `as` casts instead of Zod
8. **M3** — Delivery zone body unvalidated — admin-only, lower urgency
9. **M1** — `process.env.PORT` in Vite configs — document or rename to prevent accidental activation
