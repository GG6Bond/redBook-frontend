// 入口文件：创建并挂载 Vue 应用
// - 引入全局样式、插件（Pinia、Element Plus）以及路由
// - 挂载到 `#app`（在 index.html 中）
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'

// 创建应用实例并安装插件
const app = createApp(App)

// 状态管理（Pinia）
app.use(createPinia())

// 路由
app.use(router)

// Element Plus 组件库（两次调用是冗余的，保留第二个带默认配置的调用）
app.use(ElementPlus, { size: 'small', zIndex: 3000 })

// 挂载应用到 DOM
app.mount('#app')
