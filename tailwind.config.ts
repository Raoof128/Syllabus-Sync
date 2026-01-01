import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
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
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
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
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Macquarie University Design Tokens (--c- prefixed)
        mq: {
          primary: 'var(--c-red)',
          secondary: 'var(--c-sand-200)',
          red: 'var(--c-red)',
          'red-bright': 'var(--c-bright-red)',
          'red-deep': 'var(--c-deep-red)',
          magenta: 'var(--c-magenta)',
          purple: 'var(--c-purple)',
          background: 'var(--c-background)',
          'background-secondary': 'var(--c-background-secondary)',
          'background-tertiary': 'var(--c-background-tertiary)',
          'background-invert': 'var(--c-background-invert)',
          content: 'var(--c-content)',
          'content-secondary': 'var(--c-content-secondary)',
          'content-tertiary': 'var(--c-content-tertiary)',
          'content-faded': 'var(--c-content-faded)',
          border: 'var(--c-border)',
          'border-secondary': 'var(--c-border-secondary)',
          focus: 'var(--c-focus)',
          success: 'var(--c-success)',
          warning: 'var(--c-warning)',
          error: 'var(--c-error)',
          info: 'var(--c-info)',
          'card-background': 'var(--c-card-background)',
          'input-background': 'var(--c-input-background)',
          'button-secondary': 'var(--c-button-secondary)',
          'hover-background': 'var(--c-hover-background)',
          charcoal: {
            600: 'var(--c-charcoal-600)',
            700: 'var(--c-charcoal-700)',
            800: 'var(--c-charcoal-800)',
            900: 'var(--c-charcoal-900)',
          },
          sand: {
            100: 'var(--c-sand-100)',
            200: 'var(--c-sand-200)',
            300: 'var(--c-sand-300)',
            400: 'var(--c-sand-400)',
            500: 'var(--c-sand-500)',
          },
          navy: {
            600: 'var(--c-navy-600)',
            700: 'var(--c-navy-700)',
            800: 'var(--c-navy-800)',
            900: 'var(--c-navy-900)',
          },
          slate: {
            100: 'var(--c-slate-100)',
            200: 'var(--c-slate-200)',
            300: 'var(--c-slate-300)',
            400: 'var(--c-slate-400)',
            500: 'var(--c-slate-500)',
          },
        },
        // Macquarie University Brand Colors (legacy)
        macquarie: {
          red: '#A6192E',
          blue: '#002A45',
          gold: '#FFB81C',
        },
      },
      fontFamily: {
        sans: ['var(--font-work-sans)', 'var(--f-primary)'],
        serif: ['var(--font-source-serif-pro)', 'var(--f-secondary)'],
        mq: ['var(--font-work-sans)', 'var(--f-primary)'],
        mqSerif: ['var(--font-source-serif-pro)', 'var(--f-secondary)'],
      },
      fontSize: {
        'mq-small': 'var(--fs-small)',
        'mq-regular': 'var(--fs-regular)',
        'mq-medium': 'var(--fs-medium)',
        'mq-large': 'var(--fs-large)',
        'mq-xl': 'var(--fs-xl)',
        'mq-2xl': 'var(--fs-2xl)',
        'mq-3xl': 'var(--fs-3xl)',
        'mq-4xl': 'var(--fs-4xl)',
        'mq-x-mega': 'var(--fs-x-mega)',
      },
      spacing: {
        'mq-1': 'var(--c-space-1)',
        'mq-2': 'var(--c-space-2)',
        'mq-3': 'var(--c-space-3)',
        'mq-4': 'var(--c-space-4)',
      },
      borderRadius: {
        'mq-sm': 'var(--c-radius-sm)',
        'mq': 'var(--c-radius)',
        'mq-lg': 'var(--c-radius-lg)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'mq-sm': 'var(--c-shadow-sm)',
        'mq': 'var(--c-shadow)',
      },
      transitionTimingFunction: {
        'mq-ease': 'cubic-bezier(0.5, 0.5, 0, 1)',
        'mq-snap': 'cubic-bezier(0, 0, 0, 1)',
      },
      transitionDuration: {
        'mq-fast': '0.15s',
        'mq-slow': '0.6s',
        'mq-mid': '0.3s',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
