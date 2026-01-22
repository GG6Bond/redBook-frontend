import { HttpClient } from './http'

// 定义响应数据类型
interface ApiResponse<T extends Record<string, unknown> = Record<string, unknown>> {
  code?: number
  message?: string
  data?: T
}

// 用户相关接口
export class UserAPI {
  /**
   * 登录接口
   */
  static login(account: string, password: string): Promise<ApiResponse<{ token: string }>> {
    return HttpClient.post('/api/user/login', {
      account,
      password,
    })
  }

  /**
   * 登出接口
   */
  static logout(): Promise<ApiResponse> {
    return HttpClient.post('/api/user/logout')
  }
}

// 笔记相关接口
export class NoteAPI {
  /**
   * 获取笔记列表（分页）
   */
  static getList(current: number, pageSize: number): Promise<ApiResponse> {
    return HttpClient.post('/api/note/list/page', {
      current,
      pageSize,
    })
  }

  /**
   * 获取笔记详情
   */
  static getDetail(id: string | number): Promise<ApiResponse> {
    return HttpClient.get(`/api/note/${id}`)
  }

  /**
   * 新建笔记
   */
  static addNote(data: {
    title: string
    content: string
    coverUrl?: string
    imageUrls?: string[]
  }): Promise<ApiResponse<number>> {
    return HttpClient.post('/api/note/add', data)
  }

  /**
   * 更新笔记
   */
  static update(id: string | number, data: Record<string, unknown>): Promise<ApiResponse> {
    return HttpClient.put(`/api/note/${id}`, data)
  }

  /**
   * 删除笔记
   */
  static delete(id: string | number): Promise<ApiResponse> {
    return HttpClient.delete(`/api/note/${id}`)
  }

  /**
   * 点赞笔记
   */
  static like(id: string | number): Promise<ApiResponse> {
    return HttpClient.post(`/api/note/${id}/like`)
  }

  /**
   * 收藏笔记
   */
  static collect(id: string | number): Promise<ApiResponse> {
    return HttpClient.post(`/api/note/${id}/collect`)
  }
}
