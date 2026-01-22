<template>
  <el-dialog v-model="visible" title="发布笔记" width="500px" @close="handleClose">
    <el-form :model="form" label-width="80px" :rules="rules" ref="formRef">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入标题" />
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input type="textarea" v-model="form.content" placeholder="请输入内容" />
      </el-form-item>
      <el-form-item label="封面" prop="coverUrl">
        <el-input v-model="form.coverUrl" placeholder="封面图片URL" />
      </el-form-item>
      <el-form-item label="图片组">
        <el-input
          v-model="imageInput"
          placeholder="输入图片URL后回车添加"
          @keyup.enter="addImageUrl"
        />
        <div class="image-list">
          <el-tag
            v-for="(url, idx) in form.imageUrls"
            :key="url"
            closable
            @close="removeImageUrl(idx)"
            style="margin: 4px"
          >
            {{ url }}
          </el-tag>
        </div>
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
import { ElMessage } from 'element-plus'
import { NoteAPI } from '../utils/api'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['update:visible', 'success'])

const visible = ref(props.visible)
// 监听 props.visible 变化，更新本地 visible
watch(
  () => props.visible,
  (v) => (visible.value = v),
)
// 监听本地 visible 变化，通知父组件
watch(visible, (v) => emit('update:visible', v))

const formRef = ref()
const form = ref({
  title: '',
  content: '',
  coverUrl: '',
  imageUrls: [] as string[],
})
const imageInput = ref('')
const loading = ref(false)

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
}

function addImageUrl() {
  if (imageInput.value.trim()) {
    form.value.imageUrls.push(imageInput.value.trim())
    imageInput.value = ''
  }
}
function removeImageUrl(idx: number) {
  form.value.imageUrls.splice(idx, 1)
}
function handleClose() {
  visible.value = false
}
async function handleSubmit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    // 这里假设 UserAPI.addNote 实现了接口调用
    await NoteAPI.addNote({ ...form.value })
    ElMessage.success('发布成功')
    emit('success')
    handleClose()
    // 清空表单
    form.value = { title: '', content: '', coverUrl: '', imageUrls: [] }
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '发布失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.image-list {
  margin-top: 8px;
}
</style>
