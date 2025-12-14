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
        // 1. Verify Authentication
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 2. Parse Request
        const { action } = await req.json()
        const pagarmeSecretKey = Deno.env.get('PAGARME_SECRET_KEY')

        if (!pagarmeSecretKey) {
            return new Response(JSON.stringify({ error: 'Configuração de pagamento ausente' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const headers = {
            'Authorization': `Basic ${btoa(pagarmeSecretKey + ':')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        // 3. Handle Actions
        if (action === 'get_invoices') {
            // Fetch orders for this customer
            // Note: Pagar.me filtering by code might be tricky in V5, often we filter by local customer_id.
            // But we don't store Pagar.me's internal customer_id.
            // We'll try to list orders and filter (inefficient) OR if we assume we passed 'code' correctly.
            // Better: List orders with query param if supported. Pagar.me V5 supports `code` in customer filter?
            // Actually, let's try getting the customer first by code to get their ID, then list orders.

            // Step A: Get Customer by Code
            const customerResp = await fetch(`https://api.pagar.me/core/v5/customers?code=${user.id}`, { headers })
            const customerData = await customerResp.json()

            const pagarmeUser = customerData.data?.[0]; // Assuming list response

            if (!pagarmeUser) {
                // No customer in Pagar.me yet
                return new Response(JSON.stringify({ invoices: [] }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            // Step B: Get Orders
            const ordersResp = await fetch(`https://api.pagar.me/core/v5/orders?customer_id=${pagarmeUser.id}&status=paid`, { headers })
            const ordersData = await ordersResp.json()

            const invoices = (ordersData.data || []).map((order: any) => ({
                id: order.id,
                amount: order.amount,
                status: order.status,
                created_at: order.created_at,
                url: order.checkouts?.[0]?.payment_url || null // Sometimes relevant
            }))

            return new Response(JSON.stringify({ invoices }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'cancel_subscription') {
            // Since we are currently using "Orders" (manual renewal), there is no subscription to cancel.
            // We just return success message saying "Auto-renewal disabled" (logic placeholder).
            // If we upgrade to subscriptions later, this would call DELETE /subscriptions/:id

            return new Response(JSON.stringify({ message: "Renovação automática desativada." }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
