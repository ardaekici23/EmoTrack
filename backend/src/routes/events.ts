import { Router, Response } from 'express';
import { pool } from '../db/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function rowToEvent(row: Record<string, unknown>) {
  return {
    eventId: row.id,
    title: row.title,
    managerId: row.manager_id,
    teamId: row.team_id,
    status: row.status,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    participantCount: Number(row.participant_count ?? 0),
    hasJoined: row.has_joined ?? false,
  };
}

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole !== 'manager') { res.status(403).json({ error: 'Manager access required' }); return; }
  const { title, teamId, scheduledAt } = req.body;
  if (!title?.trim() || !teamId) { res.status(400).json({ error: 'Title and teamId are required' }); return; }

  try {
    const { rows: teamRows } = await pool.query(
      'SELECT id FROM teams WHERE id = $1 AND manager_id = $2',
      [teamId, req.userId]
    );
    if (!teamRows[0]) { res.status(404).json({ error: 'Team not found' }); return; }

    const { rows } = await pool.query(
      `INSERT INTO events (title, manager_id, team_id, scheduled_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, manager_id, team_id, status, scheduled_at, started_at, ended_at, created_at`,
      [title.trim(), req.userId, teamId, scheduledAt || null]
    );
    res.status(201).json({ ...rowToEvent(rows[0]), participantCount: 0 });
  } catch {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole !== 'manager') { res.status(403).json({ error: 'Manager access required' }); return; }
  try {
    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.manager_id, e.team_id, e.status,
              e.scheduled_at, e.started_at, e.ended_at, e.created_at,
              COUNT(ep.user_id)::int AS participant_count
       FROM events e
       LEFT JOIN event_participants ep ON ep.event_id = e.id
       WHERE e.manager_id = $1
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [req.userId]
    );
    res.json(rows.map(rowToEvent));
  } catch {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/active', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rows: userRows } = await pool.query('SELECT team_id FROM users WHERE id = $1', [req.userId]);
    const userTeamId = userRows[0]?.team_id;
    if (!userTeamId) { res.json([]); return; }

    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.manager_id, e.team_id, e.status,
              e.scheduled_at, e.started_at, e.ended_at, e.created_at,
              COUNT(ep.user_id)::int AS participant_count,
              EXISTS(
                SELECT 1 FROM event_participants ep2
                WHERE ep2.event_id = e.id AND ep2.user_id = $2
              ) AS has_joined
       FROM events e
       LEFT JOIN event_participants ep ON ep.event_id = e.id
       WHERE e.team_id::text = $1 AND e.status = 'active'
       GROUP BY e.id
       ORDER BY e.started_at DESC`,
      [userTeamId, req.userId]
    );
    res.json(rows.map(rowToEvent));
  } catch {
    res.status(500).json({ error: 'Failed to fetch active events' });
  }
});

router.get('/scheduled', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rows: userRows } = await pool.query('SELECT team_id FROM users WHERE id = $1', [req.userId]);
    const userTeamId = userRows[0]?.team_id;
    if (!userTeamId) { res.json([]); return; }

    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.manager_id, e.team_id, e.status,
              e.scheduled_at, e.started_at, e.ended_at, e.created_at,
              COUNT(ep.user_id)::int AS participant_count,
              false AS has_joined
       FROM events e
       LEFT JOIN event_participants ep ON ep.event_id = e.id
       WHERE e.team_id::text = $1 AND e.status = 'scheduled'
       GROUP BY e.id
       ORDER BY e.scheduled_at ASC`,
      [userTeamId]
    );
    res.json(rows.map(rowToEvent));
  } catch {
    res.status(500).json({ error: 'Failed to fetch scheduled events' });
  }
});

router.get('/:eventId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.manager_id, e.team_id, e.status,
              e.scheduled_at, e.started_at, e.ended_at, e.created_at,
              COUNT(ep.user_id)::int AS participant_count
       FROM events e
       LEFT JOIN event_participants ep ON ep.event_id = e.id
       WHERE e.id = $1
       GROUP BY e.id`,
      [req.params.eventId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Event not found' }); return; }
    res.json(rowToEvent(rows[0]));
  } catch {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

router.patch('/:eventId/start', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole !== 'manager') { res.status(403).json({ error: 'Manager access required' }); return; }
  try {
    const { rows } = await pool.query(
      `UPDATE events SET status = 'active', started_at = NOW()
       WHERE id = $1 AND manager_id = $2 AND status = 'scheduled'
       RETURNING id, title, manager_id, team_id, status, scheduled_at, started_at, ended_at, created_at`,
      [req.params.eventId, req.userId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Event not found or already started' }); return; }
    res.json(rowToEvent(rows[0]));
  } catch {
    res.status(500).json({ error: 'Failed to start event' });
  }
});

router.patch('/:eventId/end', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole !== 'manager') { res.status(403).json({ error: 'Manager access required' }); return; }
  try {
    const { rows } = await pool.query(
      `UPDATE events SET status = 'ended', ended_at = NOW()
       WHERE id = $1 AND manager_id = $2 AND status = 'active'
       RETURNING id, title, manager_id, team_id, status, scheduled_at, started_at, ended_at, created_at`,
      [req.params.eventId, req.userId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Event not found or not active' }); return; }
    res.json(rowToEvent(rows[0]));
  } catch {
    res.status(500).json({ error: 'Failed to end event' });
  }
});

router.post('/:eventId/join', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rows: eventRows } = await pool.query(
      'SELECT id, team_id FROM events WHERE id = $1 AND status = $2',
      [req.params.eventId, 'active']
    );
    if (!eventRows[0]) { res.status(404).json({ error: 'Active event not found' }); return; }

    const { rows: userRows } = await pool.query('SELECT team_id FROM users WHERE id = $1', [req.userId]);
    if (userRows[0]?.team_id !== eventRows[0].team_id?.toString()) {
      res.status(403).json({ error: 'Event is not for your team' });
      return;
    }

    await pool.query(
      `INSERT INTO event_participants (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.params.eventId, req.userId]
    );
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to join event' });
  }
});

router.delete('/:eventId/leave', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'DELETE FROM event_participants WHERE event_id = $1 AND user_id = $2',
      [req.params.eventId, req.userId]
    );
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to leave event' });
  }
});

router.get('/:eventId/results', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rows: eventRows } = await pool.query(
      'SELECT id, title, manager_id, team_id, started_at, ended_at FROM events WHERE id = $1',
      [req.params.eventId]
    );
    if (!eventRows[0]) { res.status(404).json({ error: 'Event not found' }); return; }

    const event = eventRows[0];
    const isManager = req.userRole === 'manager' && event.manager_id === req.userId;
    if (!isManager) {
      const { rows: pRows } = await pool.query(
        'SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2',
        [req.params.eventId, req.userId]
      );
      if (!pRows[0]) { res.status(403).json({ error: 'Access denied' }); return; }
    }

    const { rows } = await pool.query(
      `SELECT
         u.id,
         u.name,
         COUNT(el.id)::int AS log_count,
         COALESCE(AVG(el.confidence_score), 0) AS avg_confidence,
         MODE() WITHIN GROUP (ORDER BY el.dominant_emotion) AS dominant_emotion,
         COALESCE(AVG(COALESCE((el.all_scores->>'happy')::float,    0)), 0) AS avg_happy,
         COALESCE(AVG(COALESCE((el.all_scores->>'neutral')::float,  0)), 0) AS avg_neutral,
         COALESCE(AVG(COALESCE((el.all_scores->>'sad')::float,      0)), 0) AS avg_sad,
         COALESCE(AVG(COALESCE((el.all_scores->>'angry')::float,    0)), 0) AS avg_angry,
         COALESCE(AVG(COALESCE((el.all_scores->>'fearful')::float,  0)), 0) AS avg_fearful,
         COALESCE(AVG(COALESCE((el.all_scores->>'disgusted')::float,0)), 0) AS avg_disgusted,
         COALESCE(AVG(COALESCE((el.all_scores->>'surprised')::float,0)), 0) AS avg_surprised
       FROM event_participants ep
       JOIN users u ON ep.user_id = u.id
       LEFT JOIN emotion_logs el ON el.user_id = ep.user_id AND el.event_id = $1
       WHERE ep.event_id = $1
       GROUP BY u.id, u.name`,
      [req.params.eventId]
    );

    const { rows: timelineRows } = await pool.query(
      `SELECT user_id, timestamp, dominant_emotion, confidence_score
       FROM emotion_logs WHERE event_id = $1
       ORDER BY user_id, timestamp ASC`,
      [req.params.eventId]
    );

    const timelineByUser = new Map<string, { timestamp: string; emotion: string; confidence: number }[]>();
    for (const tr of timelineRows) {
      const userId = tr.user_id as string;
      if (!timelineByUser.has(userId)) timelineByUser.set(userId, []);
      timelineByUser.get(userId)!.push({
        timestamp: (tr.timestamp as Date).toISOString(),
        emotion: tr.dominant_emotion as string,
        confidence: Number(tr.confidence_score),
      });
    }

    const participants = rows.map(r => ({
      userId: r.id,
      name: r.name,
      logCount: r.log_count,
      dominantEmotion: r.dominant_emotion || 'Neutral',
      avgConfidence: Number(r.avg_confidence),
      avgScores: {
        happy: Number(r.avg_happy),
        neutral: Number(r.avg_neutral),
        sad: Number(r.avg_sad),
        angry: Number(r.avg_angry),
        fearful: Number(r.avg_fearful),
        disgusted: Number(r.avg_disgusted),
        surprised: Number(r.avg_surprised),
      },
      timeline: timelineByUser.get(r.id as string) ?? [],
    }));

    const emotions = ['happy', 'neutral', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'] as const;
    const overallAvgScores = Object.fromEntries(
      emotions.map(e => [
        e,
        participants.length
          ? participants.reduce((sum, p) => sum + p.avgScores[e], 0) / participants.length
          : 0,
      ])
    ) as Record<typeof emotions[number], number>;

    const overallDominantEmotion = participants.length
      ? emotions.reduce((max, e) => overallAvgScores[e] > overallAvgScores[max] ? e : max, emotions[0])
      : 'Neutral';

    res.json({
      eventId: event.id,
      title: event.title,
      startedAt: event.started_at,
      endedAt: event.ended_at,
      participants,
      overallAvgScores,
      overallDominantEmotion: overallDominantEmotion.charAt(0).toUpperCase() + overallDominantEmotion.slice(1),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

export default router;
