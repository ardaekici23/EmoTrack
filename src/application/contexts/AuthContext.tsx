import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User } from '../../domain/user/types';
import { getCurrentUser } from '../../infrastructure/api/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  refreshUser: async () => {},
});

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setCurrentUser(await getCurrentUser());
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ currentUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
