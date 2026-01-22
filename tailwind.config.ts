import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
				heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					light: 'hsl(var(--secondary-light))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				footer: {
					DEFAULT: 'hsl(var(--footer))',
					foreground: 'hsl(var(--footer-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				},
				financial: {
					DEFAULT: '#75acb3', // Updated from old gold/yellow
					foreground: 'hsl(var(--foreground))'
				},
				status: {
					pending: {
						base: 'hsl(var(--status-pending-base))',
						bg: 'hsl(var(--status-pending-bg))',
					},
					preparing: {
						base: 'hsl(var(--status-preparing-base))',
						bg: 'hsl(var(--status-preparing-bg))',
					},
					ready: {
						base: 'hsl(var(--status-ready-base))',
						bg: 'hsl(var(--status-ready-bg))',
					},
					delivered: {
						base: 'hsl(var(--status-delivered-base))',
						bg: 'hsl(var(--status-delivered-bg))',
					},
					late: {
						base: 'hsl(var(--status-late-base))',
						bg: 'hsl(var(--status-late-bg))',
					},
				},
				icon: {
					DEFAULT: 'hsl(var(--icon-color))',
					foreground: 'hsl(var(--foreground))'
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				shimmer: {
					'0%': { backgroundPosition: '0% 50%' },
					'100%': { backgroundPosition: '200% 50%' }
				},
				float: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'subtle-pulse': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' }
				},
				'rise-slow': {
					'0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)', opacity: '0.8' },
					'50%': { transform: 'translate3d(0, -30px, 0) scale(1.1)', opacity: '1' }
				},
				'aurora': {
					'0%': { transform: 'translate3d(0, 0, 0) scale(1)' },
					'25%': { transform: 'translate3d(20%, -10%, 0) scale(1.1)' },
					'50%': { transform: 'translate3d(-15%, 15%, 0) scale(0.9)' },
					'75%': { transform: 'translate3d(10%, 20%, 0) scale(1.05)' },
					'100%': { transform: 'translate3d(0, 0, 0) scale(1)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'shimmer': 'shimmer 3s linear infinite',
				'float': 'float 6s ease-in-out infinite',
				'subtle-pulse': 'subtle-pulse 3s ease-in-out infinite',
				'rise-slow': 'rise-slow 8s ease-in-out infinite',
				'aurora': 'aurora 18s ease-in-out infinite alternate',
			},
			boxShadow: {
				'elegant': '0 4px 12px rgba(0, 0, 0, 0.1)', // Updated base elevation
				'glow': '0 0 20px rgba(47, 96, 107, 0.3)',
				'card': '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 10px 15px -3px rgba(0, 0, 0, 0.02)',
				'floating': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' // Slightly stronger for hover
			}
		}
	},
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
