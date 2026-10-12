/**
 * Server-Side AI Provider Client for Smart Study AI
 * Supports:
 * 1. Ollama (Local development or remote hosted endpoint)
 * 2. Groq Cloud (Free tier running open-source Llama models)
 * 3. Google Gemini API (Free tier via Google AI Studio)
 * 4. Graceful fallback when AI services are offline
 */

export interface AIGenerationOptions {
  prompt: string;
  systemPrompt?: string;
  formatJson?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export async function generateAIContent(options: AIGenerationOptions): Promise<string | null> {
  const provider = (process.env.AI_PROVIDER || "auto").toLowerCase();
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";

  // Determine active provider based on configuration & available keys
  let targetProvider = provider;
  if (provider === "auto") {
    if (groqKey) {
      targetProvider = "groq";
    } else if (geminiKey) {
      targetProvider = "gemini";
    } else {
      targetProvider = "ollama";
    }
  }

  try {
    if (targetProvider === "groq" && groqKey) {
      return await callGroqAPI(options, groqKey);
    } else if (targetProvider === "gemini" && geminiKey) {
      return await callGeminiAPI(options, geminiKey);
    } else {
      // Default to Ollama (local or remote URL)
      return await callOllamaAPI(options, ollamaUrl);
    }
  } catch (error: any) {
    console.warn(`[AI Provider: ${targetProvider}] Request failed:`, error?.message || error);
    return null;
  }
}

/**
 * Calls Ollama (Local or Remote)
 */
async function callOllamaAPI(options: AIGenerationOptions, baseUrl: string): Promise<string | null> {
  const model = process.env.OLLAMA_MODEL || "llama3.2";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const payload: Record<string, any> = {
      model,
      prompt: options.systemPrompt ? `${options.systemPrompt}\n\n${options.prompt}` : options.prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.3,
        num_predict: options.maxTokens ?? 1200,
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

    const data = await response.json();
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: options.prompt });

    const payload: Record<string, any> = {
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 1200,
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

    const data = await response.json();
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const fullPrompt = options.systemPrompt
      ? `${options.systemPrompt}\n\n${options.prompt}`
      : options.prompt;

    const payload: Record<string, any> = {
      contents: [
        {
          parts: [{ text: fullPrompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 1200,
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

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText ? candidateText.trim() : null;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}
