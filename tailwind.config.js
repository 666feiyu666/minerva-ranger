/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'melvor-dark': '#121212',       // 整体背景深色
        'melvor-panel': '#232323',      // 卡片/侧边栏背景
        'melvor-border': '#383838',     // 边框颜色
        'melvor-green': '#5cb85c',      // 经典的 Melvor 绿色
        'melvor-success': '#2ecc71',
        'melvor-warning': '#f0ad4e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // 推荐用个干净的字体
      }
    },
  },
  plugins: [],
}