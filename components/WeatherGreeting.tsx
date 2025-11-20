'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface WeatherData {
  temperature: number;
  icon: string;
  description: string;
}

export default function WeatherGreeting() {
  const [greeting, setGreeting] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 获取北京时间问候
    const getBeijingGreeting = () => {
      // 使用Intl API获取北京时间的当前小时
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Shanghai',
        hour: 'numeric',
        hour12: false,
      });
      const hour = parseInt(formatter.format(now), 10);

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

    // 立即设置一次
    setGreeting(getBeijingGreeting());

    // 设置定时器，每分钟更新一次问候语
    const interval = setInterval(() => {
      setGreeting(getBeijingGreeting());
    }, 60000); // 每分钟更新一次

    const fallbackWeather = () => {
      setWeather({
        temperature: 22,
        icon: '☀️',
        description: '晴',
      });
    };

    const controller = new AbortController();

    const fetchWeather = async () => {
      try {
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=23.1291&longitude=113.2644&current=temperature_2m,weather_code&timezone=Asia/Shanghai',
          {
            signal: controller.signal,
            cache: 'no-store',
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const temp = Math.round(data.current.temperature_2m);
          const weatherCode = data.current.weather_code;

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

          setWeather({
            temperature: temp,
            icon: getWeatherIcon(weatherCode),
            description: '',
          });
        } else {
          fallbackWeather();
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.warn('天气请求超时，使用默认数据');
        } else {
          console.warn('获取天气失败，使用默认数据:', error);
        }
        fallbackWeather();
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      fallbackWeather();
      setIsLoading(false);
    } else {
      fetchWeather();
    }

    // 清理定时器
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-lg font-medium text-[#0B3D2E]">
        <span>{greeting}</span>
        <span className="text-xl">🌤️</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-lg font-medium text-[#0B3D2E]">{greeting}</span>
      {weather && (
        <Link
          href="/weather"
          className="flex items-center gap-2 rounded-full border border-[#E7E1D6] bg-white px-3 py-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <span className="text-xl">{weather.icon}</span>
          <span className="text-sm font-medium text-[#0B3D2E]">{weather.temperature}°C</span>
        </Link>
      )}
    </div>
  );
}

