/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F4F6F0',
        surface: '#FFFFFF',
        'surface-elevated': '#FAFAF9',
        primary: '#1B2A1E',
        secondary: '#5A6B5E',
        accent: {
          green: '#2D6A4F',
          red: '#D95D39',
          gold: '#D9A752',
        },
        border: '#E1E6DC',
        'border-subtle': '#EEF1EB',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(27, 42, 30, 0.03), 0 8px 20px rgba(27, 42, 30, 0.02)',
        'elevated': '0 6px 16px rgba(27, 42, 30, 0.04), 0 16px 40px rgba(27, 42, 30, 0.05)',
        'modal': '0 24px 64px rgba(27, 42, 30, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-mic': 'pulseMic 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseMic: {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(45, 106, 79, 0.4)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 0 14px rgba(45, 106, 79, 0)',
            transform: 'scale(1.06)',
          },
        },
      },
    },
  },
  plugins: [],
}