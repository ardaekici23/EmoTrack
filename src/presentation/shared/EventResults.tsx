import React from 'react';
import { EventResults as EventResultsType, TimelineEntry } from '../../domain/event/types';
import { EMOTION_COLORS } from '../../shared/constants';

interface EventResultsProps {
  results: EventResultsType;
}

const LEGEND_EMOTIONS = ['Happy', 'Neutral', 'Sad', 'Angry', 'Fearful', 'Disgusted', 'Surprised'] as const;

function formatDuration(start: Date | null, end: Date | null): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function fmt(d: Date | string) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    return <div className="emotion-timeline-empty">No detection data</div>;
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
      i < timeline.length - 1
        ? new Date(timeline[i + 1].timestamp).getTime()
        : end;
    const left = Math.max(0, ((segStart - start) / totalDuration) * 100);
    const width = Math.max(0.5, ((segEnd - segStart) / totalDuration) * 100);
    const emotion = entry.emotion.charAt(0).toUpperCase() + entry.emotion.slice(1);
    return { left, width, emotion, entry };
  });

  const midTime = new Date(start + totalDuration / 2);

  return (
    <div className="emotion-timeline">
      <div className="emotion-timeline-track">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="emotion-timeline-segment"
            style={{
              left: `${seg.left}%`,
              width: `${seg.width}%`,
              backgroundColor:
                EMOTION_COLORS[seg.emotion as keyof typeof EMOTION_COLORS] || '#9e9e9e',
            }}
            title={`${seg.emotion} · ${(seg.entry.confidence * 100).toFixed(0)}% · ${new Date(
              seg.entry.timestamp
            ).toLocaleTimeString()}`}
          />
        ))}
      </div>
      <div className="emotion-timeline-labels">
        <span>{startedAt ? fmt(startedAt) : ''}</span>
        <span>{fmt(midTime)}</span>
        <span>{endedAt ? fmt(endedAt) : ''}</span>
      </div>
    </div>
  );
}

export function EventResults({ results }: EventResultsProps) {
  const emotions = ['happy', 'neutral', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'] as const;

  return (
    <div className="event-results">
      <div className="event-results-header">
        <h3>{results.title}</h3>
        <div className="event-meta">
          {results.startedAt && (
            <span>Started: {new Date(results.startedAt).toLocaleTimeString()}</span>
          )}
          {results.endedAt && (
            <span>Ended: {new Date(results.endedAt).toLocaleTimeString()}</span>
          )}
          <span>Duration: {formatDuration(results.startedAt, results.endedAt)}</span>
          <span>{results.participants.length} participants</span>
        </div>
      </div>

      <div className="event-overall">
        <h4>Overall Result</h4>
        <div className="overall-dominant">
          <span
            className="emotion-badge-sm"
            style={{
              backgroundColor:
                EMOTION_COLORS[results.overallDominantEmotion as keyof typeof EMOTION_COLORS] ||
                '#9e9e9e',
            }}
          >
            {results.overallDominantEmotion}
          </span>
        </div>
        <div className="overall-scores">
          {emotions.map(e => (
            <div key={e} className="score-bar">
              <span className="score-label">{e.charAt(0).toUpperCase() + e.slice(1)}</span>
              <div className="score-bar-container">
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${(results.overallAvgScores[e] * 100).toFixed(0)}%`,
                    backgroundColor:
                      EMOTION_COLORS[
                        (e.charAt(0).toUpperCase() + e.slice(1)) as keyof typeof EMOTION_COLORS
                      ],
                  }}
                />
              </div>
              <span className="score-value">
                {(results.overallAvgScores[e] * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="participant-results">
        <h4>Per Participant</h4>

        <div className="timeline-legend">
          {LEGEND_EMOTIONS.map(e => (
            <span key={e} className="legend-item">
              <span
                className="legend-dot"
                style={{ backgroundColor: EMOTION_COLORS[e as keyof typeof EMOTION_COLORS] }}
              />
              {e}
            </span>
          ))}
        </div>

        {results.participants.length === 0 ? (
          <p className="info-text">No participants recorded emotion data.</p>
        ) : (
          <div className="participant-table">
            {results.participants.map(p => (
              <div key={p.userId} className="participant-row">
                <div className="participant-info">
                  <span className="participant-name">{p.name}</span>
                  <span
                    className="emotion-badge-sm"
                    style={{
                      backgroundColor:
                        EMOTION_COLORS[p.dominantEmotion as keyof typeof EMOTION_COLORS] ||
                        '#9e9e9e',
                    }}
                  >
                    {p.dominantEmotion}
                  </span>
                  <span className="participant-stats">
                    {p.logCount} samples · {(p.avgConfidence * 100).toFixed(0)}% avg confidence
                  </span>
                </div>
                <EmotionTimeline
                  timeline={p.timeline}
                  startedAt={results.startedAt}
                  endedAt={results.endedAt}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
