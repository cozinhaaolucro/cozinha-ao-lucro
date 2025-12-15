
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: any | null;
    loading: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string | undefined) => {
        if (!userId) {
            setProfile(null);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        }
    };

    useEffect(() => {
        // Safety timeout to prevent infinite loading (e.g. network hang)
        const safetyTimer = setTimeout(() => {
            setLoading((current) => {
                if (current) {
                    console.warn('Auth loading safety timeout triggered');
                    return false;
                }
                return current;
            });
        }, 5000); // 5 seconds max loading time

        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            await fetchProfile(session?.user?.id);
            setLoading(false);
            clearTimeout(safetyTimer);
        }).catch(() => {
            setLoading(false);
            clearTimeout(safetyTimer);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            // Only set loading if we don't have a session match (initial load or sign out)
            // PREVENT "loading" flash on token refresh
            if (_event === 'SIGNED_IN' && !user) {
                setLoading(true);
            } else if (_event === 'SIGNED_OUT') {
                setLoading(false);
                setSession(null);
                setUser(null);
                setProfile(null);
            }

            try {
                // If the session is effectively the same, don't trigger a full reload
                // But update the session object just in case of token refresh
                setSession(session);
                setUser(session?.user ?? null);

                // Only fetch profile if user CHANGED
                if (session?.user?.id && session.user.id !== user?.id) {
                    // Add timeout to profile fetch to prevent hanging
                    const profilePromise = fetchProfile(session?.user?.id);
                    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000)); // 5s max for profile
                    await Promise.race([profilePromise, timeoutPromise]);
                }
            } catch (error) {
                console.error('Error in auth state change:', error);
            } finally {
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimer);
        };
    }, []);

    const signOut = async () => {
        // Optimistically clear state immediately
        setSession(null);
        setUser(null);
        setProfile(null);
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
