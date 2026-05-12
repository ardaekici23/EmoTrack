import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../../infrastructure/firebase/auth';
import { UserRole } from '../../domain/user/types';
import { ROUTES, USER_ROLES } from '../../shared/constants';

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [teamId, setTeamId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name || !email || !password || !teamId) { setError('Please fill in all fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    try {
      setError(''); setLoading(true);
      const user = await signUp({ name, email, password, role, teamId });
      navigate(user.role === 'manager' ? ROUTES.MANAGER_DASHBOARD : ROUTES.EMPLOYEE_DASHBOARD);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign Up for EmoTrack</h2>
        <p className="auth-subtitle">Create your account to get started</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter your full name" required disabled={loading} />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter your work email" required disabled={loading} />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters" required disabled={loading} />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password" required disabled={loading} />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" value={role} onChange={e => setRole(e.target.value as UserRole)} disabled={loading}>
              <option value={USER_ROLES.EMPLOYEE}>Employee</option>
              <option value={USER_ROLES.MANAGER}>Manager</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="teamId">Team ID</label>
            <input type="text" id="teamId" value={teamId} onChange={e => setTeamId(e.target.value)}
              placeholder="Enter your team identifier" required disabled={loading} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to={ROUTES.LOGIN}>Login</Link>
        </p>
      </div>
    </div>
  );
}
