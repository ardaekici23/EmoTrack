import React from 'react';
import { useAuth } from '../../application/contexts/AuthContext';
import { EmotionDetector } from './EmotionDetector';
import { EmotionHistory } from './EmotionHistory';

export function EmployeeDashboard() {
  const { currentUser } = useAuth();

  return (
    <div className="employee-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {currentUser?.name}</h1>
        <p className="dashboard-subtitle">Track your emotional well-being throughout the workday</p>
      </div>

      <div className="dashboard-content">
        <section className="detection-section">
          <h2>Real-Time Emotion Detection</h2>
          <EmotionDetector />
        </section>

        <section className="history-section">
          <h2>Emotion History</h2>
          <EmotionHistory />
        </section>
      </div>

      <div className="dashboard-info">
        <div className="info-card">
          <h3>How it works</h3>
          <ul>
            <li>Click "Start Detection" to begin emotion tracking</li>
            <li>Your emotions are detected every few seconds using your webcam</li>
            <li>All processing happens in your browser - no video is sent to the server</li>
            <li>Only emotion labels and timestamps are saved</li>
            <li>View your emotion trends over time in the history section</li>
          </ul>
        </div>

        <div className="info-card privacy">
          <h3>Privacy & Security</h3>
          <ul>
            <li><strong>Your video never leaves your device</strong></li>
            <li>Only emotion labels (e.g., "Happy", "Neutral") are stored</li>
            <li>You can stop detection at any time</li>
            <li>Your data is private and only visible to you and your manager (in aggregate)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
