import React, { useEffect, useState } from 'react';
import { useAuth } from '../../application/contexts/AuthContext';
import { getTeamEmotionLogs, getTeamAlerts, AlertResponse } from '../../infrastructure/api/emotionLogs';
import { getMyTeams } from '../../infrastructure/api/teams';
import { EmotionLog } from '../../domain/emotion/types';
import { Team } from '../../domain/team/types';
import { TeamAnalytics } from './TeamAnalytics';
import { UserAnalytics } from './UserAnalytics';
import { DateRangeFilter } from './DateRangeFilter';
import { TeamManagement } from './TeamManagement';
import { EventManagement } from './EventManagement';

type Tab = 'analytics' | 'teams' | 'events';

export function ManagerDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('analytics');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [analyticsView, setAnalyticsView] = useState<'team' | 'users'>('team');
  const [logs, setLogs] = useState<EmotionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [alertData, setAlertData] = useState<AlertResponse | null>(null);

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    getMyTeams().then(setTeams).catch(() => {});
  }, [activeTab]);

  useEffect(() => {
    if (!currentUser || activeTab !== 'analytics') return;

    async function fetchTeamLogs() {
      try {
        setLoading(true);
        const teamLogs = await getTeamEmotionLogs('', startDate, endDate, selectedTeamId ?? undefined);
        setLogs(teamLogs);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch team emotion logs');
      } finally {
        setLoading(false);
      }
    }

    fetchTeamLogs();
    const interval = setInterval(fetchTeamLogs, 60000);
    return () => clearInterval(interval);
  }, [currentUser, startDate, endDate, activeTab, selectedTeamId]);

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const fetchAlerts = () =>
      getTeamAlerts(2, 50, selectedTeamId ?? undefined).then(setAlertData).catch(() => {});
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60000);
    return () => clearInterval(id);
  }, [activeTab, selectedTeamId]);

  function handleFilterChange(start: Date | undefined, end: Date | undefined) {
    setStartDate(start);
    setEndDate(end);
  }

  const selectedTeamName = selectedTeamId
    ? teams.find(t => t.teamId === selectedTeamId)?.name ?? 'Selected Team'
    : 'All Teams';

  return (
    <div className="manager-dashboard">
      <div className="dashboard-header">
        <h1>Manager Dashboard</h1>
        <p className="dashboard-subtitle">Welcome, <strong>{currentUser?.name}</strong></p>
      </div>

      <nav className="tab-nav">
        <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          Team Analytics
          {alertData?.anyAlerting && <span className="alert-badge" />}
        </button>
        <button className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>
          Team Management
        </button>
        <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          Events
        </button>
      </nav>

      <div className="tab-content">
        {activeTab === 'analytics' && (
          <>
            {alertData?.anyAlerting && (
              <div className="alert alert-danger">
                <strong>Mood Alert — </strong>
                {alertData.alerts
                  .filter(a => a.alerting)
                  .map(a => `${a.teamName}: ${a.negativePct}% negative in the last ${alertData.hours}h (${a.sampleCount} samples)`)
                  .join(' · ')}
              </div>
            )}

            {teams.length > 1 && (
              <div className="team-switcher">
                <span className="team-switcher-label">Viewing:</span>
                <button
                  className={`team-switcher-btn ${selectedTeamId === null ? 'active' : ''}`}
                  onClick={() => setSelectedTeamId(null)}
                >
                  All Teams
                </button>
                {teams.map(team => (
                  <button
                    key={team.teamId}
                    className={`team-switcher-btn ${selectedTeamId === team.teamId ? 'active' : ''}`}
                    onClick={() => setSelectedTeamId(team.teamId)}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="manager-dashboard loading">
                <div className="loading-spinner" />
                <p>Loading team analytics...</p>
              </div>
            ) : error ? (
              <div className="manager-dashboard error">
                <div className="error-message">{error}</div>
              </div>
            ) : (
              <>
                <section className="filter-section">
                  <h2>Filter Data</h2>
                  <DateRangeFilter onFilterChange={handleFilterChange} />
                </section>
                <section className="analytics-section">
                  <div className="analytics-section-header">
                    <h2>{selectedTeamName} — Emotion Analytics</h2>
                    <div className="view-toggle">
                      <button
                        className={`view-toggle-btn ${analyticsView === 'team' ? 'active' : ''}`}
                        onClick={() => setAnalyticsView('team')}
                      >
                        Team Overview
                      </button>
                      <button
                        className={`view-toggle-btn ${analyticsView === 'users' ? 'active' : ''}`}
                        onClick={() => setAnalyticsView('users')}
                      >
                        Per User
                      </button>
                    </div>
                  </div>
                  {analyticsView === 'team' ? <TeamAnalytics logs={logs} /> : <UserAnalytics logs={logs} />}
                </section>
              </>
            )}
          </>
        )}
        {activeTab === 'teams' && <TeamManagement />}
        {activeTab === 'events' && <EventManagement />}
      </div>
    </div>
  );
}
