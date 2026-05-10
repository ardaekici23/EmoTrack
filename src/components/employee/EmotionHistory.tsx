/**
 * EmotionHistory Component
 * Displays historical emotion data with charts
 */

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { getUserEmotionHistory } from '../../services/firestore.service';
import { EmotionLog } from '../../types/EmotionLog';
import { EMOTION_COLORS } from '../../utils/constants';

interface ChartData {
  time: string;
  [key: string]: number | string;
}

export function EmotionHistory(): JSX.Element {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<EmotionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!currentUser) return;

      try {
        setLoading(true);
        const history = await getUserEmotionHistory(currentUser.userId, undefined, undefined, 50);
        setLogs(history);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch emotion history');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();

    // Refresh every 30 seconds
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (loading) {
    return (
      <div className="emotion-history loading">
        <div className="loading-spinner"></div>
        <p>Loading emotion history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="emotion-history error">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="emotion-history empty">
        <p>No emotion data yet</p>
        <p className="info-text">Start detection to begin tracking your emotions</p>
      </div>
    );
  }

  // Aggregate data for chart
  const chartData = aggregateByHour(logs);

  // Calculate statistics
  const emotionCounts: Record<string, number> = {};
  logs.forEach((log) => {
    emotionCounts[log.dominantEmotion] = (emotionCounts[log.dominantEmotion] || 0) + 1;
  });

  const mostCommonEmotion = Object.entries(emotionCounts).reduce((max, entry) =>
    entry[1] > max[1] ? entry : max
  )[0];

  return (
    <div className="emotion-history">
      <h3>Your Emotion History</h3>

      <div className="stats-summary">
        <div className="stat-card">
          <span className="stat-label">Total Logs</span>
          <span className="stat-value">{logs.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Most Common</span>
          <span className="stat-value" style={{ color: EMOTION_COLORS[mostCommonEmotion as keyof typeof EMOTION_COLORS] }}>
            {mostCommonEmotion}
          </span>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(EMOTION_COLORS).map((emotion) => (
              <Line
                key={emotion}
                type="monotone"
                dataKey={emotion}
                stroke={EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="recent-logs">
        <h4>Recent Detections</h4>
        <div className="logs-list">
          {logs.slice(0, 10).map((log) => (
            <div key={log.logId} className="log-item">
              <span
                className="log-emotion"
                style={{ color: EMOTION_COLORS[log.dominantEmotion] }}
              >
                {log.dominantEmotion}
              </span>
              <span className="log-confidence">
                {(log.confidenceScore * 100).toFixed(1)}%
              </span>
              <span className="log-time">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Aggregate logs by hour for chart visualization
 */
function aggregateByHour(logs: EmotionLog[]): ChartData[] {
  // Group logs by hour
  const hourlyData: Map<string, Record<string, number>> = new Map();

  logs.forEach((log) => {
    const date = new Date(log.timestamp);
    const hourKey = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;

    if (!hourlyData.has(hourKey)) {
      hourlyData.set(hourKey, {});
    }

    const hourData = hourlyData.get(hourKey)!;
    hourData[log.dominantEmotion] = (hourData[log.dominantEmotion] || 0) + 1;
  });

  // Convert to chart format
  return Array.from(hourlyData.entries())
    .map(([time, emotions]) => ({
      time,
      ...emotions,
    }))
    .reverse()
    .slice(0, 24); // Last 24 hours
}
