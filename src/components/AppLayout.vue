<template>
  <div class="layout-container">
    <aside class="sidebar">
      <div class="logo-section">
        <div class="logo">大蓝书</div>
      </div>

      <nav class="nav-menu">
        <div
          class="nav-item"
          :class="{ active: activeNav === 'discover' }"
          @click="handleNavClick('discover')"
        >
          <el-icon><Search /></el-icon>
          <div>发现</div>
        </div>
        <div
          class="nav-item"
          :class="{ active: activeNav === 'publish' }"
          @click="handleNavClick('publish')"
        >
          <el-icon><Plus /></el-icon>
          <div>发布</div>
        </div>
        <div
          class="nav-item"
          :class="{ active: activeNav === 'notify' }"
          @click="handleNavClick('notify')"
        >
          <el-icon><Bell /></el-icon>
          <div>通知</div>
        </div>
        <div
          class="nav-item"
          :class="{ active: activeNav === 'mine' }"
          @click="handleNavClick('mine')"
        >
          <el-icon><User /></el-icon>
          <div>我的</div>
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <header class="header">
        <div class="header-content">
          <div class="search-box">
            <el-input
              class="input-search"
              v-model="searchQuery"
              placeholder="搜索笔记、用户..."
              :clear-icon="Close"
              clearable
              @keyup.enter="handleSearch"
            >
            </el-input>
            <el-icon class="search-icon"><Search /></el-icon>
          </div>

          <div class="header-actions">
            <el-button v-if="hasToken" type="primary" @click="handleLogout" class="logout-btn">
              <el-icon><SwitchButton /></el-icon>
              <div style="margin-left: 6px">登出</div>
            </el-button>
            <el-button v-else type="primary" @click="handleLogin">登录</el-button>
          </div>
        </div>
      </header>

      <div class="category-bar">
        <div class="category-scroll">
          <span
            v-for="c in categories"
            :key="c"
            class="category-tag"
            :class="{ active: activeCategory === c }"
            @click="activeCategory = c"
          >
            {{ c }}
          </span>
        </div>
      </div>

      <section class="content-area scrollable-content"><slot /></section>
      <NotePublishModal v-model:visible="showPublishModal" @success="handlePublishSuccess" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Search, Plus, Bell, User, SwitchButton, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import NotePublishModal from './NotePublishModal.vue'

defineOptions({ name: 'AppLayout' })

import { ref, onMounted } from 'vue'
const router = useRouter()
const searchQuery = ref('')
const activeNav = ref('discover')

const activeCategory = ref('推荐')
const hasToken = ref(false)
const showPublishModal = ref(false)

const categories = [
  '推荐',
  '穿搭',
  '美食',
  '彩妆',
  '影视',
  '职场',
  '情感',
  '家居',
  '游戏',
  '旅行',
  '健身',
]

// 初始化时检查是否有token
onMounted(() => {
  hasToken.value = !!localStorage.getItem('token')
})

const handleNavClick = (nav: string) => {
  activeNav.value = nav
  if (nav === 'publish') {
    showPublishModal.value = true
  }
}
function handlePublishSuccess() {
  // 可选：刷新列表或提示
}
const handleSearch = () => {
  console.log('search:', searchQuery.value)
}

const handleLogin = () => {
  router.push('/login')
}

const handleLogout = () => {
  localStorage.removeItem('token')
  hasToken.value = false
  ElMessage.success('已登出')
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.sidebar {
  width: 320px;
  background: #fff;
  border-right: 1px solid #eef2f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
  border: none;
  border-bottom: 0;
  position: sticky;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 10;
  flex-shrink: 0;
}
.logo-section {
  margin-top: 36px;
  margin-bottom: 50px;
}
.logo {
  width: 84px;
  height: 44px;
  border-radius: 9999px;
  background: #0099cc;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
}
.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0;
  font-weight: bolder;
  font-size: 20px;
}
.nav-item {
  width: 200px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  border-radius: 30;
  cursor: pointer;
  gap: 10px;
}

.nav-item > div {
  font-weight: 600 !important;
}

.nav-item.active {
  background: #f0fbff;
  color: #0099cc;
  border-radius: 9999px;
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: none;
  border-bottom: 0;
  height: 100vh;
  position: relative;
  overflow: hidden;
}
.header {
  background: #fff;
  padding: 12px 24px;
  border-bottom: 1px solid #ffffff;
  position: sticky;
  top: 0;
  z-index: 20;
}
.header-content {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  gap: 24px;
}
.search-box {
  width: 400px;
  height: 60px;
  display: flex;
  align-items: center;
  font-size: 20px !important;
  gap: 10px;
}
.search-box .input-search {
  height: 38px;
  font-size: 16px;
}

.search-box .search-icon {
  font-size: 22px;
}

.search-box .input-search :deep(.el-input__wrapper) {
  border-radius: 9999px;
}

.search-box .input-search :deep(input) {
  padding-left: 15px;
}

.header-actions {
  width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  position: absolute;
  right: 0;
}

.logout-btn {
  height: 32px;
}

.category-bar {
  background: #fff;
  border-bottom: 1px solid #eef2f5;
  border: none;
  border-bottom: 0;
  position: sticky;
  top: 64px; /* header高度，若header高度有变需同步调整 */
  z-index: 15;
}
.category-scroll {
  display: flex;
  gap: 16px;
  padding: 10px 24px;
}
.category-tag {
  cursor: pointer;
  color: #666;
  font-size: 18px;
  margin: 5px;
}
.category-tag.active {
  color: #0099cc;
  border-bottom: 2px solid #0099cc;
}
.content-area.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
  min-height: 0;
}

div {
  border: none; /* 去掉所有边框 */
  border-bottom: 0; /* 只去掉下边框 */
}
</style>
