import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        shade: {
          black: "#050608",
          charcoal: "#101318",
          panel: "#151922",
          line: "#262c36",
          silver: "#aeb7c6",
          blue: "#6c8cff",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(108, 140, 255, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
