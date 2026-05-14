import { Router, Response } from 'express';
import { pool } from '../db/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function rowToLog(row: Record<string, unknown>) {
  return {
    logId: row.id,
    userId: row.user_id,
    userName: row.user_name ?? null,
    timestamp: row.timestamp,
    dominantEmotion: row.dominant_emotion,
    confidenceScore: row.confidence_score,
    allScores: row.all_scores,
    eventId: row.event_id ?? null,
  };
}

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { dominantEmotion, confidenceScore, allScores, eventId } = req.body;
  try {
    let resolvedEventId: string | null = null;
    if (eventId) {
      const { rows: epRows } = await pool.query(
        `SELECT ep.event_id FROM event_participants ep
         JOIN events e ON ep.event_id = e.id
         WHERE ep.event_id = $1 AND ep.user_id = $2 AND e.status = 'active'`,
        [eventId, req.userId]
      );
      if (epRows.length > 0) resolvedEventId = eventId;
    }

    const { rows } = await pool.query(
      `INSERT INTO emotion_logs (user_id, dominant_emotion, confidence_score, all_scores, event_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.userId, dominantEmotion, confidenceScore, JSON.stringify(allScores), resolvedEventId]
    );
    res.status(201).json({ logId: rows[0].id });
  } catch {
    res.status(500).json({ error: 'Failed to log emotion' });
  }
});

router.get('/history', requireAuth, async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, limit = '100' } = req.query;
  const params: unknown[] = [req.userId];
  let i = 2;

  let query = `SELECT id, user_id, timestamp, dominant_emotion, confidence_score, all_scores
               FROM emotion_logs WHERE user_id = $1`;
  if (startDate) { query += ` AND timestamp >= $${i++}`; params.push(startDate); }
  if (endDate)   { query += ` AND timestamp <= $${i++}`; params.push(endDate); }
  query += ` ORDER BY timestamp DESC LIMIT $${i}`;
  params.push(parseInt(limit as string));

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows.map(rowToLog));
  } catch {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/team/alert', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole !== 'manager') { res.status(403).json({ error: 'Manager access required' }); return; }
  const hours = Math.min(parseInt(req.query.hours as string) || 2, 48);
  const threshold = Math.min(parseInt(req.query.threshold as string) || 50, 100);
  const teamId = req.query.teamId as string | undefined;

  try {
    const { rows: ownedTeams } = await pool.query('SELECT id FROM teams WHERE manager_id = $1', [req.userId]);
    if (ownedTeams.length === 0) { res.json({ alerts: [], anyAlerting: false }); return; }
    if (teamId && !ownedTeams.some((t: { id: string }) => t.id === teamId)) {
      res.status(403).json({ error: 'Access denied' }); return;
    }

    const params: unknown[] = [req.userId, `${hours} hours`];
    let query = `
      SELECT t.id AS team_id, t.name AS team_name,
             COUNT(el.id)::int AS total,
             COUNT(el.id) FILTER (WHERE el.dominant_emotion IN ('Angry','Disgusted','Fearful','Sad'))::int AS negative_count
      FROM teams t
      LEFT JOIN users u ON t.id::text = u.team_id
      LEFT JOIN emotion_logs el ON el.user_id = u.id AND el.timestamp >= NOW() - $2::interval
      WHERE t.manager_id = $1`;
    if (teamId) { query += ` AND t.id = $3`; params.push(teamId); }
    query += ' GROUP BY t.id, t.name';

    const { rows } = await pool.query(query, params);
    const alerts = rows.map((r: Record<string, unknown>) => {
      const total = Number(r.total);
      const negCount = Number(r.negative_count);
      const negativePct = total > 0 ? (negCount / total) * 100 : 0;
      return {
        teamId: r.team_id, teamName: r.team_name,
        negativePct: Math.round(negativePct * 10) / 10,
        sampleCount: total,
        alerting: total >= 5 && negativePct >= threshold,
      };
    });
    res.json({ alerts, anyAlerting: alerts.some((a: { alerting: boolean }) => a.alerting), threshold, hours });
  } catch {
    res.status(500).json({ error: 'Failed to fetch alert status' });
  }
});

router.get('/team', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole !== 'manager') {
    res.status(403).json({ error: 'Manager access required' });
    return;
  }

  const { startDate, endDate, teamId } = req.query;

  try {
    const { rows: ownedTeams } = await pool.query('SELECT id FROM teams WHERE manager_id = $1', [req.userId]);
    if (ownedTeams.length === 0) { res.status(404).json({ error: 'No teams found. Create a team first in Team Management.' }); return; }

    // If a specific teamId is requested, verify the manager owns it
    if (teamId) {
      const owns = ownedTeams.some(t => t.id === teamId);
      if (!owns) { res.status(403).json({ error: 'Access denied to that team' }); return; }
    }

    const params: unknown[] = [req.userId];
    let i = 2;
    let query = `SELECT el.id, el.user_id, u.name AS user_name, el.timestamp, el.dominant_emotion, el.confidence_score, el.all_scores
                 FROM emotion_logs el
                 JOIN users u ON el.user_id = u.id
                 JOIN teams t ON t.id::text = u.team_id
                 WHERE t.manager_id = $1`;
    if (teamId) { query += ` AND t.id = $${i++}`; params.push(teamId); }
    if (startDate) { query += ` AND el.timestamp >= $${i++}`; params.push(startDate); }
    if (endDate)   { query += ` AND el.timestamp <= $${i++}`; params.push(endDate); }
    query += ' ORDER BY el.timestamp DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows.map(rowToLog));
  } catch {
    res.status(500).json({ error: 'Failed to fetch team logs' });
  }
});

export default router;
