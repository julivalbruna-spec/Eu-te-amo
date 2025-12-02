import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// FIX: Switched from v9 to v8 compat User type and removed v9 function to resolve type errors.
// import { User, onAuthStateChanged } from 'firebase/auth';
import firebase from 'firebase/compat/app';
import { auth } from '../firebase';

interface AuthContextType {
  currentUser: firebase.User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Fix: Define props as a separate interface to improve type clarity and resolve compiler error.
interface AuthProviderProps {
  children: ReactNode;
}

// FIX: Explicitly typed component with React.FC to resolve children prop issue.
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIX: Switched to Firebase v8 compat syntax for auth state changes.
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const value = {
    currentUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
