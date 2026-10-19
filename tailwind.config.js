/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // 与 src/assets/main.css 中的设计 token 共用一个色源：
      // 日/夜主题由 .app-shell[data-theme] 切换，Tailwind 工具类自动跟随。
      colors: {
        paper: 'var(--paper)',
        'paper-strong': 'var(--paper-strong)',
        'paper-muted': 'var(--paper-muted)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        forest: 'var(--forest)',
        'forest-deep': 'var(--forest-deep)',
        sage: 'var(--sage)',
        lake: 'var(--lake)',
        bark: 'var(--bark)',
        ochre: 'var(--ochre)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        sans: ['var(--font-ui)'],
        display: ['var(--font-display)'],
      },
      boxShadow: {
        paper: 'var(--shadow-paper)',
        float: 'var(--shadow-float)',
      },
    },
  },
  plugins: [],
}
