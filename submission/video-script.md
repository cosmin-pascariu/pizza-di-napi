# Pizza di Napi: demo video script (target 2:40, hard limit 3:00)

Narration is read by a TTS voice (files in `submission/voiceover/`). Record the screen
first, then lay each voice-over clip over its scene. You don't appear or speak.

**Before recording**
- Open <https://pizza-di-napi.onrender.com> once so the Render server is awake.
- Empty the cart. Chrome window ~1280 px wide for desktop scenes; for phone scenes use
  Chrome DevTools device mode (iPhone 14) or record your real iPhone.
- Never show: the PayPal sandbox password, the kitchen PIN, API keys. Pause the
  recording while you type them, or cut those seconds out.
- No third-party brands in the video (PayPal is the sponsor, that's fine). The AI model is named in the Devpost text instead.
- No music with copyright. Silence or a royalty-free track from the YouTube Audio Library.

---

## Scene 1: The problem (0:00 to 0:15)
**Screen:** phone view, hero of the home page, slow scroll to the menu photos.

> **VO 01:** Ordering pizza for a group is still a chore. Who eats what, is anyone vegetarian, and will it fit the budget? Meet Pizza di Napi: a neighbourhood pizzeria with its own ordering app, powered by PayPal and AI.

## Scene 2: Slicey builds the order (0:15 to 0:50)
**Screen:** tap **Ask Slicey**. Tap the suggestion *"We're 4 people, one is vegetarian, budget €40"*. Let the green "Added…" chips and the reply appear. Then type *"Which of these has no milk?"* (optional if time is short).

> **VO 02:** This is Slicey, our AI ordering assistant. It doesn't just recommend food. It fills the cart itself through tool calls, picks a vegetarian pizza, keeps the order inside the budget, and even notices that delivery is free above thirty euros. It also knows the calories and allergens of every dish.

## Scene 3: From chat to checkout (0:50 to 1:00)
**Screen:** type *"That's all, let's pay"*. The app jumps to the checkout page by itself.

> **VO 03:** When the customer is ready, Slicey opens the checkout. The AI never handles payment details. That is PayPal's job.

## Scene 4: PayPal checkout (1:00 to 1:30)
**Screen:** fill name, phone, address. Click the yellow **PayPal** button. In the popup, log in (cut this part), show the "Pizza di Napi" review screen, click **Pay**. Land on the tracking page "Order received".

> **VO 04:** Payment runs on PayPal Checkout. Our server recalculates every price from the menu, creates the order with the PayPal Orders API, and after the buyer approves, captures it and checks that the amount matches before the order goes to the kitchen.

## Scene 5: The kitchen (1:30 to 1:55)
**Screen:** split or switch to `/admin` (already signed in). The new order sits in **New**. Click **Start baking**, then switch to the customer's tracking page: it now shows "In the oven".

> **VO 05:** In the kitchen, paid orders appear on a live board. One tap moves an order forward, and the customer follows it in real time, from the oven to their door.

## Scene 6: Automatic refunds (1:55 to 2:20)
**Screen:** place a second order before recording (or reuse one). In the kitchen click **Cancel**, choose *"We ran out of an ingredient"*, click **Refund**. Show the red "Refunded via PayPal" note, then the customer page "Order cancelled, refunded".

> **VO 06:** And when something goes wrong, like running out of an ingredient, the kitchen cancels the order with a reason, and the customer is refunded in full through the PayPal Payments API, in one tap. They see exactly why on their tracking page.

## Scene 7: The owner talks to the menu (2:20 to 2:35)
**Screen:** in the kitchen's **Menu assistant**, type *"We're out of tiramisu tonight, and Diavola is 11 euro from today"*. Show the green change chips. (Afterwards, revert: *"Tiramisu is available again and Diavola is back to 10.50"*.)

> **VO 07:** The owner manages the menu just by talking to it. Prices and availability update instantly for every customer.

## Scene 8: Close (2:35 to 2:50)
**Screen:** back to the home page; toggle dark mode; show the PN logo / installable app.

> **VO 08:** Pizza di Napi is an installable web app, secure by design, and free to run. An AI waiter and PayPal checkout that any independent pizzeria can have. Thanks for watching.

---

### Editing tips (iMovie)
1. Import the screen recordings and the 8 voice-over files.
2. Put each VO under its scene; trim or speed up (1.2x to 1.5x) the screen footage so it fits.
3. Add a 2 second title card at the start: "Pizza di Napi: AI ordering + PayPal checkout".
4. Export 1080p, check the length is under 3:00, upload to YouTube as **Public**.
