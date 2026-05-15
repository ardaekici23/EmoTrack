import React, { useEffect, useState } from 'react';
import { useEmotionDetection } from '../../application/hooks/useEmotionDetection';
import { useAuth } from '../../application/contexts/AuthContext';
import { saveEmotionLog } from '../../domain/emotion/service';
import { EMOTION_LABELS } from '../../shared/constants';
import { Icon } from '../shared/Icons';

export function EmotionDetector() {
  const { prediction, isLoading, error, videoRef, startDetection, stopDetection, isActive } =
    useEmotionDetection();
  const { currentUser } = useAuth();
  const [tick, setTick] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (prediction && currentUser && prediction.faceDetected) {
      saveEmotionLog(currentUser.userId, prediction);
      setTick(t => t + 1);
    }
  }, [prediction, currentUser]);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const sample = prediction && prediction.faceDetected ? prediction : null;
  const dominant = sample?.dominantEmotion ?? 'Neutral';
  const confidence = sample?.confidence ?? 0;

  return (
    <div className="stack stack-4">
      <div className="twocol">
        {/* Webcam card */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="section-title">Live detection</div>
              <div className="section-sub">In-browser facial emotion recognition · samples every 3 seconds</div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              {isActive ? (
                <button className="btn btn-ghost btn-sm" onClick={stopDetection}>Pause</button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={startDetection} disabled={isLoading}>
                  {isLoading ? 'Loading…' : 'Start'}
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}
            <div className="webcam">
              <div className="webcam-grid" />
              {isActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="webcam-live-video"
                />
              ) : (
                <div className="webcam-face">
                  <div className="webcam-mouth" />
                </div>
              )}
              {!isActive && <div className="webcam-bbox" />}
              <div className="webcam-stamp">
                {isActive && <span className="live-dot" />}
                <span>{isActive ? 'live · 224 × 224' : 'paused'}</span>
              </div>
              <div className="webcam-foot">face-api.js · cpu · v0.22</div>
              <div className="webcam-meta">
                interval 3.0s<br />device only
              </div>
            </div>
          </div>
          <div className="card-foot">
            <span>Samples this session: <strong style={{ color: 'var(--text)' }}>{tick}</strong></span>
            <span className="mono">{time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>

        {/* Readout + scores */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="section-title">Current reading</div>
              <div className="section-sub">Dominant emotion and class probabilities</div>
            </div>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner" />
                Loading detection models…
              </div>
            ) : (
              <>
                <div className="readout">
                  <div className="readout-mark" style={{ background: `var(--e-${dominant.toLowerCase()})` }}>
                    {dominant.charAt(0)}
                  </div>
                  <div className="readout-meta">
                    <div className="readout-label">Dominant emotion</div>
                    <div className="readout-value">{sample ? dominant : '—'}</div>
                    <div className="readout-conf">
                      {sample ? `Confidence · ${(confidence * 100).toFixed(1)}%` : isActive ? 'No face detected' : 'Detection paused'}
                    </div>
                  </div>
                </div>

                <div className="kicker" style={{ marginBottom: 12 }}>All class probabilities</div>
                <div className="scorelist">
                  {EMOTION_LABELS.map(e => {
                    const v = sample?.allScores?.[e.toLowerCase() as keyof typeof sample.allScores] ?? 0;
                    const isDom = e === dominant && !!sample;
                    return (
                      <div key={e} className={`scorerow${isDom ? ' dominant' : ''}`}>
                        <div className="scorelabel">
                          <span className={`e-dot e-${e}`} />
                          <span style={{ fontWeight: isDom ? 600 : 400, color: isDom ? 'var(--text)' : 'var(--text-2)' }}>{e}</span>
                        </div>
                        <div className="score-track">
                          <div className="score-fill" style={{ width: `${v * 100}%`, background: `var(--e-${e.toLowerCase()})` }} />
                        </div>
                        <div className="scorenum">{(v * 100).toFixed(1)}%</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Privacy block */}
      <div className="privacy">
        <div>
          <div className="privacy-head">
            <div className="privacy-icon"><Icon.Camera /></div>
            <h4>How detection works</h4>
          </div>
          <ul>
            <li>The browser captures a single frame from your webcam every 3 seconds.</li>
            <li>face-api.js runs locally on your CPU to classify the dominant emotion.</li>
            <li>The frame is discarded immediately after classification.</li>
            <li>Only the emotion label and timestamp are sent to the server.</li>
          </ul>
        </div>
        <div>
          <div className="privacy-head">
            <div className="privacy-icon"><Icon.Shield /></div>
            <h4>Privacy &amp; security</h4>
          </div>
          <ul>
            <li>Your video never leaves your device — no frames or audio are transmitted.</li>
            <li>Managers see aggregate team data only, never your individual readings.</li>
            <li>Encryption in transit (TLS 1.3) and at rest (AES-256).</li>
            <li>Delete your full history at any time from account settings.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
