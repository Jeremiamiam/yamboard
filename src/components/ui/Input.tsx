import { cn } from "@/lib/cn";
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

/* ═══════════════════════════════════════════════════════════════
   Input & Textarea — form field primitives.
   ═══════════════════════════════════════════════════════════════ */

const inputBase =
  "w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-emerald-500/40 dark:focus:shadow-[0_0_10px_rgba(80,250,123,0.08)] transition-all";

const inputSizes = {
  sm: "px-2.5 py-1.5 text-xs rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-sm rounded-xl",
} as const;

const inputVariants = {
  default: "",
  /** No background, just underline */
  inline:
    "bg-transparent dark:bg-transparent border-0 border-b border-zinc-300 dark:border-zinc-700 rounded-none px-0 pb-0.5",
  /** Ghost — no visible border until focus */
  ghost:
    "bg-transparent dark:bg-transparent border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:border-zinc-400 dark:focus:border-zinc-500",
} as const;

type InputSize = keyof typeof inputSizes;
type InputVariant = keyof typeof inputVariants;

/* ─── Input ──────────────────────────────────────────────── */

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
  variant?: InputVariant;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ inputSize = "md", variant = "default", className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputBase, inputSizes[inputSize], inputVariants[variant], className)}
      {...props}
    />
  ),
);
InputField.displayName = "InputField";

/* ─── Textarea ───────────────────────────────────────────── */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  inputSize?: InputSize;
  variant?: InputVariant;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ inputSize = "md", variant = "default", className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(inputBase, inputSizes[inputSize], inputVariants[variant], "resize-y leading-relaxed", className)}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { InputField, Textarea, type InputFieldProps, type TextareaProps };
