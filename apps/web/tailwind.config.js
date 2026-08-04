/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        apple: {
          bg: '#0d0d0f',
          surface: '#1a1a1d',
          'surface-raised': '#232326',
          border: '#2c2c2f',
          text: '#f5f5f7',
          muted: '#8e8e93',
          accent: '#0a84ff',
          'accent-hover': '#409cff',
          success: '#30d158',
          warning: '#ff9f0a',
          danger: '#ff453a',
        },
      },
      boxShadow: {
        apple: '0 4px 24px rgba(0, 0, 0, 0.08)',
        'apple-sm': '0 2px 12px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'apple': '18px',
        'apple-sm': '12px',
      },
    },
  },
  plugins: [],
};
