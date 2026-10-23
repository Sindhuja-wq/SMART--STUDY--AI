/**
 * Server-Side AI Provider Client for Smart Study AI
 * Supports:
 * 1. Groq Cloud (Free tier running high-speed open-source Llama models)
 * 2. Google Gemini API (Free tier via Google AI Studio)
 * 3. Ollama (Local development or remote hosted endpoint)
 * 4. Graceful multi-provider cascade failover
 */

export interface AIGenerationOptions {
  prompt: string;
  systemPrompt?: string;
  formatJson?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

interface ProviderAttempt {
  name: "groq" | "gemini" | "ollama";
  execute: () => Promise<string | null>;
}

export async function generateAIContent(options: AIGenerationOptions): Promise<string | null> {
  const providerConfig = (process.env.AI_PROVIDER || "auto").toLowerCase().trim();
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const ollamaUrl = process.env.OLLAMA_URL?.trim() || "http://localhost:11434";
  const isVercel = process.env.VERCEL === "1";

  // Build ordered list of providers to attempt
  const attempts: ProviderAttempt[] = [];

  const addGroq = () => {
    if (groqKey) {
      attempts.push({
        name: "groq",
        execute: () => callGroqAPI(options, groqKey),
      });
    }
  };

  const addGemini = () => {
    if (geminiKey) {
      attempts.push({
        name: "gemini",
        execute: () => callGeminiAPI(options, geminiKey),
      });
    }
  };

  const addOllama = () => {
    // In Vercel serverless environment, localhost Ollama does not exist; only attempt if remote URL
    const isLocalhost = ollamaUrl.includes("localhost") || ollamaUrl.includes("127.0.0.1");
    if (!isVercel || !isLocalhost) {
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
    // Default "auto": Prioritize cloud free tiers (Groq, then Gemini), then Ollama
    addGroq();
    addGemini();
    addOllama();
  }

  if (attempts.length === 0) {
    console.warn("[AI Provider] No active AI provider credentials available in environment.");
    return null;
  }

  for (const attempt of attempts) {
    try {
      const result = await attempt.execute();
      if (result && result.trim().length > 0) {
        return result.trim();
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI Provider: ${attempt.name}] Request failed: ${errMsg}. Trying next provider...`);
    }
  }

  return null;
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
  } catch (err) {
    clearTimeout(timeout);
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
      max_tokens: options.maxTokens ?? 2000,
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
      throw new Error(`Groq returned ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Calls Google Gemini API (Free tier via Google AI Studio)
 */
async function callGeminiAPI(options: AIGenerationOptions, apiKey: string): Promise<string | null> {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const timeoutMs = options.timeoutMs ?? 25000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fullPrompt = options.systemPrompt
      ? `${options.systemPrompt}\n\n${options.prompt}`
      : options.prompt;

    const payload: {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig: {
        temperature: number;
        maxOutputTokens: number;
        responseMimeType?: string;
      };
    } = {
      contents: [
        {
          parts: [{ text: fullPrompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 2000,
      },
    };

    if (options.formatJson) {
      payload.generationConfig.responseMimeType = "application/json";
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini returned ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText ? candidateText.trim() : null;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}
