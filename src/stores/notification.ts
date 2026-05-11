import { defineStore } from 'pinia'
import { NotificationAPI, type NotificationVO } from '@/utils/api'
import { websocketClient } from '@/utils/websocket'
import { ElNotification } from 'element-plus'
import { h } from 'vue'

interface NotificationState {
  unreadCount: number
  notifications: NotificationVO[]
  allNotifications: NotificationVO[]
  isConnected: boolean
  loading: boolean
  filter: 'all' | string | number
  hasMore: boolean
  processedMessageIds: Set<string>
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    unreadCount: 0,
    notifications: [],
    allNotifications: [],
    isConnected: false,
    loading: false,
    filter: 'all',
    hasMore: true,
    processedMessageIds: new Set(),
  }),

  getters: {
    hasUnread: (state) => state.unreadCount > 0,
  },

  actions: {
    initWebSocket() {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('未登录，跳过 WebSocket 连接')
        return
      }

      // 先设置 WebSocket 回调，再连接
      websocketClient.updateHandlers({
        onOpen: () => {
          this.isConnected = true
          console.log('WebSocket 连接成功')
          this.fetchUnreadCount()
        },
        onMessage: (data) => {
          this.handleWebSocketMessage(data)
        },
        onClose: () => {
          this.isConnected = false
          console.log('WebSocket 连接关闭')
        },
        onError: (error) => {
          console.error('WebSocket 错误:', error)
          this.isConnected = false
        },
      })

      // 然后再连接
      websocketClient.connect(token)
    },

    disconnectWebSocket() {
      websocketClient.disconnect()
      this.isConnected = false
    },

    handleWebSocketMessage(data: any) {
      console.log('收到 WebSocket 消息:', data)

      if (data.type === 'notification') {
        const notification = data.data as NotificationVO

        const messageId = `${notification.id}_${notification.createTime}`
        if (this.processedMessageIds.has(messageId)) {
          console.log('消息已处理，跳过:', messageId)
          return
        }

        this.processedMessageIds.add(messageId)

        if (this.processedMessageIds.size > 200) {
          const idsArray = Array.from(this.processedMessageIds)
          this.processedMessageIds = new Set(idsArray.slice(-100))
        }

        this.unreadCount = data.unreadCount || 0

        console.log('更新未读计数:', this.unreadCount)
        console.log('收到通知:', notification)

        this.notifications.unshift(notification)

        if (this.notifications.length > 50) {
          this.notifications = this.notifications.slice(0, 50)
        }

        this.allNotifications.unshift(notification)
        if (this.allNotifications.length > 200) {
          this.allNotifications = this.allNotifications.slice(0, 200)
        }

        this.showNotificationToast(notification)
      }
    },

    showNotificationToast(notification: NotificationVO) {
      const typeIconMap: Record<number, string> = {
        1: '❤️',
        2: '❤️',
        3: '💬',
        4: '💬',
        5: '👤',
        6: '🔔'
      }

      const icon = typeIconMap[notification.type] || '🔔'

      ElNotification({
        title: `${icon} ${notification.title}`,
        message: h('div', {
          style: 'cursor: pointer; padding: 4px 0;',
          onClick: () => {
            ElNotification.closeAll()
            this.handleNotificationClick(notification)
          }
        }, notification.content),
        duration: 4000,
        position: 'top-right',
        type: notification.type === 6 ? 'info' : 'success',
        offset: 60,
      })
    },

    handleNotificationClick(notification: NotificationVO) {
      if (notification.isRead === 0) {
        this.markAsRead(notification.id)
      }

      if (notification.relatedType === 1 && notification.relatedId) {
        window.open(`/note/${notification.relatedId}`, '_blank')
      } else if (notification.relatedType === 3 && notification.senderId) {
        window.open(`/user/${notification.senderId}`, '_blank')
      }
    },

    async fetchUnreadCount() {
      try {
        const res = await NotificationAPI.getUnreadCount()
        this.unreadCount = res.data || 0
      } catch (error) {
        console.error('获取未读消息数量失败:', error)
      }
    },

    async fetchNotifications(page = 1, pageSize = 10, append = false) {
      if (!append) {
        this.loading = true
      }
      try {
        const res = await NotificationAPI.getNotificationList({
          current: page,
          pageSize,
        })
        const newRecords = res.data?.records || []

        if (append) {
          this.allNotifications = [...this.allNotifications, ...newRecords]
        } else {
          this.allNotifications = newRecords
        }

        const total = (res.data?.total as number) || 0
        this.hasMore = this.allNotifications.length < total

        this.applyFilter()
      } catch (error) {
        console.error('获取通知列表失败:', error)
      } finally {
        this.loading = false
      }
    },

    applyFilter() {
      if (this.filter === 'all') {
        this.notifications = [...this.allNotifications]
      } else if (this.filter === 'like') {
        this.notifications = this.allNotifications.filter(n => n.type === 1 || n.type === 2)
      } else if (this.filter === 'comment') {
        this.notifications = this.allNotifications.filter(n => n.type === 3 || n.type === 4)
      } else {
        this.notifications = this.allNotifications.filter(n => n.type === this.filter)
      }
    },

    async markAsRead(notificationId: string) {
      try {
        await NotificationAPI.markAsRead(notificationId)
        const notification = this.notifications.find((n) => n.id === notificationId)
        if (notification) {
          notification.isRead = 1
        }
        this.fetchUnreadCount()
      } catch (error) {
        console.error('标记已读失败:', error)
      }
    },

    async markAllAsRead() {
      try {
        await NotificationAPI.markAllAsRead()
        this.notifications.forEach((n) => {
          n.isRead = 1
        })
        this.unreadCount = 0
      } catch (error) {
        console.error('标记全部已读失败:', error)
      }
    },

    setFilter(filterType: 'all' | string | number) {
      this.filter = filterType
      this.applyFilter()
    },

    async batchMarkAsRead(notificationIds: string[]) {
      try {
        const promises = notificationIds.map(id => NotificationAPI.markAsRead(id))
        await Promise.all(promises)

        notificationIds.forEach(id => {
          const notification = this.notifications.find((n) => n.id === id)
          if (notification) {
            notification.isRead = 1
          }
        })
        this.fetchUnreadCount()
      } catch (error) {
        console.error('批量标记已读失败:', error)
      }
    },

    async batchDeleteNotifications(notificationIds: string[]) {
      try {
        const promises = notificationIds.map(id => NotificationAPI.deleteNotification(id))
        await Promise.all(promises)

        this.notifications = this.notifications.filter((n) => !notificationIds.includes(n.id))
        this.fetchUnreadCount()
      } catch (error) {
        console.error('批量删除通知失败:', error)
      }
    },

    async deleteNotification(notificationId: string) {
      try {
        await NotificationAPI.deleteNotification(notificationId)
        this.notifications = this.notifications.filter((n) => n.id !== notificationId)
        this.fetchUnreadCount()
      } catch (error) {
        console.error('删除通知失败:', error)
      }
    },
  },
})
