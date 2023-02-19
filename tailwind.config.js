/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        monza: {
          50: '#ffefef',
          100: '#ffe1e2',
          200: '#ffc7cc',
          300: '#ff99a2',
          400: '#ff5f72',
          500: '#ff2847',
          600: '#fa0431',
          700: '#d40029',
          800: '#bc002d',
          900: '#97042c',
        },
      },
      transitionProperty: {
        mapMarkerSize: 'width, height',
      },
    },
  },
  plugins: [],
}
