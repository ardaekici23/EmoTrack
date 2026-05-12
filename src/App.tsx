import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './application/contexts/AuthContext';
import { Login } from './presentation/auth/Login';
import { Signup } from './presentation/auth/Signup';
import { PrivateRoute } from './presentation/auth/PrivateRoute';
import { EmployeeDashboard } from './presentation/employee/EmployeeDashboard';
import { ManagerDashboard } from './presentation/manager/ManagerDashboard';
import { Navbar } from './presentation/shared/Navbar';
import { ROUTES } from './shared/constants';
import './App.css';

export default function App() {
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
                element={<PrivateRoute requiredRole="employee"><EmployeeDashboard /></PrivateRoute>}
              />
              <Route
                path={ROUTES.MANAGER_DASHBOARD}
                element={<PrivateRoute requiredRole="manager"><ManagerDashboard /></PrivateRoute>}
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
