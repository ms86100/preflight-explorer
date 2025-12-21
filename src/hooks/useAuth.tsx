import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ClassificationLevel, AppRole } from '@/types/jira';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  job_title?: string;
  department?: string;
  clearance_level?: ClassificationLevel;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: AppRole[];
  clearanceLevel: ClassificationLevel;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasClearance: (level: ClassificationLevel) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CLEARANCE_HIERARCHY: ClassificationLevel[] = [
  'public',
  'restricted',
  'confidential',
  'export_controlled',
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (authUser: User) => {
    // For now, create a profile from auth user metadata
    // Once tables are created, this will fetch from the profiles table
    const displayName = authUser.user_metadata?.display_name || 
      authUser.email?.split('@')[0] || 
      'User';
    
    setProfile({
      id: authUser.id,
      email: authUser.email || '',
      display_name: displayName,
      avatar_url: authUser.user_metadata?.avatar_url,
      clearance_level: 'restricted', // Default for demo
    });

    // Default role for demo
    setRoles(['developer']);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role) || roles.includes('admin');
  };

  const hasClearance = (level: ClassificationLevel): boolean => {
    const userLevel = profile?.clearance_level || 'public';
    const userIndex = CLEARANCE_HIERARCHY.indexOf(userLevel);
    const requiredIndex = CLEARANCE_HIERARCHY.indexOf(level);
    return userIndex >= requiredIndex;
  };

  const clearanceLevel: ClassificationLevel = profile?.clearance_level || 'public';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        clearanceLevel,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        hasRole,
        hasClearance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
