import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#181A1B',
        paper: '#F6F4EE',
        accent: {
          DEFAULT: '#1E6F5C',
          dark: '#134A3D',
          light: '#E3EFEA',
        },
        line: '#E4E0D6',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
