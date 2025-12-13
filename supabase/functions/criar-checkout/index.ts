import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Verificar autenticação do usuário
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Não autorizado' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Obter usuário do Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Usuário não encontrado' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Preparar dados do cliente para o Pagar.me
        const customerName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente'
        const customerEmail = user.email!
        const customerId = user.id

        // 4. Chamar API do Pagar.me para criar pedido
        const pagarmeSecretKey = Deno.env.get('PAGARME_SECRET_KEY')

        if (!pagarmeSecretKey) {
            console.error('PAGARME_SECRET_KEY não configurada')
            return new Response(
                JSON.stringify({ error: 'Configuração de pagamento ausente' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Criar o pedido no Pagar.me
        const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(pagarmeSecretKey + ':')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer: {
                    name: customerName,
                    email: customerEmail,
                    code: customerId,  // UUID do Supabase - usado no webhook para identificar o usuário
                    type: 'individual',
                },
                items: [{
                    amount: 3990,  // R$ 39,90 em centavos
                    description: 'Plano Pro - Cozinha ao Lucro (Mensal)',
                    quantity: 1,
                    code: 'plano_pro_mensal',
                }],
                payments: [{
                    payment_method: 'checkout',
                    checkout: {
                        expires_in: 3600,  // 1 hora para pagar
                        billing_address_editable: false,
                        customer_editable: false,
                        accepted_payment_methods: ['credit_card', 'pix', 'boleto'],
                        success_url: `${Deno.env.get('APP_URL') || 'http://localhost:8080'}/app/dashboard?payment=success`,
                        // Configuração obrigatória para PIX
                        pix: {
                            expires_in: 3600,  // 1 hora
                        },
                        // Configuração obrigatória para Boleto
                        boleto: {
                            due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],  // 3 dias
                            instructions: 'Pagar até a data de vencimento',
                        },
                        // Configuração para cartão de crédito
                        credit_card: {
                            capture: true,
                            statement_descriptor: 'COZINHA LUCRO',
                            installments: [{ number: 1, total: 3990 }],
                        },
                    }
                }],
            }),
        })

        if (!pagarmeResponse.ok) {
            const errorData = await pagarmeResponse.json()
            console.error('Erro Pagar.me:', errorData)
            return new Response(
                JSON.stringify({ error: 'Erro ao criar checkout', details: errorData }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const order = await pagarmeResponse.json()

        // 5. Extrair URL do checkout
        const checkoutUrl = order.checkouts?.[0]?.payment_url

        if (!checkoutUrl) {
            console.error('Checkout URL não encontrada:', order)
            return new Response(
                JSON.stringify({ error: 'URL de pagamento não gerada' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 6. Retornar URL do checkout
        return new Response(
            JSON.stringify({
                checkout_url: checkoutUrl,
                order_id: order.id,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Erro inesperado:', error)
        return new Response(
            JSON.stringify({ error: 'Erro interno do servidor' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
