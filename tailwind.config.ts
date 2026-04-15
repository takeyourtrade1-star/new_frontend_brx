import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
      },
      maxWidth: {
        'content': '90rem',
        'content-xl': '100rem',
        'content-2xl': '120rem',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-comodo)'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // Shadcn (CSS variables)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: '#FF7300',
          foreground: '#ffffff',
          // Testo su sfondo chiaro: #CC5C00 ha contrasto 4.54:1 (WCAG AA)
          text: '#CC5C00',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Design System Ebartex – solidi
        'header-bg': '#0F172A',
        'input-bg': '#d9d9d9',
        'stroke-grey': '#878787',

        // Gradient start/end (per from-X to-Y)
        'global-bg-start': '#3D65C6',
        'global-bg-end': '#1D3160',
        'card1-start': '#BB82FF',
        'card1-end': '#4A02A4',
        'card2-start': '#CC7E4A',
        'card2-end': '#291442',
        'card3-start': '#32A6A8',
        'card3-end': '#291442',
        'card4-start': '#A83269',
        'card4-end': '#291442',
        'footer-start': '#6732A8',
        'footer-end': '#291442',
        marquee: '#F3C76A',
      },
      keyframes: {
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
        'countdown-flip': {
          '0%': { transform: 'rotateX(0deg)', opacity: '1' },
          '50%': { transform: 'rotateX(-90deg)', opacity: '0.5' },
          '51%': { transform: 'rotateX(90deg)', opacity: '0.5' },
          '100%': { transform: 'rotateX(0deg)', opacity: '1' },
        },
        'auth-enter': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'caret-blink': 'caret-blink 1.2s ease-out infinite',
        'countdown-flip': 'countdown-flip 0.4s ease-in-out',
        'auth-enter': 'auth-enter 0.5s ease-out forwards',
      },
      backgroundImage: {
        'gradient-global': 'linear-gradient(to bottom, #3D65C6 0%, #1D3160 100%)',
        'gradient-card1': 'linear-gradient(135deg, #BB82FF 0%, #4A02A4 100%)',
        'gradient-card2': 'linear-gradient(135deg, #CC7E4A 0%, #291442 100%)',
        'gradient-card3': 'linear-gradient(135deg, #32A6A8 0%, #291442 100%)',
        'gradient-card4': 'linear-gradient(135deg, #A83269 0%, #291442 100%)',
        'gradient-footer': 'linear-gradient(135deg, #6732A8 0%, #291442 100%)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
