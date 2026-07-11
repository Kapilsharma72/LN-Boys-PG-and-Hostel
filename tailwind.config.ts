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
        // LN Boys PG & Hostel brand palette
        navy: {
          DEFAULT: "#0B0B3B",
          50: "#e8e8f5",
          100: "#c5c5e6",
          200: "#9f9fd6",
          300: "#7878c6",
          400: "#5c5cb9",
          500: "#3f3fac",
          600: "#2e2e96",
          700: "#1f1f7a",
          800: "#14145c",
          900: "#0B0B3B",
        },
        gold: {
          DEFAULT: "#F5C518",
          50: "#fffde7",
          100: "#fff9c4",
          200: "#fff176",
          300: "#ffee58",
          400: "#ffca28",
          500: "#F5C518",
          600: "#f9a825",
          700: "#f57f17",
          800: "#e65100",
          900: "#bf360c",
        },
        brand: {
          navy: "#0B0B3B",
          gold: "#F5C518",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
