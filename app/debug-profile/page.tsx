import React from 'react';
import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import Link from 'next/link';

/**
 * 调试页面 - 显示当前用户的profile状态
 * 仅用于开发调试，生产环境应删除
 */

export const dynamic = 'force-dynamic';

export default async function DebugProfilePage() {
  const { user } = await requireAuth();
  const supabase = await createServerSupabaseClient();

  // 获取完整的用户profile数据
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-[#E7E1D6] p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#0B3D2E] mb-2">
            用户Profile调试信息
          </h1>
          <p className="text-sm text-[#0B3D2E]/60">
            此页面显示当前用户的完整profile数据，用于调试AI分析报告问题
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 用户基础信息 */}
          <div className="bg-[#FAF6EF] rounded-xl p-6">
            <h3 className="text-lg font-medium text-[#0B3D2E] mb-4">用户基础信息</h3>
            <div className="space-y-2 text-sm">
              <div><strong>用户ID:</strong> {user.id}</div>
              <div><strong>邮箱:</strong> {user.email}</div>
            </div>
          </div>

          {/* Profile查询状态 */}
          <div className="bg-[#FAF6EF] rounded-xl p-6">
            <h3 className="text-lg font-medium text-[#0B3D2E] mb-4">Profile查询状态</h3>
            <div className="space-y-2 text-sm">
              <div><strong>查询错误:</strong> {error ? JSON.stringify(error) : '无'}</div>
              <div><strong>Profile存在:</strong> {profile ? '是' : '否'}</div>
            </div>
          </div>
        </div>

        {/* AI分析报告所需字段 */}
        <div className="mt-6 bg-[#FAF6EF] rounded-xl p-6">
          <h3 className="text-lg font-medium text-[#0B3D2E] mb-4">AI分析报告所需字段</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className={`p-3 rounded-lg ${profile?.height ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className="font-medium">身高</div>
              <div>{profile?.height || '未设置'}</div>
            </div>
            <div className={`p-3 rounded-lg ${profile?.weight ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className="font-medium">体重</div>
              <div>{profile?.weight || '未设置'}</div>
            </div>
            <div className={`p-3 rounded-lg ${profile?.age ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className="font-medium">年龄</div>
              <div>{profile?.age || '未设置'}</div>
            </div>
            <div className={`p-3 rounded-lg ${profile?.gender ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <div className="font-medium">性别</div>
              <div>{profile?.gender || '未设置'}</div>
            </div>
          </div>
        </div>

        {/* 完整Profile数据 */}
        <div className="mt-6 bg-[#FAF6EF] rounded-xl p-6">
          <h3 className="text-lg font-medium text-[#0B3D2E] mb-4">完整Profile数据</h3>
          <pre className="bg-white p-4 rounded-lg text-xs overflow-auto max-h-96 text-[#0B3D2E]">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>

        {/* 操作按钮 */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/analysis"
            className="bg-[#0B3D2E] text-white px-6 py-3 rounded-xl hover:bg-[#0a3629] transition-colors"
          >
            尝试访问AI分析报告
          </Link>
          <Link
            href="/onboarding/profile"
            className="bg-white border border-[#0B3D2E] text-[#0B3D2E] px-6 py-3 rounded-xl hover:bg-[#FAF6EF] transition-colors"
          >
            完善个人资料
          </Link>
          <Link
            href="/landing"
            className="text-[#0B3D2E]/60 px-6 py-3 hover:text-[#0B3D2E] transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
