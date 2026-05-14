import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function makeToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

function rowToUser(row: Record<string, unknown>) {
  return {
    userId: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    teamId: row.team_id,
    createdAt: row.created_at,
  };
}

router.post('/signup', async (req: Request, res: Response) => {
  const { name, email, password, role, teamId } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  try {
    // Team code is optional at signup; employees can join a team later from the dashboard
    let resolvedTeamId: string | null = null;
    if (role === 'employee' && teamId) {
      const { rows: teamRows } = await pool.query('SELECT id FROM teams WHERE id = $1', [teamId]);
      if (!teamRows[0]) { res.status(400).json({ error: 'Team not found. Please enter a valid team code.' }); return; }
      resolvedTeamId = teamId;
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, team_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, team_id, created_at`,
      [name, email, hash, role, resolvedTeamId]
    );
    const user = rowToUser(rows[0]);
    res.status(201).json({ token: makeToken(rows[0].id, rows[0].role), user });
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg.code === '23505') res.status(409).json({ error: 'Email already in use' });
    else res.status(500).json({ error: 'Failed to create account' });
  }
});

router.post('/signin', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: 'Email and password required' }); return; }

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const row = rows[0];
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    res.json({ token: makeToken(row.id, row.role), user: rowToUser(row) });
  } catch {
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

router.patch('/team', requireAuth, async (req: AuthRequest, res: Response) => {
  const { teamId } = req.body;
  if (!teamId) { res.status(400).json({ error: 'teamId is required' }); return; }
  try {
    const { rows: teamRows } = await pool.query('SELECT id FROM teams WHERE id = $1', [teamId]);
    if (!teamRows[0]) { res.status(400).json({ error: 'Team not found. Please enter a valid team code.' }); return; }
    const { rows } = await pool.query(
      'UPDATE users SET team_id = $1 WHERE id = $2 RETURNING id, name, email, role, team_id, created_at',
      [teamId, req.userId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(rowToUser(rows[0]));
  } catch {
    res.status(500).json({ error: 'Failed to join team' });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, team_id, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(rowToUser(rows[0]));
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
