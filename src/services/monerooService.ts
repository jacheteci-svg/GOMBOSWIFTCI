/**
 * Moneroo Payment Service
 * 
 * Centralizes all interactions with the Moneroo API for SaaS subscriptions.
 */

import { insforge } from '../lib/insforge';

const MONEROO_API_BASE = 'https://api.moneroo.io/v1';

// We recommend using environment variables for security.
// To be set in your .env.local file:
// VITE_MONEROO_PUBLIC_KEY="pk_..."
// (The Secret Key should only be used in Edge Functions, but for local/demo we'll assume a secure client-side check or backend proxy)
const PUBLIC_KEY = import.meta.env.VITE_MONEROO_PUBLIC_KEY || '';

export interface MonerooInitializationRequest {
    amount: number;
    currency: string;
    customer: {
        name: string;
        email: string;
    };
    reference_id: string; // The Plan ID or a unique transaction reference
    type: 'SUBSCRIPTION' | 'ORDER';
    tenant_id: string;
    return_url?: string;
}

export const monerooService = {
    /**
     * Step 1: Initialize a payment on Moneroo and get the checkout_url.
     * Since we don't have a backend proxy here, we'll use a secure client-side approach (temporary)
     * OR call an Edge Function if available.
     */
    initializeSubscription: async (req: MonerooInitializationRequest) => {
        try {
            // 1. Create a local record of the transaction attempt
            const { data: localTx, error: txError } = await insforge.database
                .from('moneroo_transactions')
                .insert({
                    tenant_id: req.tenant_id,
                    reference_id: req.reference_id,
                    type_transaction: req.type,
                    montant: req.amount,
                    devise: req.currency || 'XOF',
                    customer_email: req.customer.email,
                    statut: 'pending'
                })
                .select()
                .single();

            if (txError) throw txError;

            // 2. Call Moneroo API to get checkout URL
            const nameParts = (req.customer.name || '').trim().split(' ');
            const firstName = nameParts[0] || 'Client';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Gombo';

            const response = await fetch(`${MONEROO_API_BASE}/payments/initialize`, {
                method: 'POST',
                headers: {
                    // ATTENTION: Moneroo usually requires the SECRET KEY for initialization.
                    // If you get a 401, ensure VITE_MONEROO_PUBLIC_KEY is actually your secret key OR move this to an Edge Function.
                    'Authorization': `Bearer ${PUBLIC_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    amount: Math.round(Number(req.amount)),
                    currency: (req.currency || 'XOF').toUpperCase(),
                    description: `Abonnement SaaS GomboSwiftCI - Plan ${req.reference_id}`,
                    customer: {
                        first_name: firstName,
                        last_name: lastName,
                        email: req.customer.email
                    },
                    meta: {
                        tx_id: localTx.id,
                        tenant_id: req.tenant_id,
                        plan_id: req.reference_id
                    },
                    return_url: req.return_url || `${window.location.origin}/subscription-done`,
                    cancel_url: `${window.location.origin}/subscription-cancel`
                })
            });

            const monerooData = await response.json();
            
            if (!response.ok) {
                const errorMsg = monerooData.message || monerooData.error || 'Erreur API Moneroo';
                throw new Error(errorMsg);
            }

            const payload = monerooData.data || monerooData;

            if (payload && payload.checkout_url) {
                // 3. Update the local transaction with Moneroo's ID
                await insforge.database
                    .from('moneroo_transactions')
                    .update({ 
                        moneroo_id: payload.id, 
                        checkout_url: payload.checkout_url 
                    })
                    .eq('id', localTx.id);

                return payload.checkout_url;
            } else {
                throw new Error('Url de paiement non reçue de Moneroo');
            }
        } catch (error: any) {
            console.error("Moneroo initialization error:", error);
            throw error;
        }
    },

    /**
     * Step 2: Verify the payment status (manually or after redirection)
     */
    verifyPayment: async (monerooId: string, maxRetries = 15) => {
        try {
            // Polling: on interroge notre BDD locale jusqu'à ce que le Webhook ait fait l'UPDATE.
            // On vérifie 15 fois, avec 2 secondes de pause => 30 secondes d'attente maximum.
            for (let i = 0; i < maxRetries; i++) {
                const { data: tx, error } = await insforge.database
                    .from('moneroo_transactions')
                    .select('statut, type_transaction, tenant_id, reference_id')
                    .eq('moneroo_id', monerooId)
                    .maybeSingle();

                if (error) throw error;
                if (!tx) throw new Error("Transaction introuvable dans la base de données.");

                if (tx.statut === 'success') {
                    return { success: true, data: tx };
                }
                
                if (tx.statut === 'failed') {
                    return { success: false, data: tx, message: "Paiement échoué ou annulé." };
                }

                // Pause de 2 secondes
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Timeout : Le webhook n'a pas encore répondu
            throw new Error("L'opérateur met du temps à confirmer. Vérifiez votre abonnement dans quelques minutes.");

        } catch (error: any) {
            console.error("Erreur Verification Webhook Moneroo:", error);
            throw error;
        }
    }
};
