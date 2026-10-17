/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EEF2FF',  // Iridescent ice violet
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',  // Luminous electric iris
          500: '#6366F1',  // Electric violet
          600: '#4F46E5',  // Core Royal Sapphire
          700: '#4338CA',  // Imperial Indigo
          800: '#3730A3',  // Midnight Ink
          900: '#1E1B4B',  // Deep Velvet Obsidian
          950: '#0F0E2A',  // Cosmic Night
        },
        accent: {
          gold: '#F59E0B',
          'gold-light': '#FEF3C7',
          'gold-dark': '#B45309',
          emerald: '#10B981',
          'emerald-light': '#ECFDF5',
          'emerald-dark': '#047857',
          rose: '#F43F5E',
          'rose-light': '#FFF1F2',
          cyan: '#06B6D4',
          'cyan-light': '#ECFEFF',
        },
        brand: {
          bg: '#F8FAFC',
          canvas: '#FAFBFD',
          dark: '#0B0F19',
          surface: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 20px 35px -8px rgba(79, 70, 229, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.04)',
        glow: '0 0 25px rgba(99, 102, 241, 0.35)',
        'glow-sm': '0 0 15px rgba(99, 102, 241, 0.18)',
        'gold-glow': '0 0 20px rgba(245, 158, 11, 0.25)',
        glass: '0 8px 32px 0 rgba(15, 23, 42, 0.06)',
        'inner-bevel': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
