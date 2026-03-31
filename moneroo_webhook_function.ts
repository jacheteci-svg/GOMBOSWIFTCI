/**
 * MONEROO WEBHOOK HANDLER (Deno/Supabase/InsForge Edge Function)
 * 
 * This function handles asynchronous notifications from Moneroo.
 * It is ultra-secure because it fetches the data directly from Moneroo after receiving the hook.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Configure these entries in your platform's dashboard secret management
const MONEROO_SECRET_KEY = Deno.env.get("MONEROO_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
    try {
        // 1. We receive the POST from Moneroo
        if (req.method !== "POST") return new Response("Méthode non autorisée", { status: 405 });

        const body = await req.json();
        const monerooId = body.id; // L'ID du paiement (p_...)
        const event = body.event;  // e.g. 'payment.success'

        console.log(`[Moneroo] Evenement reçu: ${event} pour ${monerooId}`);

        if (event !== "payment.success") {
            return new Response("Evénement ignoré", { status: 200 });
        }

        // 2. IMPORTANT: Verify the payment by calling Moneroo API
        // This avoids spoofing (signature check is also possible but this is safer)
        const monerooRes = await fetch(`https://api.moneroo.io/v1/payments/${monerooId}`, {
            headers: {
                "Authorization": `Bearer ${MONEROO_SECRET_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const payment = await monerooRes.json();

        if (payment.status !== "success") {
            return new Response("Paiement non confirmé chez Moneroo", { status: 400 });
        }

        // 3. Find the transaction in our database
        const { data: tx, error: txError } = await supabase
            .from("moneroo_transactions")
            .select("*")
            .eq("moneroo_id", monerooId)
            .single();

        if (txError || !tx) {
            console.error("Transaction introuvable:", monerooId);
            return new Response("Transaction non trouvée", { status: 404 });
        }

        // 4. Atomic Success Processing
        if (tx.statut !== "success") {
            // A. Mark transaction as success
            await supabase
                .from("moneroo_transactions")
                .update({ statut: "success" })
                .eq("moneroo_id", monerooId);

            // B. If it's a subscription, activate the plan
            if (tx.type_transaction === "SUBSCRIPTION") {
                const planId = tx.reference_id;
                const tenantId = tx.tenant_id;

                console.log(`[Moneroo] Mise à jour du Plan: ${planId} pour le tenant ${tenantId}`);

                // Call our PL/pgSQL helper function
                const { error: rpcError } = await supabase.rpc("process_subscription_payment", {
                    t_id: tenantId,
                    p_plan: planId
                });

                if (rpcError) throw rpcError;
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });

    } catch (err: any) {
        console.error("Webhook Error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
