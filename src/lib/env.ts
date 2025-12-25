import z from "zod";

const envSchema = z.object({
  VERCEL_URL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string(),
  GLYPHIC_API_KEY: z.string(),
  GLYPHIC_BASE_URL: z.string(),
  DATABASE_URL: z.string(),
});

export const env = envSchema.parse(process.env);
