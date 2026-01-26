import { HttpClient } from './http'

// 定义响应数据类型
interface ApiResponse<T extends Record<string, unknown> = Record<string, unknown>> {
  code?: number
  message?: string
  data?: T
}


/**
 * 搜索请求参数接口
 */
interface SearchRequest {
  current?: number;
  pageSize?: number;
  noteParm?: string; // 搜索笔记时的关键词
  userParm?: string; // 搜索用户时的关键词
}

/**
 * 分页请求通用接口
 */
export interface PageRequest {
  current?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: string;
}

/**
 * 关注状态返回
 */
export interface FollowStatus {
  followed: boolean; // 是否已关注
  mutual: boolean;   // 是否互相关注
}

// cos 相关接口
export class CosAPI {
  /**
   * 获取临时密钥
   */
  static getStsCredential(): Promise<ApiResponse<{
    credentials: {
      tmpSecretId: string
      tmpSecretKey: string
      sessionToken: string
    }
    region: string
    bucket: string
  }>> {
    return HttpClient.post('/api/cos/credential', {})
  }
}


/**
 * 用户信息视图对象 (响应数据)
 */
export interface UserVO {
  id: string; // 注意：虽然文档是int64，但在前端建议用string接收防止精度丢失
  account: string;
  nickname: string;
  avatar: string;
  gender: number; // 0 或 1
  phone: string;
  region: string;
  signature: string;
  birthday: string; // date-time 字符串
  createTime: string; // date-time 字符串
}

/**
 * 修改用户信息请求参数
 */
export interface UserUpdateRequest {
  nickname?: string;
  avatar?: string;
  gender?: number;
  phone?: string;
  region?: string;
  signature?: string;
  birthday?: string;
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

  /**
   * 获取当前登录用户信息
   * 注意：根据文档，此处使用 POST 请求且无参数
   */
  static getCurrentUser(): Promise<ApiResponse<UserVO>> {
    return HttpClient.post('/api/user/getCurrentUser')
  }

  /**
   * 修改用户信息
   * @param data 需要修改的信息字段
   */
  static updateUserInfo(data: UserUpdateRequest): Promise<ApiResponse<boolean>> {
    return HttpClient.post('/api/user/update', data)
  }



  /**
   * 关注/取关用户
   * 接口地址: /api/follow/{userId}
   * 请求方式: POST
   * @param userId 用户ID (路径参数)
   */
  static follow(userId: string | number): Promise<ApiResponse<FollowStatus>> {
    // 注意：这里 userId 是拼接到 URL 路径中的
    return HttpClient.post(`/api/follow/${userId}`)
  }


}

// 通用分页响应结构 (根据文档 data 的结构)
export interface PageResult<T> {
  records: T[]
  total: string | number
}

// 我的笔记请求参数接口 (排除 userId)
export interface NoteQueryRequest {
  current?: number
  pageSize?: number
  sortOrder?: string
  title?: string
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
   * 获取我的笔记列表
   * 接口地址: /api/note/my
   * 请求方式: POST
   */
  static getMyNotes(data?: NoteQueryRequest): Promise<ApiResponse<PageResult<any>>> {
    // 给定默认分页参数，防止传空时后端报错（视后端实现而定，给个空对象 {} 比较安全）
    const payload = data || { current: 1, pageSize: 10 }
    return HttpClient.post('/api/note/my', payload)
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

  /**
   * 搜索笔记或用户
   * 接口地址: /api/note/search
   * 请求方式: POST
   */
  static search(data: SearchRequest): Promise<ApiResponse<PageResult<any>>> {
    // 默认参数处理：确保分页有默认值
    const payload = {
      current: 1,
      pageSize: 10,
      noteParm: "",
      userParm: "",
      ...data
    }
    return HttpClient.post('/api/note/search', payload)
  }

  static getLikeList(data: PageRequest): Promise<ApiResponse<PageResult<any>>> {
    const payload = {
      current: 1,
      pageSize: 10,
      ...data
    }
    return HttpClient.post('/api/like/likeList', payload)
  }

  /**
   * 获取用户收藏列表
   * 接口地址: /api/favorite/favoriteList
   */
  static getFavoriteList(data: PageRequest): Promise<ApiResponse<PageResult<any>>> {
    const payload = {
      current: 1,
      pageSize: 10,
      ...data
    }
    return HttpClient.post('/api/favorite/favoriteList', payload)
  }

}




