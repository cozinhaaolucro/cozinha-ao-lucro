// ============================================================================
// TEST SETUP
// ============================================================================
// Configuração global para testes com Vitest

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup após cada teste
afterEach(() => {
    cleanup();
});

// Mock do matchMedia (para componentes responsivos)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock do ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock do IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock do scrollTo
window.scrollTo = vi.fn();

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: {
                    user: {
                        id: 'test-user-id',
                        email: 'test@example.com',
                    },
                },
                error: null,
            }),
            getSession: vi.fn().mockResolvedValue({
                data: { session: null },
                error: null,
            }),
            onAuthStateChange: vi.fn().mockReturnValue({
                data: { subscription: { unsubscribe: vi.fn() } },
            }),
        },
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        channel: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis(),
        }),
    },
    subscribeToOrders: vi.fn().mockReturnValue(null),
    subscribeToIngredientStockChanges: vi.fn().mockReturnValue(null),
}));

// Suprimir warnings de console em testes
const originalError = console.error;
console.error = (...args: any[]) => {
    // Ignorar erros de act() e hydration
    if (
        typeof args[0] === 'string' &&
        (args[0].includes('act(') ||
            args[0].includes('Warning: ReactDOM.render') ||
            args[0].includes('Warning: An update to'))
    ) {
        return;
    }
    originalError.apply(console, args);
};
