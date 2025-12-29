'use client';

import { motion } from 'framer-motion';

interface Icon3DProps {
    size?: number;
    className?: string;
}

// 3D Star Icon - 渐变星星（用于欢迎页）
export function Star3D({ size = 80, className = '' }: Icon3DProps) {
    return (
        <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={className}
            style={{ width: size, height: size }}
        >
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#A78BFA" />
                        <stop offset="50%" stopColor="#818CF8" />
                        <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                    <filter id="starShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#6366F1" floodOpacity="0.4" />
                    </filter>
                </defs>
                {/* 4-point star */}
                <path
                    d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z"
                    fill="url(#starGradient)"
                    filter="url(#starShadow)"
                />
                {/* Highlight */}
                <path
                    d="M50 15 L55 42 L82 50 L55 55 L50 82 L45 55 L18 50 L45 42 Z"
                    fill="white"
                    opacity="0.3"
                />
            </svg>
        </motion.div>
    );
}

// 3D Bell Icon - 通知铃铛
export function Bell3D({ size = 80, className = '' }: Icon3DProps) {
    return (
        <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={className}
            style={{ width: size, height: size }}
        >
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FCD34D" />
                        <stop offset="50%" stopColor="#FBBF24" />
                        <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                    <filter id="bellShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#D97706" floodOpacity="0.4" />
                    </filter>
                </defs>
                {/* Bell body */}
                <ellipse cx="50" cy="65" rx="30" ry="25" fill="url(#bellGradient)" filter="url(#bellShadow)" />
                {/* Bell top */}
                <ellipse cx="50" cy="50" rx="20" ry="30" fill="url(#bellGradient)" />
                {/* Ring */}
                <circle cx="50" cy="15" r="8" fill="#D97706" />
                <circle cx="50" cy="15" r="4" fill="#FCD34D" />
                {/* Clapper */}
                <ellipse cx="50" cy="88" rx="6" ry="5" fill="#92400E" />
                {/* Highlight */}
                <ellipse cx="38" cy="45" rx="8" ry="15" fill="white" opacity="0.4" />
            </svg>
        </motion.div>
    );
}

// 3D Heart Icon - 健康心形
export function Heart3D({ size = 80, className = '' }: Icon3DProps) {
    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={className}
            style={{ width: size, height: size }}
        >
            <motion.svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
                <defs>
                    <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FB7185" />
                        <stop offset="50%" stopColor="#F43F5E" />
                        <stop offset="100%" stopColor="#E11D48" />
                    </linearGradient>
                    <filter id="heartShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#E11D48" floodOpacity="0.4" />
                    </filter>
                </defs>
                {/* Heart shape */}
                <path
                    d="M50 85 C20 60 10 40 10 30 C10 15 25 10 35 10 C42 10 48 15 50 20 C52 15 58 10 65 10 C75 10 90 15 90 30 C90 40 80 60 50 85 Z"
                    fill="url(#heartGradient)"
                    filter="url(#heartShadow)"
                />
                {/* Highlight */}
                <ellipse cx="32" cy="32" rx="10" ry="12" fill="white" opacity="0.4" />
            </motion.svg>
        </motion.div>
    );
}

// 3D Fire Icon - 连续打卡火焰
export function Fire3D({ size = 80, className = '' }: Icon3DProps) {
    return (
        <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={className}
            style={{ width: size, height: size }}
        >
            <motion.svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            >
                <defs>
                    <linearGradient id="fireOuter" x1="50%" y1="100%" x2="50%" y2="0%">
                        <stop offset="0%" stopColor="#F97316" />
                        <stop offset="50%" stopColor="#EA580C" />
                        <stop offset="100%" stopColor="#DC2626" />
                    </linearGradient>
                    <linearGradient id="fireInner" x1="50%" y1="100%" x2="50%" y2="0%">
                        <stop offset="0%" stopColor="#FCD34D" />
                        <stop offset="100%" stopColor="#F97316" />
                    </linearGradient>
                    <filter id="fireShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#EA580C" floodOpacity="0.5" />
                    </filter>
                </defs>
                {/* Outer flame */}
                <path
                    d="M50 10 C70 30 85 50 80 70 C75 85 60 95 50 95 C40 95 25 85 20 70 C15 50 30 30 50 10 Z"
                    fill="url(#fireOuter)"
                    filter="url(#fireShadow)"
                />
                {/* Inner flame */}
                <path
                    d="M50 35 C60 50 70 60 65 75 C62 85 55 90 50 90 C45 90 38 85 35 75 C30 60 40 50 50 35 Z"
                    fill="url(#fireInner)"
                />
                {/* Core */}
                <ellipse cx="50" cy="80" rx="8" ry="10" fill="#FEF3C7" />
            </motion.svg>
        </motion.div>
    );
}

// 3D Trophy Icon - 成就奖杯
export function Trophy3D({ size = 80, className = '' }: Icon3DProps) {
    return (
        <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={className}
            style={{ width: size, height: size }}
        >
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FCD34D" />
                        <stop offset="50%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                    <filter id="trophyShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#D97706" floodOpacity="0.4" />
                    </filter>
                </defs>
                {/* Cup body */}
                <path
                    d="M25 20 L75 20 L70 55 C68 65 60 70 50 70 C40 70 32 65 30 55 L25 20 Z"
                    fill="url(#trophyGradient)"
                    filter="url(#trophyShadow)"
                />
                {/* Handles */}
                <path d="M25 25 C15 25 10 35 15 45 C18 50 22 50 25 48" stroke="url(#trophyGradient)" strokeWidth="6" fill="none" />
                <path d="M75 25 C85 25 90 35 85 45 C82 50 78 50 75 48" stroke="url(#trophyGradient)" strokeWidth="6" fill="none" />
                {/* Stem */}
                <rect x="45" y="70" width="10" height="12" fill="#D97706" />
                {/* Base */}
                <rect x="35" y="82" width="30" height="8" rx="2" fill="url(#trophyGradient)" />
                {/* Highlight */}
                <ellipse cx="40" cy="35" rx="8" ry="15" fill="white" opacity="0.3" />
            </svg>
        </motion.div>
    );
}

// 3D Avocado Icon - 牛油果（健康饮食）
export function Avocado3D({ size = 40, className = '' }: Icon3DProps) {
    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={className}
            style={{ width: size, height: size }}
        >
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="avoOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#84CC16" />
                        <stop offset="100%" stopColor="#65A30D" />
                    </linearGradient>
                    <linearGradient id="avoInner" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#BEF264" />
                        <stop offset="100%" stopColor="#A3E635" />
                    </linearGradient>
                </defs>
                <ellipse cx="20" cy="22" rx="14" ry="16" fill="url(#avoOuter)" />
                <ellipse cx="20" cy="24" rx="9" ry="11" fill="url(#avoInner)" />
                <ellipse cx="20" cy="26" rx="5" ry="6" fill="#92400E" />
                <ellipse cx="18" cy="24" rx="2" ry="3" fill="white" opacity="0.4" />
            </svg>
        </motion.div>
    );
}
