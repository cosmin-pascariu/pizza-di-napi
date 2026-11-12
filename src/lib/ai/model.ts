import "server-only";
import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google";

/**
 * Gemini via the Vercel AI SDK. Uses the free tier of Google AI Studio
 * (GOOGLE_GENERATIVE_AI_API_KEY). Swap the provider here to use another model.
 */
export const isAiConfigured = () => Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

export const chatModel = () => google(process.env.GEMINI_MODEL ?? "gemini-2.5-flash");

/**
 * Gemini 2.5 "thinks" before answering and those tokens count towards the output
 * limit. Without a cap, a long reasoning pass could use the whole budget and the
 * assistant would reply with nothing. A small thinking budget keeps answers fast
 * and leaves room for the reply and tool calls.
 */
export const THINKING_BUDGET = 1024;
export const MAX_OUTPUT_TOKENS = 2500;
export const aiProviderOptions = {
  google: { thinkingConfig: { thinkingBudget: THINKING_BUDGET } } satisfies GoogleLanguageModelOptions,
};
