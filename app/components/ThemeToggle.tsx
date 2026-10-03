"use client";

import { useTheme } from "@/app/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "system", label: "System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ] as const;

  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={`Set theme to ${option.label}`}
          onClick={() => setTheme(option.value)}
          className={`rounded-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${
            theme === option.value
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
