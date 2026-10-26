/**
 * Server-Side AI Provider Client for Smart Study AI
 * Supports:
 * 1. Groq Cloud (Free tier running high-speed open-source Llama models)
 * 2. Google Gemini API (Free tier via Google AI Studio)
 * 3. Ollama (Local development or remote hosted endpoint)
 * 4. Graceful multi-provider cascade failover with rate-limit and transient retry logic
 */

export interface AIGenerationOptions {
  prompt: string;
  systemPrompt?: string;
  formatJson?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface DetailedGenerationResult {
  content: string | null;
  provider?: "groq" | "gemini" | "ollama";
  error?: string;
}

interface ProviderAttempt {
  name: "groq" | "gemini" | "ollama";
  execute: () => Promise<string | null>;
}

export async function generateAIContent(options: AIGenerationOptions): Promise<string | null> {
  const result = await generateAIContentDetailed(options);
  return result.content;
}

export async function generateAIContentDetailed(options: AIGenerationOptions): Promise<DetailedGenerationResult> {
  const providerConfig = (process.env.AI_PROVIDER || "auto").toLowerCase().trim();
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const ollamaUrl = process.env.OLLAMA_URL?.trim() || "http://localhost:11434";
  const isVercel = process.env.VERCEL === "1";
  const isProduction = process.env.NODE_ENV === "production";

  // Build ordered list of providers to attempt
  const attempts: ProviderAttempt[] = [];

  const addGroq = () => {
    if (groqKey) {
      attempts.push({
        name: "groq",
        execute: () => callGroqWithRetry(options, groqKey),
      });
    }
  };

  const addGemini = () => {
    if (geminiKey) {
      attempts.push({
        name: "gemini",
        execute: () => callGeminiWithRetry(options, geminiKey),
      });
    }
  };

  const addOllama = () => {
    // In serverless or production cloud environments (e.g. Vercel), localhost Ollama does not exist.
    // Only attempt Ollama if it is a remote endpoint or we are in local development.
    const isLocalhost =
      ollamaUrl.includes("localhost") || ollamaUrl.includes("127.0.0.1") || ollamaUrl.includes("0.0.0.0");
    if (!isVercel && (!isProduction || !isLocalhost)) {
      attempts.push({
        name: "ollama",
        execute: () => callOllamaAPI(options, ollamaUrl),
      });
    }
  };

  if (providerConfig === "groq") {
    addGroq();
    addGemini();
    addOllama();
  } else if (providerConfig === "gemini") {
    addGemini();
    addGroq();
    addOllama();
  } else if (providerConfig === "ollama") {
    addOllama();
    addGroq();
    addGemini();
  } else {
    // Default "auto": Prioritize Google Gemini as primary cloud AI, then Groq, then local Ollama
    addGemini();
    addGroq();
    addOllama();
  }

  if (attempts.length === 0) {
    const errorMsg = "No active AI provider credentials configured (GROQ_API_KEY or GEMINI_API_KEY).";
    console.warn(`[AI Provider] ${errorMsg}`);
    return { content: null, error: errorMsg };
  }

  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const result = await attempt.execute();
      if (result && result.trim().length > 0) {
        return {
          content: result.trim(),
          provider: attempt.name,
        };
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`${attempt.name}: ${errMsg}`);
      console.warn(`[AI Provider: ${attempt.name}] Call failed: ${errMsg}. Attempting cascade failover...`);
    }
  }

  return {
    content: null,
    error: `All configured AI providers failed: ${errors.join(" | ")}`,
  };
}

/**
 * Calls Groq Cloud with bounded retry for transient errors (e.g. rate limit 429)
 */
async function callGroqWithRetry(options: AIGenerationOptions, apiKey: string): Promise<string | null> {
  try {
    return await callGroqAPI(options, apiKey);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("429") || errMsg.includes("rate limit") || errMsg.includes("503")) {
      console.warn("[AI Provider: Groq] Transient rate limit or server error encountered. Retrying in 1200ms...");
      await new Promise((res) => setTimeout(res, 1200));
      return await callGroqAPI(options, apiKey);
    }
    throw err;
  }
}

/**
 * Calls Google Gemini with bounded retry for transient errors
 */
async function callGeminiWithRetry(options: AIGenerationOptions, apiKey: string): Promise<string | null> {
  try {
    return await callGeminiAPI(options, apiKey);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("429") || errMsg.includes("rate limit") || errMsg.includes("503")) {
      console.warn("[AI Provider: Gemini] Transient rate limit or server error encountered. Retrying in 1200ms...");
      await new Promise((res) => setTimeout(res, 1200));
      return await callGeminiAPI(options, apiKey);
    }
    throw err;
  }
}

/**
 * Calls Ollama (Local or Remote)
 */
async function callOllamaAPI(options: AIGenerationOptions, baseUrl: string): Promise<string | null> {
  const model = process.env.OLLAMA_MODEL || "llama3.2";
  const timeoutMs = options.timeoutMs ?? 25000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: {
      model: string;
      prompt: string;
      stream: boolean;
      format?: string;
      options: {
        temperature: number;
        num_predict: number;
      };
    } = {
      model,
      prompt: options.systemPrompt ? `${options.systemPrompt}\n\n${options.prompt}` : options.prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.3,
        num_predict: options.maxTokens ?? 2000,
      },
    };

    if (options.formatJson) {
      payload.format = "json";
    }

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Ollama returned status ${response.status}`);
    }

    const data = (await response.json()) as { response?: string };
    return data.response ? data.response.trim() : null;
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Ollama request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

/**
 * Calls Groq Cloud (Free Llama 3.3/3.1 API)
 */
async function callGroqAPI(options: AIGenerationOptions, apiKey: string): Promise<string | null> {
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const timeoutMs = options.timeoutMs ?? 25000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const messages: Array<{ role: "system" | "user"; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: options.prompt });

    const payload: {
      model: string;
      messages: Array<{ role: "system" | "user"; content: string }>;
      temperature: number;
      max_tokens: number;
      response_format?: { type: "json_object" };
    } = {
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2200,
    };

    if (options.formatJson) {
      payload.response_format = { type: "json_object" };
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq returned ${response.status}: ${errText.substring(0, 200)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Groq request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

/**
 * Calls Google Gemini API (Free tier via Google AI Studio)
 * Compatible with gemini-1.5-flash and gemini-2.0-flash
 */
async function callGeminiAPI(options: AIGenerationOptions, apiKey: string): Promise<string | null> {
  const preferredModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const timeoutMs = options.timeoutMs ?? 28000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: {
      contents: Array<{ parts: Array<{ text: string }> }>;
      systemInstruction?: { parts: Array<{ text: string }> };
      generationConfig: {
        temperature: number;
        maxOutputTokens: number;
        responseMimeType?: string;
      };
    } = {
      contents: [
        {
          parts: [{ text: options.prompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 4000,
      },
    };

    if (options.systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: options.systemPrompt }],
      };
    }

    if (options.formatJson) {
      payload.generationConfig.responseMimeType = "application/json";
    }

    let url = `https://generativelanguage.googleapis.com/v1beta/models/${preferredModel}:generateContent?key=${apiKey}`;
    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    // If preferred model returned 404 Not Found, try alternate model (e.g. gemini-1.5-flash or gemini-2.0-flash)
    if (response.status === 404) {
      const fallbackModel = preferredModel === "gemini-2.0-flash" ? "gemini-1.5-flash" : "gemini-2.0-flash";
      url = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${apiKey}`;
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    }

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini returned ${response.status}: ${errText.substring(0, 200)}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText ? candidateText.trim() : null;
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Gemini request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}
