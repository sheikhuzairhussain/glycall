import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type DurationFormat = "short" | "medium" | "long";

/**
 * Formats a duration in seconds to a human-readable string.
 *
 * @param seconds - The duration in seconds
 * @param format - The format style:
 *   - "short": "1h 30m" (omits seconds if hours present)
 *   - "medium": "1h 30m 45s" (always shows all non-zero units)
 *   - "long": "1 hour 30 minutes 45 seconds" (verbose)
 * @returns Formatted duration string
 */
export function formatDuration(
  seconds: number,
  format: DurationFormat = "medium",
): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (format === "long") {
    const parts: string[] = [];
    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
    }
    if (secs > 0 || parts.length === 0) {
      parts.push(`${secs} ${secs === 1 ? "second" : "seconds"}`);
    }
    // Join with "and" before the last element for natural language
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts[0]}, ${parts[1]} and ${parts[2]}`;
  }

  if (format === "short") {
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }

  // "medium" format
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
