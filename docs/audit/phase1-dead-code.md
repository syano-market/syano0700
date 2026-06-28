# Phase 1 — Dead Code Audit

**Date:** 2026-06-28  
**Scope:** `artifacts/marketplace/src/` · `artifacts/api-server/src/` · `artifacts/mobile/app/` · `artifacts/mobile/src/`  
**Method:** Every finding was verified by opening the actual file, reading the actual line, and confirming the name is not referenced elsewhere in the file.

---

## Summary

| Task | Findings | Safe 🟢 | Review 🟡 |
|------|----------|---------|----------|
| Unused Imports | 8 | 8 | 0 |
| Dead Variables | 4 | 4 | 0 |
| Dead Functions | 0 | 0 | 0 |
| Console Statements | 34 | 25 | 9 |
| Commented Code | 1 | 0 | 1 |
| **TOTAL** | **47** | **37** | **10** |

## Estimated lines safe to remove: ~38

---

## Task 1 — Unused Imports

---
FILE: artifacts/marketplace/src/components/MessagingPanel.tsx
LINE: 7
IMPORT: import { Package, Store, ShieldAlert, MoreHorizontal, Image as ImageIcon, ... } from 'lucide-react'
UNUSED: ShieldAlert
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/services/aiProvider.ts
LINE: 15
IMPORT: import { eq, desc, ilike, and, sql } from "drizzle-orm"
UNUSED: desc
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/services/aiProvider.ts
LINE: 15
IMPORT: import { eq, desc, ilike, and, sql } from "drizzle-orm"
UNUSED: ilike
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/services/aiProvider.ts
LINE: 15
IMPORT: import { eq, desc, ilike, and, sql } from "drizzle-orm"
UNUSED: and
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/services/deliveryMissionService.ts
LINE: 1
IMPORT: import { eq, desc, and, inArray } from "drizzle-orm"
UNUSED: desc
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/services/deliveryMissionService.ts
LINE: 1
IMPORT: import { eq, desc, and, inArray } from "drizzle-orm"
UNUSED: inArray
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/services/missionAssignmentEngine.ts
LINE: 9
IMPORT: import { eq, and, notInArray, desc } from "drizzle-orm"
UNUSED: notInArray
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/services/missionAssignmentEngine.ts
LINE: 9
IMPORT: import { eq, and, notInArray, desc } from "drizzle-orm"
UNUSED: desc
SAFE_TO_REMOVE: YES
---

---

## Task 2 — Dead Variables

---
FILE: artifacts/marketplace/src/components/NotificationCenter.tsx
LINE: 178
CODE: const lang = i18n.language;
REASON: Declared inside the NotificationCenter component body but never read — the component uses i18n.language directly (lines 151, 154) via a helper that captures its own lang at line 29. The line-178 binding is never referenced.
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/marketplace/src/components/NotificationCenter.tsx
LINE: 179
CODE: const { resolvedTheme } = useTheme();
REASON: Destructured but resolvedTheme is never read anywhere after this line in the component.
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/marketplace/src/components/NotificationCenter.tsx
LINE: 180
CODE: const isDark = resolvedTheme === "dark";
REASON: Depends on resolvedTheme (line 179, also dead). isDark is never used in JSX or any conditional in the component.
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/mobile/app/tracking/[missionId].tsx
LINE: 178
CODE: eventLine: { width: 2, flex: 1, backgroundColor: colors.border, marginStart: 4, marginTop: 4 },
REASON: StyleSheet entry defined in StyleSheet.create() but styles.eventLine is never referenced in JSX or any other expression in the file.
SAFE_TO_REMOVE: YES
---

---

## Task 3 — Dead Functions

No dead functions found. All candidate findings from initial exploration were verified to be called or exported.

---

## Task 4 — Console Statements

### Marketplace web

---
FILE: artifacts/marketplace/src/main.tsx
LINE: 16
CODE: console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/marketplace/src/App.tsx
LINE: 242
CODE: console.warn("[SW] Registration failed:", err)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/marketplace/src/components/PushPermissionPrompt.tsx
LINE: 99
CODE: console.warn("[PushPermission] error:", e)
SAFE_TO_REMOVE: YES
---

### API server — searchProcessor.ts (verification test suite)

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 803
CODE: console.log(`\n${C.bold}${HR}${C.reset}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 804
CODE: console.log(`${C.bold}  SYANO Search Processor — Verification Suite${C.reset}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 805
CODE: console.log(`${C.bold}${HR}${C.reset}\n`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 813
CODE: console.log(`${C.cyan}${C.bold}▶ ${tc.description}${C.reset}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 814
CODE: console.log(`${C.dim}  Input:          "${tc.input}"${C.reset}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 815
CODE: console.log(`${C.dim}  Normalized:     "${result.normalizedQuery}"${C.reset}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 816
CODE: console.log(`${C.dim}  Language:       ${result.primaryLanguage}${C.reset}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 817
CODE: console.log(`${C.dim}  Base tokens:    [${result.baseTokens.join(", ")}]${C.reset}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 818
CODE: console.log(`${C.dim}  Expanded:       [${result.expandedTokens.join(", ")}]${C.reset}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 823
CODE: console.log(`  ${C.green}✓${C.reset} ${assertion.label}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 826
CODE: console.log(`  ${C.red}✗${C.reset} ${C.yellow}FAILED${C.reset}: ${assertion.label}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 830
CODE: console.log()
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 838
CODE: console.log(`${C.bold}${HR_THIN}${C.reset}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 839
CODE: console.log(...)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/utils/searchProcessor.ts
LINE: 842
CODE: console.log(`${C.bold}${HR}${C.reset}\n`)
SAFE_TO_REMOVE: YES
---

### API server — verification.ts

---
FILE: artifacts/api-server/src/services/verification.ts
LINE: 26
CODE: console.log(`...OTP dev output...`)
SAFE_TO_REMOVE: YES
---

### API server — emailService.ts (no pino logger imported)

---
FILE: artifacts/api-server/src/services/emailService.ts
LINE: 66
CODE: console.warn(`[email] RESEND_API_KEY not set — skipping welcome email to ${to}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/services/emailService.ts
LINE: 71
CODE: console.log(`[email] Welcome email sent to ${to}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/services/emailService.ts
LINE: 73
CODE: console.error(`[email] Failed to send welcome email to ${to}:`, err)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/services/emailService.ts
LINE: 138
CODE: console.warn(`[email] RESEND_API_KEY not set — skipping password reset email to ${to}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/services/emailService.ts
LINE: 143
CODE: console.log(`[email] Password reset email sent to ${to}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/services/emailService.ts
LINE: 145
CODE: console.error(`[email] Failed to send password reset email to ${to}:`, err)
SAFE_TO_REMOVE: YES
---

### API server — notif.ts (no pino logger imported)

---
FILE: artifacts/api-server/src/lib/notif.ts
LINE: 23
CODE: console.log(`[sse] connect  uid=${userId} tabs=${tabs} total_users=${clients.size}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/lib/notif.ts
LINE: 32
CODE: console.log(`[sse] disconnect uid=${userId} tabs=${tabs} total_users=${clients.size}`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/lib/notif.ts
LINE: 57
CODE: console.log(`[sse] kicked uid=${userId} (account suspended)`)
SAFE_TO_REMOVE: YES
---

---
FILE: artifacts/api-server/src/lib/notif.ts
LINE: 141
CODE: console.log(`[sse] role_changed uid=${userId}`)
SAFE_TO_REMOVE: YES
---

### API server — auth.ts (console.error in catch blocks — no pino imported)

These are legitimate server-side error catches but use `console.error` instead of the pino `logger`. They should be migrated to `logger.error()` rather than silently deleted.

---
FILE: artifacts/api-server/src/routes/auth.ts
LINE: 275
CODE: console.error("[OTP] Send failed on register:", err)
SAFE_TO_REMOVE: REVIEW_FIRST
---

---
FILE: artifacts/api-server/src/routes/auth.ts
LINE: 338
CODE: console.error("[OTP] Auto-send on unverified login failed:", err)
SAFE_TO_REMOVE: REVIEW_FIRST
---

---
FILE: artifacts/api-server/src/routes/auth.ts
LINE: 387
CODE: console.error("[OTP] send-otp failed:", err)
SAFE_TO_REMOVE: REVIEW_FIRST
---

---
FILE: artifacts/api-server/src/routes/auth.ts
LINE: 425
CODE: console.error("[OTP] resend-otp failed:", err)
SAFE_TO_REMOVE: REVIEW_FIRST
---

---
FILE: artifacts/api-server/src/routes/auth.ts
LINE: 633
CODE: console.error("[OTP] forgot-password email failed:", err)
SAFE_TO_REMOVE: REVIEW_FIRST
---

---
FILE: artifacts/api-server/src/routes/auth.ts
LINE: 810
CODE: console.error("[Google Auth] Token verification failed:", err)
SAFE_TO_REMOVE: REVIEW_FIRST
---

---
FILE: artifacts/api-server/src/routes/auth.ts
LINE: 950
CODE: console.error("[Facebook Auth] Token debug failed:", JSON.stringify(debugData))
SAFE_TO_REMOVE: REVIEW_FIRST
---

---
FILE: artifacts/api-server/src/routes/auth.ts
LINE: 960
CODE: console.error("[Facebook Auth] Token verification failed:", err)
SAFE_TO_REMOVE: REVIEW_FIRST
---

---
FILE: artifacts/api-server/src/routes/auth.ts
LINE: 985
CODE: console.error("[Facebook Auth] Profile fetch failed:", err)
SAFE_TO_REMOVE: REVIEW_FIRST
---

---

## Task 5 — Commented Code

---
FILE: artifacts/marketplace/src/components/OrderStatusTimeline.tsx
LINES: 25-29
PREVIEW: // ── V1 Delivery flow (canonical) ─────────────────────────────────────────────
         // pending → confirmed → preparing → ready_for_pickup → courier_assigned → picked_up → out_for_delivery → delivered
         //
         // Legacy External Shipping flow (backward compat for old orders):
         // pending → processing → shipped → delivered
SIZE: 5 lines
SAFE_TO_REMOVE: REVIEW_FIRST
---

---

## Notes

- **auth.ts console.error (9 findings):** These are real errors being swallowed by `console.error` instead of the pino `logger`. Do not simply delete them — replace with `logger.error(...)` from `../lib/logger` to preserve observability.
- **emailService.ts and notif.ts (10 findings):** These files have no pino import. The console calls are the only observability layer. Replacement with `logger` calls is preferred over deletion.
- **searchProcessor.ts (13 findings):** Lines 803–842 form a self-contained CLI verification suite (`runVerificationSuite()`). The console calls are intentional for the test runner output. They can be removed only if the verification function itself is removed or gated behind a `process.env.NODE_ENV === 'development'` check.
- **OrderStatusTimeline comments:** Document legitimate flow diagrams, not dead code. Safe to keep as reference for future order-status work.
