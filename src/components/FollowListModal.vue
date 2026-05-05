<template>
  <el-dialog
    v-model="visible"
    width="500px"
    class="follow-list-modal"
    :show-close="false"
    append-to-body
    align-center
    destroy-on-close
    @close="handleClose"
  >
    <template #header>
      <div class="modal-header">
        <span class="title">{{ title }}</span>
        <el-icon class="close-icon" @click="handleClose"><Close /></el-icon>
      </div>
    </template>

    <div class="follow-list-content" v-loading="loading">
      <!-- 用户列表 -->
      <div v-if="userList.length > 0" class="user-list">
        <div v-for="user in userList" :key="user.id" class="user-item">
          <div class="user-left" @click="goToUserHome(user.id)">
            <el-avatar :size="50" :src="user.avatar || defaultAvatar" />
            <div class="user-info">
              <p class="user-name">{{ user.nickname || '小红薯' }}</p>
              <p class="user-signature">{{ user.signature || '这个人很懒，什么都没写' }}</p>
            </div>
          </div>
          <el-button
            v-if="String(user.id) !== String(currentUserId)"
            :type="user.followed ? 'info' : 'danger'"
            :plain="user.followed"
            round
            size="small"
            :loading="followLoading[user.id]"
            @click.stop="handleFollowToggle(user)"
          >
            {{ user.followed ? '已关注' : '关注' }}
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="暂无关注" />

      <!-- 加载更多 -->
      <div v-if="userList.length > 0 && hasMore" class="load-more">
        <el-button link :loading="loadingMore" @click="loadMore">
          加载更多
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { FollowAPI, type PageRequest } from '../utils/api'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  visible: boolean
  userId?: string | number  // 不传则查询当前登录用户
  userName?: string         // 用于标题显示
}>()

const emit = defineEmits(['update:visible', 'close'])

// 状态定义
const visible = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const userList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = 10
const hasMore = ref(true)
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const followLoading = ref<Record<string, boolean>>({})

// 当前登录用户ID
const currentUserId = ref(localStorage.getItem('userId') || '')

// 标题
const title = computed(() => {
  if (props.userName) {
    return `${props.userName}的关注`
  }
  return '我的关注'
})

// 监听visible变化
watch(
  () => props.visible,
  (val) => {
    visible.value = val
    if (val) {
      resetData()
      fetchFollowList()
    }
  }
)

watch(visible, (val) => {
  emit('update:visible', val)
})

// 重置数据
const resetData = () => {
  userList.value = []
  currentPage.value = 1
  hasMore.value = true
}

// 获取关注列表
const fetchFollowList = async () => {
  loading.value = true
  try {
    const params: PageRequest = {
      current: currentPage.value,
      pageSize: pageSize,
    }
    // 如果传入了userId，则查询指定用户的关注列表
    if (props.userId) {
      params.userId = props.userId
    }

    const res = await FollowAPI.getFollowingList(params)
    if (res.code === 0 && res.data) {
      userList.value = res.data.records || []
      hasMore.value = userList.value.length < res.data.total
    }
  } catch (error) {
    console.error('获取关注列表失败:', error)
    ElMessage.error('获取关注列表失败')
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  loadingMore.value = true
  currentPage.value++

  try {
    const params: PageRequest = {
      current: currentPage.value,
      pageSize: pageSize,
    }
    if (props.userId) {
      params.userId = props.userId
    }

    const res = await FollowAPI.getFollowingList(params)
    if (res.code === 0 && res.data) {
      const newList = res.data.records || []
      userList.value.push(...newList)
      hasMore.value = userList.value.length < res.data.total
    }
  } catch (error) {
    console.error('加载更多失败:', error)
    ElMessage.error('加载更多失败')
  } finally {
    loadingMore.value = false
  }
}

// 关注/取关
const handleFollowToggle = async (user: any) => {
  if (followLoading.value[user.id]) return

  followLoading.value[user.id] = true
  try {
    const res = await FollowAPI.follow(user.id)
    if (res.code === 0) {
      user.followed = res.data.followed
      ElMessage.success(user.followed ? '关注成功' : '已取消关注')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    followLoading.value[user.id] = false
  }
}

// 跳转到用户主页
const goToUserHome = (userId: string | number) => {
  // 关闭弹窗
  handleClose()
  // TODO: 可以在这里添加跳转到用户主页的逻辑
  console.log('跳转到用户主页:', userId)
}

// 关闭弹窗
const handleClose = () => {
  visible.value = false
  emit('close')
}
</script>

<style scoped>
.follow-list-modal :deep(.el-dialog__header) {
  margin: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.follow-list-modal :deep(.el-dialog__body) {
  padding: 0;
  max-height: 500px;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-icon {
  font-size: 20px;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
}

.close-icon:hover {
  color: #666;
}

.follow-list-content {
  padding: 10px 0;
}

.user-list {
  display: flex;
  flex-direction: column;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: #f5f5f5;
}

.user-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  cursor: pointer;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-signature {
  font-size: 12px;
  color: #999;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 16px;
}
</style>
