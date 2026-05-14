import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { EmotionLog } from '../../domain/emotion/types';

const POSITIVE = new Set(['Happy', 'Surprised']);
const NEGATIVE = new Set(['Angry', 'Disgusted', 'Fearful', 'Sad']);

interface MoodTrendChartProps {
  logs: EmotionLog[];
}

function buildTrend(logs: EmotionLog[], granularity: 'day' | 'week') {
  const buckets = new Map<string, { pos: number; neu: number; neg: number; total: number }>();

  logs.forEach(log => {
    const d = new Date(log.timestamp);
    let key: string;
    if (granularity === 'day') {
      key = d.toLocaleDateString('en-CA');
    } else {
      const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
      const mon = new Date(d);
      mon.setDate(d.getDate() - dow);
      key = `Wk ${mon.toLocaleDateString('en-CA')}`;
    }
    const b = buckets.get(key) ?? { pos: 0, neu: 0, neg: 0, total: 0 };
    if (POSITIVE.has(log.dominantEmotion)) b.pos++;
    else if (NEGATIVE.has(log.dominantEmotion)) b.neg++;
    else b.neu++;
    b.total++;
    buckets.set(key, b);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, b]) => ({
      label,
      Positive: +((b.pos / b.total) * 100).toFixed(1),
      Neutral: +((b.neu / b.total) * 100).toFixed(1),
      Negative: +((b.neg / b.total) * 100).toFixed(1),
    }));
}

export function MoodTrendChart({ logs }: MoodTrendChartProps) {
  const [granularity, setGranularity] = useState<'day' | 'week'>('day');

  if (logs.length === 0) return null;

  const data = buildTrend(logs, granularity);

  return (
    <div className="trend-chart-section">
      <h3>Mood Over Time</h3>
      <div className="trend-granularity">
        <button
          className={`trend-btn ${granularity === 'day' ? 'active' : ''}`}
          onClick={() => setGranularity('day')}
        >
          Day
        </button>
        <button
          className={`trend-btn ${granularity === 'week' ? 'active' : ''}`}
          onClick={() => setGranularity('week')}
        >
          Week
        </button>
      </div>

      {data.length < 2 ? (
        <p className="trend-empty">
          Not enough data for a trend — need emotion data spread across at least 2{' '}
          {granularity === 'day' ? 'days' : 'weeks'}.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Legend />
            <Line type="monotone" dataKey="Positive" stroke="#4caf50" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Neutral"  stroke="#2196f3" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Negative" stroke="#f44336" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
