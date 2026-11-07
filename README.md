# Pizza di Napi 🍕

A mobile-first **PWA for a neighbourhood pizzeria** with an **AI ordering assistant**: customers describe what they need ("we're 4, one vegetarian, budget €40"), the AI builds the cart, they pay with **PayPal**, and follow the delivery live. The owner manages the menu by talking to an AI back-office assistant.

Built for the [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/).

> **Judges:** see [Testing instructions](#testing-instructions) for the live demo link, a PayPal sandbox buyer account and the kitchen PIN.

## The problem

Small pizzerias lose orders and margin to delivery platforms, and ordering for a group is
still a chore: who eats what, is anyone vegetarian, how many pizzas, will it fit the budget?
Pizza di Napi gives an independent pizzeria its own ordering app where an AI assistant turns
"we're 4, one vegetarian, €40" into a ready cart in seconds, PayPal handles payment and
refunds, and the owner runs the kitchen and the menu by simply talking to it.

## Features

- **Agentic ordering with "Slicey"** – a chat that understands group size, dietary needs, allergens, calories and budget, **fills the cart itself through tool calls** (`add_to_cart`, `set_quantity`, `clear_cart`) and **takes the customer straight to PayPal checkout** (`go_to_checkout`) when they're ready. Tools run in the browser on the real cart; the assistant only ever sees the menu and the cart (no personal data) and never handles payment details.
- **AI menu assistant for the owner** – "Diavola is €11 from today", "we're out of tiramisu", "what sold best today?" → the model updates the menu through server-side tools.
- **Menu & cart** – categories, dietary tags, persistent cart (works offline as an installed PWA).
- **PayPal Checkout (Orders v2, sandbox)** – orders are created and captured **server-side**; prices are always recomputed on the server, and the captured amount is verified against the order before it is marked as paid.
- **Automatic PayPal refunds (Payments v2)** – when the kitchen cancels a paid order (out of an ingredient, too busy…), the customer is refunded in full through PayPal in one tap and sees the reason on their tracking page.
- **Menu with nutrition info** – photos, approximate calories per portion, flour type and EU allergens for every item.
- **Live order tracking** – received → in the oven → out for delivery → delivered.
- **Kitchen dashboard** (`/admin`) – Kanban board of paid orders, one tap to move an order forward or cancel and refund it, today's orders and revenue. Protected by a PIN and a signed session.
- **Installable PWA** – web manifest, app icons, service worker, light/dark theme; feels native on iOS and Android, works on desktop.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Route Handlers) + React 19 + TypeScript
- Tailwind CSS 4
- PayPal REST API: Orders v2 (create, capture) and Payments v2 (refunds) + [`@paypal/react-paypal-js`](https://github.com/paypal/paypal-js)
- [Vercel AI SDK](https://ai-sdk.dev/) + Google **Gemini** (free tier) for tool calling
- JSON file store (`data/db.json`) – zero setup for judges
- Hosted on [Render](https://render.com) (free plan) via the included `render.yaml` blueprint

## Testing instructions

**Live demo:** _LIVE_URL_ (hosted on Render's free plan: the first visit after a quiet period can take up to a minute to wake up).

1. **Order with AI:** open the demo, tap **Ask Slicey** and try *"We're 4 people, one is vegetarian, budget €40"* or *"Which pizzas have no milk?"*. Watch the cart fill up, then say *"that's all"* to go to checkout.
2. **Pay with PayPal (sandbox, no real money):** fill in any delivery details and pay with this sandbox buyer account:
   - Email: _SANDBOX_BUYER_EMAIL_
   - Password: _SANDBOX_BUYER_PASSWORD_
3. **Kitchen:** open `/admin` in another tab and sign in with PIN _DEMO_ADMIN_PIN_. Move the order forward and watch the customer's tracking page update, or **Cancel** it to trigger an automatic PayPal refund.
4. **AI menu assistant:** in the kitchen, try *"We're out of tiramisu tonight"* or *"Diavola is €11 from today"*.

These credentials belong to a PayPal **sandbox** test account and a demo kitchen; they move no real money.

## Running locally

Requirements: **Node.js 22+** (see `.nvmrc`), a free PayPal developer account and a free Gemini API key.

1. **Create PayPal sandbox credentials**
   - Go to <https://developer.paypal.com/dashboard/applications/sandbox> and click **Create App**.
   - Copy the **Client ID** and **Secret**.
   - Under **Testing tools → Sandbox accounts** you get a *personal* (buyer) account – use it to pay.

2. **Create a Gemini API key** (free, no credit card) at <https://aistudio.google.com/apikey>.

3. **Configure and start**

   ```bash
   nvm use            # or any Node 22+
   npm install
   cp .env.example .env.local   # then paste your sandbox Client ID / Secret
   npm run dev
   ```

4. Open <http://localhost:3000>, tap **Ask Slicey** (or add pizzas manually), fill in delivery details and pay with the sandbox buyer account.
   Open <http://localhost:3000/admin> in another tab to see the order arrive and move it through the kitchen.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `PAYPAL_CLIENT_ID` | yes | Sandbox app client id (server) |
| `PAYPAL_CLIENT_SECRET` | yes | Sandbox app secret (server only, never exposed) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | yes | Same client id, used by the PayPal JS SDK in the browser |
| `GOOGLE_GENERATIVE_AI_API_KEY` | yes (for AI) | Gemini API key; without it the app works but the assistants are disabled |
| `GEMINI_MODEL` | no | Defaults to `gemini-2.5-flash` |
| `ADMIN_PIN` | yes (production) | PIN for the `/admin` kitchen dashboard. Without it the kitchen is locked in production and open in local dev |
| `ADMIN_SESSION_SECRET` | recommended | Secret that signs kitchen sessions (`openssl rand -base64 32`) |
| `PAYPAL_API_BASE` | no | Defaults to `https://api-m.sandbox.paypal.com` |
| `DATA_DIR` | no | Where `db.json` is stored (default `./data`) |

## Deploying to Render (free)

1. Push the repo to GitHub, then in Render choose **New → Blueprint** and select the repo. Render reads `render.yaml`.
2. Fill in the environment variables it asks for (PayPal sandbox keys, Gemini key, `ADMIN_PIN`). `ADMIN_SESSION_SECRET` is generated automatically.
3. Deploy. Every push to `main` redeploys automatically.

Note: the free plan has an ephemeral disk, so orders reset on each redeploy. That is fine for a demo.

## How the payment flow works

```
Browser (PayPal button)          Next.js API                     PayPal
────────────────────────         ───────────────                 ──────
click Pay ───────────────▶ POST /api/orders
                             validate cart, recompute total
                             save order (pending_payment)
                             ───────────────────────────▶ POST /v2/checkout/orders
                           ◀─ paypalOrderId ◀──────────── order id
buyer approves in popup
onApprove ───────────────▶ POST /api/orders/:id/capture
                             ───────────────────────────▶ POST /v2/checkout/orders/:id/capture
                             status COMPLETED → order "received"
redirect to /order?id=…
```

## Security

Payments are verified server-side (prices recomputed, captured amount checked), customer details
are never exposed on public tracking links, the kitchen uses signed `HttpOnly` session cookies,
every API is validated and rate-limited, and strict security headers (CSP, HSTS) are set.
See [SECURITY.md](./SECURITY.md) for details and the deployment checklist.

## Project structure

```
src/
  app/
    page.tsx                 menu
    cart/page.tsx            cart + delivery details + PayPal buttons
    order/page.tsx           live order tracking
    admin/page.tsx           kitchen dashboard
    api/chat                 AI ordering assistant (streaming, client-side cart tools)
    api/kitchen/assistant    AI menu assistant (server-side menu tools)
    api/menu                 GET menu
    api/orders               GET (admin) / POST create order + PayPal order
    api/orders/[id]          GET order / PATCH status (admin)
    api/orders/[id]/capture  POST capture PayPal payment (amount verified)
    api/orders/[id]/refund   POST cancel + full PayPal refund (kitchen)
    api/admin/session        kitchen sign-in / sign-out
    manifest.ts              PWA manifest
  lib/
    paypal.ts                PayPal Orders v2 client (OAuth + create + capture)
    ai/cart-tools.ts         shared, typed tool definitions for the assistant
    store.ts                 JSON file store
public/sw.js                 service worker
```

## Built with AI assistance

The product idea, design decisions and direction are mine; I used [Claude Code](https://claude.com/claude-code)
as an AI pair programmer to help write and review the code.

## Roadmap

- [x] AI ordering assistant that builds the cart and opens checkout via tool calls
- [x] AI menu management in natural language
- [x] Automatic PayPal refunds when the kitchen cancels an order
- [x] Deploy to Render
- [ ] Voice ordering
- [ ] Partial refunds (for example one missing item)

## Image credits

All food photography is from [Unsplash](https://unsplash.com) and used under the [Unsplash License](https://unsplash.com/license) (free to use, no permission needed). Thank you to the photographers:

- `hero.webp`: [photo](https://unsplash.com/photos/pizza-baking-in-wood-fired-oven-vHRFraV4U00) by [Fabrizio Pullara](https://unsplash.com/@fabrizio_photopf)
- `about.webp`: [photo](https://unsplash.com/photos/pizza-on-brown-wooden-table-40OJLYVWeeM) by [Nik Owens](https://unsplash.com/@nik_owens)
- `margherita.webp`: [photo](https://unsplash.com/photos/round-cooked-pizza-x00CzBt4Dfk) by [Aurélien Lemasson-Théobald](https://unsplash.com/@aurel__lens)
- `diavola.webp`: [photo](https://unsplash.com/photos/a-pepperoni-pizza-sitting-on-top-of-a-wooden-cutting-board-xIqVfW8XUt4) by [David Foodphototasty](https://unsplash.com/@phototastyfood)
- `quattro-formaggi.webp`: [photo](https://unsplash.com/photos/a-pizza-sitting-on-top-of-a-wooden-cutting-board-7wM-Ad3p56E) by [Artem Mihailov](https://unsplash.com/@mihailovart_pht)
- `prosciutto-funghi.webp`: [photo](https://unsplash.com/photos/a-pizza-with-mushrooms-and-ham-on-a-wooden-board-Ew_9G3UfsA0) by [David Foodphototasty](https://unsplash.com/@phototastyfood)
- `ortolana.webp`: [photo](https://unsplash.com/photos/pizza-with-cheese-and-green-leaves-jsZKLRi7toU) by [Laure Noverraz](https://unsplash.com/@lornov)
- `garlic-bread.webp`: [photo](https://unsplash.com/photos/brown-bread-on-white-ceramic-plate-zevnVcUyiJg) by [Waldemar Brandt](https://unsplash.com/@waldemarbrandt67w)
- `caesar-salad.webp`: [photo](https://unsplash.com/photos/closed-photography-of-vegetable-salad-with-croutons-in-plate-FK-UKNip0pE) by [Chris Tweten](https://unsplash.com/@ctwtn)
- `lemonade.webp`: [photo](https://unsplash.com/photos/clear-drinking-glass-with-lemon-juice-WDgN0XclV_w) by [Juliet Frías](https://unsplash.com/@july_06)
- `cola.webp`: [photo](https://unsplash.com/photos/clear-drinking-glass-with-ice-and-black-liquid-i597Mg_WSPw) by [Qasim Malick](https://unsplash.com/@qasimmalick)
- `tiramisu.webp`: [photo](https://unsplash.com/photos/a-piece-of-cake-sitting-on-top-of-a-white-plate-d-Mx494kXAg) by [Gina's Auckland](https://unsplash.com/@ginasauckland)

## License

[MIT](./LICENSE)
