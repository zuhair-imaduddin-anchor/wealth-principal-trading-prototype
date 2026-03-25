import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0e1a',
        card: '#0f1629',
        border: '#1e2d4a',
        accent: '#3b82f6',
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        primary: '#f1f5f9',
        muted: '#64748b',
      },
    },
  },
  plugins: [],
}
export default config
