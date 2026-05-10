/**
 * Navbar Component
 * Application navigation bar
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../services/auth.service';
import { ROUTES } from '../../utils/constants';

export function Navbar(): JSX.Element {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await signOut();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={ROUTES.HOME} className="navbar-brand">
          EmoTrack
        </Link>

        {currentUser && (
          <div className="navbar-menu">
            <Link
              to={
                currentUser.role === 'manager'
                  ? ROUTES.MANAGER_DASHBOARD
                  : ROUTES.EMPLOYEE_DASHBOARD
              }
              className="nav-link"
            >
              Dashboard
            </Link>

            <div className="navbar-user">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">{currentUser.role}</span>
              <button onClick={handleLogout} className="btn btn-logout">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
