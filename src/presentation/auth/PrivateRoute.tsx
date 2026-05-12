import React, { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../application/contexts/AuthContext';
import { UserRole } from '../../domain/user/types';
import { ROUTES } from '../../shared/constants';

interface PrivateRouteProps {
  children: ReactElement;
  requiredRole?: UserRole;
}

export function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) return <Navigate to={ROUTES.LOGIN} replace />;

  if (requiredRole && currentUser.role !== requiredRole) {
    return (
      <div className="unauthorized-container">
        <h2>Unauthorized Access</h2>
        <p>You don't have permission to access this page.</p>
        <p>Your role: <strong>{currentUser.role}</strong></p>
        <p>Required role: <strong>{requiredRole}</strong></p>
        <button
          onClick={() => {
            window.location.href = currentUser.role === 'manager'
              ? ROUTES.MANAGER_DASHBOARD
              : ROUTES.EMPLOYEE_DASHBOARD;
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
