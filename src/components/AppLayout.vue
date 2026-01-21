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
              v-model="searchQuery"
              placeholder="搜索笔记、用户..."
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <div class="header-actions">
            <el-button v-if="hasToken" type="primary" @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              登出
            </el-button>
            <el-button v-else type="primary" @click="handleLogin"> 登录</el-button>
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

      <section class="content-area"><slot /></section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, Bell, User, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'AppLayout' })

const router = useRouter()
const searchQuery = ref('')
const activeNav = ref('discover')
const activeCategory = ref('推荐')
const hasToken = ref(false)

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
}
.sidebar {
  width: 320px;
  background: #fff;
  border-right: 1px solid #eef2f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
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
  background: #f7f7f8;
}
.header {
  background: #fff;
  padding: 12px 24px;
  border-bottom: 1px solid #eef2f5;
}
.header-content {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  gap: 24px;
}
.search-box {
  width: 320px;
}
.header-actions {
  display: flex;
  gap: 12px;
  position: absolute;
  right: 0;
}
.category-bar {
  background: #fff;
  border-bottom: 1px solid #eef2f5;
}
.category-scroll {
  display: flex;
  gap: 16px;
  padding: 10px 24px;
}
.category-tag {
  cursor: pointer;
  color: #666;
}
.category-tag.active {
  color: #0099cc;
  border-bottom: 2px solid #0099cc;
}
.content-area {
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
}
</style>
