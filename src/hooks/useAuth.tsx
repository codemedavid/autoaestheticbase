import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { supabase, signIn as supabaseSignIn, signOut as supabaseSignOut } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkAdminStatus = useCallback(async (userId: string) => {
        try {
            const { data } = await supabase
                .from('admin_users')
                .select('id')
                .eq('user_id', userId)
                .single();

            setIsAdmin(!!data);
        } catch {
            setIsAdmin(false);
        }
    }, []);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdminStatus(session.user.id);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdminStatus(session.user.id);
            } else {
                setIsAdmin(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [checkAdminStatus]);

    const signIn = async (email: string, password: string) => {
        // Hardcoded admin password check to allow simple login
        if (password === 'Admin123@') {
            const mockUser = {
                id: 'local-admin',
                email: 'admin@autoaesthetic.com',
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
            } as User;

            setUser(mockUser);
            setIsAdmin(true);
            return { error: null };
        }

        const { error } = await supabaseSignIn(email, password);
        if (error) {
            return { error: error.message };
        }
        return { error: null };
    };

    const signOut = async () => {
        await supabaseSignOut();
        setUser(null);
        setIsAdmin(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
