import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../application/contexts/AuthContext';
import { joinTeam } from '../../infrastructure/api/auth';
import { signOut } from '../../infrastructure/api/auth';
import { ROUTES } from '../../shared/constants';
import { EmotionDetector } from './EmotionDetector';
import { EmotionHistory } from './EmotionHistory';
import { EventsTab } from './EventsTab';
import { Icon } from '../shared/Icons';
import { getInitials } from '../shared/SharedComponents';

type Tab = 'detection' | 'history' | 'events';

export function EmployeeDashboard() {
  const { currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
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

  async function handleLogout() {
    try {
      await signOut();
      navigate(ROUTES.LOGIN);
    } catch {}
  }

  const initials = currentUser ? getInitials(currentUser.name) : 'U';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const tabs: { key: Tab; label: string; icon: React.FC }[] = [
    { key: 'detection', label: 'Detection', icon: Icon.Camera },
    { key: 'history', label: 'My history', icon: Icon.Activity },
    { key: 'events', label: 'Events', icon: Icon.Calendar },
  ];

  if (!currentUser?.teamId) {
    return (
      <div className="app">
        <aside className="side">
          <div className="brand">
            <div className="brand-logo">E</div>
            <div>
              <div className="brand-name">EmoTrack</div>
              <div className="brand-sub">Workspace</div>
            </div>
          </div>
          <div className="side-role">
            <div className="side-user">
              <div className="avatar">{initials}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="side-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name}</div>
                <div className="side-user-meta">employee</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </aside>
        <div className="main-col">
          <div className="topbar">
            <div className="topbar-title">Personal workspace</div>
            <div className="topbar-meta">
              <span className="topbar-status">All systems normal</span>
              <span>{dateStr}</span>
            </div>
          </div>
          <main className="main">
            <div className="join-team-screen">
              <div className="join-team-card">
                <h2>You haven't joined a team yet</h2>
                <p>Ask your manager for the team code and enter it below to get started.</p>
                {joinError && <div className="error-banner" style={{ marginBottom: 16 }}>{joinError}</div>}
                <form onSubmit={handleJoinTeam} className="join-team-form">
                  <input
                    className="input mono"
                    value={teamCode}
                    onChange={e => setTeamCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PYM-734-AX9"
                    style={{ letterSpacing: '0.08em' }}
                    disabled={joining}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary" disabled={joining || !teamCode.trim()} style={{ width: '100%', padding: '10px 16px' }}>
                    {joining ? 'Joining…' : 'Join Team'}
                  </button>
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const pageTitle: Record<Tab, string> = {
    detection: `Hi ${currentUser.name.split(' ')[0]}, ready to start tracking?`,
    history: 'Your emotion history',
    events: 'Team events',
  };
  const pageLede: Record<Tab, string> = {
    detection: 'All detection runs in your browser. Only emotion labels are stored — your video stays on this device.',
    history: 'A private summary of your emotional patterns. Visible only to you.',
    events: 'Sessions scheduled by your team manager. Join when active to contribute aggregate readings.',
  };

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <div className="brand-logo">E</div>
          <div>
            <div className="brand-name">EmoTrack</div>
            <div className="brand-sub">Workspace</div>
          </div>
        </div>

        <div className="side-section">
          <h6>Employee</h6>
          {tabs.map(t => {
            const IconCmp = t.icon;
            return (
              <div
                key={t.key}
                className={`side-link${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                <span className="side-icon"><IconCmp /></span>
                <span style={{ flex: 1 }}>{t.label}</span>
              </div>
            );
          })}
        </div>

        <div className="side-role">
          <div className="side-user">
            <div className="avatar">{initials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="side-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</div>
              <div className="side-user-meta">employee</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
            <span className="side-icon" style={{ width: 12, height: 12 }}><Icon.LogOut /></span>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-col">
        <div className="topbar">
          <div className="topbar-title">Personal workspace</div>
          <div className="topbar-meta">
            <span className="topbar-status">All systems normal</span>
            <span>{dateStr}</span>
            <button className="btn btn-link" style={{ fontSize: 12 }} onClick={handleLogout}>Sign out</button>
          </div>
        </div>

        <main className="main">
          <div className="page-head">
            <div>
              <div className="page-title">{pageTitle[activeTab]}</div>
              <div className="page-lede">{pageLede[activeTab]}</div>
            </div>
            <div className="page-actions">
              <button className="btn btn-ghost btn-sm">Help</button>
              <button className="btn btn-ghost btn-sm">Settings</button>
            </div>
          </div>

          <nav className="tabs">
            {tabs.map(t => {
              const IconCmp = t.icon;
              return (
                <button
                  key={t.key}
                  className={`tab${activeTab === t.key ? ' on' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  <span className="side-icon" style={{ width: 14, height: 14 }}><IconCmp /></span>
                  {t.label}
                </button>
              );
            })}
          </nav>

          {activeTab === 'detection' && <EmotionDetector />}
          {activeTab === 'history' && <EmotionHistory />}
          {activeTab === 'events' && <EventsTab />}
        </main>
      </div>
    </div>
  );
}
