/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        lora: ['Lora', 'serif'],
        nunito: ['Nunito', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#FFFDD0',
          100: '#FEFCBF',
          200: '#FAF089',
        },
        'home-bg': '#F5F9FF',
      }
    },
  },
  plugins: [],
};
