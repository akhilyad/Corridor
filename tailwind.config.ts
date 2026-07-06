import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Corridor brand. Infrastructure + Europe. Deep slate base, amber "weld" accent.
        ink: {
          50: "#f6f7f8",
          100: "#eceef1",
          200: "#d4d8df",
          300: "#aeb5c2",
          400: "#818b9f",
          500: "#636e84",
          600: "#4e586a",
          700: "#404857",
          800: "#373e4a",
          900: "#1d2230",
          950: "#11151f",
        },
        weld: {
          50: "#fdf6ef",
          100: "#f8e7d2",
          200: "#f0c79f",
          300: "#e6a163",
          400: "#dd7e36",
          500: "#c8601c",
          600: "#a94c16",
          700: "#863a16",
          800: "#6d3018",
          900: "#5c2a18",
        },
        sea: {
          50: "#eef6f8",
          100: "#d4eaf0",
          200: "#a9d5e1",
          300: "#74b8ce",
          400: "#4697b1",
          500: "#2f7c97",
          600: "#2a6580",
          700: "#285469",
          800: "#274858",
          900: "#243d4b",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(29,34,48,0.06), 0 1px 3px 0 rgba(29,34,48,0.04)",
        cardHover: "0 6px 16px -4px rgba(29,34,48,0.12), 0 2px 6px -2px rgba(29,34,48,0.08)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
