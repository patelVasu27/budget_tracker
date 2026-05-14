/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF9F7',
        surface: '#FFFFFF',
        'surface-elevated': '#FFFFFF',
        primary: '#1A1A1A',
        secondary: '#6B7280',
        accent: {
          green: '#059669',
          red: '#DC2626',
          gold: '#D97706',
        },
        border: '#E5E7EB',
        'border-subtle': '#F3F4F6',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        'elevated': '0 4px 6px rgba(0,0,0,0.02), 0 10px 24px rgba(0,0,0,0.04)',
        'modal': '0 20px 40px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-mic': 'pulseMic 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseMic: {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.4)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 0 12px rgba(220, 38, 38, 0)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
  },
  plugins: [],
}