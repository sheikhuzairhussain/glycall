import z from "zod";

const envSchema = z.object({
  VERCEL_URL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
