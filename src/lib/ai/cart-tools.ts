import { tool, type InferUITools, type UIMessage } from "ai";
import { z } from "zod";

/**
 * Tools the ordering assistant can call. They have no `execute` function:
 * they run in the browser (see ChatAssistant) because the cart lives on the client.
 * The shared definitions keep server and client in sync and fully typed.
 */
const cartToolOutput = z.object({ ok: z.boolean(), message: z.string() });

export const cartTools = {
  add_to_cart: tool({
    description: "Add a menu item to the customer's cart. Use the exact item id from the menu.",
    inputSchema: z.object({
      itemId: z.string().describe("Menu item id, e.g. 'diavola'"),
      quantity: z.number().int().min(1).max(10).describe("How many to add"),
    }),
    outputSchema: cartToolOutput,
  }),
  set_quantity: tool({
    description:
      "Set the exact quantity of an item already in the cart. Use quantity 0 to remove it.",
    inputSchema: z.object({
      itemId: z.string(),
      quantity: z.number().int().min(0).max(20),
    }),
    outputSchema: cartToolOutput,
  }),
  clear_cart: tool({
    description: "Remove everything from the cart. Only use when the customer asks to start over.",
    inputSchema: z.object({}),
    outputSchema: cartToolOutput,
  }),
};

export type CartToolOutput = z.infer<typeof cartToolOutput>;

export type AssistantMessage = UIMessage<never, never, InferUITools<typeof cartTools>>;
