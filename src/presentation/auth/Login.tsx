import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '../../infrastructure/api/auth';
import { useAuth } from '../../application/contexts/AuthContext';
import { ROUTES } from '../../shared/constants';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login to EmoTrack</h2>
        <p className="auth-subtitle">Track emotional well-being for remote teams</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email" id="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email" required disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password" id="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password" required disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to={ROUTES.SIGNUP}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
