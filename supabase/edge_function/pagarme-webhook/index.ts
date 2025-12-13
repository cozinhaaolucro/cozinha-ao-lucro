
// Follow this guide to deploy: https://supabase.com/docs/guides/functions/deploy
// Deno runtime

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

console.log("Pagar.me Webhook Function Up!")

serve(async (req) => {
    try {
        const supabase = createClient(
            // Supabase API URL - Env var
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase API SERVICE ROLE KEY - Env var
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const payload = await req.json()
        console.log("Webhook received:", payload)

        // Pagar.me payload structure varies, assuming simplified model here:
        // payload.data.status, payload.data.metadata.order_id

        // Example Pagar.me structure check (adjust based on actual Pagar.me version used)
        const status = payload?.data?.status;
        const orderId = payload?.data?.metadata?.order_id; // Need to ensure we send this metadata when creating transaction

        if (orderId && status) {
            let appStatus = 'pending';
            if (status === 'paid') appStatus = 'preparing';
            // Logic: if paid, move to preparing? Or keep pending but mark paid? 
            // User requested "account status reflects payment status".
            // Maybe we just update a 'payment_status' column? Or 'status' if 'paid' -> 'preparing'?

            // Let's assume we update the order status to 'pending' (confirmed) or 'preparing'

            const { error } = await supabase
                .from('orders')
                .update({ status: 'preparing', payment_status: 'paid' }) // ensuring we have payment_status column or reusing status
                .eq('id', orderId)

            if (error) throw error

            return new Response(JSON.stringify({ message: "Order updated" }), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            })
        }

        return new Response(JSON.stringify({ message: "Ignored" }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
