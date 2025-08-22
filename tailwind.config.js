/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sky-light': '#87CEEB',
        'sky-dark': '#4682B4',
        'cloud-white': '#F0F8FF',
        'grass-green': '#90EE90',
        'bone-white': '#FFF8DC',
        'dog-brown': '#D2B48C',
      },
      fontFamily: {
        'pixel': ['monospace'],
      },
      animation: {
        'bounce-gentle': 'bounce 2s infinite',
        'pulse-glow': 'pulse 1.5s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
