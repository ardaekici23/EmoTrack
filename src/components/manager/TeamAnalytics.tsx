/**
 * TeamAnalytics Component
 * Displays aggregated team emotion data
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EmotionLog } from '../../types/EmotionLog';
import { EMOTION_LABELS, EMOTION_COLORS } from '../../utils/constants';

interface TeamAnalyticsProps {
  logs: EmotionLog[];
}

export function TeamAnalytics({ logs }: TeamAnalyticsProps): JSX.Element {
  if (logs.length === 0) {
    return (
      <div className="team-analytics empty">
        <p>No team emotion data available</p>
        <p className="info-text">Emotion data will appear here once team members start tracking</p>
      </div>
    );
  }

  // Aggregate emotion counts
  const emotionCounts: Record<string, number> = {};
  EMOTION_LABELS.forEach((emotion) => {
    emotionCounts[emotion] = 0;
  });

  logs.forEach((log) => {
    emotionCounts[log.dominantEmotion]++;
  });

  // Prepare chart data
  const chartData = Object.entries(emotionCounts).map(([emotion, count]) => ({
    emotion,
    count,
    percentage: ((count / logs.length) * 100).toFixed(1),
  }));

  // Calculate statistics
  const mostCommonEmotion = chartData.reduce((max, item) =>
    item.count > max.count ? item : max
  ).emotion;

  const averageConfidence =
    logs.reduce((sum, log) => sum + log.confidenceScore, 0) / logs.length;

  // Categorize emotions
  const positiveEmotions = ['Happy', 'Surprised'];
  const negativeEmotions = ['Angry', 'Disgusted', 'Fearful', 'Sad'];

  const positiveCount = logs.filter((log) =>
    positiveEmotions.includes(log.dominantEmotion)
  ).length;

  const negativeCount = logs.filter((log) =>
    negativeEmotions.includes(log.dominantEmotion)
  ).length;

  const neutralCount = logs.filter((log) => log.dominantEmotion === 'Neutral').length;

  return (
    <div className="team-analytics">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Detections</span>
          <span className="stat-value">{logs.length}</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Most Common</span>
          <span
            className="stat-value"
            style={{ color: EMOTION_COLORS[mostCommonEmotion as keyof typeof EMOTION_COLORS] }}
          >
            {mostCommonEmotion}
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Avg. Confidence</span>
          <span className="stat-value">{(averageConfidence * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="emotion-distribution">
        <h3>Emotion Distribution</h3>
        <div className="distribution-bars">
          <div className="distribution-item positive">
            <span className="distribution-label">Positive</span>
            <div className="distribution-bar">
              <div
                className="distribution-fill"
                style={{ width: `${(positiveCount / logs.length) * 100}%` }}
              ></div>
            </div>
            <span className="distribution-value">
              {((positiveCount / logs.length) * 100).toFixed(1)}%
            </span>
          </div>

          <div className="distribution-item neutral">
            <span className="distribution-label">Neutral</span>
            <div className="distribution-bar">
              <div
                className="distribution-fill"
                style={{ width: `${(neutralCount / logs.length) * 100}%` }}
              ></div>
            </div>
            <span className="distribution-value">
              {((neutralCount / logs.length) * 100).toFixed(1)}%
            </span>
          </div>

          <div className="distribution-item negative">
            <span className="distribution-label">Negative</span>
            <div className="distribution-bar">
              <div
                className="distribution-fill"
                style={{ width: `${(negativeCount / logs.length) * 100}%` }}
              ></div>
            </div>
            <span className="distribution-value">
              {((negativeCount / logs.length) * 100).toFixed(1)}%
            </span>
          </div>
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
            <Bar
              dataKey="count"
              fill="#8884d8"
              label={{ position: 'top' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {negativeCount / logs.length > 0.4 && (
        <div className="alert alert-warning">
          <strong>⚠️ Attention:</strong> Your team is showing elevated levels of negative emotions
          ({((negativeCount / logs.length) * 100).toFixed(1)}%). Consider checking in with team
          members or scheduling team-building activities.
        </div>
      )}
    </div>
  );
}
