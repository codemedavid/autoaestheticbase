import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
    );
}

// Create Supabase client
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    }
);

// =============================================
// Auth Helpers
// =============================================

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function isAdmin(): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

    return !!data;
}

// =============================================
// Real-time Subscription Helpers
// =============================================

export function subscribeToAvailability(callback: () => void) {
    return supabase
        .channel('availability-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'date_availability' },
            callback
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'time_slots' },
            callback
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'service_date_availability' },
            callback
        )
        .subscribe();
}

export function subscribeToBookings(callback: () => void) {
    return supabase
        .channel('booking-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'bookings' },
            callback
        )
        .subscribe();
}
