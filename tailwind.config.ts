import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#000000",
          secondary: "#0a0a0a",
          card: "#111111",
          hover: "#1a1a1a"
        },
        border: {
          DEFAULT: "#222222",
          light: "#333333"
        },
        text: {
          primary: "#ffffff",
          secondary: "#888888",
          muted: "#555555"
        },
        accent: {
          DEFAULT: "#ffffff",
          dim: "#333333"
        },
        status: {
          success: "#22c55e",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#3b82f6"
        }
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
