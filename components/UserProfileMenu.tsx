'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface UserProfileMenuProps {
  user: {
    id: string;
    email?: string;
  };
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

export default function UserProfileMenu({ user, profile }: UserProfileMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setAvatarUrl(profile?.avatar_url || '');
  }, [profile?.full_name, profile?.avatar_url]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push('/login');
    router.refresh();
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id);

      if (error) {
        console.error('更新资料时出错:', error);
        alert('保存失败，请稍后重试');
      } else {
        setIsEditing(false);
        setIsOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error('保存资料时出错:', error);
      alert('保存失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.[0].toUpperCase() || 'U';
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-full border border-[#E7E1D6] bg-white px-3 py-1.5 hover:bg-[#FAF6EF] transition-colors"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={fullName || user.email || 'User'}
            className="h-8 w-8 rounded-full object-cover"
            width={32}
            height={32}
            unoptimized
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B3D2E] text-xs font-medium text-white">
            {getInitials()}
          </div>
        )}
        <span className="hidden md:block text-sm text-[#0B3D2E]">
          {fullName || user.email?.split('@')[0] || '用户'}
        </span>
        <svg
          className={`h-4 w-4 text-[#0B3D2E] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 rounded-lg border border-[#E7E1D6] bg-white shadow-lg z-50"
          >
            {isEditing ? (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#0B3D2E] mb-1">姓名</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
                    placeholder="输入您的姓名"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#0B3D2E] mb-1">头像 URL</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex-1 rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-3 py-2 text-sm text-white hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {isLoading ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setIsOpen(false);
                      setFullName(profile?.full_name || '');
                      setAvatarUrl(profile?.avatar_url || '');
                    }}
                    type="button"
                    className="rounded-md border border-[#E7E1D6] px-3 py-2 text-sm text-[#0B3D2E] hover:bg-[#FAF6EF] transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-[#E7E1D6]">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={fullName || user.email || 'User'}
                      className="h-12 w-12 rounded-full object-cover"
                      width={48}
                      height={48}
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B3D2E] text-sm font-medium text-white">
                      {getInitials()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#0B3D2E] truncate">
                      {fullName || '未设置姓名'}
                    </div>
                    <div className="text-xs text-[#0B3D2E]/60 truncate">{user.email}</div>
                  </div>
                </div>
                <Link
                  href="/pricing"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-md border border-[#0B3D2E] bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-3 py-2 text-sm text-white hover:shadow-md transition-all text-left block font-medium"
                >
                  升级订阅
                </Link>
                <Link
                  href="/assistant?panel=profile"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-md border border-[#E7E1D6] bg-white px-3 py-2 text-sm text-[#0B3D2E] hover:bg-[#FAF6EF] transition-colors text-left block"
                >
                  设置
                </Link>
                <button
                  onClick={() => {
                    setIsEditing(true);
                  }}
                  type="button"
                  className="w-full rounded-md border border-[#E7E1D6] bg-white px-3 py-2 text-sm text-[#0B3D2E] hover:bg-[#FAF6EF] transition-colors text-left"
                >
                  编辑个人信息
                </button>
                <button
                  onClick={handleLogout}
                  type="button"
                  className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  退出登录
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

