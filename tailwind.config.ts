import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        accent: "var(--accent)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
      },
      boxShadow: {
        "glow-blue":    "0 0 20px rgba(59, 130, 246, 0.15)",
        "glow-blue-sm": "0 0 12px rgba(59, 130, 246, 0.10)",
        "glow-blue-md": "0 0 30px rgba(59, 130, 246, 0.20)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-in",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
