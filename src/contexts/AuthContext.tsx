
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { seedAccount } from '@/lib/seeding';

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
                // Trigger seeding if profile exists
                seedAccount().catch(console.error);
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        }
    };

    // Use refs to track state in listeners without triggering re-effects
    const userRef = useRef<User | null>(null);
    const sessionRef = useRef<Session | null>(null);

    // Update refs when state changes
    useEffect(() => {
        userRef.current = user;
        sessionRef.current = session;
    }, [user, session]);

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
            const currentUser = userRef.current;
            const newUserId = session?.user?.id;
            const currentUserId = currentUser?.id;

            // Only set loading if we are actually changing users or logging in from null
            const isDifferentUser = newUserId !== currentUserId;

            if (_event === 'SIGNED_IN' && isDifferentUser) {
                // Only show loading if we are essentially switching users
                setLoading(true);
            } else if (_event === 'SIGNED_OUT') {
                setLoading(false);
                setSession(null);
                setUser(null);
                setProfile(null);
            }

            try {
                // Always update session state
                setSession(session);
                setUser(session?.user ?? null);

                // Only fetch profile if user CHANGED
                if (newUserId && isDifferentUser) {
                    const profilePromise = fetchProfile(newUserId);
                    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000));
                    await Promise.race([profilePromise, timeoutPromise]);
                }
            } catch (error) {
                console.error('Error in auth state change:', error);
            } finally {
                // Only unset loading if we set it (or just force it false to be safe)
                if ((_event === 'SIGNED_IN' && isDifferentUser) || _event === 'SIGNED_OUT') {
                    setLoading(false);
                }
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
