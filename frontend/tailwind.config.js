/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['hover', 'focus', 'active', 'disabled'],
      textColor: ['hover', 'focus', 'active', 'disabled'],
      opacity: ['hover', 'focus', 'active', 'disabled'],
      cursor: ['hover', 'focus', 'active', 'disabled'],
      pointerEvents: ['disabled'],
      borderColor: ['hover', 'focus', 'active', 'disabled'],
    },
  },
  plugins: [],
}
