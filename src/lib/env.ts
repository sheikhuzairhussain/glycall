import z from "zod";

const envSchema = z
  .object({
    VERCEL_URL: z.string().optional(),
    MODEL_PROVIDER: z.string(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GLYPHIC_API_KEY: z.string(),
    GLYPHIC_BASE_URL: z.string(),
    DATABASE_URL: z.string(),
  })
  .superRefine((data) => {
    if (data.MODEL_PROVIDER.toLowerCase().includes("google")) {
      if (!data.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error(
          "GOOGLE_GENERATIVE_AI_API_KEY is required when MODEL_PROVIDER contains 'google'",
        );
      }
    } else if (data.MODEL_PROVIDER.toLowerCase() === "anthropic") {
      if (!data.ANTHROPIC_API_KEY) {
        throw new Error(
          "ANTHROPIC_API_KEY is required when MODEL_PROVIDER is 'anthropic'",
        );
      }
    } else {
      throw new Error("MODEL_PROVIDER must be 'anthropic' or contain 'google'");
    }
  });

export const env = envSchema.parse(process.env);
