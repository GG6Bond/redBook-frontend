import COS from 'cos-js-sdk-v5';
import { CosAPI } from '@/utils/api.ts'

/**
 * COS 临时密钥结构
 */
interface CosCredentials {
  tmpSecretId: string;
  tmpSecretKey: string;
  sessionToken: string;
}

/**
 * 后端返回的 STS 数据结构
 */
interface StsResponse {
  credentials: CosCredentials;
  startTime: number;
  expiredTime: number;
  bucket: string;
  region: string;
  key: string;
}

/**
 * 上传进度数据（COS SDK 返回）
 */
export interface CosProgress {
  loaded: number;
  total: number;
  speed: number;
  percent: number;
}

/**
 * 上传参数
 */
interface UploadOptions {
  onProgress?: (progress: CosProgress) => void;
}

/**
 * 上传成功返回数据
 */
export interface UploadResult {
  url: string;
  key: string;
  Location?: string;
  ETag?: string;
}

/**
 * 获取 COS 临时密钥
 */
/**
 * COS 临时密钥结构
 */
interface CosCredentials {
  tmpSecretId: string;
  tmpSecretKey: string;
  sessionToken: string;
}

/**
 * 后端返回的 STS 数据结构
 */
interface StsResponse {
  tmpSecretId: string;
  tmpSecretKey: string;
  sessionToken: string;
  startTime: number;
  expiredTime: number;
  requestId: string;
  expiration: string;
  bucket: string;
  region: string;
  key: string;
}

/**
 * 获取 STS 临时凭证
 * @returns Promise<StsResponse> 符合类型声明的 STS 凭证数据
 */
async function getStsCredential(): Promise<StsResponse> {
  const res = await CosAPI.getStsCredential();
  console.log('getStsCredential:', res);
  return res.data as StsResponse;
}


/**
 * 上传文件到 COS
 */
export function uploadToCos(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { onProgress } = options;

  if (!file) {
    return Promise.reject(new Error('file 不能为空'));
  }


  return new Promise(async (resolve, reject) => {
    try {
      // 1. 获取临时密钥
      const data = await getStsCredential();
      console.log('getKeyAndCredentials:', data);

      const {
        startTime,
        expiredTime,
        bucket,
        region,
      } = data;

      const { tmpSecretId, tmpSecretKey, sessionToken } = data;

      // 2. 参数校验
      const params: Record<string, string | number | undefined> = {
        tmpSecretId,
        tmpSecretKey,
        sessionToken,
        bucket,
        region,
      };

      const emptyParam = Object.keys(params).find(
        k => params[k] === undefined || params[k] === ''
      );

      if (emptyParam) {
        reject(new Error(`参数错误: ${emptyParam} 不能为空`));
        return;
      }

      // 3. 创建 COS 实例
      const cos = new COS({
        SecretId: tmpSecretId,
        SecretKey: tmpSecretKey,
        SecurityToken: sessionToken,
        StartTime: startTime,
        ExpiredTime: expiredTime,
      });


      const key = renameFile(file)

      // 4. 上传文件
      cos.uploadFile(
        {
          Bucket: bucket,
          Region: region,
          Key: key,
          Body: file,
          onProgress(progressData: CosProgress) {
            onProgress?.(progressData);
          },
        },
        (err: COS.CosError | null, result: COS.PutObjectResult) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              ...result,
              key,
              url: `https://${bucket}.cos.${region}.myqcloud.com/${key}`,
            });
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

function renameFile(file: File) {
  // 1. 获取后缀
  const ext = file.name.substring(file.name.lastIndexOf('.'));

  // 2. 新文件名
  const newName = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`;

  // 3. 构造新 File
  return newName;
}
