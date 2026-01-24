<template>
  <el-dialog
    v-model="visible"
    title="发布笔记"
    width="720px"
    class="publish-dialog"
    @close="handleClose"
  >
    <el-form
      :model="form"
      label-width="80px"
      :rules="rules"
      ref="formRef"
      size="large"
      class="publish-form"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入标题" />
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input type="textarea" v-model="form.content" placeholder="请输入内容" />
      </el-form-item>
      <el-form-item label="图片" prop="content">
        <el-upload
          label="图片"
          v-model:file-list="fileList"
          list-type="picture-card"
          :http-request="uploadRequest"
          :on-remove="handleRemove"
          :on-success="handleSuccess"
          :limit="9"
          :class="{ 'hide-upload': fileList.length >= 9 }"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">发布</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, type UploadProps, type UploadUserFile } from 'element-plus'
import { NoteAPI } from '../utils/api'
import { Plus } from '@element-plus/icons-vue'
import { uploadToCos } from '@/utils/cosUpload.ts'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()


const fileList = ref<UploadUserFile[]>([])
const dialogImageUrl = ref('')
const dialogVisible = ref(false)
const visible = ref(props.visible)

// 监听父组件传下来的 visible
watch(
  () => props.visible,
  (v) => (visible.value = v),
)

// 监听本地 visible，回传给父组件
watch(visible, (v) => emit('update:visible', v))

const formRef = ref()
const form = ref({
  title: '',
  content: '',
})

const loading = ref(false)

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
}

// 上传图片
const uploadRequest = async (options) => {
  const { file, onProgress, onSuccess, onError } = options

  try {
    const res = await uploadToCos(file, {
      onProgress: (p) => {
        onProgress({ percent: p.percent * 100 })
      },
    })
    // console.log('上传图片成功，响应为：', res)
    // console.log('FileList为：',fileList.value)
    // console.log('FileList的url为：',fileList.value[fileList.value.length - 1].url)
    // fileList.value[fileList.value.length - 1].url = res.url
    // 1. 找到当前正在上传的那个文件对象（通过 uid 匹配，绝对安全）
    const targetFile = fileList.value.find(item => item.uid === file.uid)
    // 2. 如果找到了，再修改它的 URL
    if (targetFile) {
      console.log('更新url：', res.url)
      targetFile.url = res.url
    }

    onSuccess({
      url: res.url
    })

  } catch (err) {
    onError(err)
  }
}

// 提交表单事件，插入数据库
async function handleSubmit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    const imageUrls = fileList.value
      .filter(file => file.status === 'success')
      .map(file => {
        return file.url
      })
    // 获取首页图片的 URL
    const coverUrl = imageUrls.length > 0 ? imageUrls[0] : ''
    // 添加笔记
    await NoteAPI.addNote({
      ...form.value,
      coverUrl,
      imageUrls,
    })
    ElMessage.success('发布成功')
    emit('success')
    handleClose()
    // 清空表单
    form.value = { title: '', content: ''}
    fileList.value = []
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '发布失败')
  } finally {
    loading.value = false
  }
}


const handleSuccess: UploadProps['onSuccess'] = (response, file, fileList) => {
  console.log('上传成功')
}

const handleRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  console.log('移除了文件')
}

function handleClose() {
  visible.value = false
}
</script>

<style scoped>
.publish-form {
  font-size: 20px;
}

.publish-dialog .el-dialog__body {
  padding: 36px 48px 20px 48px;
  font-size: 20px;
  background: #f7fafd;
}
.publish-dialog .el-dialog__title {
  font-size: 28px;
  font-weight: bold;
  color: #0099cc;
  letter-spacing: 2px;
}
.publish-dialog .el-form {
  margin-top: 12px;
  font-size: 20px;
}
.publish-dialog .el-form-item {
  margin-bottom: 32px;
}
.publish-dialog .el-input__inner,
.publish-dialog .el-textarea__inner {
  font-size: 20px;
  padding: 12px 18px;
  border-radius: 10px;
}
.publish-dialog .el-form-item__label {
  font-size: 20px;
  color: #222;
  font-weight: 600;
}
.publish-dialog .el-tag {
  font-size: 18px;
  padding: 5px 14px;
  background: #e6f7ff;
  color: #0099cc;
  border-radius: 8px;
  margin: 4px 8px 4px 0;
}
.publish-dialog .el-button {
  font-size: 20px;
  min-width: 110px;
  border-radius: 8px;
  padding: 12px 0;
}
.image-list {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 当拥有 hide-upload 类时，隐藏上传按钮容器 */
.hide-upload :deep(.el-upload--picture-card) {
  display: none;
}
</style>
