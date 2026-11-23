/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ranch: {
          50: '#f4f7f4',
          100: '#e5eee5',
          200: '#ceddce',
          300: '#a7c3a7',
          400: '#79a279',
          500: '#558355',
          600: '#416841',
          700: '#345234',
          800: '#2c432c',
          900: '#253725',
          950: '#111d11',
        },
        clay: {
          50: '#fbf7f4',
          100: '#f5ebe4',
          200: '#ebd6c9',
          300: '#debca6',
          400: '#cd9b7d',
          500: '#c0805c',
          600: '#b16a4c',
          700: '#94543e',
          800: '#794537',
          900: '#643a30',
          950: '#351c17',
        }
      }
    },
  },
  plugins: [],
}
