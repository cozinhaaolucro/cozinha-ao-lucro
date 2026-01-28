// ============================================================================
// COZINHA AO LUCRO - PAGARME WEBHOOK
// ============================================================================
// Descrição: Webhook para processar eventos de pagamento do Pagar.me
// Segurança: Validação HMAC para garantir autenticidade das requisições
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Valida a assinatura HMAC do webhook do Pagar.me
 * O Pagar.me envia um header 'x-hub-signature' com HMAC-SHA1
 */
async function validateWebhookSignature(
    body: string,
    signature: string | null,
    secret: string
): Promise<boolean> {
    if (!signature) {
        console.warn('No signature provided in webhook request')
        return false
    }

    // Pagar.me usa formato: sha1=<hash>
    const [algorithm, hash] = signature.split('=')

    if (algorithm !== 'sha1') {
        console.warn('Unexpected signature algorithm:', algorithm)
        return false
    }

    // Criar HMAC-SHA1
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(body)
    )

    // Converter para hex
    const computedHash = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

    // Comparação segura contra timing attacks
    if (computedHash.length !== hash.length) return false

    let result = 0
    for (let i = 0; i < computedHash.length; i++) {
        result |= computedHash.charCodeAt(i) ^ hash.charCodeAt(i)
    }

    return result === 0
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
    try {
        // 1. Validar método
        if (req.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 })
        }

        // 2. Ler corpo como texto para validação HMAC
        const bodyText = await req.text()

        // 3. Validar assinatura HMAC (SEGURANÇA)
        const webhookSecret = Deno.env.get('PAGARME_WEBHOOK_SECRET')
        const signature = req.headers.get('x-hub-signature')

        if (webhookSecret) {
            const isValid = await validateWebhookSignature(bodyText, signature, webhookSecret)

            if (!isValid) {
                console.error('Invalid webhook signature')
                return new Response('Invalid signature', { status: 401 })
            }
            console.log('Webhook signature validated successfully')
        } else {
            console.warn('PAGARME_WEBHOOK_SECRET not configured - skipping signature validation')
        }

        // 4. Parse do payload
        const payload = JSON.parse(bodyText)
        console.log('Webhook recebido:', payload.type, payload.id)

        // 5. Verificar tipo do evento
        const eventType = payload.type
        const validPaymentEvents = ['order.paid', 'charge.paid', 'invoice.paid']
        const validCancelEvents = ['subscription.canceled', 'subscription.expired']

        if (!validPaymentEvents.includes(eventType) && !validCancelEvents.includes(eventType)) {
            console.log('Event ignored:', eventType)
            return new Response('Event ignored', { status: 200 })
        }

        // 6. Extrair dados do cliente
        const customerCode = payload.data?.customer?.code

        if (!customerCode) {
            console.error('Customer code not found in payload')
            return new Response('Customer code missing', { status: 400 })
        }

        // 7. Criar cliente Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 8. Processar evento
        if (validPaymentEvents.includes(eventType)) {
            // PAGAMENTO BEM SUCEDIDO
            const subscriptionEnd = new Date()
            subscriptionEnd.setDate(subscriptionEnd.getDate() + 30)

            // Atualizar perfil
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    subscription_status: 'active',
                    subscription_plan: 'pro',
                    subscription_end: subscriptionEnd.toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', customerCode)

            if (profileError) {
                console.error('Error updating profile:', profileError)
                return new Response('Database error', { status: 500 })
            }

            // Registrar no histórico de pagamentos
            const amount = payload.data?.amount || payload.data?.charges?.[0]?.last_transaction?.amount || 2990

            const { error: paymentError } = await supabase
                .from('payment_history')
                .insert({
                    user_id: customerCode,
                    pagarme_order_id: payload.data?.id || payload.id,
                    amount: amount / 100, // Converter de centavos
                    status: 'paid',
                    payment_method: payload.data?.charges?.[0]?.payment_method || 'unknown',
                    paid_at: new Date().toISOString()
                })

            if (paymentError) {
                console.warn('Error inserting payment history:', paymentError)
                // Não falhar por causa do histórico
            }

            console.log('Subscription activated for user:', customerCode)

            return new Response(JSON.stringify({
                message: "Subscription activated",
                user_id: customerCode,
                expires: subscriptionEnd.toISOString()
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            })

        } else if (validCancelEvents.includes(eventType)) {
            // ASSINATURA CANCELADA
            const { error } = await supabase
                .from('profiles')
                .update({
                    subscription_status: 'cancelled',
                    updated_at: new Date().toISOString()
                })
                .eq('id', customerCode)

            if (error) {
                console.error('Error cancelling subscription:', error)
                return new Response('Database error', { status: 500 })
            }

            console.log('Subscription cancelled for user:', customerCode)

            return new Response(JSON.stringify({
                message: "Subscription cancelled",
                user_id: customerCode
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            })
        }

        return new Response('Event processed', { status: 200 })

    } catch (error) {
        console.error('Webhook error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        })
    }
})
