import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import { getDemoAccountByUid } from '../data/mockAccounts';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentModule, setCurrentModule] = useState('enlist');
  const [loading, setLoading] = useState(true);
  const isAuthenticated = Boolean(user);

  // Restore session on page reload
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          const mockAccount = getDemoAccountByUid(profile.uid);
          const merged = mockAccount
            ? { ...mockAccount, supabaseId: session.user.id }
            : { uid: profile.uid, fullName: profile.full_name, name: profile.full_name, role: profile.role, rank: profile.rank, unit: profile.unit, supabaseId: session.user.id };
          setUser(merged);
          setCurrentModule(merged.currentModule || 'serve');
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setUser(null);
        setCurrentModule('enlist');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (uid, password) => {
    const mockAccount = getDemoAccountByUid(uid);
    if (!mockAccount) return { success: false, error: 'Unrecognized service ID. Check with your unit admin.' };

    const email = `${uid.trim().toLowerCase()}@coverme.app`;

    let { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // First-time user for this account — sign them up then sign in
      const signUp = await supabase.auth.signUp({ email, password });
      if (signUp.error) return { success: false, error: signUp.error.message };
      const retry = await supabase.auth.signInWithPassword({ email, password });
      data = retry.data;
      error = retry.error;
    }

    if (error || !data?.user) {
      return { success: false, error: 'Incorrect password. Try again.' };
    }

    // Upsert profile row so the DB always reflects current mock data
    await supabase.from('profiles').upsert({
      id: data.user.id,
      uid: mockAccount.uid,
      full_name: mockAccount.fullName || mockAccount.name,
      role: mockAccount.role,
      rank: mockAccount.rank,
      pes_status: mockAccount.pesStatus || mockAccount.pes || 'B1',
      vocation: mockAccount.vocation,
      unit: mockAccount.unit,
      platoon: mockAccount.platoon,
      company: mockAccount.company,
      section: mockAccount.section,
      enlistment_date: mockAccount.enlistmentDate,
      ord_date: mockAccount.ordDate,
      ippt_goal: mockAccount.ipptGoal || '',
      consented: mockAccount.consented || false,
      current_module: mockAccount.currentModule || 'serve',
    }, { onConflict: 'id' });

    const profile = { ...mockAccount, supabaseId: data.user.id };
    setUser(profile);
    setCurrentModule(profile.currentModule || 'serve');
    return { success: true, user: profile };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentModule('enlist');
  };

  const updateUser = (updater) => {
    setUser((cur) => (typeof updater === 'function' ? updater(cur) : updater));
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
    () => ({ user, setUser, isAuthenticated, currentModule, loading, login, logout, setCurrentModule, updateUser, syncAuthSession, clearSession }),
    [currentModule, isAuthenticated, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
