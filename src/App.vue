<script setup lang="ts">
// 根组件：仅负责把布局组件与视图组合在一起
// - `AppLayout` 提供全局布局（侧栏、顶部搜索等）
// - 通过 RouterView 根据路由渲染对应的页面
import { useRouter } from 'vue-router'
import AppLayout from './components/AppLayout.vue'

const router = useRouter()
</script>

<template>
  <!-- 登录页面直接显示，不使用布局 -->
  <template v-if="router.currentRoute.value.path === '/login'">
    <router-view />
  </template>
  <!-- 其他页面使用布局包裹 -->
  <template v-else>
    <AppLayout>
      <router-view />
    </AppLayout>
  </template>
</template>

<style scoped>
/* 根组件通常不需要额外样式；保持为空使布局样式由布局组件控制 */
</style>
