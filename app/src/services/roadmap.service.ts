import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import type { PriorityLevel } from '@/types';

/**
 * Zod validation schemas for AI-generated execution roadmaps.
 * Ensures model output matches expected domain boundaries before persistence.
 */
export const RoadmapTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(120),
  description: z.string().min(1, 'Task description is required').max(500),
});

export const RoadmapMilestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required').max(120),
  description: z.string().min(1, 'Milestone description is required').max(500),
  tasks: z
    .array(RoadmapTaskSchema)
    .min(1, 'Each milestone must have at least one task')
    .max(10),
});

export const RoadmapSchema = z.object({
  milestones: z
    .array(RoadmapMilestoneSchema)
    .min(1, 'Roadmap must have at least one milestone')
    .max(10),
});

export type ValidatedRoadmap = z.infer<typeof RoadmapSchema>;
export type ValidatedMilestone = z.infer<typeof RoadmapMilestoneSchema>;
export type ValidatedTask = z.infer<typeof RoadmapTaskSchema>;

export interface GenerateRoadmapInput {
  title: string;
  description?: string;
  targetDate?: string;
  priority?: PriorityLevel;
}

export interface GenerateRoadmapResult {
  roadmap: ValidatedRoadmap | null;
  error: string | null;
}

export class RoadmapService {
  /**
   * Generates a structured execution roadmap for a user goal using Google Gemini 3.6 Flash.
   * Strictly validates the model response through Zod before returning.
   */
  static async generateRoadmap(
    input: GenerateRoadmapInput
  ): Promise<GenerateRoadmapResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        roadmap: null,
        error: 'AI service is temporarily unconfigured. Please try again later.',
      };
    }

    if (!input.title || input.title.trim().length === 0) {
      return {
        roadmap: null,
        error: 'Goal title is required to generate an execution roadmap.',
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an AI Chief of Staff and Goal Execution Engine for Stride.
Your objective is to transform the user's high-level goal into an actionable, sequential execution roadmap.

User Goal Specifications:
- Goal Title: "${input.title.trim()}"
${input.description ? `- Description: "${input.description.trim()}"` : ''}
${input.targetDate ? `- Target Date: "${input.targetDate.trim()}"` : ''}
${input.priority ? `- Priority Level: "${input.priority}"` : ''}

Execution Guidelines:
1. Break the goal into 3 to 6 logical, sequential milestones ordered chronologically.
2. Under each milestone, provide 2 to 5 concrete, highly actionable tasks.
3. Ensure every task is a single, beginner-friendly executable action achievable in approximately 5 to 15 minutes (e.g. "Install Node.js" rather than "Configure development environment"). Avoid technical jargon or combined multi-step tasks.
4. Provide plain step-by-step instructions in the task description explaining exactly what the user should do (e.g. "Download Node.js LTS from nodejs.org and run the installer using default settings.").
5. Do NOT include database IDs, user IDs, timestamps, or scheduled dates.
6. Respond ONLY with structured JSON matching the requested schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    tasks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                        },
                        required: ['title', 'description'],
                      },
                    },
                  },
                  required: ['title', 'description', 'tasks'],
                },
              },
            },
            required: ['milestones'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        return {
          roadmap: null,
          error:
            'Our AI execution engine returned an empty response. Please try again.',
        };
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(responseText);
      } catch {
        return {
          roadmap: null,
          error:
            "We couldn't construct your roadmap formatting automatically. Please try again.",
        };
      }

      const validationResult = RoadmapSchema.safeParse(parsedJson);
      if (!validationResult.success) {
        return {
          roadmap: null,
          error:
            'Our AI execution engine generated an invalid roadmap layout. Please try again.',
        };
      }

      return {
        roadmap: validationResult.data,
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (
        message.includes('429') ||
        message.includes('quota') ||
        message.includes('rate')
      ) {
        return {
          roadmap: null,
          error:
            'AI service rate limit reached. Please wait a moment and try again.',
        };
      }

      return {
        roadmap: null,
        error:
          'Our AI execution engine is taking longer than expected. Please try generating your roadmap again.',
      };
    }
  }
}
