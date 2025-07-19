/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scans all files in src for Tailwind classes
  ],
  theme: {
    extend: {
      colors: {
        primary: '#228B22',    // Forest green
        secondary: '#8B4513',  // Saddle brown
        accent: '#D2B48C',     // Tan
        background: '#F5F5DC', // Beige
        text: '#333333',       // Dark gray
        light: '#FAFAFA',      // Off-white
        dark: '#2F4F4F',       // Dark teal
        success: '#32CD32',    // Lime green
        warning: '#DAA520',    // Goldenrod
        error: '#CD5C5C',      // Indian red
        'primary-light': '#32CD32',   // Lighter green
        'primary-dark': '#006400',    // Darker green
        'secondary-light': '#A0522D', // Light brown
        'secondary-dark': '#654321',  // Darker brown
        'accent-light': '#DEB887',    // Light tan
        'accent-dark': '#BC9A6A',     // Darker tan
      },
      fontFamily: {
        sans: ['Inter', 'Open Sans', 'system-ui', 'sans-serif'], // Clean, natural fonts
      },
      boxShadow: {
        'natural': '0 4px 8px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)', // Subtle shadow
        'natural-lg': '0 8px 16px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
        'natural-xl': '0 16px 32px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.10)',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out', // Subtle animations
        'slide-up': 'slide-up 0.4s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};