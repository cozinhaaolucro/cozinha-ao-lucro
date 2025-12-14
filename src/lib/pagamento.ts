import { supabase } from './supabase';

const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
    : '';

export interface CheckoutResponse {
    checkout_url: string;
    order_id: string;
}

export interface CheckoutError {
    error: string;
    details?: unknown;
}

/**
 * Cria um checkout dinâmico no Pagar.me vinculado ao usuário atual.
 * Retorna a URL do checkout para onde o usuário deve ser redirecionado.
 */
export async function criarCheckout(): Promise<CheckoutResponse> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${EDGE_FUNCTION_URL}/criar-checkout`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error((data as CheckoutError).error || 'Erro ao criar checkout');
    }

    return data as CheckoutResponse;
}

/**
 * Abre o checkout do Pagar.me em uma nova aba.
 * Lida com erros e exibe mensagens apropriadas.
 */
export async function iniciarPagamento(): Promise<void> {
} catch (error) {
    console.error('Erro ao iniciar pagamento:', error);
    throw error;
}
}

export interface Invoice {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    url?: string;
}

export async function getInvoices(): Promise<Invoice[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');

    const response = await fetch(`${EDGE_FUNCTION_URL}/pagarme-ops`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get_invoices' }),
    });

    if (!response.ok) throw new Error('Erro ao buscar faturas');
    const data = await response.json();
    return data.invoices;
}

export async function cancelSubscription(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');

    const response = await fetch(`${EDGE_FUNCTION_URL}/pagarme-ops`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel_subscription' }),
    });

    if (!response.ok) throw new Error('Erro ao cancelar assinatura');
}
