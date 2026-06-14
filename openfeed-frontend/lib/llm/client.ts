import "server-only";

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

export class LlmRefusalError extends Error {
  constructor(refusal: string) {
    super(`LLM refused: ${refusal}`);
    this.name = "LlmRefusalError";
  }
}

export interface LlmClient {
  completeStructured<T>(opts: {
    schema: z.ZodType<T>;
    schemaName: string;
    system: string;
    user: string;
  }): Promise<T>;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 1,
  timeout: 15_000,
});

const openAiLlmClient: LlmClient = {
  async completeStructured({ schema, schemaName, system, user }) {
    const completion = await openai.chat.completions.parse({
      model: process.env.LLM_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: zodResponseFormat(schema, schemaName),
    });
    const msg = completion.choices[0].message;
    if (msg.refusal) throw new LlmRefusalError(msg.refusal);
    if (!msg.parsed) throw new Error("No parsed output from LLM");
    return msg.parsed;
  },
};

export const llmClient: LlmClient = openAiLlmClient;
