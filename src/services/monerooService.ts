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
                    devise: req.currency,
                    customer_email: req.customer.email,
                    statut: 'pending'
                })
                .select()
                .single();

            if (txError) throw txError;

            // 2. Call Moneroo API to get checkout URL
            // Moneroo usually requires first_name, last_name, email in the customer object.
            const nameParts = (req.customer.name || '').trim().split(' ');
            const firstName = nameParts[0] || 'Client';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Nexus';

            const response = await fetch(`${MONEROO_API_BASE}/payments/initialize`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PUBLIC_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: Number(req.amount),
                    currency: req.currency || 'XOF',
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

            if (monerooData.checkout_url) {
                // 3. Update the local transaction with Moneroo's ID
                await insforge.database
                    .from('moneroo_transactions')
                    .update({ 
                        moneroo_id: monerooData.id, 
                        checkout_url: monerooData.checkout_url 
                    })
                    .eq('id', localTx.id);

                return monerooData.checkout_url;
            } else {
                throw new Error(monerooData.message || 'Échec de l\'initialisation du paiement');
            }
        } catch (error: any) {
            console.error("Moneroo initialization error:", error);
            throw error;
        }
    },

    /**
     * Step 2: Verify the payment status (manually or after redirection)
     */
    verifyPayment: async (monerooId: string) => {
        try {
            // Note: In a production app, this should be done in an Edge Function
            const response = await fetch(`${MONEROO_API_BASE}/payments/${monerooId}`, {
                headers: {
                    'Authorization': `Bearer ${PUBLIC_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

            if (data.status === 'success') {
                // Update local transaction
                const { data: updatedTx, error: txError } = await insforge.database
                    .from('moneroo_transactions')
                    .update({ statut: 'success' })
                    .eq('moneroo_id', monerooId)
                    .select()
                    .single();
                
                if (txError) throw txError;

                // Sync the plan automatically in the database (via helper function)
                if (updatedTx.type_transaction === 'SUBSCRIPTION') {
                    await insforge.database.rpc('process_subscription_payment', {
                        t_id: updatedTx.tenant_id,
                        p_plan: updatedTx.reference_id
                    });
                }

                return { success: true, data };
            }

            return { success: false, data };
        } catch (error) {
            console.error("Moneroo verification error:", error);
            throw error;
        }
    }
};
