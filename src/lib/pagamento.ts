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
    try {
        const { checkout_url } = await criarCheckout();
        window.open(checkout_url, '_blank');
    } catch (error) {
        console.error('Erro ao iniciar pagamento:', error);
        throw error;
    }
}
