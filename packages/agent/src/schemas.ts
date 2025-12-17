/**
 * Zod Schemas for Structured Output
 * 
 * Defines the structured JSON output required for the @assisant-ai/learner system.
 * This structure is enforced by the LLM using Zod and LangChain's structured output parser.
 */

import { z } from 'zod';

/**
 * Schema for a single insight extracted from conversation
 */
export const InsightSchema = z.object({
  /** The category of the learned insight (based on LEARNING_SYSTEM_SUMMARY.md) */
  category: z.enum(['preference', 'interest', 'goal', 'pattern', 'context', 'skill']).describe(
    "One of the predefined learning categories: preference (user likes/dislikes), interest (topics they care about), goal (objectives they want to achieve), pattern (behavioral patterns), context (situational information), skill (capabilities or expertise)"
  ),

  /** A short snake_case key for the specific insight. */
  key: z.string().describe(
    "Short snake_case key for the insight, e.g., 'design_style', 'favorite_language', 'work_schedule'"
  ),

  /** The specific value or content of the learned insight. */
  value: z.string().describe(
    "The specific learned value, e.g., 'minimalist', 'Python', 'early_morning'"
  ),

  /** Confidence score of the extraction, from 0.0 to 1.0. */
  confidence: z.number().min(0.0).max(1.0).describe(
    "Confidence in the extracted insight (0.0 to 1.0). Higher confidence means the insight is more certain."
  ),
});

/**
 * Array of insights - the expected output format from the LLM
 */
export const InsightsArraySchema = InsightSchema.array().describe(
  "A list of 0 or more structured insights extracted from the conversation. Return empty array [] if no insights found."
);

/**
 * TypeScript type inferred from the schema
 */
export type Insight = z.infer<typeof InsightSchema>;
export type InsightsArray = z.infer<typeof InsightsArraySchema>;

