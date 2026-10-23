/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#f3ead6',
        ink: '#2c241b',
        brown: '#6b4426',
        gold: '#b8863b',
        forest: '#2f5d50',
        wine: '#8c2f2f',
      },
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', '"Noto Serif SC"', '"Songti SC"', 'Georgia', 'serif'],
        body: ['system-ui', '"Noto Sans SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
