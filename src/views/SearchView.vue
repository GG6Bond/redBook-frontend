<template>
  <div class="search-layout">

    <div class="fixed-header">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="custom-tabs">
        <el-tab-pane label="笔记" name="note"></el-tab-pane>
        <el-tab-pane label="用户" name="user"></el-tab-pane>
      </el-tabs>
    </div>

    <div class="scroll-content" v-loading="loading">
      <div class="inner-content">

        <div v-if="activeTab === 'note'" class="notes-grid">
          <div v-for="item in results" :key="item.id" class="note-card" @click="goDetail(item.id)">
            <div class="note-image">
              <img :src="item.coverUrl || 'https://via.placeholder.com/300x400?text=No+Image'" loading="lazy" />
            </div>
            <div class="note-info">
              <h3 class="note-title">{{ item.title }}</h3>
              <div class="note-footer">
                <div class="author">
                  <el-avatar :size="20" :src="item.userVO?.avatar" />
                  <span class="nickname">{{ item.userVO?.nickname || '未知' }}</span>
                </div>
                <div class="likes">
                  <el-icon><Star /></el-icon>
                  <span>{{ item.likes || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="user-list">
          <div v-for="user in results" :key="user.id" class="user-item">
            <div class="user-left">
              <el-avatar :size="50" :src="user.userVO?.avatar" />
              <div class="user-detail">
                <p class="u-name">{{ user.userVO?.nickname || '小红薯' }}</p>
                <p class="u-info">账号：{{ user.userVO?.account || '-' }}</p>
              </div>
            </div>
            <el-button round size="small" type="danger" plain>关注</el-button>
          </div>
        </div>

        <el-empty v-if="!loading && results.length === 0" description="暂无相关内容" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Star } from '@element-plus/icons-vue';
import { NoteAPI } from '@/utils/api.ts'; // 确保路径正确

const route = useRoute();
const activeTab = ref('note');
const results = ref<any[]>([]);
const loading = ref(false);

const doSearch = async () => {
  const keyword = route.query.q as string;
  if (!keyword) return;

  loading.value = true;
  try {
    const params = {
      current: 1,
      pageSize: 20,
      noteParm: activeTab.value === 'note' ? keyword : "",
      userParm: activeTab.value === 'user' ? keyword : ""
    };
    const res = await NoteAPI.search(params);
    if (res.code === 0) {
      results.value = res.data.records;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const handleTabChange = () => {
  results.value = [];
  doSearch();
};

onMounted(() => doSearch());
watch(() => route.query.q, () => doSearch());

const goDetail = (id: string) => {
  console.log('Jump:', id);
};
</script>

<style scoped>
/* --- 布局核心逻辑 (Flex布局 + 独立滚动) --- */

.search-layout {
  /* 关键点 1: 计算高度 */
  /* 假设你页面最顶部的“搜索框/Logo栏”高度是 60px */
  /* 这里必须减去那个高度，否则底部内容会被挤出屏幕 */
  height: calc(100vh - 60px);

  display: flex;
  flex-direction: column; /* 垂直排列 */
  overflow: hidden; /* 禁止最外层出现滚动条 */
  background-color: #fff;
}

/* Tab 栏区域 */
.fixed-header {
  flex-shrink: 0; /* 禁止被压缩 */
  background: #fff;
  z-index: 10;
  border-bottom: 1px solid #f2f2f2;
  padding: 0 16px;
}

/* 滚动内容区域 */
.scroll-content {
  flex: 1; /* 自动填满剩余空间 */
  overflow-y: auto; /* 关键点 2: 只有这里会出现滚动条 */
  background-color: #f9f9f9;
  padding: 12px;
}

.inner-content {
  max-width: 1400px; /* 限制内容最大宽度 */
  margin: 0 auto;
}

/* --- 样式重置 --- */
:deep(.el-tabs__header) {
  margin: 0; /* 去掉 Tabs 默认的下边距 */
}
:deep(.el-tabs__nav-wrap::after) {
  height: 0; /* 去掉 Tabs 默认的灰色分割线 */
}

/* --- 响应式瀑布流 (自动列数) --- */
.notes-grid {
  display: grid;
  /* 自动填充：每列最小 200px，自动换行 */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

/* --- 卡片样式 --- */
.note-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: transform 0.2s;
}

.note-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.note-image img {
  width: 100%;
  aspect-ratio: 3 / 4; /* 保持图片比例统一 */
  object-fit: cover;
  display: block;
}

.note-info {
  padding: 10px;
}

.note-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  max-width: 70%;
}
.nickname {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.likes {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 2px;
}

/* 用户列表样式 */
.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
}
</style>
