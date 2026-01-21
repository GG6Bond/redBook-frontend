// 路由配置文件：定义应用中的页面路由
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  // 使用 HTML5 history 模式
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 根路径 -> HomeView
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      // 登录页面
      path: '/login',
      name: 'login',
      component: LoginView,
    },
  ],
})


export default router
