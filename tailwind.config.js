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
          bg: '#f5f5f7',
          surface: '#ffffff',
          border: '#d2d2d7',
          text: '#1d1d1f',
          muted: '#86868b',
          accent: '#0071e3',
          'accent-hover': '#0077ed',
          success: '#34c759',
          warning: '#ff9500',
          danger: '#ff3b30',
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
