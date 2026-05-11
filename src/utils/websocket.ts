type MessageHandler = (data: any) => void

interface WebSocketOptions {
  onOpen?: () => void
  onMessage?: (data: any) => void
  onClose?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string = ''
  private options: WebSocketOptions
  private reconnectAttempts: number = 0
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null
  private readonly HEARTBEAT_INTERVAL: number = 30000

  constructor(options: WebSocketOptions = {}) {
    this.options = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...options,
    }
  }

  connect(token: string) {
    // 后端配置了 context-path: /api，所以完整路径是 /api/ws/notification
    const host = 'localhost:8765'
    this.url = `ws://${host}/api/ws/notification?token=${token}`

    console.log('正在连接 WebSocket:', this.url)

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('WebSocket 连接成功，URL:', this.url)
        this.reconnectAttempts = 0
        this.options.onOpen?.()
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('收到 WebSocket 消息:', data)
          this.options.onMessage?.(data)
        } catch (error) {
          console.error('解析 WebSocket 消息失败:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket 连接关闭')
        this.options.onClose?.()
        this.stopHeartbeat()
        this.reconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket 错误:', error)
        this.options.onError?.(error)
      }
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error)
    }
  }

  private reconnect() {
    if (
      this.reconnectAttempts < (this.options.maxReconnectAttempts || 5) &&
      localStorage.getItem('token')
    ) {
      this.reconnectAttempts++
      console.log(
        `尝试重连 WebSocket... (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`,
      )

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
      }

      this.reconnectTimer = window.setTimeout(() => {
        const token = localStorage.getItem('token')
        if (token) {
          this.connect(token)
        }
      }, this.options.reconnectInterval)
    } else {
      console.log('WebSocket 重连失败，已达到最大尝试次数')
    }
  }

  updateHandlers(options: WebSocketOptions) {
    this.options = { ...this.options, ...options }
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, this.HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket 未连接，无法发送消息')
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

export const websocketClient = new WebSocketClient()
export default WebSocketClient
