// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./sections/**/*.{js,jsx,ts,tsx}",
    "./*.{js,jsx,ts,tsx}" // Include root files like App.js
  ],
 presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#2A2A2A',    // Dark charcoal
          beige: '#D4B896',   // Elegant beige
          light: '#F5F5F5',   // Light gray
        },
        background: {
          primary: '#2A2A2A',
          secondary: '#F5F5F5',
          accent: '#D4B896',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#2A2A2A', 
          accent: '#D4B896',
        }
      },
      fontFamily: {
        'sans': ['System'],
      },
    },
  },
  plugins: [],
}