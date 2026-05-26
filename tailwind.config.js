/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0a0b',
          deep: '#050507',
          surface: '#111113',
          elevated: '#16161a',
          glass: 'rgba(22, 22, 26, 0.6)',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.06)',
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
        },
        text: {
          primary: '#f5f5f7',
          secondary: '#a1a1a8',
          tertiary: '#6e6e76',
          quaternary: '#48484e',
        },
        accent: {
          blue: '#4a9eff',
          emerald: '#2ee5a6',
          amber: '#ffb547',
          red: '#ff5e5e',
          purple: '#a78bfa',
        },
        graphite: '#1f1f24',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        md: '14px',
        lg: '18px',
      },
      letterSpacing: {
        body: '-0.011em',
        head: '-0.02em',
        tight: '-0.03em',
      },
      backdropBlur: {
        glass: '20px',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      keyframes: {
        pulseSlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(74, 158, 255, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(74, 158, 255, 0.4)' },
        },
      },
      animation: {
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        glow: 'glow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
