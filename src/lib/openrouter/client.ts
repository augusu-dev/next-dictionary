import type { LLMConfig } from '@/types';

const DEFAULT_MODEL = 'google/gemini-2.0-flash-001';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  config: LLMConfig,
  retries = 1
): Promise<string> {
  const model = config.model || DEFAULT_MODEL;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Next Dictionary',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 8192,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from OpenRouter');
      }

      return content;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // Wait briefly before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Max retries exceeded');
}

export function parseJSONResponse(raw: string): unknown {
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // Fall through
      }
    }

    // Try to find JSON object or array in the response
    const objectMatch = raw.match(/(\{[\s\S]*\})/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[1]);
      } catch {
        // Fall through
      }
    }

    const arrayMatch = raw.match(/(\[[\s\S]*\])/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[1]);
      } catch {
        // Fall through
      }
    }

    throw new Error('Failed to parse JSON response from LLM');
  }
}
