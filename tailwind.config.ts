import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0f0f0f",
          card: "#1a1a1a",
          border: "#2a2a2a",
          muted: "#3a3a3a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
