/**
 * API 工具函数
 * 用于错误处理、重试机制等
 */

/**
 * 带重试的 fetch 请求
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // 如果是 429 (Rate Limit) 或 5xx 错误，进行重试
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (attempt < maxRetries) {
          // 从响应头获取重试延迟时间，或使用默认值
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : retryDelay * Math.pow(2, attempt); // 指数退避

          console.warn(
            `API 请求失败 (${response.status})，${delay}ms 后重试 (${attempt + 1}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      // 其他错误或成功响应，直接返回
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt); // 指数退避
        console.warn(
          `API 请求异常，${delay}ms 后重试 (${attempt + 1}/${maxRetries}):`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // 所有重试都失败
  throw lastError || new Error('API 请求失败：已达到最大重试次数');
}

/**
 * 解析 API 错误信息
 */
export function parseApiError(error: unknown): { message: string; code?: string } {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { statusText?: string; status?: number } }).response;
    if (response) {
      return {
        message: response.statusText || '请求失败',
        code: response.status?.toString(),
      };
    }

    if ('message' in error) {
      return {
        message: String((error as { message?: string }).message || '请求失败'),
        code: (error as { code?: string | number }).code?.toString(),
      };
    }
  }

  return {
    message: '未知错误，请稍后重试',
  };
}

/**
 * 检查响应是否成功
 */
export function isSuccessResponse(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * 检查是否是临时错误（可以重试）
 */
export function isRetryableError(status: number): boolean {
  // 429: Rate Limit
  // 5xx: Server Error
  return status === 429 || (status >= 500 && status < 600);
}

