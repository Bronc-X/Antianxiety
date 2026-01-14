'use client';

/**
 * Mobile Dashboard Presentational Component (The Skin - Mobile)
 * 
 * Pure presentation component for mobile dashboard view.
 * Receives all data and callbacks via props from useDashboard hook.
 * 
 * Features:
 * - Framer Motion card animations
 * - Haptic feedback on interactions
 * - Lottie loading animation
 * - Offline banner
 * - California Calm design language
 * 
 * Requirements: 3.2, 3.3, 3.5, 5.6, 6.3
 */

import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Activity, Moon, Heart, Zap, WifiOff, AlertCircle } from 'lucide-react';
import { useHaptics, ImpactStyle } from '@/hooks/useHaptics';
import { LoadingAnimation } from '@/components/lottie/LoadingAnimation';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import type { UseDashboardReturn } from '@/types/architecture';

// ============================================
// Props Interface
// ============================================

interface MobileDashboardProps {
  dashboard: UseDashboardReturn;
}

// ============================================
// Animation Variants
// ============================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
};

// ============================================
// Offline Banner
// ============================================

function OfflineBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2"
    >
      <WifiOff className="h-4 w-4 text-amber-600" />
      <span className="text-sm text-amber-700">
        You&apos;re offline. Showing cached data.
      </span>
    </motion.div>
  );
}

// ============================================
// Loading State
// ============================================

function MobileLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <LoadingAnimation size="lg" />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-gray-500 mt-4 text-sm"
      >
        Loading your wellness data...
      </motion.p>
    </div>
  );
}

// ============================================
// Error Display
// ============================================

function MobileErrorDisplay({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry: () => void;
}) {
  const { impact } = useHaptics();
  
  const handleRetry = async () => {
    await impact(ImpactStyle.Light);
    onRetry();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] p-6"
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AlertCircle className="h-16 w-16 text-amber-400 mb-4" />
      </motion.div>
      <p className="text-gray-600 text-center mb-6 max-w-xs">
        Let&apos;s try that again gently. {error}
      </p>
      <Button 
        variant="outline" 
        onClick={handleRetry}
        className="border-amber-300 text-amber-700"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </motion.div>
  );
}

// ============================================
// Stat Card Component
// ============================================

interface MobileStatCardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  icon: React.ReactNode;
  trend?: 'improving' | 'stable' | 'declining';
  index: number;
}

function MobileStatCard({ title, value, unit, icon, trend, index }: MobileStatCardProps) {
  const { impact } = useHaptics();
  
  const trendColors = {
    improving: 'text-green-600 bg-green-50',
    stable: 'text-gray-600 bg-gray-50',
    declining: 'text-amber-600 bg-amber-50',
  };
  
  const handlePress = async () => {
    await impact(ImpactStyle.Light);
  };
  
  return (
    <motion.div
      variants={cardVariants}
      whileTap={{ scale: 0.98 }}
      onTapStart={handlePress}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">{title}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold text-gray-900">
                  {value ?? '—'}
                </span>
                {unit && <span className="text-xs text-gray-500">{unit}</span>}
              </div>
            </div>
            <div className={`p-2 rounded-full ${trend ? trendColors[trend] : 'bg-gray-100'}`}>
              {icon}
            </div>
          </div>
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`text-xs mt-2 ${trendColors[trend].split(' ')[0]}`}
            >
              {trend === 'improving' && '↑ Improving'}
              {trend === 'stable' && '→ Stable'}
              {trend === 'declining' && '↓ Needs attention'}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function MobileDashboard({ dashboard }: MobileDashboardProps) {
  const { impact, notification } = useHaptics();
  const { 
    profile, 
    weeklyLogs, 
    hardwareData, 
    isLoading, 
    isSyncing, 
    isOffline,
    error,
    sync,
    refresh 
  } = dashboard;
  
  // Handle sync with haptic feedback
  const handleSync = async () => {
    await impact(ImpactStyle.Medium);
    await sync();
    await notification('success');
  };
  
  // Loading state
  if (isLoading) {
    return <MobileLoadingState />;
  }
  
  // Error state
  if (error) {
    return <MobileErrorDisplay error={error} onRetry={refresh} />;
  }
  
  // Calculate stats
  const avgSleep = weeklyLogs.length > 0
    ? Math.round(
        weeklyLogs
          .filter(log => log.sleep_duration_minutes)
          .reduce((sum, log) => sum + (log.sleep_duration_minutes || 0), 0) / 
        weeklyLogs.filter(log => log.sleep_duration_minutes).length / 60 * 10
      ) / 10
    : null;
  
  const avgStress = weeklyLogs.length > 0
    ? Math.round(
        weeklyLogs
          .filter(log => log.stress_level !== null)
          .reduce((sum, log) => sum + (log.stress_level || 0), 0) / 
        weeklyLogs.filter(log => log.stress_level !== null).length * 10
      ) / 10
    : null;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && <OfflineBanner />}
      </AnimatePresence>
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b px-4 py-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Health Dashboard
            </h1>
            <p className="text-xs text-gray-500">
              Your wellness at a glance
            </p>
          </div>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing' : 'Sync'}
            </Button>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-4"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <MobileStatCard
            title="Mood Trend"
            value={profile?.recent_mood_trend || 'stable'}
            icon={<Activity className="h-4 w-4" />}
            trend={profile?.recent_mood_trend}
            index={0}
          />
          
          <MobileStatCard
            title="Avg Sleep"
            value={avgSleep}
            unit="hrs"
            icon={<Moon className="h-4 w-4" />}
            index={1}
          />
          
          <MobileStatCard
            title="Stress"
            value={avgStress}
            unit="/10"
            icon={<Zap className="h-4 w-4" />}
            index={2}
          />
          
          <MobileStatCard
            title="HRV"
            value={hardwareData?.hrv?.value ?? null}
            unit="ms"
            icon={<Heart className="h-4 w-4" />}
            index={3}
          />
        </div>
        
        {/* Profile Card */}
        {profile && (
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Health Goals */}
                {profile.health_goals.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Health Goals</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.health_goals.slice(0, 3).map((goal, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
                        >
                          {goal.goal_text}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Health Concerns */}
                {profile.health_concerns.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Focus Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.health_concerns.slice(0, 3).map((concern, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                          className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full"
                        >
                          {concern}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Recent Activity */}
        {weeklyLogs.length > 0 && (
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklyLogs.slice(0, 5).map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <span className="text-sm text-gray-600">{log.log_date}</span>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {log.sleep_duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Moon className="h-3 w-3" />
                            {(log.sleep_duration_minutes / 60).toFixed(1)}h
                          </span>
                        )}
                        {log.mood_status && (
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {log.mood_status}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default MobileDashboard;
