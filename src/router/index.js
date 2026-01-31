// 修改前：
// import { createRouter, createWebHistory } from 'vue-router'

// 修改后：引入 createWebHashHistory
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  // 修改前：history: createWebHistory(import.meta.env.BASE_URL),
  // 修改后：
  history: createWebHashHistory(), 
  routes: [],
})

export default router