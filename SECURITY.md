# Security

This document describes how Pizza di Napi protects customers, the kitchen and payments,
and what to keep in mind when deploying it.

## Reporting a vulnerability

Please open a private security advisory on the GitHub repository instead of a public issue.

## Payments (PayPal)

- **No card data ever touches our servers.** Buyers pay in the PayPal popup; we only store
  the PayPal order id and capture id.
- **Prices are never trusted from the browser.** The server rebuilds every order from the
  menu, recomputes totals and creates the PayPal order itself.
- **The PayPal order id used for capture comes from our database**, not from the request.
- **Captures are verified**: an order is marked as paid only if PayPal reports `COMPLETED`
  and the captured currency, amount and reference id match the order exactly.
- PayPal requests use `PayPal-Request-Id` headers, so retries are idempotent.
- The PayPal secret is server-only (`PAYPAL_CLIENT_SECRET`); only the public client id is
  exposed to the browser.

## Customer data

- Order ids are 128-bit random values, so tracking links can be shared but not guessed.
- The public tracking endpoint returns status, items and the street only. Name, phone,
  courier notes and payment ids are visible to the kitchen only.
- The AI assistant receives the menu and the cart, never personal data.
- Inputs are validated with zod (types, lengths, phone format, quantities) and control
  characters are stripped. React escapes all output.

## Kitchen dashboard

- Protected by `ADMIN_PIN`. **In production the kitchen is locked until `ADMIN_PIN` is set.**
  In local development it is open when no PIN is configured, with a visible warning.
- Signing in creates an HMAC-signed session cookie: `HttpOnly`, `SameSite=Strict`,
  `Secure` in production, valid for 12 hours. The PIN is never stored in the browser.
- PIN comparison is constant-time. Sign-in is limited to 5 attempts per minute per IP and
  30 wrong PINs per 15 minutes overall, to stop brute force from many addresses.
- State-changing requests must come from our own origin (CSRF protection on top of the
  `SameSite=Strict` cookie).

## Abuse protection

Per-IP rate limits (in memory, per server instance):

| Endpoint | Limit |
| --- | --- |
| AI chat (`/api/chat`) | 12 / minute, 150 / day |
| Kitchen AI (`/api/kitchen/assistant`) | 20 / minute |
| Create order (`/api/orders`) | 10 / 10 minutes |
| Capture payment | 20 / 10 minutes |
| Kitchen sign-in | 5 / minute |
| Order tracking | 120 / minute |

Request bodies are size-capped (1–64 KB depending on the endpoint). The client IP is read
from the last `X-Forwarded-For` entry, which is the one added by the hosting platform's proxy.

## HTTP security headers

Set for every response in `next.config.ts`:

- `Content-Security-Policy`: only our own origin plus the PayPal SDK domains; no framing
  (`frame-ancestors 'none'`), no plugins, restricted `base-uri` and `form-action`.
- `Strict-Transport-Security` (production), `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (camera, microphone and geolocation disabled).
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`, which the PayPal popup needs.
- API responses are `Cache-Control: no-store`; the service worker never caches API calls
  or the kitchen.
- The `X-Powered-By` header is removed.

## Known trade-offs

- `script-src` includes `'unsafe-inline'` because Next.js inlines its bootstrap scripts;
  switching to nonces would make every page dynamically rendered.
- Rate limits and the JSON file store live in a single server instance. When running more
  than one instance, move both to a shared store (for example Redis and Postgres).
- `npm audit` reports moderate issues only in development tooling (ESLint's `minimatch`),
  which is not part of the production bundle.

## Deployment checklist

- [ ] Set `ADMIN_PIN` (8+ characters) and `ADMIN_SESSION_SECRET` (`openssl rand -base64 32`).
- [ ] Use sandbox PayPal credentials for the demo; never commit `.env.local`.
- [ ] Serve over HTTPS only (Render and Vercel do this by default).
- [ ] Rotate the Gemini and PayPal keys if they are ever exposed.
