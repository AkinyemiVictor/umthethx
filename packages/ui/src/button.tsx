"use client";

import { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
  variant?: ButtonVariant;
}

const primaryClasses =
  "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white bg-orange-500 text-zinc-950 hover:bg-orange-600 active:bg-orange-700 active:text-white dark:focus-visible:ring-offset-zinc-950";

export const Button = ({
  children,
  className,
  appName,
  variant = "primary",
}: ButtonProps) => {
  const classes = [variant === "primary" ? primaryClasses : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      onClick={() => alert(`Hello from your ${appName} app!`)}
    >
      {children}
    </button>
  );
};
