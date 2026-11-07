# Pizza di Napi 🍕

A mobile-first **PWA for a neighbourhood pizzeria** with an **AI ordering assistant**: customers describe what they need ("we're 4, one vegetarian, budget €40"), the AI builds the cart, they pay with **PayPal**, and follow the delivery live. The owner manages the menu by talking to an AI back-office assistant.

Built for the [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/).

## Features

- **AI ordering assistant "Slicey"** – a chat that understands group size, dietary needs and budget, and **fills the cart itself through tool calls** (`add_to_cart`, `set_quantity`, `clear_cart`). Tools run in the browser on the real cart, the server only validates item ids, and the assistant only ever sees the menu and the cart (no personal data).
- **AI menu assistant for the owner** – "Diavola is €11 from today", "we're out of tiramisu", "what sold best today?" → the model updates the menu through server-side tools.
- **Menu & cart** – categories, dietary tags, persistent cart (works offline as an installed PWA).
- **PayPal Checkout (Orders v2, sandbox)** – orders are created and captured **server-side**; prices are always recomputed on the server from the menu, never trusted from the client.
- **Live order tracking** – received → in the oven → out for delivery → delivered.
- **Kitchen dashboard** (`/admin`) – Kanban board of paid orders, one tap to move an order forward, today's orders and revenue. Optional PIN protection.
- **Installable PWA** – web manifest, app icons, service worker; feels native on iOS and Android, works on desktop.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Route Handlers) + React 19 + TypeScript
- Tailwind CSS 4
- PayPal REST API (Orders v2) + [`@paypal/react-paypal-js`](https://github.com/paypal/paypal-js)
- [Vercel AI SDK](https://ai-sdk.dev/) + Google **Gemini** (free tier) for tool calling
- JSON file store (`data/db.json`) – zero setup for judges

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
    api/orders/[id]/capture  POST capture PayPal payment
    manifest.ts              PWA manifest
  lib/
    paypal.ts                PayPal Orders v2 client (OAuth + create + capture)
    ai/cart-tools.ts         shared, typed tool definitions for the assistant
    store.ts                 JSON file store
public/sw.js                 service worker
```

## Roadmap

- [x] AI ordering assistant that builds the cart via tool calls
- [x] AI menu management in natural language
- [ ] Voice ordering
- [ ] Deploy to Render.

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
