import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          500: "#3b6cf0",
          600: "#2f56d4",
          700: "#2544ab",
        },
      },
    },
  },
  plugins: [],
};

export default config;
