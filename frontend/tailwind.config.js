/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 14px rgba(0,0,0,.06)',
      },
    },
  },
  plugins: [
    // If you installed it: require('@tailwindcss/line-clamp'),
  ],
}
