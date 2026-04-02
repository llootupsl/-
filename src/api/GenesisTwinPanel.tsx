/**
 * =============================================================================
 * 创世纪数据孪生面板 - UI 组件
 * =============================================================================
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  GenesisTwin,
  type GenesisTwinStatus,
  type WeatherData as TwinWeatherData,
  type TimeData as TwinTimeData,
} from './GenesisTwin';

export interface GenesisTwinPanelProps {
  className?: string;
  onLocationChange?: (lat: number, lng: number) => void;
  onWeatherUpdate?: (weather: WeatherData) => void;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  description: string;
}

export interface TimeData {
  timezone: string;
  sunrise: string;
  sunset: string;
  moonPhase: string;
  lunarDate: string;
}

interface PanelStatusView {
  initialized: boolean;
  locationSource: GenesisTwinStatus['locationSource'];
  weatherSource: GenesisTwinStatus['weatherSource'];
  weatherStatus: GenesisTwinStatus['weatherStatus'];
  weatherMessage: string | null;
}

const MOON_PHASE_ICONS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

function formatWeatherSource(source: PanelStatusView['weatherSource']): string {
  if (source === 'open-meteo') return 'Open-Meteo';
  if (source === 'mock') return '本地模拟';
  return '待获取';
}

function formatWeatherStatus(status: PanelStatusView['weatherStatus']): string {
  if (status === 'live') return '实时';
  if (status === 'fallback') return '回退';
  return '待机';
}

function formatLocationSource(source: PanelStatusView['locationSource']): string {
  if (source === 'browser') return '浏览器定位';
  if (source === 'fallback') return '默认坐标';
  return '未定位';
}

function formatMoonPhase(phase: number): string {
  const index = Math.min(
    MOON_PHASE_ICONS.length - 1,
    Math.max(0, Math.floor((phase % 1) * MOON_PHASE_ICONS.length))
  );
  return MOON_PHASE_ICONS[index];
}

function convertWeather(weather: TwinWeatherData | null): WeatherData | null {
  if (!weather) return null;

  return {
    temperature: weather.temperature,
    humidity: weather.humidity,
    condition: weather.condition,
    description: weather.description,
  };
}

function convertTime(time: TwinTimeData | null): TimeData | null {
  if (!time) return null;

  return {
    timezone: time.timezone,
    sunrise: new Date(time.sunrise).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    sunset: new Date(time.sunset).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    moonPhase: formatMoonPhase(time.moonPhase),
    lunarDate: time.lunarDate ?? '未知',
  };
}

function snapshotStatus(status: GenesisTwinStatus): PanelStatusView {
  return {
    initialized: status.initialized,
    locationSource: status.locationSource,
    weatherSource: status.weatherSource,
    weatherStatus: status.weatherStatus,
    weatherMessage: status.weatherMessage,
  };
}

/**
 * 创世纪数据孪生面板
 */
export const GenesisTwinPanel: React.FC<GenesisTwinPanelProps> = memo(({
  className = '',
  onLocationChange,
  onWeatherUpdate,
}) => {
  const twinRef = useRef<GenesisTwin | null>(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const onWeatherUpdateRef = useRef(onWeatherUpdate);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
    onWeatherUpdateRef.current = onWeatherUpdate;
  }, [onLocationChange, onWeatherUpdate]);

  if (!twinRef.current) {
    twinRef.current = new GenesisTwin();
  }

  const twin = twinRef.current;

  const [activeTab, setActiveTab] = useState<'location' | 'weather' | 'time'>('weather');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    () => {
      const initialLocation = twin.getLocation();
      return initialLocation
        ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
        : null;
    }
  );
  const [weather, setWeather] = useState<WeatherData | null>(() => convertWeather(twin.getWeather()));
  const [time, setTime] = useState<TimeData | null>(() => convertTime(twin.getTime()));
  const [status, setStatus] = useState<PanelStatusView>(() => snapshotStatus(twin.getStatus()));
  const [loading, setLoading] = useState(true);

  const syncFromTwin = useCallback(() => {
    const twinLocation = twin.getLocation();
    const twinWeather = twin.getWeather();
    const twinTime = twin.getTime();
    const twinStatus = twin.getStatus();

    setLocation(
      twinLocation
        ? { lat: twinLocation.latitude, lng: twinLocation.longitude }
        : null
    );
    setWeather(convertWeather(twinWeather));
    setTime(convertTime(twinTime));
    setStatus(snapshotStatus(twinStatus));

    if (twinLocation) {
      onLocationChangeRef.current?.(twinLocation.latitude, twinLocation.longitude);
    }

    if (twinWeather) {
      onWeatherUpdateRef.current?.({
        temperature: twinWeather.temperature,
        humidity: twinWeather.humidity,
        condition: twinWeather.condition,
        description: twinWeather.description,
      });
    }
  }, [twin]);

  useEffect(() => {
    let mounted = true;

    const handleUpdate = () => {
      if (!mounted) return;
      syncFromTwin();
      setLoading(false);
    };

    const handleError = () => {
      if (!mounted) return;
      syncFromTwin();
      setLoading(false);
    };

    twin.on('initialized', handleUpdate);
    twin.on('update', handleUpdate);
    twin.on('location-update', handleUpdate);
    twin.on('weather-update', handleUpdate);
    twin.on('time-update', handleUpdate);
    twin.on('error', handleError);

    void twin.init()
      .then(() => {
        if (!mounted) return;
        syncFromTwin();
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        syncFromTwin();
        setLoading(false);
      });

    return () => {
      mounted = false;
      twin.removeListener('initialized', handleUpdate);
      twin.removeListener('update', handleUpdate);
      twin.removeListener('location-update', handleUpdate);
      twin.removeListener('weather-update', handleUpdate);
      twin.removeListener('time-update', handleUpdate);
      twin.removeListener('error', handleError);
      twin.destroy();
    };
  }, [syncFromTwin, twin]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await twin.refresh();
      syncFromTwin();
    } finally {
      setLoading(false);
    }
  }, [syncFromTwin, twin]);

  const getWeatherIcon = useCallback((condition: string) => {
    switch (condition) {
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      case 'snowy': return '❄️';
      case 'stormy': return '⛈️';
      case 'foggy': return '🌫️';
      default: return '🌤️';
    }
  }, []);

  return (
    <div className={`genesis-twin-panel ${className}`}>
      <div className="panel-header">
        <h3>创世纪孪生</h3>
        <span className="update-time">
          {new Date().toLocaleTimeString('zh-CN')}
        </span>
      </div>

      <div className="panel-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span className="meta-chip">定位: {formatLocationSource(status.locationSource)}</span>
        <span className="meta-chip">天气: {formatWeatherSource(status.weatherSource)}</span>
        <span className="meta-chip">状态: {formatWeatherStatus(status.weatherStatus)}</span>
      </div>

      {/* 标签页 */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'weather' ? 'active' : ''}`}
          onClick={() => setActiveTab('weather')}
        >
          🌤️ 天气
        </button>
        <button
          className={`tab-btn ${activeTab === 'location' ? 'active' : ''}`}
          onClick={() => setActiveTab('location')}
        >
          📍 位置
        </button>
        <button
          className={`tab-btn ${activeTab === 'time' ? 'active' : ''}`}
          onClick={() => setActiveTab('time')}
        >
          ⏰ 时间
        </button>
      </div>

      {/* 天气页面 */}
      {activeTab === 'weather' && (
        <div className="tab-content weather-content">
          {weather ? (
            <>
              <div className="weather-main">
                <span className="weather-icon large">
                  {getWeatherIcon(weather.condition)}
                </span>
                <div className="weather-temp">
                  <span className="temp-value">{weather.temperature.toFixed(1)}</span>
                  <span className="temp-unit">°C</span>
                </div>
                <span className="weather-desc">{weather.description}</span>
              </div>

              <div className="weather-details">
                <div className="weather-item">
                  <span className="item-icon">💧</span>
                  <span className="item-label">湿度</span>
                  <span className="item-value">{weather.humidity.toFixed(0)}%</span>
                </div>
                <div className="weather-item">
                  <span className="item-icon">🌡️</span>
                  <span className="item-label">体感</span>
                  <span className="item-value">{(weather.temperature - 2).toFixed(0)}°</span>
                </div>
                <div className="weather-item">
                  <span className="item-icon">💨</span>
                  <span className="item-label">风速</span>
                  <span className="item-value">{(Math.random() * 10).toFixed(1)} m/s</span>
                </div>
                <div className="weather-item">
                  <span className="item-icon">🌡️</span>
                  <span className="item-label">气压</span>
                  <span className="item-value">{(1013 + Math.random() * 20).toFixed(0)} hPa</span>
                </div>
              </div>

              {status.weatherStatus === 'fallback' && status.weatherMessage && (
                <div className="weather-fallback" style={{ marginTop: '0.75rem', opacity: 0.9 }}>
                  回退说明: {status.weatherMessage}
                </div>
              )}

              <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
                {loading ? '⏳ 同步中...' : '🔄 刷新'}
              </button>
            </>
          ) : (
            <div className="loading">加载中...</div>
          )}
        </div>
      )}

      {/* 位置页面 */}
      {activeTab === 'location' && (
        <div className="tab-content location-content">
          <div className="location-display">
            <div className="coord-item">
              <span className="coord-label">纬度</span>
              <span className="coord-value">
                {location?.lat.toFixed(6) ?? '--'}
              </span>
            </div>
            <div className="coord-item">
              <span className="coord-label">经度</span>
              <span className="coord-value">
                {location?.lng.toFixed(6) ?? '--'}
              </span>
            </div>
          </div>

          <div className="location-map-placeholder">
            <div className="map-grid">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="grid-cell" />
              ))}
            </div>
            <span className="map-label">
              {status.locationSource === 'browser' ? '浏览器定位已启用' : '默认坐标回退中'}
            </span>
          </div>

          <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
            {loading ? '⏳ 同步中...' : '📍 重新同步'}
          </button>
        </div>
      )}

      {/* 时间页面 */}
      {activeTab === 'time' && (
        <div className="tab-content time-content">
          <div className="time-display">
            <div className="digital-clock">
              {new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
            <div className="date-display">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </div>
          </div>

          {time && (
            <div className="time-details">
              <div className="time-item">
                <span className="item-icon">🌅</span>
                <span className="item-label">日出</span>
                <span className="item-value">{time.sunrise}</span>
              </div>
              <div className="time-item">
                <span className="item-icon">🌇</span>
                <span className="item-label">日落</span>
                <span className="item-value">{time.sunset}</span>
              </div>
              <div className="time-item">
                <span className="item-icon">{time.moonPhase}</span>
                <span className="item-label">月相</span>
                <span className="item-value">{time.moonPhase}</span>
              </div>
              <div className="time-item">
                <span className="item-icon">📅</span>
                <span className="item-label">农历</span>
                <span className="item-value">{time.lunarDate}</span>
              </div>
            </div>
          )}

          <div className="timezone-info">
            <span className="tz-label">时区</span>
            <span className="tz-value">{time?.timezone ?? '--'}</span>
          </div>
        </div>
      )}
    </div>
  );
});

GenesisTwinPanel.displayName = 'GenesisTwinPanel';

export default GenesisTwinPanel;
