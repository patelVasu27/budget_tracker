/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'positive': '#10B981',
        'negative': '#EF4444',
      }
    },
  },
  plugins: [],
}