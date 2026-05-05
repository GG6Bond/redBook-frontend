<template>
  <el-dialog
    v-model="visible"
    width="1000px"
    class="user-center-modal"
    :show-close="false"
    append-to-body
    align-center
    destroy-on-close
    @close="handleClose"
  >
    <div class="modal-content" v-loading="loading">
      <div class="left-sidebar">
        <div class="profile-card">
          <el-avatar :size="100" :src="userInfo.avatar || defaultAvatar" class="profile-avatar" />
          <h2 class="profile-name">{{ userInfo.nickname || '未命名' }}</h2>
          <div class="profile-id">小红书号：{{ userInfo.id || 'Unknown' }}</div>
          <div class="profile-bio">{{ userInfo.signature || '这个人很懒，什么都没写' }}</div>

          <div class="user-basic-info">
            <div class="info-row">
              <el-icon
                ><Male v-if="userInfo.gender === 1" /><Female
                  v-else-if="userInfo.gender === 2" /><User v-else
              /></el-icon>
              <span>{{ getGenderText(userInfo.gender) }}</span>
            </div>
            <div class="info-row" v-if="userInfo.birthday">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDate(userInfo.birthday) }}</span>
            </div>
            <div class="info-row" v-if="userInfo.region">
              <el-icon><Location /></el-icon>
              <span>{{ userInfo.region }}</span>
            </div>
            <div class="info-row" v-if="userInfo.phone">
              <el-icon><Iphone /></el-icon>
              <span>{{ maskPhone(userInfo.phone) }}</span>
            </div>
          </div>

          <div class="profile-stats">
            <div class="stat-box">
              <span class="num">{{ following || 0 }}</span>
              <span class="label">关注</span>
            </div>
            <div class="stat-box">
              <span class="num">{{ followers || 0 }}</span>
              <span class="label">粉丝</span>
            </div>
            <div class="stat-box">
              <span class="num">{{ userInfo.likesAndCollections || 0 }}</span>
              <span class="label">获赞与收藏</span>
            </div>
          </div>

          <div class="profile-actions">
            <el-button type="primary" round class="action-btn" @click="handleOpenEdit"
              >编辑资料</el-button
            >
            <el-button round class="action-btn">分享主页</el-button>
          </div>
        </div>
      </div>

      <div class="right-content">
        <div class="content-tabs">
          <div
            class="tab-item"
            :class="{ active: activeTab === 'notes' }"
            @click="activeTab = 'notes'"
          >
            笔记
          </div>
          <div
            class="tab-item"
            :class="{ active: activeTab === 'likes' }"
            @click="activeTab = 'likes'"
          >
            点赞
          </div>
          <div
            class="tab-item"
            :class="{ active: activeTab === 'collect' }"
            @click="activeTab = 'collect'"
          >
            收藏
          </div>
        </div>

        <div class="scroll-list">
          <div v-if="notes.length > 0" class="note-grid">
            <div v-for="note in notes" :key="note.id" class="note-item">
              <img :src="note.coverUrl" class="note-cover" />
              <div class="note-info">{{ note.title }}</div>
              <div class="note-stat">
                <el-icon><Star /></el-icon> {{ note.likes }}
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <el-empty description="这里空空如也" />
          </div>
        </div>
      </div>
    </div>
  </el-dialog>

  <el-dialog
    v-model="editVisible"
    title="编辑资料"
    width="500px"
    append-to-body
    align-center
    class="edit-dialog"
  >
    <el-form :model="editForm" label-width="80px" class="edit-form">
      <el-form-item label="头像" class="avatar-item">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :http-request="handleAvatarUpload"
        >
          <img v-if="editForm.avatar" :src="editForm.avatar" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>

      <el-form-item label="昵称">
        <el-input
          v-model="editForm.nickname"
          placeholder="请输入昵称"
          maxlength="20"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="小红书号" v-if="false">
        <el-input disabled placeholder="无法修改" />
      </el-form-item>

      <el-form-item label="性别">
        <el-radio-group v-model="editForm.gender">
          <el-radio :label="1">男</el-radio>
          <el-radio :label="2">女</el-radio>
          <el-radio :label="0">保密</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="生日">
        <el-date-picker
          v-model="editForm.birthday"
          type="date"
          placeholder="选择生日"
          value-format="YYYY-MM-DDTHH:mm:ss.000+00:00"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="地区">
        <el-input v-model="editForm.region" placeholder="例如：中国·山东" />
      </el-form-item>

      <el-form-item label="简介">
        <el-input
          v-model="editForm.signature"
          type="textarea"
          :rows="3"
          placeholder="填写你的简介，让大家更了解你"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSaveEdit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Star, Male, Female, User, Calendar, Location, Iphone, Plus } from '@element-plus/icons-vue'
import { FollowAPI, NoteAPI, type PageRequest, UserAPI } from '../utils/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
// 假设你之前有一个 COS 上传工具，如果没有，需要按你的项目实际情况替换
import { uploadToCos } from '@/utils/cosUpload'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits(['update:visible'])

// ---------- 状态定义 ----------
const visible = ref(false)
const loading = ref(false)
const activeTab = ref('notes')
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const userInfo = ref<any>({})
const notes = ref<any[]>([])

const following = ref(0)
const followers = ref(0)



// 编辑弹窗相关状态
const editVisible = ref(false)
const saveLoading = ref(false)
const editForm = ref({
  nickname: '',
  avatar: '',
  gender: 0,
  birthday: '',
  region: '',
  signature: '',
  phone: '',
})

// ---------- 监听与生命周期 ----------
watch(
  () => props.visible,
  (val) => {
    visible.value = val
    if (val) {
      fetchUserData()
    }
  },
)

watch(visible, (val) => {
  emit('update:visible', val)
})

const handleClose = () => {
  visible.value = false
}

// ---------- 获取数据逻辑 ----------
const fetchUserData = async () => {
  loading.value = true
  try {
    const userRes = await UserAPI.getCurrentUser()
    const followRes = await FollowAPI.getFollowingList()
    following.value = followRes.data.total
    if (userRes.code === 0 && userRes.data) {
      userInfo.value = userRes.data
      if (!userInfo.value.avatar) userInfo.value.avatar = defaultAvatar
    }

    const noteRes = await NoteAPI.getMyNotes()
    if (noteRes.code === 0 && noteRes.data) {
      notes.value = noteRes.data.records
    }
    // console.log('笔记数据', notes.value)
    // console.log(notes.value.records.length)
  } catch (e) {
    console.error(e)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// ---------- 工具函数 ----------
const getGenderText = (gender: number) => {
  if (gender === 1) return '男'
  if (gender === 2) return '女'
  return '未设置性别'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return dayjs(dateStr).format('YYYY-MM-DD')
}

const maskPhone = (phone: string) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// ---------- 编辑资料逻辑 ----------

// 打开编辑弹窗，回显数据
const handleOpenEdit = () => {
  // 深拷贝当前数据到表单，避免直接修改显示的数据
  editForm.value = JSON.parse(JSON.stringify(userInfo.value))
  editVisible.value = true
}

// 头像上传 (复用之前的逻辑)
const handleAvatarUpload = async (options: any) => {
  try {
    const res = await uploadToCos(options.file) // 你的上传工具函数
    editForm.value.avatar = res.url
    ElMessage.success('头像上传成功')
  } catch (error) {
    ElMessage.error('头像上传失败')
  }
}

// 保存修改
const handleSaveEdit = async () => {
  saveLoading.value = true
  try {
    // 构造 UserUpdateRequest 对象
    const updateData = {
      nickname: editForm.value.nickname,
      avatar: editForm.value.avatar,
      gender: editForm.value.gender,
      birthday: editForm.value.birthday, // Element Plus DatePicker 出来的格式
      region: editForm.value.region,
      signature: editForm.value.signature,
      // phone 通常不在这里修改，需要验证码流程，这里暂时不传或只在前端回显
    }

    const res = await UserAPI.updateUserInfo(updateData)
    if (res.code === 0) {
      ElMessage.success('修改成功')
      editVisible.value = false
      // 重新获取最新用户信息
      fetchUserData()
    } else {
      ElMessage.error(res.message || '修改失败')
    }
  } catch (e) {
    ElMessage.error('网络异常')
  } finally {
    saveLoading.value = false
  }
}

// --- 核心逻辑：获取数据 ---
const loadData = async () => {
  loading.value = true
  const params: PageRequest = {
    current: 1,
    pageSize: 20,
    sortField: 'createTime',
    sortOrder: 'descend',
  }

  try {
    let response

    // 根据当前 Tab 调用对应的 API 方法
    if (activeTab.value === 'likes') {
      response = await NoteAPI.getLikeList(params)
    } else if (activeTab.value === 'collect') {
      response = await NoteAPI.getFavoriteList(params)
    } else {
      // 假设你还有一个获取“我的笔记”的方法，或者保持现状
      // response = await NoteApi.getMyNotes(params)
      notes.value = [] // 暂时清空
      return
    }

    // 根据你的 ApiResponse 结构处理数据
    if (response && response.code === 0) {
      notes.value = response.data.records
    } else {
      notes.value = []
    }
  } catch (error) {
    console.error('加载列表失败:', error)
    notes.value = []
  } finally {
    loading.value = false
  }
}

// --- 监听器与生命周期 ---
// 当点击 Tab 切换时，自动重新加载数据
watch(activeTab, () => {
  loadData()
})

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* 原有样式保持... */
.modal-content {
  display: flex;
  height: 80vh;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.left-sidebar {
  width: 350px;
  background-color: #fff; /* 改回白色背景更干净，或者保持 #f9f9f9 */
  padding: 40px 20px;
  border-right: 1px solid #f0f0f0; /* 边框颜色淡一点 */
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
}

.profile-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.profile-avatar {
  border: 1px solid #eee; /* 头像边框 */
  margin-bottom: 16px;
  background: #fff;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.profile-id {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.profile-bio {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 20px;
  padding: 0 10px;
  word-break: break-all;
}

/* 2. 新增：用户信息展示区样式 */
.user-basic-info {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  background: #f6f6f6;
  padding: 4px 10px;
  border-radius: 20px;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 30px;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.stat-box .num {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.stat-box .label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 1. 优化：操作按钮区 */
.profile-actions {
  width: 80%; /* 控制按钮容器宽度 */
  display: flex;
  flex-direction: column; /* 垂直排列 */
  gap: 12px; /* 按钮之间的间距 */
}

.action-btn {
  width: 100%; /* 按钮占满容器宽度，实现整齐对齐 */
  margin-left: 0 !important; /* Element Plus 默认可能会有 margin-left，强制去除 */
  height: 40px;
  font-weight: 600;
}

/* 右侧内容区样式保持不变 */
.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
}
.content-tabs {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  color: #999;
  font-weight: 500;
  margin-bottom: 10px;
}
.tab-item {
  cursor: pointer;
  padding: 8px 0;
  position: relative;
  transition: color 0.3s;
}
.tab-item.active {
  color: #333;
  font-weight: 600;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: #ff2442;
}
.scroll-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px 20px;
}
.note-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}
.note-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  aspect-ratio: 3/4; /* 保持图片比例 */
  background: #f8f8f8;
}
.note-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.note-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.note-stat {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #fff;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

/* 3. 新增：编辑弹窗样式 */
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 50%; /* 圆形上传框 */
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}
.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px; /* 垂直居中 */
}
.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}
</style>
