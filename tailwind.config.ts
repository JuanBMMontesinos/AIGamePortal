import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gamer: {
          950: "#060608",
          900: "#0a0a0e",
          850: "#101017",
          800: "#14141e",
          700: "#1c1c2b",
          600: "#28283d",
          500: "#3d3d5c",
        },
        brand: {
          purple: "#8b5cf6",
          cyan: "#06b6d4",
          emerald: "#10b981",
          rose: "#f43f5e",
          amber: "#f59e0b",
        },
      },
      boxShadow: {
        "neon-purple": "0 0 25px -5px rgba(139, 92, 246, 0.35)",
        "neon-cyan": "0 0 25px -5px rgba(6, 182, 212, 0.35)",
        "neon-glow": "0 0 35px -5px rgba(139, 92, 246, 0.25), 0 0 15px -3px rgba(6, 182, 212, 0.2)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gamer-radial": "radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15), transparent 70%)",
        "cyber-grid": "linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
