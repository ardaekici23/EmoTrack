import React, { useState, useMemo } from 'react';
import { EmotionLog } from '../../domain/emotion/types';
import { Team } from '../../domain/team/types';
import { EMOTION_LABELS, EmotionLabel } from '../../shared/constants';
import { MoodTrendSVG, DistributionBars, StackBar, EmotionChip, Avatar, countEmotions } from '../shared/SharedComponents';

interface TeamAnalyticsProps {
  logs: EmotionLog[];
  teams: Team[];
  alertData: { anyAlerting: boolean; teamName?: string; negativePct?: number; hours?: number; sampleCount?: number } | null;
  teamFilter: string | null;
  setTeamFilter: (id: string | null) => void;
}

type Range = '24h' | '7d' | '14d' | '30d';
type View = 'team' | 'users';

export function TeamAnalytics({ logs, teams, alertData, teamFilter, setTeamFilter }: TeamAnalyticsProps) {
  const [range, setRange] = useState<Range>('7d');
  const [view, setView] = useState<View>('team');

  const filtered = useMemo(() => {
    const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 14;
    const after = new Date();
    after.setDate(after.getDate() - days);
    return logs.filter(l => new Date(l.timestamp) >= after);
  }, [logs, range]);

  const counts = useMemo(() => countEmotions(filtered), [filtered]);
  const dominant = EMOTION_LABELS.reduce((a, b) => counts[a] > counts[b] ? a : b);
  const pos = counts.Happy + counts.Surprised;
  const neu = counts.Neutral;
  const neg = counts.Sad + counts.Angry + counts.Disgusted + counts.Fearful;
  const avgConf = filtered.reduce((s, l) => s + l.confidenceScore, 0) / (filtered.length || 1);
  const negPct = (neg / (filtered.length || 1)) * 100;
  const wellness = Math.round(((pos * 1.0 + neu * 0.5) / (filtered.length || 1)) * 100);

  return (
    <div className="stack stack-6">
      {alertData?.anyAlerting && (
        <div className="banner">
          <div className="banner-icon">!</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Burnout signal detected</div>
            <div style={{ color: 'var(--text-mute)' }}>
              <strong>{alertData.teamName}</strong> shows{' '}
              <strong>{alertData.negativePct}% negative</strong> emotions in the last {alertData.hours}h
              <span className="muted"> · {alertData.sampleCount} samples</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm">Investigate</button>
        </div>
      )}

      {/* Filters */}
      <div className="row-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div className="row" style={{ gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-mute)' }}>Team</span>
          <button className={`chip${teamFilter === null ? ' on' : ''}`} onClick={() => setTeamFilter(null)}>All teams</button>
          {teams.map(t => (
            <button key={t.teamId} className={`chip${teamFilter === t.teamId ? ' on' : ''}`} onClick={() => setTeamFilter(t.teamId)}>{t.name}</button>
          ))}
        </div>
        <div className="row" style={{ gap: 16 }}>
          <div className="row" style={{ gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-mute)' }}>Range</span>
            <div className="segmented">
              {(['24h', '7d', '14d', '30d'] as Range[]).map(k => (
                <button key={k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{k}</button>
              ))}
            </div>
          </div>
          <div className="segmented">
            <button className={view === 'team' ? 'on' : ''} onClick={() => setView('team')}>Overview</button>
            <button className={view === 'users' ? 'on' : ''} onClick={() => setView('users')}>Per person</button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Team wellness index</div>
          <div className="kpi-value">{wellness}<span className="unit">/100</span></div>
          <div className="kpi-sub"><span className="kpi-delta down">−2.1</span> vs. previous period</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Dominant emotion</div>
          <div className="kpi-value" style={{ color: `var(--e-${dominant.toLowerCase()})` }}>{dominant}</div>
          <div className="kpi-sub">{((counts[dominant] / (filtered.length || 1)) * 100).toFixed(0)}% of samples</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Negative emotion share</div>
          <div className="kpi-value">{negPct.toFixed(1)}<span className="unit">%</span></div>
          <div className="kpi-sub">{negPct > 35 ? 'Above healthy threshold (35%)' : 'Within healthy range'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total detections</div>
          <div className="kpi-value">{filtered.length.toLocaleString()}</div>
          <div className="kpi-sub">Avg. confidence {(avgConf * 100).toFixed(0)}%</div>
        </div>
      </div>

      {view === 'team' && (
        <>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="section-title">Sentiment mix</div>
                <div className="section-sub">Positive, neutral and negative shares</div>
              </div>
              <div className="row" style={{ gap: 14, fontSize: 12, color: 'var(--text-mute)' }}>
                <span className="row" style={{ gap: 6 }}><span className="e-dot" style={{ background: 'var(--positive)' }} />Positive {((pos / (filtered.length || 1)) * 100).toFixed(0)}%</span>
                <span className="row" style={{ gap: 6 }}><span className="e-dot" style={{ background: 'var(--text-mute)' }} />Neutral {((neu / (filtered.length || 1)) * 100).toFixed(0)}%</span>
                <span className="row" style={{ gap: 6 }}><span className="e-dot" style={{ background: 'var(--negative)' }} />Negative {((neg / (filtered.length || 1)) * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="card-body">
              <StackBar pos={pos} neu={neu} neg={neg} />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="section-title">Daily trend</div>
                <div className="section-sub">Share of positive vs. negative detections per day</div>
              </div>
              <div className="row" style={{ gap: 14, fontSize: 12, color: 'var(--text-mute)' }}>
                <span className="row" style={{ gap: 6 }}><span className="e-dot" style={{ background: 'var(--positive)' }} />Positive</span>
                <span className="row" style={{ gap: 6 }}><span className="e-dot" style={{ background: 'var(--negative)' }} />Negative</span>
              </div>
            </div>
            <div className="card-body">
              {filtered.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>No data for this period.</div>
              ) : (
                <MoodTrendSVG logs={filtered} width={1100} height={220} />
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="section-title">Distribution by emotion</div>
                <div className="section-sub">All seven detection classes</div>
              </div>
            </div>
            <div className="card-body">
              <DistributionBars counts={counts} total={filtered.length} />
            </div>
          </div>
        </>
      )}

      {view === 'users' && <UserBreakdown logs={filtered} />}
    </div>
  );
}

function UserBreakdown({ logs }: { logs: EmotionLog[] }) {
  const byUser = useMemo(() => {
    const map: Record<string, { userId: string; name: string; total: number; counts: Record<EmotionLabel, number>; conf: number }> = {};
    logs.forEach(l => {
      if (!map[l.userId]) {
        map[l.userId] = {
          userId: l.userId,
          name: l.userName || `User ${l.userId.slice(0, 4)}`,
          total: 0,
          counts: Object.fromEntries(EMOTION_LABELS.map(e => [e, 0])) as Record<EmotionLabel, number>,
          conf: 0,
        };
      }
      const m = map[l.userId];
      m.total++;
      m.counts[l.dominantEmotion]++;
      m.conf += l.confidenceScore;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [logs]);

  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="section-title">Per-person breakdown</div>
          <div className="section-sub">Anonymised individual readings — identifiers hidden by default</div>
        </div>
        <button className="btn btn-link btn-sm">Reveal names</button>
      </div>
      <div className="card-body">
        <div className="stack stack-3">
          {byUser.length === 0 && (
            <div style={{ color: 'var(--text-mute)', fontSize: 13 }}>No individual data for this period.</div>
          )}
          {byUser.map((u, i) => {
            const pos = u.counts.Happy + u.counts.Surprised;
            const neu = u.counts.Neutral;
            const neg = u.counts.Sad + u.counts.Angry + u.counts.Disgusted + u.counts.Fearful;
            const dom = EMOTION_LABELS.reduce((a, b) => u.counts[a] > u.counts[b] ? a : b);
            const isOpen = expanded === u.userId;
            return (
              <div key={u.userId} className="card-inset" style={{ padding: '14px 18px' }}>
                <div className="row-between" style={{ cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : u.userId)}>
                  <div className="row" style={{ gap: 14 }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', width: 24 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Avatar initials={`P${i + 1}`} size={30} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>Anonymous {String.fromCharCode(65 + i)}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
                        {u.total} detections · avg conf {((u.conf / u.total) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 16 }}>
                    <EmotionChip emotion={dom} confidence={u.counts[dom] / u.total} />
                    <span style={{ width: 180 }}><StackBar pos={pos} neu={neu} neg={neg} /></span>
                    <button className="btn btn-ghost btn-sm" style={{ minWidth: 32 }}>{isOpen ? '−' : '+'}</button>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <DistributionBars counts={u.counts} total={u.total} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
