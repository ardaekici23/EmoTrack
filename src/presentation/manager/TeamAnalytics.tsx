import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { EmotionLog } from '../../domain/emotion/types';
import { EMOTION_LABELS, EMOTION_COLORS } from '../../shared/constants';
import { MoodTrendChart } from './MoodTrendChart';

const POSITIVE_EMOTIONS = new Set(['Happy', 'Surprised']);
const NEGATIVE_EMOTIONS = new Set(['Angry', 'Disgusted', 'Fearful', 'Sad']);

interface TeamAnalyticsProps {
  logs: EmotionLog[];
}

export function TeamAnalytics({ logs }: TeamAnalyticsProps) {
  if (logs.length === 0) {
    return (
      <div className="team-analytics empty">
        <p>No team emotion data available</p>
        <p className="info-text">Emotion data will appear here once team members start tracking</p>
      </div>
    );
  }

  const emotionCounts = EMOTION_LABELS.reduce<Record<string, number>>(
    (acc, e) => ({ ...acc, [e]: 0 }), {}
  );
  logs.forEach(log => { emotionCounts[log.dominantEmotion]++; });

  const chartData = Object.entries(emotionCounts).map(([emotion, count]) => ({
    emotion,
    count,
    percentage: ((count / logs.length) * 100).toFixed(1),
  }));

  const mostCommon = chartData.reduce((max, item) => item.count > max.count ? item : max).emotion;
  const avgConfidence = logs.reduce((sum, log) => sum + log.confidenceScore, 0) / logs.length;
  const positiveCount = logs.filter(log => POSITIVE_EMOTIONS.has(log.dominantEmotion)).length;
  const negativeCount = logs.filter(log => NEGATIVE_EMOTIONS.has(log.dominantEmotion)).length;
  const neutralCount = logs.filter(log => log.dominantEmotion === 'Neutral').length;

  const pct = (n: number) => ((n / logs.length) * 100).toFixed(1);

  return (
    <div className="team-analytics">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Detections</span>
          <span className="stat-value">{logs.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Most Common</span>
          <span className="stat-value" style={{ color: EMOTION_COLORS[mostCommon as keyof typeof EMOTION_COLORS] }}>
            {mostCommon}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg. Confidence</span>
          <span className="stat-value">{(avgConfidence * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="emotion-distribution">
        <h3>Emotion Distribution</h3>
        <div className="distribution-bars">
          {[
            { label: 'Positive', count: positiveCount, className: 'positive' },
            { label: 'Neutral', count: neutralCount, className: 'neutral' },
            { label: 'Negative', count: negativeCount, className: 'negative' },
          ].map(({ label, count, className }) => (
            <div key={label} className={`distribution-item ${className}`}>
              <span className="distribution-label">{label}</span>
              <div className="distribution-bar">
                <div className="distribution-fill" style={{ width: `${pct(count)}%` }} />
              </div>
              <span className="distribution-value">{pct(count)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <h3>Detailed Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="emotion" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" label={{ position: 'top' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {negativeCount / logs.length > 0.4 && (
        <div className="alert alert-warning">
          <strong>Attention:</strong> Your team is showing elevated levels of negative emotions
          ({pct(negativeCount)}%). Consider checking in with team members or scheduling team-building activities.
        </div>
      )}

      <MoodTrendChart logs={logs} />
    </div>
  );
}
