/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['"Manrope"', '"Inter"', 'sans-serif'],
        brand: ['"Cinzel"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        haterra: {
          forest: '#1A3627',
          ranch: '#294B38',
          sage: '#486456',
          ivory: '#E9E3D2',
          brass: '#B49A67',
          canvas: '#F6F5EF',
          text: '#202C25',
          muted: '#69766C',
          border: '#E5E3DA',
        },
        ranch: {
          50: '#f4f7f5',
          100: '#e4ebe6',
          200: '#c7d7cc',
          300: '#9eb8a7',
          400: '#6e917b',
          500: '#486456',
          600: '#294B38',
          700: '#1A3627',
          800: '#152C20',
          900: '#102219',
          950: '#08120D',
        },
        clay: {
          50: '#fbf9f4',
          100: '#f4efe3',
          200: '#E9E3D2',
          300: '#d7cab0',
          400: '#c4af86',
          500: '#B49A67',
          600: '#9b7f4d',
          700: '#7f653c',
          800: '#685233',
          900: '#55442b',
          950: '#2f2415',
        }
      }
    },
  },
  plugins: [],
}
