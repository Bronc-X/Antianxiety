'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * 认证错误测试页面
 * 用于测试各种认证错误的显示效果
 */
export default function TestAuthErrorPage() {
  const router = useRouter();

  const testCases = [
    {
      name: 'OTP过期错误（邮箱验证链接过期）',
      url: '/login?error=oauth_error#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
      description: '模拟用户点击过期的邮箱验证链接'
    },
    {
      name: 'OAuth授权失败',
      url: '/login?error=oauth_error',
      description: '模拟第三方登录授权失败'
    },
    {
      name: '无效Token',
      url: '/login?error=invalid_token',
      description: '模拟验证token无效'
    },
    {
      name: '会话创建失败',
      url: '/login?error=no_session',
      description: '模拟登录会话创建失败'
    },
    {
      name: '服务器错误',
      url: '/login?error=server_error&details=Database+connection+failed',
      description: '模拟服务器错误'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-medium text-[#0B3D2E] mb-2">
            认证错误测试页面
          </h1>
          <p className="text-[#0B3D2E]/60">
            点击下方按钮测试不同的认证错误场景
          </p>
        </div>

        <div className="grid gap-4">
          {testCases.map((testCase, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-6 border border-[#E7E1D6] hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-[#0B3D2E] mb-2">
                    {testCase.name}
                  </h3>
                  <p className="text-sm text-[#0B3D2E]/60 mb-3">
                    {testCase.description}
                  </p>
                  <code className="text-xs bg-[#FAF6EF] px-2 py-1 rounded text-[#0B3D2E]/70 block overflow-x-auto">
                    {testCase.url}
                  </code>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href={testCase.url}
                    className="px-4 py-2 bg-[#0B3D2E] text-[#FAF6EF] rounded-xl text-sm font-medium hover:bg-[#0B3D2E]/90 transition-colors whitespace-nowrap"
                  >
                    测试 →
                  </Link>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${testCase.url}`);
                      alert('URL已复制到剪贴板');
                    }}
                    className="px-4 py-2 bg-white border border-[#E7E1D6] text-[#0B3D2E] rounded-xl text-sm font-medium hover:bg-[#FAF6EF] transition-colors whitespace-nowrap"
                  >
                    复制URL
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-amber-50 rounded-2xl p-6 border border-amber-200">
          <h3 className="text-lg font-medium text-[#0B3D2E] mb-3">
            ⚠️ 测试说明
          </h3>
          <ul className="space-y-2 text-sm text-[#0B3D2E]/70">
            <li>• 点击"测试"按钮会跳转到登录页面，并显示对应的错误信息</li>
            <li>• 错误信息应该是中文且用户友好的提示</li>
            <li>• URL中的错误参数会被自动清理（hash部分）</li>
            <li>• 如果错误信息显示不正确，请检查 <code className="bg-white px-1 rounded">/app/login/page.tsx</code> 的错误处理逻辑</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-[#0B3D2E]/60 hover:text-[#0B3D2E] underline"
          >
            返回登录页面
          </Link>
        </div>
      </div>
    </div>
  );
}
