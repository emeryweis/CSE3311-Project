'use client';

import { useEffect, useState } from 'react';

type WeatherDay = {
  date: string; // ISO yyyy-mm-dd
  tMax?: number;
  tMin?: number;
  precip?: number;
  windMax?: number;
  code?: number;
};

function weatherCodeLabel(code?: number): string {
  switch (code) {
    case 0: return 'Clear';
    case 1: case 2: case 3: return 'Partly cloudy';
    case 45: case 48: return 'Fog';
    case 51: case 53: case 55: return 'Drizzle';
    case 56: case 57: return 'Freezing drizzle';
    case 61: case 63: case 65: return 'Rain';
    case 66: case 67: return 'Freezing rain';
    case 71: case 73: case 75: return 'Snow';
    case 77: return 'Snow grains';
    case 80: case 81: case 82: return 'Rain showers';
    case 85: case 86: return 'Snow showers';
    case 95: return 'Thunderstorm';
    case 96: case 99: return 'Thunder w/ hail';
    default: return '—';
  }
}
function weatherCodeEmoji(code?: number): string {
  // Icons removed - return empty string
  return '';
}

// Small internal helper
async function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export default function WeatherForecast({
  lat,
  lng,
  className = '',
  sectionTitle = 'Weather',
}: {
  lat?: number | null;
  lng?: number | null;
  className?: string;
  sectionTitle?: string;
}) {
  const [weather, setWeather] = useState<WeatherDay[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const latNum = Number(lat ?? NaN);
    const lngNum = Number(lng ?? NaN);
    if (!isFinite(latNum) || !isFinite(lngNum)) {
      setWeather(null);
      setErr('No coordinates available.');
      return;
    }

    const run = async () => {
      setLoading(true);
      setErr(null);

      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', String(latNum));
      url.searchParams.set('longitude', String(lngNum));
      url.searchParams.set(
        'daily',
        [
          'weathercode',
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_sum',
          'windspeed_10m_max',
        ].join(',')
      );
      url.searchParams.set('forecast_days', '7');
      url.searchParams.set('timezone', 'auto');
      // Imperial units:
      url.searchParams.set('temperature_unit', 'fahrenheit');
      url.searchParams.set('wind_speed_unit', 'mph');
      url.searchParams.set('precipitation_unit', 'inch');

      try {
        const res = await fetchWithTimeout(url.toString(), {}, 8000);
        if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error('Weather: response is not JSON');

        const json = await res.json();
        const d = json?.daily;
        if (!d?.time) throw new Error('Weather: missing daily data');

        const out: WeatherDay[] = d.time.map((t: string, i: number) => ({
          date: t,
          tMax: d.temperature_2m_max?.[i],
          tMin: d.temperature_2m_min?.[i],
          precip: d.precipitation_sum?.[i],
          windMax: d.windspeed_10m_max?.[i],
          code: d.weathercode?.[i],
        }));

        setWeather(out);
      } catch (e: any) {
        console.error(e);
        setWeather(null);
        setErr(e?.message || 'Failed to load weather.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [lat, lng]);

  return (
    <section className={className}>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 backdrop-blur p-6">
        <h3 className="font-semibold mb-3">{sectionTitle}</h3>

        {!lat || !lng ? (
          <p className="text-neutral-500">No coordinates available.</p>
        ) : loading ? (
          <p className="text-neutral-400">Loading 7-day forecast…</p>
        ) : err ? (
          <p className="text-red-400">{err}</p>
        ) : weather && weather.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {weather.slice(0, 7).map((d) => {
              const date = new Date(d.date);
              const short = date.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              return (
                <div
                  key={d.date}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{short}</span>
                    <span className="text-xl">{weatherCodeEmoji(d.code)}</span>
                  </div>
                  <div className="mt-2 text-neutral-300">{weatherCodeLabel(d.code)}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-emerald-300 font-semibold">
                      {Number.isFinite(d.tMax ?? NaN) ? Math.round(d.tMax!) : '—'}°
                      <span className="text-xs align-top">F</span>
                    </span>
                    <span className="text-neutral-400">
                      {Number.isFinite(d.tMin ?? NaN) ? Math.round(d.tMin!) : '—'}°
                      <span className="text-xs align-top">F</span>
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">
                    Precip: {typeof d.precip === 'number' ? d.precip.toFixed(2) : '—'} in
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">
                    Wind: {Number.isFinite(d.windMax ?? NaN) ? Math.round(d.windMax!) : '—'} mph
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-neutral-500">—</p>
        )}
      </div>
    </section>
  );
}
