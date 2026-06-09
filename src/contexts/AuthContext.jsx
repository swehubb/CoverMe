import { createContext, useContext, useMemo, useState } from 'react';
import mockAuth from '../services/mockAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentModule, setCurrentModule] = useState('enlist');
  const [loading, setLoading] = useState(false);
  const isAuthenticated = Boolean(user);

  const login = async (accountId) => {
    setLoading(true);
    const result = await mockAuth.login(accountId);
    setUser(result.user);
    setCurrentModule(result.user.currentModule || 'enlist');
    setLoading(false);
    return result.user;
  };

  const logout = async () => {
    setLoading(true);
    await mockAuth.logout();
    setUser(null);
    setCurrentModule('enlist');
    setLoading(false);
  };

  const updateUser = (updater) => {
    setUser((currentUser) => (typeof updater === 'function' ? updater(currentUser) : updater));
  };

  const syncAuthSession = (nextUser, nextModule) => {
    setUser(nextUser);
    setCurrentModule(nextModule || nextUser?.currentModule || 'enlist');
  };

  const clearSession = () => {
    setUser(null);
    setCurrentModule('enlist');
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      isAuthenticated,
      currentModule,
      loading,
      login,
      logout,
      setCurrentModule,
      updateUser,
      syncAuthSession,
      clearSession,
    }),
    [currentModule, isAuthenticated, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
