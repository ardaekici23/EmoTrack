import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../application/contexts/AuthContext';
import { getTeamEmotionLogs, getTeamAlerts, AlertResponse } from '../../infrastructure/api/emotionLogs';
import { getMyTeams } from '../../infrastructure/api/teams';
import { signOut } from '../../infrastructure/api/auth';
import { EmotionLog } from '../../domain/emotion/types';
import { Team } from '../../domain/team/types';
import { ROUTES } from '../../shared/constants';
import { TeamAnalytics } from './TeamAnalytics';
import { TeamManagement } from './TeamManagement';
import { EventManagement } from './EventManagement';
import { Icon } from '../shared/Icons';
import { getInitials } from '../shared/SharedComponents';

type Tab = 'analytics' | 'teams' | 'events';

export function ManagerDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('analytics');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [logs, setLogs] = useState<EmotionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertData, setAlertData] = useState<AlertResponse | null>(null);

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    getMyTeams().then(setTeams).catch(() => {});
  }, [activeTab]);

  useEffect(() => {
    if (!currentUser || activeTab !== 'analytics') return;
    async function fetchLogs() {
      try {
        setLoading(true);
        const teamLogs = await getTeamEmotionLogs('', undefined, undefined, selectedTeamId ?? undefined);
        setLogs(teamLogs);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch team logs');
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
    const id = setInterval(fetchLogs, 60000);
    return () => clearInterval(id);
  }, [currentUser, activeTab, selectedTeamId]);

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const fetch = () =>
      getTeamAlerts(2, 50, selectedTeamId ?? undefined).then(setAlertData).catch(() => {});
    fetch();
    const id = setInterval(fetch, 60000);
    return () => clearInterval(id);
  }, [activeTab, selectedTeamId]);

  async function handleLogout() {
    try { await signOut(); navigate(ROUTES.LOGIN); } catch {}
  }

  const initials = currentUser ? getInitials(currentUser.name) : 'M';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const alertInfo = alertData?.anyAlerting
    ? {
        anyAlerting: true,
        teamName: alertData.alerts.find(a => a.alerting)?.teamName,
        negativePct: alertData.alerts.find(a => a.alerting)?.negativePct,
        hours: alertData.hours,
        sampleCount: alertData.alerts.find(a => a.alerting)?.sampleCount,
      }
    : null;

  const tabs: { key: Tab; label: string; icon: React.FC; alert?: boolean }[] = [
    { key: 'analytics', label: 'Team analytics', icon: Icon.BarChart, alert: alertData?.anyAlerting },
    { key: 'teams', label: 'Team management', icon: Icon.Users },
    { key: 'events', label: 'Events', icon: Icon.Calendar },
  ];

  const pageTitles: Record<Tab, string> = {
    analytics: 'Team analytics',
    teams: 'Team management',
    events: 'Events',
  };
  const pageLedes: Record<Tab, string> = {
    analytics: 'Aggregate emotional patterns across the teams you manage. Individual readings are never visible — only team-level shares.',
    teams: 'Create teams, invite members, and manage access. Each team has its own analytics scope.',
    events: 'Schedule emotion-tracked sessions for meetings, retrospectives, or workshops.',
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
          <h6>Manager</h6>
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
                {t.alert && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--negative)', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>

        <div className="side-role">
          <div className="side-user">
            <div className="avatar">{initials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="side-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name}</div>
              <div className="side-user-meta">manager</div>
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
          <div className="topbar-title">Workspace · {currentUser?.name?.split(' ')[0] ?? 'Manager'}</div>
          <div className="topbar-meta">
            <span className="topbar-status">All systems normal</span>
            <span>{dateStr}</span>
            <button className="btn btn-link" style={{ fontSize: 12 }} onClick={handleLogout}>Sign out</button>
          </div>
        </div>

        <main className="main">
          <div className="page-head">
            <div>
              <div className="page-title">{pageTitles[activeTab]}</div>
              <div className="page-lede">{pageLedes[activeTab]}</div>
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
                  {t.alert && <span className="tab-alert" />}
                </button>
              );
            })}
          </nav>

          {activeTab === 'analytics' && (
            error ? (
              <div className="error-banner">{error}</div>
            ) : loading && logs.length === 0 ? (
              <div className="loading-state"><div className="spinner" />Loading team analytics…</div>
            ) : (
              <TeamAnalytics
                logs={logs}
                teams={teams}
                alertData={alertInfo}
                teamFilter={selectedTeamId}
                setTeamFilter={setSelectedTeamId}
              />
            )
          )}
          {activeTab === 'teams' && <TeamManagement />}
          {activeTab === 'events' && <EventManagement />}
        </main>
      </div>
    </div>
  );
}
