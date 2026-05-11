<script setup lang="ts">
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

<style>
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>
