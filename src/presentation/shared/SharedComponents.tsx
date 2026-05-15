import React from 'react';
import { EmotionLog } from '../../domain/emotion/types';
import { EMOTION_LABELS, EmotionLabel } from '../../shared/constants';

// ── Mood trend SVG chart ──────────────────────────────────────────
interface MoodTrendSVGProps {
  logs: EmotionLog[];
  width?: number;
  height?: number;
}

export function MoodTrendSVG({ logs, width = 1080, height = 220 }: MoodTrendSVGProps) {
  const days: { date: Date; key: string; pos: number; neu: number; neg: number; total: number }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({ date: d, key: d.toISOString().slice(0, 10), pos: 0, neu: 0, neg: 0, total: 0 });
  }
  const idx = Object.fromEntries(days.map(d => [d.key, d]));
  logs.forEach(l => {
    const k = new Date(l.timestamp).toISOString().slice(0, 10);
    if (!idx[k]) return;
    idx[k].total++;
    if (l.dominantEmotion === 'Happy' || l.dominantEmotion === 'Surprised') idx[k].pos++;
    else if (l.dominantEmotion === 'Neutral') idx[k].neu++;
    else idx[k].neg++;
  });

  const padL = 40, padR = 16, padT = 16, padB = 32;
  const W = width - padL - padR;
  const H = height - padT - padB;
  const step = W / Math.max(days.length - 1, 1);
  const yFor = (v: number) => padT + H - (v / 100) * H;

  const posPoints = days.map((d, i): [number, number] => [
    padL + i * step,
    yFor(d.total ? (d.pos / d.total) * 100 : 0),
  ]);
  const negPoints = days.map((d, i): [number, number] => [
    padL + i * step,
    yFor(d.total ? (d.neg / d.total) * 100 : 0),
  ]);
  const toPath = (pts: [number, number][]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const posArea = `${toPath(posPoints)} L ${padL + W} ${padT + H} L ${padL} ${padT + H} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', maxWidth: '100%' }}>
      <defs>
        <linearGradient id="posArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#15803D" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#15803D" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(g => (
        <g key={g}>
          <line x1={padL} x2={width - padR} y1={yFor(g)} y2={yFor(g)} stroke="#E4E7EC" strokeWidth="1" strokeDasharray={g === 0 || g === 100 ? '' : '2 4'} />
          <text x={padL - 8} y={yFor(g) + 3} fontSize="10" fill="#6B7280" textAnchor="end" fontFamily="var(--mono)">{g}%</text>
        </g>
      ))}
      {days.map((d, i) => i % 2 === 0 && (
        <text key={d.key} x={padL + i * step} y={height - 10} fontSize="10" fill="#6B7280" textAnchor="middle" fontFamily="var(--mono)">
          {`${String(d.date.getDate()).padStart(2, '0')}/${String(d.date.getMonth() + 1).padStart(2, '0')}`}
        </text>
      ))}
      <path d={posArea} fill="url(#posArea)" />
      <path d={toPath(negPoints)} fill="none" stroke="#B42318" strokeWidth="1.75" strokeDasharray="4 3" />
      <path d={toPath(posPoints)} fill="none" stroke="#15803D" strokeWidth="2" />
      {posPoints.map((p, i) => (
        <circle key={'p' + i} cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke="#15803D" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

// ── Distribution bars ─────────────────────────────────────────────
interface DistributionBarsProps {
  counts: Record<string, number>;
  total: number;
}

export function DistributionBars({ counts, total }: DistributionBarsProps) {
  return (
    <div className="stack stack-3">
      {EMOTION_LABELS.map(e => {
        const c = counts[e] || 0;
        const pct = total ? (c / total) * 100 : 0;
        return (
          <div key={e} className="dist-row">
            <span className="dist-label">
              <span className={`e-dot e-${e}`} />
              {e}
            </span>
            <div className="bar-track">
              <div style={{ width: `${pct}%`, height: '100%', background: `var(--e-${e.toLowerCase()})`, borderRadius: 999, transition: 'width 240ms ease' }} />
            </div>
            <span className="mono" style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-mute)' }}>
              {pct.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Stacked sentiment bar ─────────────────────────────────────────
interface StackBarProps { pos: number; neu: number; neg: number; }

export function StackBar({ pos, neu, neg }: StackBarProps) {
  const total = pos + neu + neg || 1;
  return (
    <div className="stackbar">
      <div style={{ width: `${(pos / total) * 100}%`, background: 'var(--positive)' }} />
      <div style={{ width: `${(neu / total) * 100}%`, background: 'var(--text-mute)' }} />
      <div style={{ width: `${(neg / total) * 100}%`, background: 'var(--negative)' }} />
    </div>
  );
}

// ── Emotion chip ──────────────────────────────────────────────────
interface EmotionChipProps {
  emotion: string;
  confidence?: number;
}

export function EmotionChip({ emotion, confidence }: EmotionChipProps) {
  return (
    <span className="emotion-chip">
      <span className={`e-dot e-${emotion}`} />
      <span>{emotion}</span>
      {confidence != null && (
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          {(confidence * 100).toFixed(0)}%
        </span>
      )}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────
interface AvatarProps {
  initials: string;
  size?: number;
  accent?: boolean;
}

export function Avatar({ initials, size = 32, accent = false }: AvatarProps) {
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: accent ? 'var(--accent)' : 'var(--surface-3)',
        color: accent ? '#fff' : 'var(--text-2)',
      }}
    >
      {initials}
    </div>
  );
}

// ── Initials helper ───────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── Compute counts from logs ──────────────────────────────────────
export function countEmotions(logs: EmotionLog[]): Record<EmotionLabel, number> {
  const c = Object.fromEntries(EMOTION_LABELS.map(e => [e, 0])) as Record<EmotionLabel, number>;
  logs.forEach(l => { c[l.dominantEmotion]++; });
  return c;
}
