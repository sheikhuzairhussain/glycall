import type { UIMessagePart } from "ai";

type AnyUIMessagePart = UIMessagePart<
  Record<string, unknown>,
  Record<string, { input: unknown; output: unknown }>
>;

/**
 * Type guard to check if a message part is a tool part.
 */
export function isToolPart(
  part: AnyUIMessagePart,
): part is AnyUIMessagePart & { type: `tool-${string}` } {
  return part.type.startsWith("tool-");
}

/**
 * Type guard to check if a message part is a text part.
 */
export function isTextPart(
  part: AnyUIMessagePart,
): part is Extract<AnyUIMessagePart, { type: "text" }> {
  return part.type === "text";
}

/**
 * Type guard to check if a message part is a reasoning part.
 */
export function isReasoningPart(
  part: AnyUIMessagePart,
): part is Extract<AnyUIMessagePart, { type: "reasoning" }> {
  return part.type === "reasoning";
}

/**
 * Type guard to check if a message part is a file part.
 */
export function isFilePart(
  part: AnyUIMessagePart,
): part is Extract<AnyUIMessagePart, { type: "file" }> {
  return part.type === "file";
}
