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
          bg: 'var(--apple-bg)',
          surface: 'var(--apple-surface)',
          'surface-raised': 'var(--apple-surface-raised)',
          border: 'var(--apple-border)',
          text: 'var(--apple-text)',
          muted: 'var(--apple-muted)',
          accent: 'var(--apple-accent)',
          'accent-hover': 'var(--apple-accent-hover)',
          success: 'var(--apple-success)',
          warning: 'var(--apple-warning)',
          danger: 'var(--apple-danger)',
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
