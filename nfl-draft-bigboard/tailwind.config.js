/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: '#0B1533',
        },
        accent: {
          cyan: '#00FFFF',
        },
      },
      fontFamily: {
        sans: ['Archivo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

