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
      // Scala z-index tokenizzata (Piano 2.5). Additiva: i default Tailwind
      // (0/10/20/30/40/50/auto) restano disponibili. Gli usi `z-[N]` arbitrari
      // andranno migrati a questi token in un passo successivo verificato a runtime.
      zIndex: {
        base: '0',
        dropdown: '100',
        sticky: '200',
        'modal-backdrop': '240',
        modal: '300',
        toast: '400',
        tooltip: '500',
        devtools: '9999',
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
        'tag-shift': {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '55%': { transform: 'translate(-3.5px, 3.5px) rotate(-6deg)' },
          '100%': { transform: 'translate(-2.5px, 3px) rotate(-2deg)' },
        },
        'coin-peek': {
          '0%': { opacity: '0', transform: 'translate(1px, -1px) scale(0.3)' },
          '55%': { opacity: '1', transform: 'translate(3.5px, -3.5px) scale(1.15)' },
          '78%': { opacity: '1', transform: 'translate(2.7px, -2.7px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translate(3px, -3px) scale(1)' },
        },
        'coin-peek-shine': {
          '0%, 45%': { opacity: '0', transform: 'translate(1px, -3px) rotate(15deg)' },
          '65%': { opacity: '0.9', transform: 'translate(3px, -3px) rotate(15deg)' },
          '85%, 100%': { opacity: '0', transform: 'translate(6px, -1px) rotate(15deg)' },
        },
        /* Varianti "-loop" delle icone header: stessi valori di rotazione/scala/
         * traslazione delle animazioni hover (gavel-bang, tag-shift, coin-peek,
         * ecc.), solo ricalibrate su una timeline più lunga con una pausa a
         * riposo, per l'auto-play in loop nel ventaglio della landing. */
        'gavel-bang-loop': {
          '0%, 30%, 100%': { transform: 'rotate(0deg)' },
          '5.4%': { transform: 'rotate(-26deg)' },
          '10.2%': { transform: 'rotate(10deg)' },
          '13.2%': { transform: 'rotate(6deg)' },
          '17.4%': { transform: 'rotate(-16deg)' },
          '22.2%': { transform: 'rotate(8deg)' },
          '25.2%': { transform: 'rotate(4deg)' },
        },
        'gavel-spark-loop': {
          '0%, 9%, 30%, 100%': { opacity: '0', transform: 'scale(0.3)' },
          '10.8%': { opacity: '1', transform: 'scale(1)' },
          '14.4%': { opacity: '0', transform: 'scale(0.7)' },
          '22.8%': { opacity: '0.85', transform: 'scale(0.92)' },
          '26.4%': { opacity: '0', transform: 'scale(0.6)' },
        },
        'tag-shift-loop': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '7.3%': { transform: 'translate(-3.5px, 3.5px) rotate(-6deg)' },
          '13.2%, 22%': { transform: 'translate(-2.5px, 3px) rotate(-2deg)' },
          '30%': { transform: 'translate(0, 0) rotate(0deg)' },
        },
        'coin-peek-loop': {
          '0%, 30%, 100%': { opacity: '0', transform: 'translate(1px, -1px) scale(0.3)' },
          '8.1%': { opacity: '1', transform: 'translate(3.5px, -3.5px) scale(1.15)' },
          '11.5%': { opacity: '1', transform: 'translate(2.7px, -2.7px) scale(0.95)' },
          '14.7%, 22%': { opacity: '1', transform: 'translate(3px, -3px) scale(1)' },
        },
        'coin-peek-shine-loop': {
          '0%, 8%, 14.3%': { opacity: '0', transform: 'translate(1px, -3px) rotate(15deg)' },
          '17.1%': { opacity: '0.9', transform: 'translate(3px, -3px) rotate(15deg)' },
          '19.9%, 100%': { opacity: '0', transform: 'translate(6px, -1px) rotate(15deg)' },
        },
        'scambi-swirl-loop': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '33.3%, 55%': { transform: 'rotate(180deg)' },
          '88.3%': { transform: 'rotate(360deg)' },
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
        'offline-float': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'offline-wobble': {
          '0%,100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(15deg)' },
          '75%': { transform: 'rotate(-15deg)' },
        },
        // Saluto militare: l'avambraccio fa cerniera sul gomito e sale alla fronte,
        // tiene la posa, poi torna giù. Movimento morbido (niente molla nervosa).
        'salute-forearm': {
          '0%': { transform: 'rotate(74deg)' },
          '34%': { transform: 'rotate(-3deg)' },
          '48%': { transform: 'rotate(0deg)' },
          '85%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(74deg)' },
        },
        // Tutto il braccio (avambraccio + spalla) compare e svanisce in sincrono,
        // così non lo si vede passare "dentro" la testa.
        'salute-fade': {
          '0%': { opacity: '0' },
          '20%': { opacity: '1' },
          '85%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        // L'omino scatta sull'attenti: piccola straizzata su se stesso.
        'salute-bob': {
          '0%': { transform: 'translateY(0) scale(1)' },
          '22%': { transform: 'translateY(-1px) scale(1.035)' },
          '46%': { transform: 'translateY(0) scale(1)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        // Effetto "foil" olografico (stile CardTrader). Bande prismatiche sottili
        // che scorrono avanti/indietro sotto blend color-dodge domato, con
        // rotazione di tinta + pulsazione di luminosità per renderle cangianti.
        'foil-shimmer': {
          '0%': { backgroundPosition: '0% 50%', filter: 'brightness(0.85) contrast(1.6) hue-rotate(0deg)' },
          '50%': { backgroundPosition: '100% 50%', filter: 'brightness(1) contrast(1.75) hue-rotate(50deg)' },
          '100%': { backgroundPosition: '0% 50%', filter: 'brightness(0.85) contrast(1.6) hue-rotate(0deg)' },
        },
        // Micro-scintillii: traslano in diagonale e luccicano insieme.
        'foil-sparkle': {
          '0%': { backgroundPosition: '0% 0%', opacity: '0.15' },
          '50%': { backgroundPosition: '100% 100%', opacity: '0.55' },
          '100%': { backgroundPosition: '200% 200%', opacity: '0.15' },
        },
        // Passata di luce morbida che attraversa la carta (il tocco "premium").
        'foil-sweep': {
          '0%': { backgroundPosition: '120% 0%' },
          '40%, 100%': { backgroundPosition: '-60% 0%' },
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
        'tag-shift': 'tag-shift 0.45s cubic-bezier(0.22,1,0.36,1) forwards',
        'coin-peek': 'coin-peek 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'coin-peek-shine': 'coin-peek-shine 0.7s ease-out forwards',
        'gavel-bang-loop': 'gavel-bang-loop 3.2s cubic-bezier(0.34,1.56,0.64,1) infinite',
        'gavel-spark-loop': 'gavel-spark-loop 3.2s ease-out infinite',
        'tag-shift-loop': 'tag-shift-loop 3.4s cubic-bezier(0.22,1,0.36,1) infinite',
        'coin-peek-loop': 'coin-peek-loop 3.4s cubic-bezier(0.34,1.56,0.64,1) infinite',
        'coin-peek-shine-loop': 'coin-peek-shine-loop 3.4s ease-out infinite',
        'scambi-swirl-loop': 'scambi-swirl-loop 3.6s cubic-bezier(0.22,1,0.36,1) infinite',
        'cart-wobble': 'cart-wobble 0.9s cubic-bezier(0.34,1.56,0.64,1)',
        'cart-speed': 'cart-speed 0.9s ease-out',
        'offline-float': 'offline-float 2.5s ease-in-out infinite',
        'offline-wobble': 'offline-wobble 2s ease-in-out infinite',
        'salute-forearm': 'salute-forearm 1.5s cubic-bezier(0.45,0.05,0.25,1)',
        'salute-fade': 'salute-fade 1.5s ease-in-out',
        'salute-bob': 'salute-bob 1.5s cubic-bezier(0.34,1.56,0.64,1)',
        'foil-shimmer': 'foil-shimmer 3.2s ease-in-out infinite',
        'foil-sparkle': 'foil-sparkle 3.8s ease-in-out infinite',
        'foil-sweep': 'foil-sweep 3s ease-in-out infinite',
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
