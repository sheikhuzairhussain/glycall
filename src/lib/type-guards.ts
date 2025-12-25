import type { UIMessagePart } from "ai";

/**
 * Type guard to check if a message part is a tool part.
 */
export function isToolPart(
  part: UIMessagePart,
): part is UIMessagePart & { type: `tool-${string}` } {
  return part.type.startsWith("tool-");
}

/**
 * Type guard to check if a message part is a text part.
 */
export function isTextPart(
  part: UIMessagePart,
): part is Extract<UIMessagePart, { type: "text" }> {
  return part.type === "text";
}

/**
 * Type guard to check if a message part is a reasoning part.
 */
export function isReasoningPart(
  part: UIMessagePart,
): part is Extract<UIMessagePart, { type: "reasoning" }> {
  return part.type === "reasoning";
}

/**
 * Type guard to check if a message part is a file part.
 */
export function isFilePart(
  part: UIMessagePart,
): part is Extract<UIMessagePart, { type: "file" }> {
  return part.type === "file";
}
