import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Avatar & Participant Utilities
// ============================================================================

const AVATAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
] as const;

/**
 * Get initials from a name or email address.
 * @param name - Full name (e.g., "John Doe")
 * @param email - Email address fallback
 * @returns 1-2 character initials (uppercase)
 */
export function getInitials(
  name?: string | null,
  email?: string | null,
): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?";
}

/**
 * Get a consistent avatar color based on a string identifier.
 * Uses a hash function to ensure the same identifier always gets the same color.
 * @param identifier - String to hash (usually email or name)
 * @returns Tailwind CSS class for background color
 */
export function getAvatarColor(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Get a unique identifier string for a participant.
 * @param participant - Object with optional name, email, and id
 * @returns Best available identifier string
 */
export function getParticipantIdentifier(participant: {
  name?: string | null;
  email?: string | null;
  id: number;
}): string {
  return participant.email || participant.name || String(participant.id);
}

// ============================================================================
// Date Formatting Utilities
// ============================================================================

/**
 * Format a date string relative to now (e.g., "Today at 2:30 PM", "Yesterday", etc.)
 * @param dateString - ISO date string
 * @returns Human-readable relative date string
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date string as a full date with time.
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Wednesday, December 25, 2024 at 2:30 PM")
 */
export function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// Duration Utilities
// ============================================================================

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
