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
        primary: "#FF8A3D",
        surface: "#F9FAFB",
        border: "#E5E7EB",
        text: "#1F2937",
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-kr)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
