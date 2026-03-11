/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./ui-kit.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        purple: {
          DEFAULT: "#3d1b4d",
          light: "#7e7bff",
          bright: "#8d33c6",
        },
        burgundy: "#5e1d49",
        coral: {
          DEFAULT: "#ff7f6c",
          light: "#fdf5f1",
        },
        gold: "#ffdb8d",
        teal: "#07c5ce",
        "bright-pink": "#e073a7",
      },
      keyframes: {
        breathe: {
          "0%,100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.03)", opacity: "1" },
        },
        attentive: {
          "0%,100%": { transform: "scale(1) translateY(0)" },
          "50%": { transform: "scale(1.05) translateY(-2px)" },
        },
        think: {
          "0%": { filter: "hue-rotate(0deg)" },
          "50%": { filter: "hue-rotate(15deg)" },
          "100%": { filter: "hue-rotate(0deg)" },
        },
        speak: {
          "0%,100%": { transform: "scale(1)", filter: "brightness(1)" },
          "25%": { transform: "scale(1.04)", filter: "brightness(1.1)" },
          "75%": { transform: "scale(0.98)", filter: "brightness(0.95)" },
        },
      },
      animation: {
        breathe: "breathe 3s ease-in-out infinite",
        attentive: "attentive 2s ease-in-out infinite",
        think: "think 2s ease-in-out infinite",
        speak: "speak 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
