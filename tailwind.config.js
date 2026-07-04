/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'welcome-glow': 'welcomeGlow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        welcomeGlow: {
          '0%': { textShadow: '0 0 8px rgba(192, 255, 0, 0.1)' },
          '100%': { textShadow: '0 0 24px rgba(192, 255, 0, 0.4), 0 0 48px rgba(192, 255, 0, 0.15)' },
        },
      },
    },
  },
  plugins: [],
}
