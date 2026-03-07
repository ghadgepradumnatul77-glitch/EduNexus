/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            animation: {
                blob: "blob 7s infinite",
                'fade-in': 'fade-in 0.8s ease-out forwards',
                'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
                'shimmer': 'shimmer 2s linear infinite',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                blob: {
                    "0%": { transform: "translate(0px, 0px) scale(1)" },
                    "33%": { transform: "translate(30px, -50px) scale(1.1)" },
                    "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
                    "100%": { transform: "translate(0px, 0px) scale(1)" },
                },
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'shake': {
                    '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
                    '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
                    '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
                    '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
                },
                'shimmer': {
                    '0%': { 'background-position': '-200% 0' },
                    '100%': { 'background-position': '200% 0' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                }
            },
            colors: {
                primary: {
                    50: '#f0f9fa',
                    100: '#d1f0f4',
                    200: '#a6e3eb',
                    300: '#70cfdb',
                    400: '#3eb6c7',
                    500: '#14b8a6', // Teal 500
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                },
                surface: {
                    main: 'var(--surface-main)',
                    card: 'var(--surface-card)',
                    glass: 'var(--surface-glass)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)',
                },
                accent: {
                    indigo: '#6366f1',
                    violet: '#8b5cf6',
                    blue: '#3b82f6',
                },
                slate: {
                    950: '#0f172a',
                }
            },
            boxShadow: {
                'premium': '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.01)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'focus': '0 0 0 3px rgba(20, 184, 166, 0.5)',
            },
            backdropBlur: {
                'xs': '2px',
            },
            borderRadius: {
                'xl': '12px',
                '2xl': '16px',
                '3xl': '24px',
            }
        },
    },
    plugins: [],
}
