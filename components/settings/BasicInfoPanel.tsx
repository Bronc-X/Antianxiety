'use client';

import { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import Image from 'next/image';

interface ProfileRecord {
  id?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  [key: string]: unknown;
}

interface BasicInfoPanelProps {
  initialProfile: ProfileRecord;
}

export default function BasicInfoPanel({ initialProfile }: BasicInfoPanelProps) {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [avatarUrl] = useState(initialProfile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件');
        return;
      }
      // 验证文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB');
        return;
      }
      setAvatarFile(file);
      // 创建预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatarUrl;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // 上传到 Supabase Storage
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('上传头像失败:', uploadError);
        return null;
      }

      // 获取公开URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('上传头像时出错:', error);
      return null;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('请先登录');
        setIsSaving(false);
        return;
      }

      // 如果有新头像文件，先上传
      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        const uploadedUrl = await handleUploadAvatar();
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl;
        } else {
          setError('头像上传失败，请重试');
          setIsSaving(false);
          return;
        }
      }

      const metadata = (user.user_metadata || {}) as { username?: string };
      const fallbackUsername = metadata.username || user.email || user.id.slice(0, 8);
      
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            username: fallbackUsername,
            full_name: fullName || null,
            avatar_url: finalAvatarUrl || null,
          },
          { 
            onConflict: 'id',
            ignoreDuplicates: false 
          }
        );

      if (upsertError) {
        setError(`保存失败: ${upsertError.message}`);
        setIsSaving(false);
        return;
      }

      router.push('/landing');
      router.refresh();
      setError(null);
    } catch (err) {
      console.error('保存设置时出错:', err);
      setError('保存时发生错误，请稍后重试');
      setIsSaving(false);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* 头像上传 */}
      <div>
        <label className="block text-sm font-medium text-[#0B3D2E] mb-2">头像</label>
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="头像预览"
                className="h-20 w-20 rounded-full object-cover border-2 border-[#E7E1D6]"
                width={80}
                height={80}
                unoptimized
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0B3D2E] text-lg font-medium text-white border-2 border-[#E7E1D6]">
                {getInitials()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-md border border-[#E7E1D6] bg-white text-[#0B3D2E] text-sm font-medium hover:bg-[#FAF6EF] transition-colors"
            >
              选择本地文件
            </button>
            <p className="mt-1 text-xs text-[#0B3D2E]/60">支持 JPG、PNG 格式，最大 5MB</p>
          </div>
        </div>
      </div>

      {/* 姓名 */}
      <div>
        <label className="block text-sm font-medium text-[#0B3D2E] mb-2">姓名</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
          placeholder="输入您的姓名"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push('/landing')}
          className="px-4 py-2 rounded-md border border-[#E7E1D6] bg-white text-[#0B3D2E] text-sm font-medium hover:bg-[#FAF6EF] transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2 rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white text-sm font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}

