/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Rubik', 'system-ui', 'sans-serif'] },
      colors: {
        navy: '#0F2236',
        teal: { DEFAULT: '#1B9AAA', light: '#5FC7D4', dark: '#137C89' },
        // Text colors from the design
        slate: { DEFAULT: '#3D5468', deep: '#24384C', line: '#B9CBD1' },
        safe: '#2C7A4F',
        mist: '#E6EEF0',
        warn: '#F08A3C',
        alarm: '#E5484D',
        ok: '#3FB97F',
      },
    },
  },
  plugins: [],
}
