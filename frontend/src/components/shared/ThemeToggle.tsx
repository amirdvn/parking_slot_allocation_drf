// src/components/shared/ThemeToggle.tsx
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../features/theme/ThemeContext";

interface ThemeToggleProps {
  position?: "top-left" | "top-right";
}

function ThemeToggle({ position = "top-left" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`fixed top-5 z-50 rounded-full bg-surface p-2.5 text-gray-500 shadow-sm ring-1 ring-black/5 transition-all hover:bg-gray-50 dark:text-gray-400 dark:ring-white/5 dark:hover:bg-[#2c2c2e] ${
        position === "top-left" ? "left-5" : "right-5"
      }`}
      aria-label={theme === "dark" ? "حالت روشن" : "حالت تاریک"}
      title={theme === "dark" ? "حالت روشن" : "حالت تاریک"}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default ThemeToggle;