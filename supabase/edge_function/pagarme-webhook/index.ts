import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        // 1. Validar método
        if (req.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 })
        }

        // 2. Ler corpo da requisição
        const payload = await req.json()
        console.log('Webhook recebido:', JSON.stringify(payload))

        // 3. Verificar tipo do evento
        // Pagar.me envia 'order.paid' ou 'invoice.paid' ou 'charge.paid'
        const eventType = payload.type
        // Aceita múltiplos eventos de pagamento bem sucedido
        if (eventType !== 'order.paid' && eventType !== 'charge.paid' && eventType !== 'invoice.paid') {
            return new Response('Event ignored', { status: 200 })
        }

        // 4. Extrair dados do cliente
        // O Customer Code no Pagar.me deve ser o UUID do usuário no Supabase
        const customerCode = payload.data.customer.code

        if (!customerCode) {
            console.error('Customer code not found in payload')
            return new Response('Customer code missing', { status: 400 })
        }

        // 5. Atualizar Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Adiciona 30 dias de assinatura
        const subscriptionEnd = new Date()
        subscriptionEnd.setDate(subscriptionEnd.getDate() + 30)

        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_status: 'active',
                subscription_plan: 'pro',
                subscription_end: subscriptionEnd.toISOString()
            })
            .eq('id', customerCode)

        if (error) {
            console.error('Error updating profile:', error)
            return new Response('Database error', { status: 500 })
        }

        return new Response(JSON.stringify({ message: "Subscription activated" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        })
    }
})
