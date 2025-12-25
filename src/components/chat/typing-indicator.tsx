"use client";

import { motion } from "motion/react";
import { Message, MessageContent } from "@/components/ai-elements/message";

/**
 * Animated typing indicator shown while the assistant is processing.
 * Displays three bouncing dots.
 */
export function TypingIndicator() {
  return (
    <motion.div
      key="typing-indicator"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Message from="assistant">
        <MessageContent>
          <div className="flex items-center gap-1 py-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1.5 rounded-full bg-foreground/80"
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </MessageContent>
      </Message>
    </motion.div>
  );
}
