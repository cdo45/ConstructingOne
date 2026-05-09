import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vance: {
          navy: "#1F4E78",
          orange: "#C65911",
          good: "#63BE7B",
          mid: "#FFEB84",
          bad: "#F8696B",
        },
      },
    },
  },
  plugins: [],
};

export default config;
