<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { UserAPI } from '../utils/api'

const router = useRouter()
const account = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const rememberMe = ref(false)

const submit = async () => {
  if (!account.value || !password.value) {
    errorMsg.value = '请输入账号和密码'
    return
  }

  loading.value = true
  errorMsg.value = ''
  try {
    const res = await UserAPI.login(account.value, password.value)
    // 假设后端在 res.data.token 返回 token
    const token = res?.data?.token
    const userId = res?.data?.id
    if (!token) throw new Error('登录失败：未返回 token')
    // 保存 token 和 userId 到 localStorage，后续请求可从中读取
    localStorage.setItem('token', token)
    if (userId) {
      localStorage.setItem('userId', String(userId))
    }
    // 导航到首页
    router.push('/')
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 左侧装饰区域 -->
    <div class="login-left">
      <div class="left-content">
        <div class="logo">
          <div class="logo-icon">蓝</div>
        </div>
        <h1 class="title">小蓝书</h1>
        <p class="subtitle">发现生活的美好，分享你的故事</p>
        <div class="features">
          <div class="feature-item">
            <div class="feature-icon">📸</div>
            <div class="feature-text">分享精彩内容</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">❤️</div>
            <div class="feature-text">获得用户关注</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">💬</div>
            <div class="feature-text">参与互动交流</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="login-right">
      <div class="login-container">
        <h2 class="login-title">欢迎登录</h2>
        <p class="login-subtitle">登录你的账户继续使用小蓝书</p>

        <!-- 错误提示 -->
        <el-alert
          v-if="errorMsg"
          :title="errorMsg"
          type="error"
          :closable="true"
          @close="errorMsg = ''"
          class="error-alert"
        />

        <!-- 登录表单 -->
        <div class="form-group">
          <label class="form-label">账号</label>
          <el-input
            v-model="account"
            placeholder="请输入账号"
            :prefix-icon="User"
            clearable
            @keyup.enter="submit"
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <el-input
            v-model="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            type="password"
            show-password
            @keyup.enter="submit"
          />
        </div>

        <!-- 记住我 & 忘记密码 -->
        <div class="form-options">
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          <router-link to="#" class="forget-link">忘记密码？</router-link>
        </div>

        <!-- 登录按钮 -->
        <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="submit">
          {{ loading ? '登录中...' : '立即登录' }}
        </el-button>

        <!-- 注册链接 -->
        <div class="register-link">
          还没有账户？
          <router-link to="#" class="link">立即注册</router-link>
        </div>

        <!-- 第三方登录 -->
        <div class="divider">
          <span>或使用以下方式登录</span>
        </div>
        <div class="social-login">
          <el-button circle plain class="social-btn">
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231877F2'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h-2v-6h2v6zm-1-6.89c-.61 0-1.1-.49-1.1-1.1s.49-1.1 1.1-1.1 1.1.49 1.1 1.1-.49 1.1-1.1 1.1zm8 6.89h-2V12c0-.83-.27-1.4-.93-1.4-.51 0-.88.34-.88 1.23v3.17h-2V11h2v.65c.27-.41.76-1 1.88-1 1.39 0 2.43.93 2.43 2.93v3.02z'/%3E%3C/svg%3E"
              alt="Facebook"
            />
          </el-button>
          <el-button circle plain class="social-btn">
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23EA4335'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z'/%3E%3C/svg%3E"
              alt="Google"
            />
          </el-button>
          <el-button circle plain class="social-btn">
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2309B83E'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E"
              alt="WeChat"
            />
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 左侧装饰区域 */
.login-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-left::before {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  top: -100px;
  left: -100px;
}

.login-left::after {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  bottom: -50px;
  right: -50px;
}

.left-content {
  position: relative;
  z-index: 1;
  color: white;
  text-align: center;
}

.logo {
  margin-bottom: 24px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: bold;
  margin: 0 auto;
  backdrop-filter: blur(10px);
}

.title {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 12px 0;
  letter-spacing: 2px;
}

.subtitle {
  font-size: 16px;
  margin: 0 0 48px 0;
  opacity: 0.9;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0.9;
  font-size: 14px;
}

.feature-icon {
  font-size: 24px;
}

/* 右侧登录表单 */
.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #333;
}

.login-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0 0 24px 0;
}

.error-alert {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 14px;
}

.forget-link,
.link {
  color: #667eea;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.3s;
}

.forget-link:hover,
.link:hover {
  color: #764ba2;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  margin-bottom: 16px;
}

.login-btn:hover {
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.register-link {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 28px 0;
  font-size: 12px;
  color: #999;
}

.divider::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
  background: #eee;
}

.divider span {
  position: relative;
  background: white;
  padding: 0 8px;
}

.social-login {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.social-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid #eee;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.social-btn:hover {
  border-color: #667eea;
  background-color: rgba(102, 126, 234, 0.05);
}

.social-btn img {
  width: 20px;
  height: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }

  .login-left {
    display: none;
  }

  .login-right {
    padding: 20px;
  }

  .login-container {
    padding: 32px 24px;
  }

  .title {
    font-size: 32px;
  }
}
</style>
