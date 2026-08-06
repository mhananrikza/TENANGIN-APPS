import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: "#7FA98F",
          light: "#A8C9B5",
        },
        sand: "#FAF6F0",
        rose: {
          DEFAULT: "#E8B4B8",
          dark: "#C98A8E",
        },
        teal: {
          DEFAULT: "#2C4A46",
        },
        amber: {
          DEFAULT: "#F0C987",
        },
        cloud: "#D8D4CC",
        dark: {
          bg: "#1E2624",
          card: "#293632",
          text: "#F2EFE9",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        button: "16px",
        input: "14px",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(44,74,70,0.06)",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
        },
        bloom: {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "toast-in": {
          "0%": { transform: "translateY(-16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "confetti-burst": {
          "0%": { transform: "translate(0, 0) rotate(0deg)", opacity: "1" },
          "100%": {
            transform: "translate(var(--dx), var(--dy)) rotate(200deg)",
            opacity: "0",
          },
        },
        pop: {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "60%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateX(16px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        breathe: "breathe 1.4s ease-in-out infinite",
        bloom: "bloom 400ms ease-out",
        "toast-in": "toast-in 280ms cubic-bezier(0.22,1,0.36,1)",
        "confetti-burst": "confetti-burst 1.1s cubic-bezier(0.22,1,0.36,1) forwards",
        pop: "pop 420ms cubic-bezier(0.22,1,0.36,1)",
        "slide-in": "slide-in 300ms cubic-bezier(0.22,1,0.36,1)",
        "fade-up": "fade-up 420ms cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
