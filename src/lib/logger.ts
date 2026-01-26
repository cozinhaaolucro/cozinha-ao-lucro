import { supabase } from './supabase';

export type ErrorSeverity = 'critical' | 'warning' | 'info';

interface LogErrorParams {
    error: Error | unknown;
    severity?: ErrorSeverity;
    functionName?: string;
    details?: Record<string, unknown>;
    userId?: string;
}

/**
 * Logs an error to the system_errors table in Supabase.
 * Fails silently to prevent infinite error loops.
 */
export const logError = async ({
    error,
    severity = 'warning',
    functionName = 'unknown',
    details = {},
    userId
}: LogErrorParams) => {
    try {
        console.error(`[System Log - ${severity}]`, error);

        // Attempt to get user if passed explicitly or from session if available
        let finalUserId = userId;
        if (!finalUserId) {
            const { data } = await supabase.auth.getSession();
            finalUserId = data.session?.user.id;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : null;

        await supabase.from('system_errors').insert({
            user_id: finalUserId || null,
            function_name: functionName,
            error_message: errorMessage,
            error_details: {
                ...details,
                stack: errorStack,
                userAgent: window.navigator.userAgent,
                url: window.location.href
            },
            severity
        });

    } catch (loggingError) {
        // If logging fails, we just log to console to avoid crashing the app
        console.error('Failed to send error log to database:', loggingError);
    }
};
