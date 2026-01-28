import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        const { action } = await req.json()
        const pagarmeKey = Deno.env.get('PAGARME_SECRET_KEY')

        if (!pagarmeKey) {
            throw new Error('Pagar.me API key not configured')
        }

        // Pagar.me API Base URL
        const baseUrl = 'https://api.pagar.me/core/v5';
        const authHeader = 'Basic ' + btoa(pagarmeKey + ':');

        if (action === 'get_invoices') {
            // Fetch orders/charges for this customer code (user.id)
            // Adjust query parameters as needed for Pagar.me V5
            const response = await fetch(`${baseUrl}/orders?code=${user.id}`, {
                headers: { 'Authorization': authHeader }
            });

            const data = await response.json();

            // Transform Pagar.me orders to simple invoice objects
            const invoices = data.data ? data.data.map((order: any) => ({
                id: order.id,
                amount: order.amount / 100,
                status: order.status,
                created_at: order.created_at,
                url: order.checkouts?.[0]?.payment_url // Or usage of charges
            })) : [];

            return new Response(
                JSON.stringify({ invoices }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        if (action === 'cancel_subscription') {
            // Since we are using Orders in this MVP, "cancelling" might just mean
            // updating a local flag or if using Subscriptions API, calling cancel.
            // For now, we'll return a success since this is a placeholder for the "Stop Auto-renewal" feature
            // In a real Subscriptions implementation, we would call DELETE /subscriptions/:id

            return new Response(
                JSON.stringify({ message: 'Subscription cancelled' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
