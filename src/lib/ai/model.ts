import "server-only";
import { google } from "@ai-sdk/google";

/**
 * Gemini via the Vercel AI SDK. Uses the free tier of Google AI Studio
 * (GOOGLE_GENERATIVE_AI_API_KEY). Swap the provider here to use another model.
 */
export const isAiConfigured = () => Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

export const chatModel = () => google(process.env.GEMINI_MODEL ?? "gemini-2.5-flash");
