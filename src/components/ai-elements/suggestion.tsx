"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { Children, type ComponentProps, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

export type SuggestionsProps = ComponentProps<typeof ScrollArea> & {
  animate?: boolean;
};

export const Suggestions = ({
  className,
  children,
  animate = true,
  ...props
}: SuggestionsProps) => (
  <ScrollArea className="w-full overflow-x-auto whitespace-nowrap" {...props}>
    {animate ? (
      <AnimatePresence mode="wait">
        <motion.div
          className={cn("flex w-max flex-nowrap items-center gap-2", className)}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {Children.map(children, (child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    ) : (
      <div
        className={cn("flex w-max flex-nowrap items-center gap-2", className)}
      >
        {children}
      </div>
    )}
    <ScrollBar className="hidden" orientation="horizontal" />
  </ScrollArea>
);

export type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = "outline",
  size = "sm",
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = () => {
    onClick?.(suggestion);
  };

  return (
    <Button
      className={cn("cursor-pointer rounded-full px-4", className)}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children || suggestion}
    </Button>
  );
};

// Grid-based suggestions for welcome screens
export type SuggestionsGridProps = {
  children: ReactNode;
  className?: string;
};

const gridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const gridItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

export const SuggestionsGrid = ({
  children,
  className,
}: SuggestionsGridProps) => (
  <motion.div
    className={cn("grid auto-rows-fr gap-2 sm:grid-cols-2", className)}
    variants={gridContainerVariants}
    initial="hidden"
    animate="visible"
  >
    {Children.map(children, (child, index) => (
      <motion.div key={index} variants={gridItemVariants} className="h-full">
        {child}
      </motion.div>
    ))}
  </motion.div>
);

export type SuggestionCardProps = {
  suggestion: string;
  onClick?: (suggestion: string) => void;
  className?: string;
};

export const SuggestionCard = ({
  suggestion,
  onClick,
  className,
}: SuggestionCardProps) => {
  const handleClick = () => {
    onClick?.(suggestion);
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={cn(
        "h-full w-full cursor-pointer rounded-lg border bg-card px-3 py-2.5 text-left text-sm transition-colors hover:border-foreground/25 flex items-start justify-start",
        className,
      )}
    >
      {suggestion}
    </button>
  );
};
