
import { supabase } from './supabase';

export const getGoogleCalendarToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.provider_token;
};

export const createCalendarEvent = async (event: {
    summary: string;
    description: string;
    start: { dateTime: string };
    end: { dateTime: string };
}) => {
    const token = await getGoogleCalendarToken();
    if (!token) {
        throw new Error('Google Calendar token not found. Please sign in with Google.');
    }

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create event');
    }

    return response.json();
};

export const listCalendarEvents = async (timeMin: string, timeMax: string) => {
    const token = await getGoogleCalendarToken();
    if (!token) return null;

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) return null;
    return response.json();
};
