import type { Config } from "tailwindcss";

const families = [
  "red",
  "blue",
  "green",
  "orange",
  "emerald",
  "zinc",
  "slate",
  "amber",
  "yellow",
  "violet",
  "cyan",
];

const safelist = families.flatMap((f) => [
  `bg-${f}-100`,
  `bg-${f}-600`,
  `bg-${f}-700/10`,
  `text-${f}-600`,
  `text-${f}-700`,
  `border-${f}-300`,
  `border-${f}-700`,
  `ring-${f}-500`,
  `dark:bg-${f}-700/20`,
  `dark:bg-${f}-950/40`,
  `dark:text-${f}-300`,
  `dark:text-${f}-400`,
  `dark:border-${f}-700`,
]);

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  safelist,
  plugins: [],
} satisfies Config;
