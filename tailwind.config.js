/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ecount: {
          navy: '#1C3B6E',
          blue: '#004F9F',
          gray: '#F2F4F7',
          border: '#C9D1D9',
          rowHover: '#EBF1F5'
        }
      }
    },
  },
  plugins: [],
}
