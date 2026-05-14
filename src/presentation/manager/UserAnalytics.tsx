import React, { useState } from 'react';
import { EmotionLog } from '../../domain/emotion/types';
import { EMOTION_LABELS, EMOTION_COLORS } from '../../shared/constants';

const POSITIVE_EMOTIONS = new Set(['Happy', 'Surprised']);
const NEGATIVE_EMOTIONS = new Set(['Angry', 'Disgusted', 'Fearful', 'Sad']);

interface UserAnalyticsProps {
  logs: EmotionLog[];
}

interface UserSummary {
  userId: string;
  name: string;
  logs: EmotionLog[];
  dominant: string;
  avgConfidence: number;
  emotionCounts: Record<string, number>;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
}

function buildUserSummaries(logs: EmotionLog[]): UserSummary[] {
  const map = new Map<string, { name: string; logs: EmotionLog[] }>();
  logs.forEach(log => {
    const existing = map.get(log.userId);
    if (existing) {
      existing.logs.push(log);
    } else {
      map.set(log.userId, { name: log.userName || 'Unknown User', logs: [log] });
    }
  });

  return Array.from(map.entries())
    .map(([userId, { name, logs: userLogs }]) => {
      const counts = EMOTION_LABELS.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e]: 0 }), {});
      userLogs.forEach(l => { counts[l.dominantEmotion]++; });
      const dominant = Object.entries(counts).reduce((max, e) => e[1] > max[1] ? e : max)[0];
      const avgConfidence = userLogs.reduce((s, l) => s + l.confidenceScore, 0) / userLogs.length;
      return {
        userId,
        name,
        logs: userLogs,
        dominant,
        avgConfidence,
        emotionCounts: counts,
        positiveCount: userLogs.filter(l => POSITIVE_EMOTIONS.has(l.dominantEmotion)).length,
        negativeCount: userLogs.filter(l => NEGATIVE_EMOTIONS.has(l.dominantEmotion)).length,
        neutralCount: userLogs.filter(l => l.dominantEmotion === 'Neutral').length,
      };
    })
    .sort((a, b) => b.logs.length - a.logs.length);
}

export function UserAnalytics({ logs }: UserAnalyticsProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  if (logs.length === 0) {
    return (
      <div className="team-analytics empty">
        <p>No emotion data available</p>
        <p className="info-text">Data will appear here once team members start tracking</p>
      </div>
    );
  }

  const users = buildUserSummaries(logs);

  return (
    <div className="user-analytics">
      {users.map(user => {
        const total = user.logs.length;
        const pct = (n: number) => ((n / total) * 100).toFixed(0);
        const isExpanded = expandedUserId === user.userId;

        return (
          <div
            key={user.userId}
            className={`user-analytics-card ${isExpanded ? 'expanded' : ''}`}
            onClick={() => setExpandedUserId(isExpanded ? null : user.userId)}
          >
            <div className="user-card-header">
              <div className="user-card-identity">
                <span className="user-card-name">{user.name}</span>
                <span className="user-card-count">{total} detections</span>
              </div>
              <div className="user-card-summary">
                <span
                  className="emotion-badge-sm"
                  style={{ backgroundColor: EMOTION_COLORS[user.dominant as keyof typeof EMOTION_COLORS] || '#9e9e9e' }}
                >
                  {user.dominant}
                </span>
                <span className="user-card-confidence">{(user.avgConfidence * 100).toFixed(0)}% avg</span>
                <span className="user-card-expand">{isExpanded ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Mini sentiment bar always visible */}
            <div className="user-sentiment-bar">
              <div
                className="user-sentiment-positive"
                style={{ width: `${pct(user.positiveCount)}%` }}
                title={`Positive: ${pct(user.positiveCount)}%`}
              />
              <div
                className="user-sentiment-neutral"
                style={{ width: `${pct(user.neutralCount)}%` }}
                title={`Neutral: ${pct(user.neutralCount)}%`}
              />
              <div
                className="user-sentiment-negative"
                style={{ width: `${pct(user.negativeCount)}%` }}
                title={`Negative: ${pct(user.negativeCount)}%`}
              />
            </div>

            {/* Expanded: full emotion breakdown */}
            {isExpanded && (
              <div className="user-card-detail" onClick={e => e.stopPropagation()}>
                <div className="user-stats-row">
                  <div className="stat-card">
                    <span className="stat-label">Positive</span>
                    <span className="stat-value" style={{ color: '#4caf50' }}>{pct(user.positiveCount)}%</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Neutral</span>
                    <span className="stat-value" style={{ color: '#2196f3' }}>{pct(user.neutralCount)}%</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Negative</span>
                    <span className="stat-value" style={{ color: '#f44336' }}>{pct(user.negativeCount)}%</span>
                  </div>
                </div>

                <div className="user-emotion-breakdown">
                  {EMOTION_LABELS.map(emotion => (
                    <div key={emotion} className="score-bar">
                      <span className="score-label">{emotion}</span>
                      <div className="score-bar-container">
                        <div
                          className="score-bar-fill"
                          style={{
                            width: `${((user.emotionCounts[emotion] / total) * 100).toFixed(0)}%`,
                            backgroundColor: EMOTION_COLORS[emotion],
                          }}
                        />
                      </div>
                      <span className="score-value">
                        {user.emotionCounts[emotion]} ({((user.emotionCounts[emotion] / total) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>

                <div className="user-recent-logs">
                  <h4>Recent Detections</h4>
                  <div className="logs-list">
                    {user.logs.slice(0, 8).map(log => (
                      <div key={log.logId} className="log-item">
                        <span className="log-emotion" style={{ color: EMOTION_COLORS[log.dominantEmotion] }}>
                          {log.dominantEmotion}
                        </span>
                        <span className="log-confidence">{(log.confidenceScore * 100).toFixed(0)}%</span>
                        <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
