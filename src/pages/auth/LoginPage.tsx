// src/pages/LoginPage.tsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoginForm, useAuth } from '../../shared/components/auth';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Get the path user was trying to access before login
  const from = location.state?.from || '/';

  // Set page title
  useEffect(() => {
    document.title = 'Login - Synapse';
  }, []);

  // If user is already authenticated, redirect to intended destination
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // Show loading while checking authentication status
  if (isLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>Verificando autenticação...</div>
      </div>
    );
  }

  return <LoginForm />;
};

export default LoginPage;
