import React, { useEffect, useState } from 'react';
import { useAuth } from '../../application/contexts/AuthContext';
import { getTeamEmotionLogs } from '../../infrastructure/firebase/emotionLogs';
import { EmotionLog } from '../../domain/emotion/types';
import { TeamAnalytics } from './TeamAnalytics';
import { DateRangeFilter } from './DateRangeFilter';

export function ManagerDashboard() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<EmotionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  useEffect(() => {
    if (!currentUser) return;

    async function fetchTeamLogs() {
      try {
        setLoading(true);
        const teamLogs = await getTeamEmotionLogs(currentUser!.teamId, startDate, endDate);
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
  }, [currentUser, startDate, endDate]);

  function handleFilterChange(start: Date | undefined, end: Date | undefined) {
    setStartDate(start);
    setEndDate(end);
  }

  if (loading) {
    return (
      <div className="manager-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading team analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manager-dashboard error">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="manager-dashboard">
      <div className="dashboard-header">
        <h1>Team Analytics Dashboard</h1>
        <p className="dashboard-subtitle">
          Monitor your team's emotional well-being - Team: <strong>{currentUser?.teamId}</strong>
        </p>
      </div>

      <section className="filter-section">
        <h2>Filter Data</h2>
        <DateRangeFilter onFilterChange={handleFilterChange} />
      </section>

      <section className="analytics-section">
        <h2>Team Emotion Analytics</h2>
        <TeamAnalytics logs={logs} />
      </section>

      <div className="dashboard-info">
        <div className="info-card">
          <h3>About Team Analytics</h3>
          <ul>
            <li>View aggregated emotion data from all team members</li>
            <li>Filter data by date range to analyze trends</li>
            <li>Individual employee data is anonymized for privacy</li>
            <li>Use insights to support team well-being and prevent burnout</li>
          </ul>
        </div>

        <div className="info-card tips">
          <h3>Interpreting the Data</h3>
          <ul>
            <li><strong>High negative emotions:</strong> May indicate stress or burnout</li>
            <li><strong>Low detection count:</strong> Team members may not be using the system regularly</li>
            <li><strong>Trends over time:</strong> Look for patterns in specific time periods or days</li>
            <li><strong>Balance is key:</strong> A mix of emotions is normal — focus on sustained negative trends</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
