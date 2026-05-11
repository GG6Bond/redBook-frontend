<template>
  <div class="notification-page">
    <div class="page-header">
      <div class="header-left">
        <h1>消息通知</h1>
        <div class="connection-status" :class="connectionStatusClass">
          <span class="status-dot"></span>
          <span class="status-text">{{ connectionStatusText }}</span>
        </div>
      </div>
      <div class="header-actions">
        <span v-if="store.hasUnread" class="unread-count">
          {{ store.unreadCount }} 条未读
        </span>
        <button
          v-if="store.hasUnread"
          @click="markAllAsRead"
          class="mark-all-btn"
        >
          全部已读
        </button>
        <button
          v-if="selectedIds.length > 0"
          @click="batchMarkSelectedAsRead"
          class="batch-btn"
        >
          标记已读({{ selectedIds.length }})
        </button>
        <button
          v-if="selectedIds.length > 0"
          @click="batchDeleteSelected"
          class="batch-btn batch-delete"
        >
          删除({{ selectedIds.length }})
        </button>
      </div>
    </div>

    <NotificationFilter
      :current-filter="store.filter"
      @filter-change="handleFilterChange"
    />

    <div class="notification-list" ref="listContainerRef">
      <div v-if="store.loading && store.notifications.length === 0" class="loading">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else-if="store.notifications.length === 0" class="empty">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <p>暂无通知</p>
      </div>

      <template v-else>
        <div
          v-for="group in groupedNotifications"
          :key="group.label"
          class="time-group"
        >
          <div class="time-group-label">{{ group.label }}</div>

          <div
            v-for="notification in group.items"
            :key="notification.id"
            :class="['notification-item', { unread: notification.isRead === 0, selected: selectedIds.includes(notification.id) }]"
            @click="handleNotificationClick(notification)"
          >
            <input
              v-if="selectedIds.length > 0 || isSelectionMode"
              type="checkbox"
              :checked="selectedIds.includes(notification.id)"
              @click.stop
              @change="toggleSelect(notification.id)"
              class="select-checkbox"
            />

            <div class="notification-avatar">
              <img
                v-if="notification.senderAvatar"
                :src="notification.senderAvatar"
                :alt="notification.senderNickname"
              />
              <div v-else class="avatar-placeholder">
                {{ notification.type === 6 ? '系' : (notification.senderNickname?.charAt(0) || '用') }}
              </div>
            </div>

            <div class="notification-content">
              <div class="notification-header">
                <span class="sender-name">{{ notification.senderNickname || '系统' }}</span>
                <span class="type-tag">{{ notification.typeName }}</span>
                <span class="time">{{ formatTime(notification.createTime) }}</span>
              </div>
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.content }}</div>
            </div>

            <div class="notification-actions">
              <div v-if="notification.isRead === 0" class="unread-dot"></div>
              <button
                class="delete-btn"
                @click.stop="handleDelete(notification.id)"
                title="删除"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>

      <div v-if="store.loading && store.notifications.length > 0" class="loading-more">
        <div class="spinner-small"></div>
        <span>加载更多...</span>
      </div>
    </div>
  </div>

  <el-dialog
    v-model="deleteDialogVisible"
    title="确认删除"
    width="400px"
    :close-on-click-modal="false"
  >
    <span>确定要删除这条通知吗？此操作不可撤销。</span>
    <template #footer>
      <el-button @click="deleteDialogVisible = false">取消</el-button>
      <el-button type="danger" @click="confirmDelete">确定</el-button>
    </template>
  </el-dialog>

  <NoteDetailModal
    v-model:visible="detailVisible"
    :note-id="currentNoteId"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { ElMessage } from 'element-plus'
import type { NotificationVO } from '@/utils/api'
import NotificationFilter from '@/components/NotificationFilter.vue'
import NoteDetailModal from '@/components/NoteDetailModal.vue'

const store = useNotificationStore()
const currentPage = ref(1)
const pageSize = 10
const deleteDialogVisible = ref(false)
const pendingDeleteId = ref<string | null>(null)
const isSelectionMode = ref(false)
const selectedIds = ref<string[]>([])
const listContainerRef = ref<HTMLElement | null>(null)
const detailVisible = ref(false)
const currentNoteId = ref('')

onMounted(() => {
  store.fetchNotifications(currentPage.value, pageSize)

  if (listContainerRef.value) {
    listContainerRef.value.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  if (listContainerRef.value) {
    listContainerRef.value.removeEventListener('scroll', handleScroll)
  }
})

const connectionStatusClass = computed(() => {
  if (store.isConnected) return 'connected'
  return 'disconnected'
})

const connectionStatusText = computed(() => {
  if (store.isConnected) return '实时连接'
  return '未连接'
})

const groupedNotifications = computed(() => {
  const groups: Array<{ label: string, items: NotificationVO[] }> = []
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000

  let todayItems: NotificationVO[] = []
  let yesterdayItems: NotificationVO[] = []
  let earlierItems: NotificationVO[] = []

  store.notifications.forEach(notification => {
    const time = new Date(notification.createTime).getTime()
    if (time >= todayStart) {
      todayItems.push(notification)
    } else if (time >= yesterdayStart) {
      yesterdayItems.push(notification)
    } else {
      earlierItems.push(notification)
    }
  })

  if (todayItems.length > 0) groups.push({ label: '今天', items: todayItems })
  if (yesterdayItems.length > 0) groups.push({ label: '昨天', items: yesterdayItems })
  if (earlierItems.length > 0) groups.push({ label: '更早', items: earlierItems })

  return groups
})

const handleScroll = () => {
  if (!listContainerRef.value || store.loading || !store.hasMore) return

  const { scrollTop, scrollHeight, clientHeight } = listContainerRef.value
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadMore()
  }
}

const loadMore = () => {
  currentPage.value++
  store.fetchNotifications(currentPage.value, pageSize, true)
}

const markAllAsRead = async () => {
  await store.markAllAsRead()
  ElMessage.success('已全部标记为已读')
}

const handleNotificationClick = async (notification: NotificationVO) => {
  if (isSelectionMode.value) return

  console.log('点击通知:', notification)
  console.log('type:', notification.type, 'relatedType:', notification.relatedType, 'noteId:', notification.noteId)

  if (notification.isRead === 0) {
    await store.markAsRead(notification.id)
  }

  if (notification.type === 5 || notification.type === 6) {
    return
  }

  if (!notification.noteId) {
    ElMessage.warning('该通知关联的笔记已不存在')
    return
  }

  currentNoteId.value = notification.noteId
  detailVisible.value = true
}

const handleDelete = (id: string) => {
  pendingDeleteId.value = id
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  if (pendingDeleteId.value) {
    await store.deleteNotification(pendingDeleteId.value)
    ElMessage.success('已删除')
    deleteDialogVisible.value = false
    pendingDeleteId.value = null
  }
}

const toggleSelect = (id: string) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const batchMarkSelectedAsRead = async () => {
  if (selectedIds.value.length === 0) return
  await store.batchMarkAsRead(selectedIds.value)
  ElMessage.success(`已将 ${selectedIds.value.length} 条通知标记为已读`)
  selectedIds.value = []
  isSelectionMode.value = false
}

const batchDeleteSelected = async () => {
  if (selectedIds.value.length === 0) return
  await store.batchDeleteNotifications(selectedIds.value)
  ElMessage.success(`已删除 ${selectedIds.value.length} 条通知`)
  selectedIds.value = []
  isSelectionMode.value = false
}

const handleFilterChange = (filterType: 'all' | string | number) => {
  store.setFilter(filterType)
  currentPage.value = 1
  selectedIds.value = []
  isSelectionMode.value = false
}

const formatTime = (timeStr: string) => {
  const time = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - time.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`
  } else {
    return time.toLocaleDateString('zh-CN')
  }
}
</script>

<style scoped>
.notification-page {
  padding: 24px;
  min-height: calc(100vh - 64px);
  background: #f5f5f5;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.connection-status.connected {
  background: #f0f9eb;
  color: #67c23a;
}

.connection-status.disconnected {
  background: #fef0f0;
  color: #f56c6c;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.connection-status.connected .status-dot {
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.unread-count {
  color: #ff4d4f;
  font-size: 14px;
  font-weight: 500;
}

.mark-all-btn {
  background: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.mark-all-btn:hover {
  background: #40a9ff;
}

.batch-btn {
  background: #fff;
  color: #1890ff;
  border: 1px solid #1890ff;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.batch-btn:hover {
  background: #e6f7ff;
}

.batch-btn.batch-delete {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.batch-btn.batch-delete:hover {
  background: #fff1f0;
}

.notification-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  max-height: calc(100vh - 260px);
  overflow-y: auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: #999;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty p {
  margin: 0;
  font-size: 16px;
}

.time-group {
  padding: 0;
}

.time-group-label {
  padding: 12px 24px;
  font-size: 13px;
  color: #999;
  background: #fafafa;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 1;
}

.notification-item {
  display: flex;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
  cursor: pointer;
  align-items: flex-start;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: #fafafa;
}

.notification-item.unread {
  background-color: #e6f7ff;
}

.notification-item.unread:hover {
  background-color: #bae7ff;
}

.notification-item.selected {
  background-color: #f0f5ff;
}

.select-checkbox {
  margin-right: 12px;
  margin-top: 18px;
  cursor: pointer;
}

.notification-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 16px;
  flex-shrink: 0;
}

.notification-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #f0a88c;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 500;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.sender-name {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.type-tag {
  background: #f0f0f0;
  color: #666;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.time {
  color: #999;
  font-size: 13px;
  margin-left: auto;
}

.notification-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.notification-message {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  margin-left: 16px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #1890ff;
  border-radius: 50%;
}

.delete-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.delete-btn:hover {
  color: #ff4d4f;
}

.delete-btn svg {
  width: 18px;
  height: 18px;
}

.loading-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: #999;
  gap: 8px;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #f0f0f0;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
</style>
