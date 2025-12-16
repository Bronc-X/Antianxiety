'use client';

interface RefreshIconProps {
  className?: string;
  isSpinning?: boolean;
}

export default function RefreshIcon({ className = '', isSpinning = false }: RefreshIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''} ${className}`}
    >
      {/* 圆形箭头，逆时针方向，覆盖约3/4圆 */}
      <path
        d="M 12 3 A 9 9 0 0 1 19.5 5.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 19.5 5.5 L 19.5 2 L 21 3.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 继续圆弧到约3/4位置 */}
      <path
        d="M 19.5 5.5 A 9 9 0 0 1 12 21"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* 底部虚线部分（3个短划线） */}
      <path
        d="M 12 21 A 9 9 0 0 1 3 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="3 3"
        opacity="0.4"
        fill="none"
      />
    </svg>
  );
}

