/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: { xs: "330px" },
      colors: {
        blue: {
          50: "#fff3e9",
          100: "#fce8d5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f26b0c",
          600: "#f26b0c",
          700: "#de3204",
          800: "#9a3412",
          900: "#7c2d12",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@headlessui/tailwindcss")],
};