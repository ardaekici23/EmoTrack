import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../../infrastructure/api/auth';
import { useAuth } from '../../application/contexts/AuthContext';
import { ROUTES } from '../../shared/constants';
import { Icon } from '../shared/Icons';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    try {
      setError(''); setLoading(true);
      const user = await signIn({ email, password });
      await refreshUser();
      navigate(user.role === 'manager' ? ROUTES.MANAGER_DASHBOARD : ROUTES.EMPLOYEE_DASHBOARD);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
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
                <div className="auth-feature-desc">Understand team morale daily — detection runs in the browser, never on a server.</div>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon"><Icon.Network /></div>
              <div>
                <div className="auth-feature-title">Collaboration analytics</div>
                <div className="auth-feature-desc">Measure engagement and connection across remote and hybrid teams.</div>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon"><Icon.TrendUp /></div>
              <div>
                <div className="auth-feature-title">Performance insights</div>
                <div className="auth-feature-desc">Track productivity and goals with privacy-respecting aggregate signals.</div>
              </div>
            </div>
          </div>

          <div className="auth-legal">© 2026 EmoTrack, Inc. · Privacy · Terms · DPA</div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-panel-head">
          <div className="auth-panel-title">Sign in to your workspace</div>
          <div className="auth-panel-sub">Use your company email to continue.</div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form className="stack stack-4" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required disabled={loading} />
          </div>
          <div className="field">
            <div className="row-between" style={{ gap: 8 }}>
              <label htmlFor="password">Password</label>
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}>Forgot password?</span>
            </div>
            <input id="password" type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
          </div>
          <label className="row" style={{ gap: 8, fontSize: 13, color: 'var(--text-mute)', cursor: 'pointer' }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            Keep me signed in on this device
          </label>
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', width: '100%' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-foot">
          New to EmoTrack?{' '}
          <button type="button" className="btn-link" style={{ fontSize: 13, fontWeight: 500 }} onClick={() => navigate(ROUTES.SIGNUP)}>Create an account</button>
        </div>
      </div>
    </div>
  );
}
