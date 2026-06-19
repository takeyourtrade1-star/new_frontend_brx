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
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'gavel-bang': {
          '0%': { transform: 'rotate(0deg)' },
          '18%': { transform: 'rotate(-26deg)' },
          '34%': { transform: 'rotate(10deg)' },
          '44%': { transform: 'rotate(6deg)' },
          '58%': { transform: 'rotate(-16deg)' },
          '74%': { transform: 'rotate(8deg)' },
          '84%': { transform: 'rotate(4deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'gavel-spark': {
          '0%, 30%': { opacity: '0', transform: 'scale(0.3)' },
          '36%': { opacity: '1', transform: 'scale(1)' },
          '48%': { opacity: '0', transform: 'scale(0.7)' },
          '70%': { opacity: '0', transform: 'scale(0.3)' },
          '76%': { opacity: '0.85', transform: 'scale(0.92)' },
          '88%': { opacity: '0', transform: 'scale(0.6)' },
          '100%': { opacity: '0', transform: 'scale(0.3)' },
        },
        'bag-pop': {
          '0%': { transform: 'translateY(0) scale(1)' },
          '20%': { transform: 'translateY(-2px) scale(1.08)' },
          '44%': { transform: 'translateY(0) scale(0.94)' },
          '62%': { transform: 'translateY(-1px) scale(1.04)' },
          '80%': { transform: 'translateY(0) scale(0.98)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        'bag-handle': {
          '0%': { transform: 'scaleY(1)' },
          '30%': { transform: 'scaleY(1.55)' },
          '52%': { transform: 'scaleY(0.9)' },
          '70%': { transform: 'scaleY(1.25)' },
          '86%': { transform: 'scaleY(1.05)' },
          '100%': { transform: 'scaleY(1)' },
        },
        'bag-spark': {
          '0%, 30%': { opacity: '0', transform: 'scale(0.3) translateY(2px)' },
          '42%': { opacity: '1', transform: 'scale(1) translateY(0)' },
          '58%': { opacity: '0', transform: 'scale(0.7) translateY(-3px)' },
          '78%': { opacity: '0', transform: 'scale(0.3) translateY(2px)' },
          '100%': { opacity: '0', transform: 'scale(0.3) translateY(2px)' },
        },
        'tag-tilt': {
          '0%': { transform: 'rotate(0deg)' },
          '28%': { transform: 'rotate(-9deg)' },
          '55%': { transform: 'rotate(5deg)' },
          '78%': { transform: 'rotate(-2deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'coin-pop': {
          '0%': { opacity: '0', transform: 'scale(0.4) translateY(8px) rotateY(0deg)' },
          '30%': { opacity: '1', transform: 'scale(1) translateY(-6px) rotateY(180deg)' },
          '55%': { opacity: '1', transform: 'scale(1.08) translateY(-9px) rotateY(360deg)' },
          '78%': { opacity: '1', transform: 'scale(0.97) translateY(-7px) rotateY(360deg)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(-8px) rotateY(360deg)' },
        },
        'coin-shine': {
          '0%, 40%': { opacity: '0', transform: 'translateX(-4px) rotate(18deg)' },
          '58%': { opacity: '0.9', transform: 'translateX(0) rotate(18deg)' },
          '76%, 100%': { opacity: '0', transform: 'translateX(5px) rotate(18deg)' },
        },
        'coin-earn': {
          '0%, 35%': { opacity: '0', transform: 'translateY(4px) scale(0.4)' },
          '55%': { opacity: '1', transform: 'translateY(-1px) scale(1)' },
          '72%': { opacity: '1', transform: 'translateY(-4px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-11px) scale(0.85)' },
        },
        'cart-wobble': {
          '0%': { transform: 'translateY(0) rotate(0deg)' },
          '18%': { transform: 'translateY(-2px) rotate(-16deg)' },
          '34%': { transform: 'translateY(0) rotate(11deg)' },
          '50%': { transform: 'translateY(-1px) rotate(-7deg)' },
          '68%': { transform: 'translateY(0) rotate(4deg)' },
          '84%': { transform: 'translateY(0) rotate(-2deg)' },
          '100%': { transform: 'translateY(0) rotate(0deg)' },
        },
        'cart-speed': {
          '0%, 35%': { opacity: '0', transform: 'translateX(0)' },
          '48%': { opacity: '1', transform: 'translateX(-2px)' },
          '70%': { opacity: '0.5', transform: 'translateX(-5px)' },
          '100%': { opacity: '0', transform: 'translateX(-7px)' },
        },
      },
      animation: {
        'caret-blink': 'caret-blink 1.2s ease-out infinite',
        'countdown-flip': 'countdown-flip 0.4s ease-in-out',
        'auth-enter': 'auth-enter 0.5s ease-out forwards',
        'slide-up': 'slide-up 0.22s cubic-bezier(0.16,1,0.3,1) forwards',
        'gavel-bang': 'gavel-bang 0.95s cubic-bezier(0.34,1.56,0.64,1)',
        'gavel-spark': 'gavel-spark 0.95s ease-out',
        'bag-pop': 'bag-pop 0.9s cubic-bezier(0.34,1.56,0.64,1)',
        'bag-handle': 'bag-handle 0.9s ease-out',
        'bag-spark': 'bag-spark 0.9s ease-out',
        'tag-tilt': 'tag-tilt 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        'coin-pop': 'coin-pop 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'coin-shine': 'coin-shine 0.8s ease-out',
        'coin-earn': 'coin-earn 1s ease-out',
        'cart-wobble': 'cart-wobble 0.9s cubic-bezier(0.34,1.56,0.64,1)',
        'cart-speed': 'cart-speed 0.9s ease-out',
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
