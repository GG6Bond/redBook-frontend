<template>
  <div class="comments-section">
    <div class="total-comments">共 {{ total }} 条评论</div>

    <!-- 评论列表 -->
    <div class="comment-list" v-loading="loading">
      <div v-if="comments.length === 0" class="empty-comments">
        <el-empty description="暂无评论，快来抢沙发吧" :image-size="80" />
      </div>

      <div v-else class="comment-items">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <!-- 一级评论 -->
          <div class="comment-main">
            <el-avatar :size="36" :src="comment.userAvatar || defaultAvatar" class="comment-avatar" />
            <div class="comment-content">
              <div class="comment-header">
                <div class="header-top">
                  <span class="user-nickname">{{ comment.userNickname }}</span>
                  <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
                </div>
                <div class="comment-text">{{ comment.content }}</div>
                <div class="comment-actions">
                  <span class="action-item" @click="handleLike(comment)">
                    <el-icon :size="16" :class="{ 'liked-icon': comment.isLiked }">
                      <Star />
                    </el-icon>
                    <span :class="{ 'liked': comment.isLiked }">{{ comment.likeCount || 0 }}</span>
                  </span>
                  <span class="action-item" @click="showReplyInput(comment)">
                    <el-icon :size="16"><ChatDotRound /></el-icon>
                    <span>回复</span>
                  </span>
                  <span v-if="canDelete(comment)" class="action-item delete" @click="handleDelete(comment)">
                    <el-icon :size="16"><Delete /></el-icon>
                    <span>删除</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 回复输入框 - 显示在当前被点击回复的评论下方 -->
          <div v-if="replyInputVisible && (replyInputVisible.id === comment.id || replyInputVisible.parentId === comment.id)" class="reply-input-wrapper">
            <el-input
              v-model="replyText"
              :placeholder="replyInputVisible && replyInputVisible.replyUserNickname ? '回复 @' + replyInputVisible.replyUserNickname : '写下你的回复...'"
              size="small"
              class="reply-input"
              @keyup.enter="submitReply(comment)"
            >
              <template #suffix>
                <el-button type="primary" size="small" @click="submitReply(comment)" :loading="replyLoading">
                  发送
                </el-button>
              </template>
            </el-input>
          </div>

          <!-- 二级回复列表 -->
          <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
            <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
              <el-avatar :size="28" :src="reply.userAvatar || defaultAvatar" class="reply-avatar" />
              <div class="reply-content">
                <div class="reply-header">
                  <span class="user-nickname">{{ reply.userNickname }}</span>
                  <span v-if="reply.replyUserNickname" class="reply-to">
                    回复 <span class="target-nickname">@{{ reply.replyUserNickname }}</span>
                  </span>
                  <span class="comment-time">{{ formatTime(reply.createTime) }}</span>
                </div>
                <div class="reply-text">{{ reply.content }}</div>
                <div class="reply-actions">
                  <span class="action-item" @click="handleLike(reply)">
                    <el-icon :size="14" :class="{ 'liked-icon': reply.isLiked }">
                      <Star />
                    </el-icon>
                    <span :class="{ 'liked': reply.isLiked }">{{ reply.likeCount || 0 }}</span>
                  </span>
                  <span class="action-item" @click="showReplyInput(reply)">
                    <el-icon :size="14"><ChatDotRound /></el-icon>
                    <span>回复</span>
                  </span>
                  <span v-if="canDelete(reply)" class="action-item delete" @click="handleDelete(reply)">
                    <el-icon :size="14"><Delete /></el-icon>
                    <span>删除</span>
                  </span>
                </div>
              </div>
            </div>
            <div v-if="comment.replyCount && comment.replies.length < comment.replyCount" class="view-more-replies">
              <el-button link type="primary" size="small">
                查看全部 {{ comment.replyCount }} 条回复 >
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination-wrapper">
      <el-pagination
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Star, ChatDotRound, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CommentAPI, UserAPI } from '@/utils/api.ts'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const props = defineProps<{
  noteId: string
}>()

const emit = defineEmits(['update', 'comment-change'])

const loading = ref(false)
const comments = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const replyInputVisible = ref<any>(null)
const replyText = ref('')
const replyLoading = ref(false)

// 当前登录用户 ID
const currentUserId = ref('')

// 获取当前登录用户 ID
const fetchCurrentUserId = async () => {
  try {
    const res = await UserAPI.getCurrentUser()
    if (res.code === 0 && res.data?.id) {
      currentUserId.value = String(res.data.id)
    }
  } catch (error) {
    console.error('获取当前用户信息失败:', error)
  }
}

// 判断是否可以删除评论
const canDelete = (comment: any) => {
  return String(comment.userId) === currentUserId.value
}

// 获取评论列表
const fetchComments = async () => {
  loading.value = true
  try {
    const res = await CommentAPI.getCommentList({
      noteId: props.noteId,
      current: currentPage.value,
      pageSize: pageSize.value,
    })

    if (res.code === 0 && res.data) {
      comments.value = res.data.records || []
      total.value = Number(res.data.total) || 0
    }
  } catch (error) {
    console.error('获取评论列表失败:', error)
    ElMessage.error('获取评论失败')
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  return dayjs(time).fromNow()
}

// 显示回复输入框
const showReplyInput = (comment: any) => {
  // 判断是否是一级评论：parentId 为 0、"0"、undefined 或 null
  const isTopLevelComment = comment.parentId === 0 || comment.parentId === '0' || !comment.parentId;

  replyInputVisible.value = {
    id: comment.id,
    // 如果是一级评论，parentId 使用当前评论的 id（作为父评论）
    // 如果是二级评论，parentId 使用当前评论的 parentId（祖父评论的 id）
    parentId: isTopLevelComment ? comment.id : comment.parentId,
    replyUserId: comment.userId,
    replyUserNickname: comment.userNickname,
  }
  replyText.value = ''
}

// 提交回复
const submitReply = async (parentComment: any) => {
  if (!replyText.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  console.log('提交回复:', {
    noteId: props.noteId,
    content: replyText.value,
    parentId: replyInputVisible.value?.parentId,
    replyUserId: replyInputVisible.value?.replyUserId,
  })

  replyLoading.value = true
  try {
    const res = await CommentAPI.addComment({
      noteId: props.noteId,
      content: replyText.value,
      parentId: replyInputVisible.value?.parentId,
      replyUserId: replyInputVisible.value?.replyUserId,
    })

    if (res.code === 0) {
      ElMessage.success('回复成功')
      replyInputVisible.value = null
      replyText.value = ''
      await fetchComments()
      emit('comment-change')
    }
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败')
  } finally {
    replyLoading.value = false
  }
}

// 点赞评论
const handleLike = async (comment: any) => {
  try {
    const res = await CommentAPI.toggleLike(comment.id)
    if (res.code === 0) {
      const newIsLiked = res.data as boolean
      comment.isLiked = newIsLiked
      comment.likeCount = newIsLiked
        ? (comment.likeCount || 0) + 1
        : Math.max((comment.likeCount || 0) - 1, 0)
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('点赞失败')
  }
}

// 删除评论
const handleDelete = async (comment: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const res = await CommentAPI.deleteComment(comment.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      await fetchComments()
      emit('comment-change')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchComments()
}

// 发表评论（供父组件调用）
const sendComment = async (content: string) => {
  if (!content.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  try {
    const res = await CommentAPI.addComment({
      noteId: props.noteId,
      content: content,
    })

    if (res.code === 0) {
      ElMessage.success('评论成功')
      await fetchComments()
      emit('comment-change')
    }
  } catch (error) {
    console.error('评论失败:', error)
    ElMessage.error('评论失败')
  }
}

// 暴露方法给父组件
defineExpose({
  sendComment,
  fetchComments,
})

onMounted(() => {
  fetchCurrentUserId()
  fetchComments()
})
</script>

<style scoped>
.comments-section {
  padding: 16px;
}

.total-comments {
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
  margin-bottom: 16px;
  padding-left: 4px;
}

.comment-list {
  min-height: 150px;
}

.empty-comments {
  text-align: center;
  padding: 30px 0;
}

.comment-item {
  margin-bottom: 20px;
}

.comment-main {
  display: flex;
  gap: 10px;
}

.comment-avatar {
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.comment-avatar:hover {
  opacity: 0.8;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  flex: 1;
  min-width: 0;
}

.header-top {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 6px;
}

.user-nickname {
  font-size: 13px;
  font-weight: 600;
  color: #1f1f1f;
  cursor: pointer;
  line-height: 1.4;
}

.user-nickname:hover {
  color: #ff2442;
}

.comment-time {
  font-size: 11px;
  color: #939393;
  flex-shrink: 0;
}

.comment-text {
  font-size: 14px;
  color: #1f1f1f;
  line-height: 1.6;
  margin-bottom: 6px;
  word-wrap: break-word;
}

.comment-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: nowrap;
}

.comment-actions .action-item {
  flex-shrink: 0;
  white-space: nowrap;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #939393;
  transition: all 0.2s;
  padding: 2px 4px;
  border-radius: 4px;
}

.action-item:hover {
  color: #ff2442;
  background: #fff0f1;
}

.action-item.liked {
  color: #ff2442;
}

.action-item .liked-icon {
  color: #ff2442;
  animation: heartBeat 0.3s ease-in-out;
}

@keyframes heartBeat {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

.action-item.delete {
  color: #939393;
}

.action-item.delete:hover {
  color: #ff4d4f;
  background: #fff0f0;
}

/* 回复输入框样式 */
.reply-input-wrapper {
  margin-top: 8px;
  margin-left: 36px;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reply-input-wrapper :deep(.el-input__wrapper) {
  border-radius: 20px;
  box-shadow: 0 0 0 1px #e5e5e5 inset;
}

.reply-input-wrapper :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #ff2442 inset;
}

.reply-input-wrapper :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #ff2442 inset;
}

/* 二级评论样式 */
.replies-list {
  margin-top: 10px;
  margin-left: 36px;
  padding-left: 10px;
  border-left: 1.5px solid #f0f0f0;
}

.reply-item {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-avatar {
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.reply-avatar:hover {
  opacity: 0.8;
}

.reply-content {
  flex: 1;
  min-width: 0;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
  flex-wrap: wrap;
}

.reply-header .user-nickname {
  font-size: 12px;
}

.reply-to {
  font-size: 11px;
  color: #939393;
}

.target-nickname {
  color: #ff2442;
  font-weight: 500;
}

.reply-header .comment-time {
  font-size: 10px;
}

.reply-text {
  font-size: 13px;
  color: #1f1f1f;
  line-height: 1.5;
  margin-bottom: 6px;
  word-wrap: break-word;
}

.reply-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: nowrap;
}

.reply-actions .action-item {
  font-size: 11px;
  white-space: nowrap;
}

.view-more-replies {
  margin-top: 6px;
  padding-left: 26px;
}

.view-more-replies :deep(.el-button) {
  font-size: 12px;
  color: #939393;
}

.view-more-replies :deep(.el-button:hover) {
  color: #ff2442;
}

/* 分页样式 */
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.pagination-wrapper :deep(.el-pagination) {
  --el-pagination-button-bg-color: #fff;
  --el-pagination-hover-color: #ff2442;
}

.pagination-wrapper :deep(.el-pager li) {
  border-radius: 8px;
  margin: 0 3px;
}

.pagination-wrapper :deep(.el-pager li.is-active) {
  background-color: #ff2442;
  color: #fff;
}
</style>
