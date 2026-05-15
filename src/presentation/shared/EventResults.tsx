import React from 'react';
import { EventResults as EventResultsType, TimelineEntry } from '../../domain/event/types';
import { EMOTION_COLORS, EMOTION_LABELS, EmotionLabel } from '../../shared/constants';
import { EmotionChip, Avatar, getInitials } from './SharedComponents';

interface EventResultsProps {
  results: EventResultsType;
}

function fmt(d: Date | string | null) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function EmotionTimeline({
  timeline,
  startedAt,
  endedAt,
}: {
  timeline: TimelineEntry[];
  startedAt: Date | null;
  endedAt: Date | null;
}) {
  if (timeline.length === 0) {
    return <div style={{ color: 'var(--text-mute)', fontSize: 12 }}>No detection data</div>;
  }

  const start = startedAt
    ? new Date(startedAt).getTime()
    : new Date(timeline[0].timestamp).getTime();
  const end = endedAt
    ? new Date(endedAt).getTime()
    : new Date(timeline[timeline.length - 1].timestamp).getTime() + 3000;
  const totalDuration = Math.max(end - start, 1);

  const segments = timeline.map((entry, i) => {
    const segStart = new Date(entry.timestamp).getTime();
    const segEnd =
      i < timeline.length - 1 ? new Date(timeline[i + 1].timestamp).getTime() : end;
    const left = Math.max(0, ((segStart - start) / totalDuration) * 100);
    const width = Math.max(0.5, ((segEnd - segStart) / totalDuration) * 100);
    const emotion = entry.emotion.charAt(0).toUpperCase() + entry.emotion.slice(1);
    return { left, width, emotion, entry };
  });

  // Time axis ticks
  const tickCount = 4;
  const ticks = [];
  for (let i = 0; i <= tickCount; i++) {
    const t = start + (totalDuration * i) / tickCount;
    ticks.push({ pct: (i / tickCount) * 100, label: fmt(new Date(t)) });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Axis */}
      <div style={{ position: 'relative', height: 14 }}>
        {ticks.map((t, i) => (
          <span
            key={i}
            className="mono"
            style={{
              position: 'absolute',
              left: `${t.pct}%`,
              transform: i === 0 ? 'none' : i === ticks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
              fontSize: 10,
              color: 'var(--text-faint)',
              whiteSpace: 'nowrap',
            }}
          >{t.label}</span>
        ))}
      </div>
      {/* Track */}
      <div className="timeline-track">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="timeline-seg"
            title={`${seg.emotion} · ${(seg.entry.confidence * 100).toFixed(0)}% · ${fmt(seg.entry.timestamp)}`}
            style={{
              left: `${seg.left}%`,
              width: `${seg.width}%`,
              background: EMOTION_COLORS[seg.emotion as EmotionLabel] || '#6B7280',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function EventResults({ results }: EventResultsProps) {
  const counts = Object.fromEntries(EMOTION_LABELS.map(e => [e, 0])) as Record<EmotionLabel, number>;
  let total = 0;
  results.participants.forEach(p => {
    const em = (p.dominantEmotion.charAt(0).toUpperCase() + p.dominantEmotion.slice(1)) as EmotionLabel;
    if (counts[em] !== undefined) { counts[em] += p.logCount; total += p.logCount; }
  });
  const dom = EMOTION_LABELS.reduce((a, b) => counts[a] > counts[b] ? a : b);

  return (
    <div className="stack stack-4">
      {/* Overall readout */}
      <div className="readout">
        <div className="readout-mark" style={{ background: `var(--e-${dom.toLowerCase()})` }}>
          {dom.charAt(0)}
        </div>
        <div className="readout-meta">
          <div className="readout-label">Overall dominant emotion</div>
          <div className="readout-value">{dom}</div>
          <div className="readout-conf">{total} detections across the session</div>
        </div>
      </div>

      {/* Timeline legend */}
      <div className="row-between">
        <div>
          <div className="section-title">Per-participant timeline</div>
          <div className="section-sub">Detected emotion for each participant over the course of the session</div>
        </div>
        <div className="row" style={{ gap: 12, fontSize: 11, color: 'var(--text-mute)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {EMOTION_LABELS.map(e => (
            <span key={e} className="row" style={{ gap: 5 }}>
              <span className={`e-dot e-${e}`} style={{ width: 8, height: 8 }} />
              {e}
            </span>
          ))}
        </div>
      </div>

      {results.participants.length === 0 ? (
        <div className="card-inset muted">No participants recorded emotion data.</div>
      ) : (
        <div className="timeline-grid">
          {results.participants.map(p => {
            const nameDisplay = p.name || 'Participant';
            return (
              <div key={p.userId} className="timeline-row">
                <div className="timeline-label">
                  <Avatar initials={getInitials(nameDisplay)} size={24} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameDisplay}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
                      <EmotionChip emotion={p.dominantEmotion} /> · {p.logCount} logs
                    </div>
                  </div>
                </div>
                <EmotionTimeline
                  timeline={p.timeline}
                  startedAt={results.startedAt}
                  endedAt={results.endedAt}
                />
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 4 }}>
        Hover any segment for the exact time range and emotion label.
      </div>
    </div>
  );
}
