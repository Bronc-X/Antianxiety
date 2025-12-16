// 极简高级图标组件

export const ImageUploadIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 15.8333V4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5H15.8333C16.7538 2.5 17.5 3.24619 17.5 4.16667V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.66667 8.33333C7.12691 8.33333 7.5 7.96024 7.5 7.5C7.5 7.03976 7.12691 6.66667 6.66667 6.66667C6.20643 6.66667 5.83333 7.03976 5.83333 7.5C5.83333 7.96024 6.20643 8.33333 6.66667 8.33333Z"
      fill="currentColor"
    />
    <path
      d="M17.5 12.5L13.75 8.75L7.5 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.25 10.8333L9.16667 12.9167L2.5 17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 简化版Logo - 只有圆点+品牌名
export const BrandLogoSimple = ({ className, dotClassName }: { className?: string; dotClassName?: string }) => (
  <div className={`flex items-center gap-1.5 ${className || ''}`}>
    <svg
      className={dotClassName}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="6"
        cy="6"
        r="6"
        fill="#0B3D2E"
      />
    </svg>
    <span className="text-xs text-[#0B3D2E]/60">
      AntiAnxiety 图标系统
    </span>
  </div>
);

export const MicrophoneIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10V5C12.5 3.61929 11.3807 2.5 10 2.5C8.61929 2.5 7.5 3.61929 7.5 5V10C7.5 11.3807 8.61929 12.5 10 12.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 15V17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 17.5H12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// No More Anxious Logo - 圆点标志
export const LogoDot = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="8"
      fill="#0B3D2E"
    />
  </svg>
);

// No More Anxious 完整Logo - 圆点+文字
export const NoMoreAnxiousLogo = ({ className, dotClassName }: { className?: string; dotClassName?: string }) => (
  <div className={`flex items-center gap-2 ${className || ''}`}>
    <svg
      className={dotClassName}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="8"
        cy="8"
        r="8"
        fill="#0B3D2E"
      />
    </svg>
    <span className="text-sm font-medium text-[#0B3D2E]">
      No More anxious<sup className="text-xs">™</sup>
    </span>
  </div>
);
