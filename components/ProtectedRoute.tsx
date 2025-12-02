import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Fix: Define props as a separate interface to improve type clarity and resolve compiler error.
interface ProtectedRouteProps {
  children: React.ReactElement;
}

// FIX: Explicitly typed component with React.FC to resolve children prop issue.
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="preloader-spinner"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
