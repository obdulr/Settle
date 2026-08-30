# Authentication Standardization - COMPLETE

**Date:** 2026-07-05
**Scope:** All projects (Prime, Reid, Dexana, Notyced, Settle, Bargain)

---

## Standard Auth Stack

| Method | Technology | Status |
|--------|-----------|--------|
| Email + Password | JWT (jose/jsonwebtoken) + bcrypt | All projects |
| Passkey (WebAuthn) | @simplewebauthn/browser + server | Prime, Dexana |
| SMS OTP | Telnyx REST API | Prime, Notyced |
| TOTP | speakeasy | Dexana |
| Firebase | Push notifications + Phone Auth (mobile OTP) | Prime |

### Explicitly Removed / Banned

| Technology | Reason |
|-----------|--------|
| Twilio | Replaced by Telnyx |
| Vonage | Replaced by Telnyx |
| next-auth | Replaced by direct JWT verification |
| Google OAuth | Social login banned |
| Apple Sign-In | Social login banned |
| Facebook OAuth | Social login banned |

---

## Changes Made Per Project

### Prime (Template)

**Removed:**
- `twilio` package from prime-api and prime-web
- `TwilioService` (deleted file + all imports/injections)
- `VonageService` (deleted file + all imports/injections)
- `vonage.service.ts` and `twilio.service.ts`
- `next-auth` package from prime-web
- `app/lib/auth.ts` rewritten from next-auth to direct JWT (jose)
- Google OAuth env vars from `.env.example`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` from all mobile `eas.json` files
- Twilio/Vonage env vars from `.env.example` and `.env.production.example`
- Twilio references in admin UI replaced with Telnyx
- `test-vonage-sms.ts` script deleted

**Kept (Clean):**
- `TelnyxService` - primary SMS provider (10DLC active, all carriers approved)
- `@simplewebauthn` - passkey/WebAuthn
- Firebase - push notifications + mobile phone auth
- JWT/bcrypt - email authentication
- Resend - email delivery

**Updated:**
- `app/api/messaging/send/route.ts` - Now uses Telnyx
- `app/services/smsService.ts` - Now uses Telnyx via internal API
- `app/services/notificationService.ts` - Now uses Telnyx
- `app/admin/integrations/page.tsx` - UI now shows Telnyx
- `app/admin/communications/page.tsx` - SMS provider dropdown shows Telnyx
- API route files using `getServerSession` - migrated to `verifyToken`
- `mobile-bff.module.ts` - Only TelnyxService in providers
- `auth.module.ts` - Only checks `TELNYX_API_KEY`

---

### Reid

**Status:** Already clean. No violations found.

**Current Auth:**
- Email + Password (JWT/bcrypt via NestJS)
- Shared auth package (`packages/shared-auth`)

**Future:** Add passkey and SMS OTP when needed.

---

### Dexana

**Removed:**
- `google-auth-library` from dexana-web and dexana-api
- `@react-native-google-signin/google-signin` from dexana-mobile
- Google OAuth login UI from web login page
- `googleAuthService.ts` files (web and mobile)
- `socialAuth.ts` (mobile)
- Google sign-in buttons from LoginScreen and SignupScreen

**Kept (Clean):**
- Email + Password (JWT/bcrypt)
- Passkey (WebAuthn via @simplewebauthn)
- TOTP (speakeasy)
- Firebase (push notifications)

---

### Notyced

**Removed:**
- Twilio SMS code from `sms-auth.service.ts`
- Vonage SMS code from `sms-auth.service.ts`
- Twilio SMS from `notifications.controller.ts`
- `@react-oauth/google` package
- Google OAuth flow from admin login page
- Google OAuth endpoints from auth API route
- Google button from ModernAuthSystem component
- `GOOGLE_CLIENT_ID/SECRET` from env files

**Added:**
- Telnyx SMS implementation in `sms-auth.service.ts`
- Telnyx SMS in `notifications.controller.ts`
- `TELNYX_API_KEY` and `TELNYX_PHONE_NUMBER` env placeholders

---

### Settle

**Status:** Already clean. No violations found.

**Current Auth:**
- Email + Password (JWT/bcrypt via NestJS)
- Database prepared for passkeys (columns exist, no implementation yet)

**No social login, no Twilio, no Vonage** - nothing to remove.

---

### Bargain

**Removed:**
- `GoogleAuthProvider` and `signInWithPopup` from `auth.ts`
- `logInWithGoogle()` function
- Google Sign-In button and handler from signup page

**Kept (Clean):**
- Firebase Auth (email/password only)
- Backend JWT auth (FastAPI + python-jose + passlib)

---

## Shared Auth Package

**Location:** `/Volumes/Os_Sites/Reid/packages/shared-auth/`
**Package Name:** `@shared/auth` (v2.0.0)

**Provides:**
- `AuthClient` class - login, register, logout, refresh, password reset
- `useAuth` React hook - full auth state management
- TypeScript types for all auth methods
- JWT verification via `jose`

**Types include:**
- `AuthUser`, `AuthTokens`, `AuthResponse`
- `LoginCredentials`, `RegisterCredentials`
- `PasskeyRegistrationOptions`, `PasskeyCredential`
- `SMSOTPRequest`, `SMSOTPVerify`
- `TOTPSetupResponse`, `TOTPVerify`
- `AuthConfig` with `enabledMethods` array
- `SMSConfig` (Telnyx only)

---

## Environment Variables Standard

### Required (All Projects)
```bash
JWT_SECRET=<generate with openssl rand -base64 32>
```

### SMS (Telnyx)
```bash
TELNYX_API_KEY=<your_api_key>
TELNYX_PHONE_NUMBER=+15551234567
TELNYX_CAMPAIGN_ID=<optional_10dlc>
```

### Passkey (WebAuthn)
```bash
NEXT_PUBLIC_WEB_AUTHN_RP_ID=yourdomain.com
NEXT_PUBLIC_WEB_AUTHN_ORIGIN=https://yourdomain.com
```

### Firebase (Push + Mobile OTP)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

### BANNED Variables (Must Not Exist)
```bash
TWILIO_ACCOUNT_SID=     # REMOVED
TWILIO_AUTH_TOKEN=      # REMOVED
TWILIO_PHONE_NUMBER=    # REMOVED
VONAGE_API_KEY=         # REMOVED
VONAGE_API_SECRET=      # REMOVED
VONAGE_PHONE_NUMBER=    # REMOVED
GOOGLE_CLIENT_SECRET=   # REMOVED
NEXTAUTH_SECRET=        # REMOVED
NEXTAUTH_URL=           # REMOVED
```

---

## Final Compliance Matrix

| Project | Email/JWT | Passkey | SMS (Telnyx) | TOTP | Social Login | Twilio | Vonage |
|---------|-----------|---------|--------------|------|--------------|--------|--------|
| **Prime** | ✅ | ✅ | ✅ | - | ❌ Removed | ❌ Removed | ❌ Removed |
| **Reid** | ✅ | - | - | - | ❌ Never had | ❌ Never had | ❌ Never had |
| **Dexana** | ✅ | ✅ | - | ✅ | ❌ Removed | ❌ Never had | ❌ Never had |
| **Notyced** | ✅ | ✅ | ✅ (Telnyx) | ✅ | ❌ Removed | ❌ Removed | ❌ Removed |
| **Settle** | ✅ | - (prepared) | - | - | ❌ Never had | ❌ Never had | ❌ Never had |
| **Bargain** | ✅ | - | - | - | ❌ Removed | ❌ Never had | ❌ Never had |

✅ = Implemented | - = Not yet implemented (acceptable) | ❌ = Removed/Banned

---

## Next Steps (Optional Future Work)

1. **Reid** - Add passkey + Telnyx SMS when user base grows
2. **Settle** - Implement passkey (schema ready) + add Telnyx SMS
3. **Bargain** - Add passkey + Telnyx SMS to FastAPI backend
4. **All projects** - Import `@shared/auth` package for client-side auth consistency
5. **CI/CD** - Add pre-commit hook to reject Twilio/Vonage/social-login imports
