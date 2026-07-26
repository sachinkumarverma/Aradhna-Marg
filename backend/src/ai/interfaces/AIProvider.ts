export interface IAIGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean; // Strongly typed JSON output requirement
}

export interface IAIProvider {
  /**
   * Generates text or JSON based on a system and user prompt.
   */
  generate(systemPrompt: string, userPrompt: string, options?: IAIGenerationOptions): Promise<string>;
}
