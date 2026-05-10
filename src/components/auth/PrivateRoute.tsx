/**
 * PrivateRoute Component
 * Protects routes based on authentication and role
 */

import React, { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/User';
import { ROUTES } from '../../utils/constants';

interface PrivateRouteProps {
  children: ReactElement;
  requiredRole?: UserRole;
}

export function PrivateRoute({
  children,
  requiredRole,
}: PrivateRouteProps): JSX.Element {
  const { currentUser, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Check role-based access
  if (requiredRole && currentUser.role !== requiredRole) {
    return (
      <div className="unauthorized-container">
        <h2>Unauthorized Access</h2>
        <p>You don't have permission to access this page.</p>
        <p>
          Your role: <strong>{currentUser.role}</strong>
        </p>
        <p>
          Required role: <strong>{requiredRole}</strong>
        </p>
        <button
          onClick={() => {
            const path =
              currentUser.role === 'manager'
                ? ROUTES.MANAGER_DASHBOARD
                : ROUTES.EMPLOYEE_DASHBOARD;
            window.location.href = path;
          }}
          className="btn btn-primary"
        >
          Go to My Dashboard
        </button>
      </div>
    );
  }

  return children;
}
