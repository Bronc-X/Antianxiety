'use client';

import { useState, useEffect } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { getServerSession } from '@/lib/auth-utils';

export default function DebugPage() {
  const [clientSession, setClientSession] = useState<any>(null);
  const [serverSession, setServerSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    const checkSessions = async () => {
      try {
        // 检查客户端 session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('客户端 session 获取失败:', error);
        } else {
          setClientSession(session);
        }

        // 检查服务器端 session
        const response = await fetch('/api/debug/session');
        const data = await response.json();
        setServerSession(data.session);
      } catch (error) {
        console.error('检查 session 时出错:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSessions();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('认证状态变化:', event, session);
      setClientSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#0B3D2E]/70">检查认证状态中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0B3D2E] mb-8">认证状态调试</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 客户端 Session */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E7E1D6]">
            <h2 className="text-xl font-semibold text-[#0B3D2E] mb-4">客户端 Session</h2>
            {clientSession ? (
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">状态:</span> ✅ 已登录</p>
                <p><span className="font-medium">用户ID:</span> {clientSession.user?.id}</p>
                <p><span className="font-medium">邮箱:</span> {clientSession.user?.email}</p>
                <p><span className="font-medium">过期时间:</span> {new Date(clientSession.expires_at * 1000).toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-red-600">❌ 未登录</p>
            )}
          </div>

          {/* 服务器端 Session */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E7E1D6]">
            <h2 className="text-xl font-semibold text-[#0B3D2E] mb-4">服务器端 Session</h2>
            {serverSession ? (
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">状态:</span> ✅ 已登录</p>
                <p><span className="font-medium">用户ID:</span> {serverSession.user?.id}</p>
                <p><span className="font-medium">邮箱:</span> {serverSession.user?.email}</p>
                <p><span className="font-medium">过期时间:</span> {new Date(serverSession.expires_at * 1000).toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-red-600">❌ 未登录</p>
            )}
          </div>
        </div>

        {/* 状态对比 */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-[#E7E1D6]">
          <h2 className="text-xl font-semibold text-[#0B3D2E] mb-4">状态对比</h2>
          <div className="text-sm">
            {clientSession && serverSession ? (
              <p className="text-green-600">✅ 客户端和服务器端 session 同步正常</p>
            ) : clientSession && !serverSession ? (
              <p className="text-yellow-600">⚠️ 客户端有 session 但服务器端没有（可能存在同步问题）</p>
            ) : !clientSession && serverSession ? (
              <p className="text-yellow-600">⚠️ 服务器端有 session 但客户端没有</p>
            ) : (
              <p className="text-red-600">❌ 客户端和服务器端都没有 session</p>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-8 flex gap-4">
          <a
            href="/login"
            className="inline-flex items-center rounded-md bg-[#0B3D2E] px-4 py-2 text-white hover:bg-[#0a3629] transition-colors"
          >
            前往登录
          </a>
          <a
            href="/landing"
            className="inline-flex items-center rounded-md border border-[#0B3D2E] px-4 py-2 text-[#0B3D2E] hover:bg-[#FAF6EF] transition-colors"
          >
            前往首页
          </a>
        </div>
      </div>
    </div>
  );
}
