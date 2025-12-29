'use client';

/**
 * Desktop Dashboard Presentational Component (The Skin - Desktop)
 * 
 * Pure presentation component for desktop dashboard view.
 * Receives all data and callbacks via props from useDashboard hook.
 * 
 * Features:
 * - Grid layout for efficient desktop viewing
 * - Shadcn UI components for consistent styling
 * - Minimal animations for professional feel
 * - California Calm error messaging
 * 
 * Requirements: 3.2, 3.3, 3.4, 5.5
 */

import { RefreshCw, Activity, Moon, Heart, Zap, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui';
import type { UseDashboardReturn } from '@/types/architecture';

// ============================================
// Props Interface
// ============================================

interface DesktopDashboardProps {
  dashboard: UseDashboardReturn;
}

// ============================================
// Loading Skeleton
// ============================================

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {/* Profile Card Skeleton */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
      
      {/* Stats Cards Skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// Error Display
// ============================================

function ErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full bg-amber-50 border-amber-200">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="text-amber-800 mb-4">
            Let&apos;s try that again gently. {error}
          </p>
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  icon: React.ReactNode;
  trend?: 'improving' | 'stable' | 'declining';
}

function StatCard({ title, value, unit, icon, trend }: StatCardProps) {
  const trendColors = {
    improving: 'text-green-600',
    stable: 'text-gray-600',
    declining: 'text-amber-600',
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          {title}
        </CardTitle>
        <div className="text-gray-400">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold text-gray-900">
            {value ?? '—'}
          </span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>
        {trend && (
          <p className={`text-xs mt-1 ${trendColors[trend]}`}>
            {trend === 'improving' && '↑ Improving'}
            {trend === 'stable' && '→ Stable'}
            {trend === 'declining' && '↓ Needs attention'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Component
// ============================================

export function DesktopDashboard({ dashboard }: DesktopDashboardProps) {
  const { 
    profile, 
    weeklyLogs, 
    hardwareData, 
    isLoading, 
    isSyncing, 
    error,
    sync,
    refresh 
  } = dashboard;
  
  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  // Error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={refresh} />;
  }
  
  // Calculate stats from data
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Health Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your wellness overview at a glance
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={sync}
          disabled={isSyncing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Profile'}
        </Button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Mood Trend"
          value={profile?.recent_mood_trend || 'stable'}
          icon={<Activity className="h-5 w-5" />}
          trend={profile?.recent_mood_trend}
        />
        
        <StatCard
          title="Avg Sleep"
          value={avgSleep}
          unit="hrs"
          icon={<Moon className="h-5 w-5" />}
        />
        
        <StatCard
          title="Stress Level"
          value={avgStress}
          unit="/10"
          icon={<Zap className="h-5 w-5" />}
        />
        
        <StatCard
          title="HRV"
          value={hardwareData?.hrv?.value ?? null}
          unit="ms"
          icon={<Heart className="h-5 w-5" />}
        />
      </div>
      
      {/* Profile Overview */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Demographics */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Demographics</h3>
                <div className="space-y-1 text-sm">
                  {profile.demographics.age && (
                    <p>Age: {profile.demographics.age} years</p>
                  )}
                  {profile.demographics.gender && (
                    <p>Gender: {profile.demographics.gender}</p>
                  )}
                  {profile.demographics.bmi && (
                    <p>BMI: {profile.demographics.bmi.toFixed(1)}</p>
                  )}
                </div>
              </div>
              
              {/* Health Goals */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Health Goals</h3>
                {profile.health_goals.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {profile.health_goals.slice(0, 3).map((goal, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {goal.goal_text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">No goals set</p>
                )}
              </div>
              
              {/* Lifestyle */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Lifestyle</h3>
                <div className="space-y-1 text-sm">
                  {profile.lifestyle_factors.sleep_hours && (
                    <p>Sleep: {profile.lifestyle_factors.sleep_hours} hrs/night</p>
                  )}
                  {profile.lifestyle_factors.exercise_frequency && (
                    <p>Exercise: {profile.lifestyle_factors.exercise_frequency}</p>
                  )}
                  {profile.lifestyle_factors.stress_level && (
                    <p>Stress: {profile.lifestyle_factors.stress_level}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Weekly Logs */}
      {weeklyLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-gray-500">Date</th>
                    <th className="text-left py-2 font-medium text-gray-500">Sleep</th>
                    <th className="text-left py-2 font-medium text-gray-500">Mood</th>
                    <th className="text-left py-2 font-medium text-gray-500">Stress</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyLogs.slice(0, 7).map((log, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{log.log_date}</td>
                      <td className="py-2">
                        {log.sleep_duration_minutes 
                          ? `${(log.sleep_duration_minutes / 60).toFixed(1)} hrs`
                          : '—'}
                      </td>
                      <td className="py-2">{log.mood_status || '—'}</td>
                      <td className="py-2">{log.stress_level ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DesktopDashboard;
