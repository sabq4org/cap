/** OpenAI client options (direct OPENAI_API_KEY or AI_INTEGRATIONS_* proxy). */
export function getOpenAIConfig() {
  const apiKey =
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "";
  const baseURL =
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1";

  if (!apiKey) {
    console.warn(
      "[OpenAI] Missing AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY — AI features will fail until set",
    );
  }

  return {
    // Placeholder keeps the process from crashing at import time when the key is unset.
    apiKey: apiKey || "missing-openai-api-key",
    baseURL,
  };
}
