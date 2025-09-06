/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#1E88E5',
          600: '#1976D2',
          700: '#1565C0',
          800: '#0D47A1',
          900: '#0B3C8E'
        },
        secondary: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#43A047',
          600: '#2E7D32',
          700: '#27632A',
          800: '#1B5E20',
          900: '#124116'
        },
        accent: {
          orange: '#FB8C00',
          teal: '#00897B'
        },
        neutral: {
          50: '#F5F5F5',
          100: '#E0E0E0',
          800: '#424242',
          900: '#212121'
        },
        error: '#E53935',
        warning: '#FBC02D'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out',
        'float': 'float 3s ease-in-out infinite'
      }
    },
  },
  plugins: [],
};
