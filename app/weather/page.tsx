'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedSection from '@/components/AnimatedSection';
import MarketingNav from '@/components/MarketingNav';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';

interface WeatherData {
  temperature: number;
  icon: string;
  description: string;
  location: string;
  humidity?: number;
  windSpeed?: number;
  feelsLike?: number;
}

interface ProfileRecord {
  id: string;
  location?: string | null;
  full_name?: string | null;
}

export default function WeatherPage() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        const { data: profileData } = await supabase
          .from<ProfileRecord>('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        setProfile(profileData || null);
      }
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // 获取用户位置（从profile中获取，默认为广州）
        const location = profile?.location || '广州';
        const latitude = 23.1291; // 广州纬度
        const longitude = 113.2644; // 广州经度

        // 使用Open-Meteo API获取详细天气信息
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia/Shanghai`
        );
        
        if (response.ok) {
          const data = await response.json();
          const current = data.current;
          
          const getWeatherIcon = (code: number) => {
            if (code === 0) return '☀️';
            if (code <= 3) return '⛅';
            if (code <= 49) return '🌫️';
            if (code <= 59) return '🌦️';
            if (code <= 69) return '🌧️';
            if (code <= 79) return '🌨️';
            if (code <= 84) return '⛈️';
            return '☁️';
          };

          const getWeatherDescription = (code: number) => {
            if (code === 0) return '晴天';
            if (code <= 3) return '少云';
            if (code <= 49) return '有雾';
            if (code <= 59) return '小雨';
            if (code <= 69) return '中雨';
            if (code <= 79) return '雪';
            if (code <= 84) return '雷暴';
            return '多云';
          };

          setWeather({
            temperature: Math.round(current.temperature_2m),
            icon: getWeatherIcon(current.weather_code),
            description: getWeatherDescription(current.weather_code),
            location: location,
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            feelsLike: Math.round(current.temperature_2m), // 简化处理，实际应该计算体感温度
          });
        } else {
          // 使用模拟数据
          setWeather({
            temperature: 22,
            icon: '☀️',
            description: '晴',
            location: location,
            humidity: 65,
            windSpeed: 8,
            feelsLike: 22,
          });
        }
      } catch (error) {
        console.error('获取天气失败:', error);
        setWeather({
          temperature: 22,
          icon: '☀️',
          description: '晴',
          location: profile?.location || '广州',
          humidity: 65,
          windSpeed: 8,
          feelsLike: 22,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (profile !== undefined) {
      fetchWeather();
    }
  }, [profile]);

  // 获取北京时间问候
  const getBeijingGreeting = () => {
    const now = new Date();
    const beijingTimeString = now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' });
    const beijingTime = new Date(beijingTimeString);
    const hour = beijingTime.getHours();

    if (hour >= 5 && hour < 12) {
      return '早安';
    } else if (hour >= 12 && hour < 14) {
      return '午安';
    } else if (hour >= 14 && hour < 18) {
      return '午后好';
    } else {
      return '晚安';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF]">
        <MarketingNav user={user} profile={profile} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-[#0B3D2E]">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <MarketingNav user={user} profile={profile} />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <AnimatedSection inView variant="fadeUp">
          <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
            <div className="mb-6">
              <button
                onClick={() => router.back()}
                className="text-sm text-[#0B3D2E]/60 hover:text-[#0B3D2E] transition-colors mb-4"
              >
                ← 返回
              </button>
              <h1 className="text-2xl font-semibold text-[#0B3D2E] mb-2">天气详情</h1>
              <p className="text-sm text-[#0B3D2E]/70">{getBeijingGreeting()}，{profile?.full_name || '用户'}</p>
            </div>

            {weather && (
              <div className="space-y-6">
                {/* 主要天气信息 */}
                <div className="text-center py-6 border-b border-[#E7E1D6]">
                  <div className="text-6xl mb-4">{weather.icon}</div>
                  <div className="text-5xl font-bold text-[#0B3D2E] mb-2">{weather.temperature}°C</div>
                  <div className="text-lg text-[#0B3D2E]/70 mb-4">{weather.description}</div>
                  <div className="text-base text-[#0B3D2E]/60">
                    📍 {weather.location}
                  </div>
                </div>

                {/* 详细信息 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-[#E7E1D6] bg-[#FAF6EF] p-4">
                    <div className="text-xs uppercase tracking-widest text-[#0B3D2E]/60 mb-2">体感温度</div>
                    <div className="text-2xl font-semibold text-[#0B3D2E]">{weather.feelsLike}°C</div>
                  </div>
                  <div className="rounded-lg border border-[#E7E1D6] bg-[#FAF6EF] p-4">
                    <div className="text-xs uppercase tracking-widest text-[#0B3D2E]/60 mb-2">湿度</div>
                    <div className="text-2xl font-semibold text-[#0B3D2E]">{weather.humidity}%</div>
                  </div>
                  <div className="rounded-lg border border-[#E7E1D6] bg-[#FAF6EF] p-4">
                    <div className="text-xs uppercase tracking-widest text-[#0B3D2E]/60 mb-2">风速</div>
                    <div className="text-2xl font-semibold text-[#0B3D2E]">{weather.windSpeed} km/h</div>
                  </div>
                </div>

                {/* 时间信息 */}
                <div className="rounded-lg border border-[#E7E1D6] bg-[#FAF6EF] p-4">
                  <div className="text-xs uppercase tracking-widest text-[#0B3D2E]/60 mb-2">当前时间</div>
                  <div className="text-base text-[#0B3D2E]">
                    {new Date().toLocaleString('zh-CN', { 
                      timeZone: 'Asia/Shanghai',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      weekday: 'long'
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}

