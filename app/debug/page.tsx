'use client';

import { useState, useEffect } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';

export default function DebugPage() {
  const [clientSession, setClientSession] = useState<any>(null);
  const [serverSession, setServerSession] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    // DEV ONLY: Block in production
    if (process.env.NODE_ENV === 'production') {
      setError('This page is only available in development mode');
      setLoading(false);
      return;
    }

    const checkSessions = async () => {
      try {
        // 检查客户端 session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('客户端 session 获取失败:', error);
        } else {
          setClientSession(session);

          // 如果有session，获取profile数据
          if (session?.user?.id) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error('获取profile失败:', profileError);
              setError(`Profile error: ${profileError.message}`);
            } else {
              setProfileData(profile);
            }
          }
        }

        // 检查服务器端 session
        const response = await fetch('/api/debug/session');
        const data = await response.json();
        setServerSession(data.session);
      } catch (error) {
        console.error('检查 session 时出错:', error);
        setError(error instanceof Error ? error.message : '未知错误');
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

  if (error === 'This page is only available in development mode') {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-red-200">
          <h1 className="text-2xl font-bold text-red-600 mb-4">⛔ Access Denied</h1>
          <p className="text-[#0B3D2E]/70">This debug page is only available in development mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B3D2E] mb-2">🔍 Database Verification (DEV ONLY)</h1>
          <p className="text-[#0B3D2E]/60 text-sm">Raw database contents for current user</p>
        </div>

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

        {/* ⭐ NEW: Profile数据展示 */}
        {profileData && (
          <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border-2 border-[#0B3D2E]">
            <h2 className="text-xl font-semibold text-[#0B3D2E] mb-4">📊 Profile Table (Raw Data)</h2>

            {/* 关键字段快速查看 */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#FAF6EF] rounded-lg">
                <p className="text-xs text-[#0B3D2E]/60 mb-1">Onboarding Status</p>
                <p className="font-mono text-sm">
                  {profileData.onboarding_completed_at ? (
                    <span className="text-green-600">✅ Completed</span>
                  ) : (
                    <span className="text-yellow-600">⏳ Pending</span>
                  )}
                </p>
              </div>
              <div className="p-4 bg-[#FAF6EF] rounded-lg">
                <p className="text-xs text-[#0B3D2E]/60 mb-1">Metabolic Profile</p>
                <p className="font-mono text-sm">
                  {profileData.metabolic_profile ? (
                    <span className="text-green-600">✅ Exists</span>
                  ) : (
                    <span className="text-red-600">❌ Missing</span>
                  )}
                </p>
              </div>
            </div>

            {/* 完整JSON数据 */}
            <details className="group">
              <summary className="cursor-pointer font-medium text-[#0B3D2E] hover:text-[#0a3629] mb-2">
                ▶ View Full Profile JSON (Click to expand)
              </summary>
              <pre className="mt-4 p-4 bg-[#0B3D2E] text-[#FAF6EF] rounded-lg overflow-x-auto text-xs font-mono leading-relaxed">
                {JSON.stringify(profileData, null, 2)}
              </pre>
            </details>

            {/* Metabolic Profile详细展示 */}
            {profileData.metabolic_profile && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-3">✅ Metabolic Profile Data:</h3>
                <pre className="text-xs font-mono text-green-900 overflow-x-auto">
                  {JSON.stringify(profileData.metabolic_profile, null, 2)}
                </pre>
              </div>
            )}

            {/* AI Persona Context */}
            {profileData.ai_persona_context && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3">🧠 AI Persona Context:</h3>
                <pre className="text-xs font-mono text-blue-900 whitespace-pre-wrap">
                  {profileData.ai_persona_context}
                </pre>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">❌ Error: {error}</p>
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mt-8 flex gap-4">
          <a
            href="/login"
            className="inline-flex items-center rounded-md bg-[#0B3D2E] px-4 py-2 text-sm text-white hover:bg-[#0a3629] transition-colors"
          >
            前往登录
          </a>
          <a
            href="/onboarding"
            className="inline-flex items-center rounded-md border border-[#0B3D2E] px-4 py-2 text-sm text-[#0B3D2E] hover:bg-[#FAF6EF] transition-colors"
          >
            完成问卷
          </a>
          <a
            href="/unlearn/app"
            className="inline-flex items-center rounded-md border border-[#0B3D2E] px-4 py-2 text-sm text-[#0B3D2E] hover:bg-[#FAF6EF] transition-colors"
          >
            前往首页
          </a>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-800 hover:bg-gray-300 transition-colors"
          >
            🔄 刷新数据
          </button>
        </div>
      </div>
    </div>
  );
}
