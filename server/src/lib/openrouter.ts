import { createOpenAI } from "@ai-sdk/openai";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Routes automatically to whichever free models are available at the time
export const freeModel = openrouter("openrouter/auto:free");
