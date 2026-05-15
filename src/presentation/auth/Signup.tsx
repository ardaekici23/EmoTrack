import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp } from '../../infrastructure/api/auth';
import { useAuth } from '../../application/contexts/AuthContext';
import { UserRole } from '../../domain/user/types';
import { ROUTES, USER_ROLES } from '../../shared/constants';
import { Icon } from '../shared/Icons';

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [teamCode, setTeamCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    try {
      setError(''); setLoading(true);
      const user = await signUp({ name, email, password, role, teamId: teamCode || undefined });
      await refreshUser();
      navigate(user.role === 'manager' ? ROUTES.MANAGER_DASHBOARD : ROUTES.EMPLOYEE_DASHBOARD);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-canvas">
        <div className="auth-brand">
          <div className="auth-brand-logo">E</div>
          <span>EmoTrack</span>
        </div>

        <div className="auth-hero">
          <div>
            <div className="auth-hero-title">Unlock your remote team's potential &amp; happiness with EmoTrack.</div>
            <div className="auth-hero-body" style={{ marginTop: 16 }}>
              Stay connected, measure mood, improve collaboration, and boost performance. The ultimate toolkit for modern distributed teams.
            </div>
          </div>

          <div className="stack stack-4">
            <div className="auth-feature">
              <div className="auth-feature-icon"><Icon.Smile /></div>
              <div>
                <div className="auth-feature-title">Daily mood check-ins</div>
                <div className="auth-feature-desc">Detection runs in the browser, never on a server.</div>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon"><Icon.Network /></div>
              <div>
                <div className="auth-feature-title">Collaboration analytics</div>
                <div className="auth-feature-desc">Measure engagement across remote and hybrid teams.</div>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon"><Icon.TrendUp /></div>
              <div>
                <div className="auth-feature-title">Performance insights</div>
                <div className="auth-feature-desc">Privacy-respecting aggregate signals and trends.</div>
              </div>
            </div>
          </div>

          <div className="auth-legal">© 2026 EmoTrack, Inc. · Privacy · Terms · DPA</div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-panel-head">
          <div className="auth-panel-title">Create your account</div>
          <div className="auth-panel-sub">Choose your role to set up your workspace.</div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form className="stack stack-4" onSubmit={handleSubmit}>
          <div className="field">
            <label>Your role</label>
            <div className="role-pick">
              <div
                className={`role-pick-option ${role === USER_ROLES.EMPLOYEE ? 'selected' : ''}`}
                onClick={() => setRole(USER_ROLES.EMPLOYEE)}
              >
                <div className="role-pick-label">Employee</div>
                <div className="role-pick-desc">Track your own emotions and view personal history</div>
              </div>
              <div
                className={`role-pick-option ${role === USER_ROLES.MANAGER ? 'selected' : ''}`}
                onClick={() => setRole(USER_ROLES.MANAGER)}
              >
                <div className="role-pick-label">Manager</div>
                <div className="role-pick-desc">View aggregate analytics for your team</div>
              </div>
            </div>
          </div>

          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Arda Ekici" required disabled={loading} />
          </div>
          <div className="field">
            <label htmlFor="su-email">Work email</label>
            <input id="su-email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required disabled={loading} />
          </div>
          <div className="field">
            <label htmlFor="su-password">Password</label>
            <input id="su-password" type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required disabled={loading} />
          </div>
          <div className="field">
            <label htmlFor="su-confirm">Confirm password</label>
            <input id="su-confirm" type="password" className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required disabled={loading} />
          </div>

          {role === USER_ROLES.EMPLOYEE && (
            <div className="field">
              <div className="row-between" style={{ gap: 8 }}>
                <label>
                  Team code{' '}
                  <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span>
                </label>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Get this from your manager</span>
              </div>
              <input
                className="input mono"
                value={teamCode}
                onChange={e => setTeamCode(e.target.value.toUpperCase())}
                placeholder="e.g. PYM-734-AX9"
                style={{ letterSpacing: '0.08em' }}
                disabled={loading}
              />
              <div className="field-hint">
                Join your team now to see events and contribute to analytics. You can also add this later from your dashboard.
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', width: '100%' }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', lineHeight: 1.5 }}>
            By creating an account you agree to our{' '}
            <a style={{ color: 'var(--accent)' }} href="#terms">Terms of Service</a> and{' '}
            <a style={{ color: 'var(--accent)' }} href="#privacy">Privacy Policy</a>.
          </div>
        </form>

        <div className="auth-foot">
          Already have an account?{' '}
          <button type="button" className="btn-link" style={{ fontSize: 13, fontWeight: 500 }} onClick={() => navigate(ROUTES.LOGIN)}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
