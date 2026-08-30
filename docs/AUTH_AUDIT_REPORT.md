# Authentication Services Audit Report
**Scope:** /Volumes/Os_Sites (Prime, Reid, Dexana, Notyced, Settle, Bargain)  
**Objective:** Standardize all projects to Prime's auth pattern, remove Twilio and social-login, keep only Firebase + Telnyx for SMS, and allow only email / passkey / SMS / OTP auth methods.  
**Status:** Audit complete. No destructive changes have been made yet; see Section 9 for blocker/questions requiring approval before proceeding.

---

## 1. Executive Summary

| Project | Email | Passkey | SMS | OTP | Twilio | Other SMS providers | Social Login | Notes |
|---|---|---|---|---|---|---|---|---|
| **Prime** | ✅ JWT/bcrypt | ✅ WebAuthn | ✅ Telnyx | ✅ Firebase OTP | ⚠️ Present | ⚠️ Vonage also present | ⚠️ next-auth + Google OAuth env vars | **Template after cleanup** |
| **Reid** | ✅ JWT/bcrypt | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Needs passkey/SMS/OTP to match Prime |
| **Dexana** | ✅ JWT/bcrypt | ✅ WebAuthn | ⚠️ Firebase only | ✅ speakeasy TOTP | ❌ code | ❌ | ⚠️ Google OAuth (web + mobile) | Remove Google social login |
| **Notyced** | ✅ JWT/bcrypt + Supabase | ✅ WebAuthn | ⚠️ Twilio + Vonage | ✅ In-house OTP | ⚠️ Present | ⚠️ Vonage present | ⚠️ Google OAuth stub in admin UI | Replace SMS with Firebase/Telnyx; remove Google |
| **Settle** | ✅ JWT/bcrypt | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Very minimal; needs full auth stack to match Prime |
| **Bargain** | ❓ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Only Firebase package installed; no API auth yet |

**Critical finding:** The Prime project itself is not currently compliant with the stated requirements. It contains Twilio, Vonage, `next-auth`, and Google OAuth environment variables. The intended "template" must therefore be **Prime after its own auth cleanup** (removing Twilio/Vonage/social login, keeping email/JWT, WebAuthn, Firebase OTP, and Telnyx SMS).

---

## 2. Prime Project — Template Pattern (Current State)

### 2.1 Auth packages used
- Backend (`prime-api/package.json`):
  - `@nestjs/jwt` (line 33), `@nestjs/passport` (line 35), `passport` (line 64), `passport-jwt` (line 65), `passport-local` (line 66)
  - `bcryptjs` (line 52), `jsonwebtoken` (line 62)
  - `firebase-admin` (line 58), `nodemailer` (line 63), `resend` not listed here but used in `email.service.ts`
  - `@simplewebauthn/browser` (line 42), `@simplewebauthn/server` (line 43) → passkey
  - **Twilio** (line 76) ❌
- Web (`prime-web/package.json`):
  - `next-auth` (line 63) ❌
  - `@simplewebauthn/browser` (line 38), `@simplewebauthn/server` (line 39)
  - `firebase` (line 55), `firebase-admin` (line 56)
  - `bcrypt` (line 50), `bcryptjs` (line 51)
  - **Twilio** (line 84) ❌
- Mobile (`prime-mobile/apps/driver-app/package.json`):
  - `firebase` (line 49), `@simplewebauthn/browser` (line 67)

### 2.2 Auth services implemented
- **Email/JWT:** `prime-api/src/services/auth-service/services/auth.service.ts` (bcrypt + JWT tokens, login/register)
- **Passkey:** `prime-api/src/auth/webauthn.service.ts`, `prime-api/src/auth/webauthn.controller.ts`, `prime-web/app/api/webauthn/*`
- **SMS:** `prime-api/src/services/mobile-bff/services/telnyx.service.ts` (Telnyx), `twilio.service.ts` (Twilio), `vonage.service.ts` (Vonage)
- **OTP:** `prime-mobile/apps/driver-app/services/firebaseAuth.js` and `verify-phone.tsx` use Firebase phone auth
- **Email delivery:** `prime-api/src/email/email.service.ts` (Resend + Nodemailer)
- **Social/NextAuth:** `prime-web/app/lib/auth.ts` uses `next-auth` with a mock credentials provider; no live Google/GitHub/Facebook providers found in code, but Google OAuth env vars exist in EAS config and `.env.example`.

### 2.3 Twilio usage in Prime
- `prime-api/src/services/mobile-bff/services/twilio.service.ts` (full Twilio SMS client)
- `prime-api/src/services/auth-service/services/auth.service.ts` lines 98-103 (fallback to Twilio after Telnyx)
- `prime-api/src/services/mobile-bff/services/mobile-bff.service.ts` lines 532-566 (Twilio fallback in dispatch/job-offer SMS)
- `prime-web/app/api/messaging/send/route.ts` (Twilio API for sending messages)
- `prime-web/app/services/smsService.ts` (Twilio client)
- `prime-web/app/services/notificationService.ts` lines 112-113
- `prime-web/app/admin/integrations/page.tsx` line 365 (Twilio integration UI)
- Env vars: `.env.example` lines 37-41; `.env.production.example` does not include Twilio but does include VONAGE.

### 2.4 Vonage usage in Prime (also not allowed)
- `prime-api/src/services/mobile-bff/services/vonage.service.ts`
- `prime-api/src/services/mobile-bff/controllers/mobile-bff.controller.ts` lines 15, 23
- `prime-api/src/services/mobile-bff/mobile-bff.module.ts` lines 6, 15, 19
- `prime-api/src/services/auth-service/auth.module.ts` line 30
- `prime-api/.env.production.example` lines 54-57
- `prime-web/app/api/jobs/dispatch/route.ts` lines 231-261
- `prime-api/scripts/test-vonage-sms.ts`

### 2.5 Social-login-related items in Prime
- `prime-web/app/lib/auth.ts` — `next-auth` mock provider (lines 1-4, 49-98)
- `.env.example` lines 23-27: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `prime-mobile/apps/driver-app/eas.json`, `client-app/eas.json`, `fleet-app/eas.json` — all include `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (for Google Sign-In build config)
- No live Google/GitHub/Facebook/Apple OAuth provider code found in `prime-web/app`, but the env vars and EAS configuration are present and should be removed per requirements.

### 2.6 Environment variables used (auth/SMS/email)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_SECRET`
- `NEXT_PUBLIC_WEB_AUTHN_RP_ID`, `NEXT_PUBLIC_WEB_AUTHN_ORIGIN`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` ❌
- `VONAGE_API_KEY`, `VONAGE_API_SECRET`, `VONAGE_PHONE_NUMBER` ❌
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` ❌
- `RESEND_API_KEY`, `ADMIN_EMAIL`

### 2.7 Target Prime template (after cleanup)
- **Email auth:** NestJS JWT + bcrypt + Resend/Nodemailer
- **Passkey:** `@simplewebauthn` backend + frontend
- **SMS:** Telnyx REST API only
- **OTP:** Firebase phone auth (mobile) + backend OTP verification endpoint
- **No Twilio, no Vonage, no next-auth, no Google/Facebook/GitHub/Apple OAuth**

---

## 3. Reid Project

### 3.1 Auth packages
- `reid-api/package.json`: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `passport-local`, `bcryptjs`, `@supabase/supabase-js`
- `reid-web/apps/web/package.json`: `bcryptjs`, `jose`, `resend`, `zod`
- `packages/shared-auth/package.json`: `jose`
- No Twilio, no Firebase, no Telnyx, no simplewebauthn, no social-login packages.

### 3.2 Auth implementation
- Backend: `reid-api/src/auth/auth.module.ts` (JwtModule + PassportModule + JwtStrategy)
- Web: `reid-web/apps/web/contexts/AuthContext.tsx` (localStorage token + `/auth/login`, `/auth/register`, `/auth/session`)
- Shared SDK: `packages/shared-auth/src/auth-client.ts` (token storage, refresh, password reset)
- No passkey, no SMS, no OTP.

### 3.3 Differences from Prime target
- Reid is the closest to Prime's *email/JWT* pattern but lacks WebAuthn/passkey, SMS, and OTP.
- Uses `jose` instead of `jsonwebtoken` on the client; this is acceptable but not identical to Prime.

### 3.4 Planned changes to match Prime
- Add `@simplewebauthn/browser`/`server` to web + API.
- Add Telnyx service to API and/or Firebase OTP package for SMS/OTP.
- Add backend passkey endpoints and frontend passkey registration/login flow.
- Keep existing JWT/bcrypt email auth unchanged.
- No social login or Twilio to remove.

---

## 4. Dexana Project

### 4.1 Auth packages
- `dexana-api/package.json`: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `bcryptjs`, `jsonwebtoken`, `nodemailer`, `resend`, `@simplewebauthn/browser`, `@simplewebauthn/server`, `speakeasy` (TOTP), `google-auth-library` ⚠️, `@supabase/supabase-js`
- `dexana-web/package.json`: `google-auth-library` ⚠️, `jsonwebtoken`, `jose`, `bcryptjs`, `@supabase/supabase-js`
- `dexana-mobile/package.json`: `@react-native-google-signin/google-signin` ⚠️, `firebase`, `react-native-passkeys`, `react-native-biometrics`, `@react-native-async-storage/async-storage`
- `packages/@dexana/auth/package.json`: shared auth package with optional `firebase`

### 4.2 Social login usage (must be removed)
- `dexana-mobile/services/socialAuth.ts` (lines 13-259) — Google + Apple sign-in logic
- `dexana-mobile/app/LoginScreen.tsx` lines 41, 145, 229, 232
- `dexana-mobile/app/SignupScreen.tsx` lines 64, 234, 239, 534
- `dexana-mobile/shared-services/googleAuthService.ts` lines 107, 126, 169, 170
- `dexana-web/app/login/page.tsx` lines 8, 10, 25, 26, 139, 144, 300, 474 — Google OAuth UI/flow
- `dexana-web/app/services/googleAuthService.ts` and `dexana-web/shared-services/googleAuthService.ts`
- `dexana-web/components/auth/EnhancedSignIn.tsx` lines 86, 148
- `dexana-web/lib/google-client-id.ts` line 17
- `dexana-api/src/auth/dto/google-oauth.dto.ts`
- `dexana-api/src/auth/services/oauth.service.ts` lines 6, 72, 126, 178, 199, 293, 294, 347, 348
- `dexana-api/src/auth/audit.service.ts` line 216
- `dexana-mobile/app.json` line 47 — Google client ID

### 4.3 Passkey / OTP / SMS
- Passkey: `dexana-api` has `@simplewebauthn`; `dexana-mobile` has `react-native-passkeys`; `dexana-web/services/webAuth.ts` (or similar) likely exists.
- OTP: `dexana-api` uses `speakeasy` for TOTP (not SMS OTP).
- SMS: No Telnyx package. Firebase is present but appears used for mobile auth, not SMS delivery. No Twilio package or code references found outside Supabase config/docs.
- `dexana-web/supabase/config.toml` lines 267-273 mention Twilio in Supabase config but that is not application code.

### 4.4 Differences from Prime target
- Has Google social login (web + mobile) that must be removed.
- Has no Telnyx SMS; Firebase is present but not wired as Prime's SMS pattern.
- Uses `speakeasy` TOTP instead of Prime's Firebase phone OTP pattern.

### 4.5 Planned changes
- Remove `@react-native-google-signin/google-signin`, `google-auth-library`, `react-native-passkeys` (if passkey is replaced by WebAuthn consistent with Prime), and all Google OAuth code.
- Remove Google OAuth DTO, service, and audit references.
- Replace TOTP/social flow with Prime's email + passkey + Firebase OTP + Telnyx SMS pattern.
- Update `dexana-mobile/app.json` to remove Google client ID.

---

## 5. Notyced Project

### 5.1 Auth packages
- `notyced-api/package.json`: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `bcryptjs`, `jsonwebtoken`, `jose`, `nodemailer`, `resend`, `@simplewebauthn/server`, `@supabase/supabase-js`
- `notyced-web/package.json`: `@react-oauth/google` ⚠️, `@supabase/supabase-js`, `axios`, `zod`
- `notyced-mobile/package.json`: no social-login packages; minimal auth dependencies
- `notyced-web/services/passkeyService.ts` — passkey service exists

### 5.2 Twilio / Vonage usage (must be removed)
- `notyced-api/src/auth/sms-auth.service.ts` lines 27-31, 121-188, 206-235 — Twilio Verify + Twilio Messages API fallback
- `notyced-api/src/notifications/notifications.controller.ts` lines 53-88 — Twilio SMS send endpoint
- `notyced-web/app/api/notifications/sms/route.ts` line 13 — comment references Twilio and forwards to backend
- `notyced-api/supabase/config.toml` and `notyced-web/supabase/config.toml` — Twilio config entries
- `notyced-api/src/auth/sms-auth.service.ts` lines 14-25, 83-118 — **Vonage** also used for SMS ❌
- `.env.local` did not surface `TWILIO_*` or `VONAGE_*` in the grep, but the code expects them; they likely exist in `notyced-api/.env` or are set in production.

### 5.3 Social login usage (must be removed)
- `notyced-web/package.json` line 18: `@react-oauth/google`
- `notyced-web/app/admin/login/page.tsx` lines 18, 19, 119 — `googleAuthService` stub; UI has Google button; lines 114-159 handle Google sign-in fallback
- The Google service is currently a stub that always returns "Not configured", but the package and UI code are present and should be removed.

### 5.4 Auth methods currently implemented
- Email/JWT: yes (via `notyced-api`)
- Passkey: yes (`notyced-web/services/passkeyService.ts`, used in admin login)
- SMS/OTP: yes, but via Twilio + Vonage, not Firebase/Telnyx
- Social: Google stub only

### 5.5 Planned changes
- Replace `sms-auth.service.ts` and `notifications.controller.ts` SMS logic with Telnyx and/or Firebase OTP.
- Remove `@react-oauth/google` package and Google sign-in button from `admin/login/page.tsx`.
- Remove Vonage/Twilio env vars from all `.env*` files and docs.
- Keep existing passkey and email/JWT flow.

---

## 6. Settle Project

### 6.1 Auth packages
- `settle-api/package.json`: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `passport-local`, `bcrypt`, `typeorm`
- `settle-web/package.json`: only `@settle/shared-sdk`, `next`, `react`
- `settle-mobile/package.json`: minimal Expo deps + `@settle/shared-sdk`
- `packages/shared-sdk/package.json`: exports `./auth` but currently has no auth dependencies
- No Twilio, no Firebase, no Telnyx, no simplewebauthn, no social-login packages.

### 6.2 Auth implementation
- Backend: standard NestJS JWT + Passport (see `settle-api/src/auth` if exists; packages confirm the pattern)
- Web/Mobile: rely on `@settle/shared-sdk` auth exports, but the shared SDK is empty.
- No passkey, no SMS, no OTP.

### 6.3 Differences from Prime target
- Very minimal; has only email/JWT scaffolding. Missing passkey, SMS, and OTP entirely.
- `AGENTS.md` explicitly states the project follows Prime's standardization, so bringing it up to Prime's full auth pattern is the intended direction.

### 6.4 Planned changes
- Add `@simplewebauthn` to API and web.
- Add Telnyx service to API for SMS and Firebase OTP to mobile/web for phone verification.
- Populate `@settle/shared-sdk/auth` with auth utilities matching Prime's shared SDK pattern.
- Keep existing email/JWT structure.

---

## 7. Bargain Project

### 7.1 Auth packages
- `bargain-web/package.json`: `firebase`, `next`, `react`
- `bargain-api` directory exists but has no `package.json` — backend not yet implemented.
- `packages/shared/package.json`: minimal config package only.
- No Twilio, no social-login packages.

### 7.2 Auth implementation
- `bargain-web` has Firebase installed but no visible auth pages or services in the provided package list.
- `.env.example` includes Firebase and Resend vars but no JWT or passkey vars.
- No backend auth implementation to audit.

### 7.3 Differences from Prime target
- Bargain is the least mature. It needs a full auth stack built to Prime's pattern if auth is required.

### 7.4 Planned changes
- Since `bargain-api` is not yet implemented, the scope is to **not create** a new auth system unless explicitly required. Document current state and recommend following Prime's pattern when auth is added.
- If the user confirms auth is needed, implement: NestJS JWT email auth, WebAuthn passkey, Firebase OTP, Telnyx SMS.

---

## 8. Cross-Project Package & Environment Changes (Planned)

### 8.1 Packages to remove
| Package | Projects using it | Reason |
|---|---|---|
| `twilio` | Prime (`prime-api`, `prime-web`) | Disallowed SMS provider |
| `next-auth` | Prime (`prime-web`) | Not part of Prime target pattern; mock provider only |
| `google-auth-library` | Dexana (`dexana-api`, `dexana-web`) | Google OAuth verification |
| `@react-native-google-signin/google-signin` | Dexana (`dexana-mobile`) | Google social login |
| `@react-oauth/google` | Notyced (`notyced-web`) | Google social login stub |

### 8.2 Packages to add (to match Prime's pattern)
| Package | Target projects | Reason |
|---|---|---|
| `@simplewebauthn/browser` | Reid, Settle, Bargain web; Dexana web if not already present | Passkey frontend |
| `@simplewebauthn/server` | Reid, Settle, Notyced (already has it), Dexana (already has it) | Passkey backend |
| `firebase` / `firebase-admin` | Reid, Settle, Bargain | OTP / mobile auth |
| Telnyx API client (or custom axios service) | Reid, Settle, Notyced, Dexana if needed | SMS delivery |
| `nodemailer` / `resend` | Settle, Bargain | Email auth / password reset |

### 8.3 Environment variables to remove
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_VERIFY_SERVICE_SID` — all projects
- `VONAGE_API_KEY`, `VONAGE_API_SECRET`, `VONAGE_PHONE_NUMBER`, `VONAGE_BRAND_NAME`, `VONAGE_FROM_NUMBER` — Prime, Notyced
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID` — Prime, Dexana, Notyced
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` — Prime

### 8.4 Environment variables to keep / standardize
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` / `JWT_EXPIRATION`
- `NEXT_PUBLIC_WEB_AUTHN_RP_ID`, `NEXT_PUBLIC_WEB_AUTHN_RP_ORIGIN` (or equivalent)
- `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- `TELNYX_API_KEY`, `TELNYX_PHONE_NUMBER`, `TELNYX_CAMPAIGN_ID`
- `RESEND_API_KEY`, `ADMIN_EMAIL`, `FRONTEND_URL` / `NEXT_PUBLIC_APP_URL`

---

## 9. Issues, Blockers & Clarifications Required

Before making any destructive changes, the following questions need answers from the project owner:

1. **Prime is not currently compliant.** It contains Twilio, Vonage, `next-auth`, and Google OAuth environment variables. Should Prime be cleaned up first and then used as the template, or should the other projects be aligned to Prime's *current* (non-compliant) state?
   - *Recommended interpretation:* Clean Prime first (remove Twilio/Vonage/social login), then use the cleaned Prime as the template.

2. **SMS implementation detail.** The requirement says "Keep Firebase and Telnyx for SMS services ONLY." Prime currently uses Telnyx for backend SMS but does **not** use Firebase for SMS delivery; Firebase is used for OTP/mobile auth. Should the standard be:
   - SMS notifications → Telnyx only, or
   - SMS notifications → Telnyx + Firebase (both providers available), or
   - Firebase OTP + Telnyx transactional SMS (the Prime hybrid)?

3. **Adding missing auth methods to immature projects.** Reid, Settle, and Bargain lack passkey/SMS/OTP. Should these be **added** to match Prime, or should only obvious cleanup (Twilio/social removal) be performed and the gaps documented?
   - *Note:* The instructions say "If a project doesn't have auth, note it but don't create it unless it's clearly needed." Reid and Settle have auth but are missing methods. Bargain's backend auth is not yet implemented.

4. **Supabase auth dependency.** Several projects (Reid, Dexana, Notyced, Prime) include `@supabase/supabase-js`. Supabase can provide its own auth (including OAuth). Should Supabase auth be disabled/removed, and only the local JWT/Firebase/Telnyx pattern be used?

5. **Lockfile regeneration.** All projects are pnpm monorepos except Bargain (mixed pnpm/npm). Removing packages will require regenerating `pnpm-lock.yaml` and possibly `package-lock.json`. Should lockfiles be updated in this pass or left for a separate dependency-sync step?

6. **Build/test verification.** These projects have complex builds (Next.js, NestJS, Expo). After removing packages and code, type-check/build failures are likely. Should the scope include fixing build errors, or only file edits?

---

## 10. Recommendations & Next Steps

1. **Approve the Prime-first cleanup interpretation.** Remove Twilio, Vonage, `next-auth`, and Google OAuth env vars from Prime first; use the resulting pattern as the true template.
2. **Phase 3 (Remove Twilio):** Start with Notyced (most Twilio/Vonage code), then Prime.
3. **Phase 4 (Remove Social Login):** Start with Dexana (most comprehensive social login), then Notyced, then Prime env vars.
4. **Phase 5 (Standardize):** Add passkey/SMS/OTP to Reid and Settle; leave Bargain pending unless auth is explicitly required.
5. **Phase 6 (Verify):** After each project, run `pnpm install`, `pnpm build` (or `tsc --noEmit`), and relevant tests to catch regressions.
6. **Create a follow-up task** for runtime integration tests of the new Firebase/Telnyx SMS flows, since these require live provider credentials.

---

## 11. Appendix — Key File Index

### Prime
- `prime-api/src/services/auth-service/services/auth.service.ts`
- `prime-api/src/auth/webauthn.service.ts`
- `prime-api/src/auth/webauthn.controller.ts`
- `prime-api/src/services/mobile-bff/services/telnyx.service.ts`
- `prime-api/src/services/mobile-bff/services/twilio.service.ts`
- `prime-api/src/services/mobile-bff/services/vonage.service.ts`
- `prime-api/src/services/mobile-bff/mobile-bff.module.ts`
- `prime-web/app/lib/auth.ts`
- `prime-web/app/api/messaging/send/route.ts`
- `prime-mobile/apps/driver-app/services/firebaseAuth.js`
- `.env.example`
- `prime-api/.env.production.example`

### Reid
- `reid-api/src/auth/auth.module.ts`
- `reid-api/src/auth/strategies/jwt.strategy.ts`
- `packages/shared-auth/src/auth-client.ts`
- `reid-web/apps/web/contexts/AuthContext.tsx`
- `reid-api/.env.example`

### Dexana
- `dexana-api/src/auth/services/oauth.service.ts`
- `dexana-api/src/auth/dto/google-oauth.dto.ts`
- `dexana-mobile/services/socialAuth.ts`
- `dexana-mobile/app/LoginScreen.tsx`
- `dexana-mobile/app/SignupScreen.tsx`
- `dexana-web/app/login/page.tsx`
- `dexana-web/app/services/googleAuthService.ts`
- `dexana-mobile/app.json`

### Notyced
- `notyced-api/src/auth/sms-auth.service.ts`
- `notyced-api/src/notifications/notifications.controller.ts`
- `notyced-web/app/api/notifications/sms/route.ts`
- `notyced-web/app/admin/login/page.tsx`
- `notyced-web/services/passkeyService.ts`

### Settle
- `settle-api/package.json` (auth scaffolding)
- `packages/shared-sdk/package.json` (empty auth exports)
- `.env.example`

### Bargain
- `bargain-web/package.json`
- `bargain-api/.env.example` (no `package.json` yet)
- `.env.example`

---

*Report generated by AI agent during Phase 1–2 audit. No source-code changes have been committed yet.*
