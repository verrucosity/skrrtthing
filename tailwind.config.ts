import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // OBS/Twitch-adjacent dark palette. Flat surfaces, one accent.
        ink: "#0e0e10",
        surface: "#17171a",
        raised: "#1f1f23",
        edge: "#2b2b30",
        accent: {
          DEFAULT: "#9147ff",
          hover: "#a970ff",
          deep: "#772ce8",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["Cascadia Code", "Consolas", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
