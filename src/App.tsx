/**
 * Main App Component
 * Sets up routing and authentication context
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { ManagerDashboard } from './components/manager/ManagerDashboard';
import { Navbar } from './components/shared/Navbar';
import { ROUTES } from './utils/constants';
import './App.css';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.SIGNUP} element={<Signup />} />

              <Route
                path={ROUTES.EMPLOYEE_DASHBOARD}
                element={
                  <PrivateRoute requiredRole="employee">
                    <EmployeeDashboard />
                  </PrivateRoute>
                }
              />

              <Route
                path={ROUTES.MANAGER_DASHBOARD}
                element={
                  <PrivateRoute requiredRole="manager">
                    <ManagerDashboard />
                  </PrivateRoute>
                }
              />

              <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />

              <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
