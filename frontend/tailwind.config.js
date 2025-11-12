/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D7D3F',
          light: '#E8F4EA',
          dark: '#1F5A2D',
        },
        muted: '#5C6F63',
        surface: '#F5F6F0',
        'surface-light': '#FBFDF8',
      },
      boxShadow: {
        soft: '0 25px 55px rgba(33, 79, 58, 0.15)',
        card: '0 18px 40px rgba(33, 68, 54, 0.12)',
      },
      borderRadius: {
        xl: '1.5rem',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
    },
  },
  plugins: [],
}
