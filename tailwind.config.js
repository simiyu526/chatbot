/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,js,ts,jsx,tsx}", // Adjust based on your framework
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e40af", // Indigo-800
        secondary: "#64748b", // Slate-500
        accent: "#22d3ee", // Cyan-400
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },
      spacing: {
        128: "32rem",
        144: "36rem",
      },
      borderRadius: {
        xl: "1.25rem",
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
      },
    },
  },
  darkMode: "class", // or 'media'
  plugins: [],
};
