import React, { useEffect } from 'react';
import { useEmotionDetection } from '../../application/hooks/useEmotionDetection';
import { useAuth } from '../../application/contexts/AuthContext';
import { saveEmotionLog } from '../../domain/emotion/service';
import { EMOTION_COLORS } from '../../shared/constants';

export function EmotionDetector() {
  const { prediction, isLoading, error, videoRef, startDetection, stopDetection, isActive } =
    useEmotionDetection();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (prediction && currentUser && prediction.faceDetected) {
      saveEmotionLog(currentUser.userId, prediction);
    }
  }, [prediction, currentUser]);

  if (isLoading) {
    return (
      <div className="emotion-detector loading">
        <div className="loading-spinner"></div>
        <p>Loading emotion detection models...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="emotion-detector error">
        <div className="error-message">{error}</div>
        <p>Please check your camera permissions and try again.</p>
      </div>
    );
  }

  return (
    <div className="emotion-detector">
      <div className="detector-controls">
        {!isActive ? (
          <button onClick={startDetection} className="btn btn-primary">Start Detection</button>
        ) : (
          <button onClick={stopDetection} className="btn btn-secondary">Stop Detection</button>
        )}
      </div>

      {isActive && (
        <div className="video-container">
          <video ref={videoRef} autoPlay muted playsInline className="webcam-video" />

          {prediction && (
            <div className="prediction-overlay">
              {prediction.faceDetected ? (
                <div className="prediction-info">
                  <div className="emotion-badge" style={{ backgroundColor: EMOTION_COLORS[prediction.dominantEmotion] }}>
                    <span className="emotion-label">{prediction.dominantEmotion}</span>
                    <span className="confidence-score">{(prediction.confidence * 100).toFixed(1)}%</span>
                  </div>

                  <div className="emotion-scores">
                    {Object.entries(prediction.allScores).map(([emotion, score]) => (
                      <div key={emotion} className="score-bar">
                        <span className="score-label">
                          {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                        </span>
                        <div className="score-bar-container">
                          <div
                            className="score-bar-fill"
                            style={{
                              width: `${score * 100}%`,
                              backgroundColor: EMOTION_COLORS[(emotion.charAt(0).toUpperCase() + emotion.slice(1)) as keyof typeof EMOTION_COLORS],
                            }}
                          />
                        </div>
                        <span className="score-value">{(score * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-face-detected">
                  <p>No face detected</p>
                  <p className="hint">Please position your face in front of the camera</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!isActive && (
        <div className="detection-placeholder">
          <p>Click "Start Detection" to begin emotion tracking</p>
          <p className="info-text">
            Your emotions will be detected every few seconds and logged automatically.
          </p>
        </div>
      )}
    </div>
  );
}
