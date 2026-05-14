import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../application/contexts/AuthContext';
import { getUserEmotionHistory } from '../../infrastructure/api/emotionLogs';
import { EmotionLog } from '../../domain/emotion/types';
import { EMOTION_COLORS } from '../../shared/constants';

interface ChartDataPoint {
  time: string;
  [key: string]: number | string;
}

function aggregateByHour(logs: EmotionLog[]): ChartDataPoint[] {
  const hourly = new Map<string, Record<string, number>>();

  logs.forEach(log => {
    const d = new Date(log.timestamp);
    const key = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
    const bucket = hourly.get(key) ?? {};
    bucket[log.dominantEmotion] = (bucket[log.dominantEmotion] || 0) + 1;
    hourly.set(key, bucket);
  });

  return Array.from(hourly.entries())
    .map(([time, emotions]) => ({ time, ...emotions }))
    .reverse()
    .slice(0, 24);
}

export function EmotionHistory() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<EmotionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    async function fetchHistory() {
      try {
        setLoading(true);
        const history = await getUserEmotionHistory(currentUser!.userId, undefined, undefined, 50);
        setLogs(history);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch emotion history');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
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

  if (error) return <div className="emotion-history error"><div className="error-message">{error}</div></div>;

  if (logs.length === 0) {
    return (
      <div className="emotion-history empty">
        <p>No emotion data yet</p>
        <p className="info-text">Start detection to begin tracking your emotions</p>
      </div>
    );
  }

  const emotionCounts: Record<string, number> = {};
  logs.forEach(log => { emotionCounts[log.dominantEmotion] = (emotionCounts[log.dominantEmotion] || 0) + 1; });
  const mostCommon = Object.entries(emotionCounts).reduce((max, e) => e[1] > max[1] ? e : max)[0];

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
          <span className="stat-value" style={{ color: EMOTION_COLORS[mostCommon as keyof typeof EMOTION_COLORS] }}>
            {mostCommon}
          </span>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={aggregateByHour(logs)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(EMOTION_COLORS).map(emotion => (
              <Line
                key={emotion} type="monotone" dataKey={emotion}
                stroke={EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS]}
                strokeWidth={2} dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="recent-logs">
        <h4>Recent Detections</h4>
        <div className="logs-list">
          {logs.slice(0, 10).map(log => (
            <div key={log.logId} className="log-item">
              <span className="log-emotion" style={{ color: EMOTION_COLORS[log.dominantEmotion] }}>
                {log.dominantEmotion}
              </span>
              <span className="log-confidence">{(log.confidenceScore * 100).toFixed(1)}%</span>
              <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
