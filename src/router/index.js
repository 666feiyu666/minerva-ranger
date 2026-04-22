// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(), 
  routes: [
    {
      path: '/',
      component: () => import('../App.vue') // 确保根路径有对应的组件
    }
  ],
})

export default router
