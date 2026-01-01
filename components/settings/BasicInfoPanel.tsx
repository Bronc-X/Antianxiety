'use client';

import { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useProfile } from '@/hooks/domain/useProfile';

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
  const { isLoading, isSaving, isUploading, error, update, uploadPhoto } = useProfile();
  const [localError, setLocalError] = useState<string | null>(null);
  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [avatarUrl] = useState(initialProfile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPending = isLoading || isUploading;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setLocalError('请选择图片文件');
        return;
      }
      // 验证文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        setLocalError('图片大小不能超过5MB');
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
      return await uploadPhoto(avatarFile);
    } catch (error) {
      console.error('上传头像时出错:', error);
      return null;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    try {
      // 如果有新头像文件，先上传
      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        const uploadedUrl = await handleUploadAvatar();
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl;
        } else {
          setLocalError('头像上传失败，请重试');
          return;
        }
      }

      const success = await update({
        full_name: fullName || null,
        avatar_url: finalAvatarUrl || null,
      });

      if (!success) {
        setLocalError(error || '保存失败，请稍后重试');
        return;
      }

      router.push('/unlearn');
      router.refresh();
    } catch (err) {
      console.error('保存设置时出错:', err);
      setLocalError('保存时发生错误，请稍后重试');
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
    <form onSubmit={handleSubmit} className={`space-y-6 ${isPending ? 'animate-pulse' : ''}`}>

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
          onClick={() => router.push('/unlearn')}
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
      {(localError || error) && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{localError || error}</p>
        </div>
      )}
    </form>
  );
}

