# Devpost submission: copy & paste

Fill the Devpost form field by field with the text below. Fields marked **(fill in)**
need your own values. Never put real passwords or API keys in public fields; the
sandbox account and kitchen PIN go only in the testing-instructions field.

---

## Project name
Pizza di Napi

## Elevator pitch (max 200 characters)
An AI waiter for independent pizzerias: Slicey turns "we're 4, one vegetarian, €40" into a ready cart, PayPal handles checkout and one-tap refunds, and the owner runs the menu by chat.

## About the project (Markdown)

## Inspiration
Ordering food for a group is still surprisingly painful: who eats what, is anyone vegetarian or allergic, how many pizzas do we need, will it fit the budget? At the same time, small independent pizzerias give away a big share of every order to delivery platforms just to get a decent ordering experience. We wanted to give a neighbourhood pizzeria its own ordering app, smart enough to take a group order like a good waiter would, with payments and refunds handled properly by PayPal.

## What it does
**For customers**
- **Slicey, an agentic AI ordering assistant** (Google Gemini). Tell it *"we're 4 people, one is vegetarian, budget €40"* and it builds the order itself: it calls tools to add items to the real cart, respects dietary needs and the budget, and points out free delivery. It answers questions about calories and allergens, and when you say *"that's all"*, it takes you straight to checkout.
- **PayPal Checkout** (sandbox): pay with PayPal or card in the PayPal popup.
- **Live order tracking**: received, in the oven, out for delivery, delivered.
- A menu with photos, approximate calories, flour type and EU allergens for every dish.
- An installable PWA with light and dark mode that works on phones and desktop.

**For the pizzeria**
- **A live kitchen board**: paid orders appear instantly and move forward with one tap.
- **One-tap refunds**: cancel an order with a reason and the customer is refunded in full through the PayPal Payments API, and sees why on their tracking page.
- **An AI menu assistant**: *"We're out of tiramisu tonight"* or *"Diavola is €11 from today"* updates the menu instantly.

## How we built it
- **Next.js 16** (App Router, Route Handlers), React 19, TypeScript and Tailwind CSS 4, as a mobile-first PWA.
- **PayPal REST APIs**: Orders v2 to create and capture orders server-side, and Payments v2 for refunds, with the PayPal JS SDK buttons (`@paypal/react-paypal-js`) on the front end.
- **Vercel AI SDK + Google Gemini** for tool calling. Slicey's cart tools (`add_to_cart`, `set_quantity`, `clear_cart`, `go_to_checkout`) are typed with Zod and executed in the browser on the real cart. The kitchen assistant's menu tools run on the server.
- Hosted on **Render** (free plan) from a `render.yaml` blueprint.
- We used Claude Code as an AI pair programmer during development.

## Payment safety and security
- Prices are never trusted from the browser: the server rebuilds every order from the menu.
- The PayPal order id used for capture comes from our database, and an order is marked as paid only if the captured amount, currency and reference match exactly.
- Refunds are kitchen-only and idempotent, and cancelling a paid order always goes through a refund.
- The AI only sees the menu and the cart, never personal data or payment details.
- The kitchen uses signed HttpOnly session cookies. Every API is validated and rate-limited, CSP and HSTS headers are set, and public tracking links hide the customer's name and phone.

## Challenges we ran into
- **Agentic tools with a client-side cart**: the model calls tools that run in the browser, and the chat resubmits automatically once all results are in. Keeping the cart, the menu and the conversation in sync took some care.
- **Making payments trustworthy**: verifying captured amounts, idempotent PayPal requests, and making sure no paid order can be cancelled without a refund.
- **React Strict Mode** closed the PayPal buttons right after rendering in development; we tracked it down by comparing dev and production builds.
- **Free-tier limits**: rate limits and short prompts keep the Gemini free tier and Render's free plan enough for a real demo.

## Accomplishments that we're proud of
- An end-to-end flow that really works in the PayPal sandbox: AI-built order, payment, verified capture, live tracking and refund.
- An assistant that acts instead of just chatting: it fills the cart and opens checkout.
- A polished, accessible PWA that feels like a real restaurant app, not a prototype.

## What we learned
How to design AI tools that act on real state safely, how the PayPal Orders and Payments APIs fit together for a complete order lifecycle, and that security and trust matter just as much as features when money is involved.

## What's next for Pizza di Napi
- Voice ordering ("Hey Slicey, the usual for four").
- Partial refunds (for example one missing drink).
- Multi-restaurant support, so any independent pizzeria can launch its own ordering app in minutes.
- Persistent storage (Postgres) and shared rate limits for production scale.

---

## Built with (tags)
nextjs, react, typescript, tailwindcss, paypal, paypal-orders-api, paypal-payments-api, google-gemini, vercel-ai-sdk, zod, pwa, render

## "Try it out" links
- Live demo: https://pizza-di-napi.onrender.com
- Source code: https://github.com/cosmin-pascariu/pizza-di-napi

## Video demo link
**(fill in)** your YouTube link

## Testing instructions (private field for judges)
The demo runs on Render's free plan: the first visit after a quiet period can take up to a minute to load.

1. Open https://pizza-di-napi.onrender.com, tap **Ask Slicey** and try "We're 4 people, one is vegetarian, budget €40", then "That's all, let's pay".
2. Fill in any delivery details and pay with the PayPal sandbox buyer account:
   - Email: **(fill in)**
   - Password: **(fill in)**
3. Open https://pizza-di-napi.onrender.com/admin and sign in with kitchen PIN **(fill in)**. Move the order forward, or click **Cancel** to trigger a PayPal refund.
4. In the kitchen, try the menu assistant: "We're out of tiramisu tonight".

All accounts are PayPal sandbox test accounts; no real money is involved.
