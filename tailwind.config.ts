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
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Primary Brand Color
          600: '#ea580c',
        },
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          600: '#57534e',
          800: '#292524',
        },
      },
    },
  },
  plugins: [],
};
export default config;
