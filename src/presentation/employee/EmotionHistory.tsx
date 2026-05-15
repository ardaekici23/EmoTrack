import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../application/contexts/AuthContext';
import { getUserEmotionHistory } from '../../infrastructure/api/emotionLogs';
import { EmotionLog } from '../../domain/emotion/types';
import { EMOTION_LABELS } from '../../shared/constants';
import { MoodTrendSVG, DistributionBars, EmotionChip, countEmotions } from '../shared/SharedComponents';

type Range = '24h' | '7d' | '14d' | '30d';

export function EmotionHistory() {
  const { currentUser } = useAuth();
  const [allLogs, setAllLogs] = useState<EmotionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('7d');

  useEffect(() => {
    if (!currentUser) return;
    async function fetch() {
      try {
        setLoading(true);
        const history = await getUserEmotionHistory(currentUser!.userId, undefined, undefined, 500);
        setAllLogs(history);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    }
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [currentUser]);

  const logs = useMemo(() => {
    const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 14;
    const after = new Date();
    after.setDate(after.getDate() - days);
    return allLogs.filter(l => new Date(l.timestamp) >= after);
  }, [allLogs, range]);

  const counts = useMemo(() => countEmotions(logs), [logs]);
  const dominant = useMemo(
    () => EMOTION_LABELS.reduce((a, b) => counts[a] > counts[b] ? a : b),
    [counts]
  );
  const avgConf = useMemo(
    () => logs.reduce((s, l) => s + l.confidenceScore, 0) / (logs.length || 1),
    [logs]
  );
  const pos = (counts.Happy + counts.Surprised);
  const neu = counts.Neutral;
  const wellnessScore = Math.round(((pos * 1.0 + neu * 0.5) / (logs.length || 1)) * 100);

  if (loading && allLogs.length === 0) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        Loading emotion history…
      </div>
    );
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  return (
    <div className="stack stack-4">
      {/* Range chips */}
      <div className="row-between">
        <div className="row" style={{ gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-mute)' }}>Date range</span>
          <div className="chiprow">
            {([['24h', '24 hours'], ['7d', '7 days'], ['14d', '14 days'], ['30d', '30 days']] as [Range, string][]).map(([k, l]) => (
              <button key={k} className={`chip${range === k ? ' on' : ''}`} onClick={() => setRange(k)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Wellness index</div>
          <div className="kpi-value">{wellnessScore}<span className="unit">/100</span></div>
          <div className="kpi-sub"><span className="kpi-delta up">+4.2</span> vs. previous period</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Dominant emotion</div>
          <div className="kpi-value" style={{ color: `var(--e-${dominant.toLowerCase()})` }}>{dominant}</div>
          <div className="kpi-sub">{counts[dominant]} of {logs.length} detections</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total detections</div>
          <div className="kpi-value">{logs.length}</div>
          <div className="kpi-sub">Avg. confidence {(avgConf * 100).toFixed(0)}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Positive rate</div>
          <div className="kpi-value">{logs.length ? ((pos / logs.length) * 100).toFixed(0) : 0}<span className="unit">%</span></div>
          <div className="kpi-sub">Happy + Surprised detections</div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="section-title">Mood trend</div>
            <div className="section-sub">Daily share of positive vs. negative detections</div>
          </div>
          <div className="row" style={{ gap: 14, fontSize: 12, color: 'var(--text-mute)' }}>
            <span className="row" style={{ gap: 6 }}><span className="e-dot" style={{ background: 'var(--positive)' }} />Positive</span>
            <span className="row" style={{ gap: 6 }}><span className="e-dot" style={{ background: 'var(--negative)' }} />Negative</span>
          </div>
        </div>
        <div className="card-body">
          {logs.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>
              No data for this period. Start detection to begin tracking.
            </div>
          ) : (
            <MoodTrendSVG logs={logs} width={1100} height={220} />
          )}
        </div>
      </div>

      {/* Distribution + recent */}
      <div className="twocol">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="section-title">Emotion distribution</div>
              <div className="section-sub">Share of detections across all classes</div>
            </div>
          </div>
          <div className="card-body">
            <DistributionBars counts={counts} total={logs.length} />
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div>
              <div className="section-title">Recent detections</div>
              <div className="section-sub">Latest readings</div>
            </div>
          </div>
          <div style={{ maxHeight: 360, overflow: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{ padding: '24px 20px', color: 'var(--text-mute)', fontSize: 13 }}>No detections in this period.</div>
            ) : (
              <table className="logtable">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Emotion</th>
                    <th style={{ textAlign: 'right' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 16).map(l => (
                    <tr key={l.logId}>
                      <td className="mono" style={{ color: 'var(--text-mute)', fontSize: 12 }}>
                        {new Date(l.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td><EmotionChip emotion={l.dominantEmotion} /></td>
                      <td style={{ textAlign: 'right' }} className="mono">{(l.confidenceScore * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
