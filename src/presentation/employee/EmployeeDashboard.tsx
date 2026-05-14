import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../application/contexts/AuthContext';
import { joinTeam } from '../../infrastructure/api/auth';
import { EmotionDetector } from './EmotionDetector';
import { EmotionHistory } from './EmotionHistory';
import { EventsTab } from './EventsTab';

type Tab = 'detection' | 'history' | 'events';

export function EmployeeDashboard() {
  const { currentUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('detection');
  const [teamCode, setTeamCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function handleJoinTeam(e: FormEvent) {
    e.preventDefault();
    if (!teamCode.trim()) return;
    try {
      setJoining(true);
      setJoinError(null);
      await joinTeam(teamCode.trim());
      await refreshUser();
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join team');
    } finally {
      setJoining(false);
    }
  }

  // Show join-team prompt if user has no team yet
  if (!currentUser?.teamId) {
    return (
      <div className="employee-dashboard">
        <div className="dashboard-header">
          <h1>Welcome, {currentUser?.name}</h1>
        </div>
        <div className="join-team-screen">
          <div className="join-team-card">
            <h2>You haven't joined a team yet</h2>
            <p>Ask your manager for the team code from their Team Management page and enter it below to get started.</p>
            {joinError && <div className="error-message">{joinError}</div>}
            <form onSubmit={handleJoinTeam} className="join-team-form">
              <input
                value={teamCode}
                onChange={e => setTeamCode(e.target.value)}
                placeholder="Paste team code here"
                disabled={joining}
                className="join-team-input"
                autoFocus
              />
              <button type="submit" className="btn btn-primary" disabled={joining || !teamCode.trim()}>
                {joining ? 'Joining...' : 'Join Team'}
              </button>
            </form>
            <p className="info-text">
              Once you join a team, you can start tracking emotions, view your history, and participate in team events.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {currentUser?.name}</h1>
        <p className="dashboard-subtitle">Track your emotional well-being throughout the workday</p>
      </div>

      <nav className="tab-nav">
        <button className={`tab-btn ${activeTab === 'detection' ? 'active' : ''}`} onClick={() => setActiveTab('detection')}>
          Detection
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          History
        </button>
        <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          Events
        </button>
      </nav>

      <div className="tab-content">
        {activeTab === 'detection' && (
          <div className="dashboard-content">
            <section className="detection-section">
              <h2>Real-Time Emotion Detection</h2>
              <EmotionDetector />
            </section>
            <div className="dashboard-info">
              <div className="info-card">
                <h3>How it works</h3>
                <ul>
                  <li>Click "Start Detection" to begin emotion tracking</li>
                  <li>Your emotions are detected every few seconds using your webcam</li>
                  <li>All processing happens in your browser — no video is sent to the server</li>
                  <li>Only emotion labels and timestamps are saved</li>
                </ul>
              </div>
              <div className="info-card privacy">
                <h3>Privacy & Security</h3>
                <ul>
                  <li><strong>Your video never leaves your device</strong></li>
                  <li>Only emotion labels (e.g., "Happy", "Neutral") are stored</li>
                  <li>You can stop detection at any time</li>
                  <li>Your data is only visible to you and your manager (in aggregate)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'history' && (
          <section className="history-section">
            <h2>Emotion History</h2>
            <EmotionHistory />
          </section>
        )}
        {activeTab === 'events' && <EventsTab />}
      </div>
    </div>
  );
}
