import { Router, Response } from 'express';
import { pool } from '../db/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function requireManager(req: AuthRequest, res: Response): boolean {
  if (req.userRole !== 'manager') {
    res.status(403).json({ error: 'Manager access required' });
    return false;
  }
  return true;
}

function rowToTeam(row: Record<string, unknown>) {
  return {
    teamId: row.id,
    name: row.name,
    managerId: row.manager_id,
    memberCount: Number(row.member_count ?? 0),
    createdAt: row.created_at,
  };
}

function rowToMember(row: Record<string, unknown>) {
  return {
    userId: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!requireManager(req, res)) return;
  const { name } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: 'Team name is required' }); return; }

  try {
    const { rows } = await pool.query(
      `INSERT INTO teams (name, manager_id) VALUES ($1, $2)
       RETURNING id, name, manager_id, created_at`,
      [name.trim(), req.userId]
    );
    res.status(201).json({ ...rowToTeam(rows[0]), memberCount: 0 });
  } catch {
    res.status(500).json({ error: 'Failed to create team' });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!requireManager(req, res)) return;
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.name, t.manager_id, t.created_at,
              COUNT(u.id)::int AS member_count
       FROM teams t
       LEFT JOIN users u ON u.team_id::text = t.id::text
       WHERE t.manager_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      [req.userId]
    );
    res.json(rows.map(rowToTeam));
  } catch {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

router.get('/:teamId', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!requireManager(req, res)) return;
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.name, t.manager_id, t.created_at,
              COUNT(u.id)::int AS member_count
       FROM teams t
       LEFT JOIN users u ON u.team_id::text = t.id::text
       WHERE t.id = $1 AND t.manager_id = $2
       GROUP BY t.id`,
      [req.params.teamId, req.userId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Team not found' }); return; }
    res.json(rowToTeam(rows[0]));
  } catch {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

router.patch('/:teamId', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!requireManager(req, res)) return;
  const { name } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: 'Team name is required' }); return; }

  try {
    const { rows } = await pool.query(
      `UPDATE teams SET name = $1
       WHERE id = $2 AND manager_id = $3
       RETURNING id, name, manager_id, created_at`,
      [name.trim(), req.params.teamId, req.userId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Team not found' }); return; }
    res.json(rowToTeam(rows[0]));
  } catch {
    res.status(500).json({ error: 'Failed to update team' });
  }
});

router.get('/:teamId/members', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!requireManager(req, res)) return;
  try {
    const { rows: teamRows } = await pool.query(
      'SELECT id FROM teams WHERE id = $1 AND manager_id = $2',
      [req.params.teamId, req.userId]
    );
    if (!teamRows[0]) { res.status(404).json({ error: 'Team not found' }); return; }

    const { rows } = await pool.query(
      `SELECT id, name, email, created_at FROM users
       WHERE team_id::text = $1
       ORDER BY name`,
      [req.params.teamId]
    );
    res.json(rows.map(rowToMember));
  } catch {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.delete('/:teamId/members/:userId', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!requireManager(req, res)) return;
  try {
    const { rows: teamRows } = await pool.query(
      'SELECT id FROM teams WHERE id = $1 AND manager_id = $2',
      [req.params.teamId, req.userId]
    );
    if (!teamRows[0]) { res.status(404).json({ error: 'Team not found' }); return; }

    await pool.query(
      `UPDATE users SET team_id = NULL
       WHERE id = $1 AND team_id::text = $2`,
      [req.params.userId, req.params.teamId]
    );
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router;
