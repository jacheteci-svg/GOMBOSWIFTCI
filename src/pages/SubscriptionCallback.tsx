import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { monerooService } from '../services/monerooService';
import { useToast } from '../contexts/ToastContext';
import { useSaas } from '../saas/SaasProvider';
import { CheckCircle, XCircle, Loader, ArrowRight } from 'lucide-react';

export const SubscriptionCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { refreshSaasData, tenant } = useSaas();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    const monerooId = searchParams.get('id'); // Moneroo usually appends ?id=...

    useEffect(() => {
        const verify = async () => {
            if (!monerooId) {
                setStatus('error');
                setErrorMsg("ID de transaction manquant.");
                return;
            }

            try {
                const result = await monerooService.verifyPayment(monerooId);
                if (result.success) {
                    await refreshSaasData(); // Reload tenant data to see the new plan
                    setStatus('success');
                    showToast("Paiement confirmé ! Votre abonnement a été mis à jour.", "success");
                } else {
                    setStatus('error');
                    setErrorMsg("Le paiement n'a pas pu être validé ou a échoué.");
                }
            } catch (err: any) {
                setStatus('error');
                setErrorMsg(err.message || "Erreur lors de la vérification.");
            }
        };

        verify();
    }, [monerooId]);

    const handleContinue = () => {
        if (tenant?.slug) {
            navigate(`/${tenant.slug}/admin`);
        } else {
            navigate('/');
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#f8fafc', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div className="card glass-effect" style={{ 
                maxWidth: '500px', 
                width: '100%', 
                padding: '3rem', 
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)'
            }}>
                {status === 'loading' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                            <Loader className="spinner" size={60} color="var(--primary)" />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 850 }}>Vérification en cours...</h2>
                        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
                            Nous confirmons votre transaction avec Moneroo. Veuillez ne pas fermer cette page.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                            <div style={{ 
                                background: 'rgba(16,185,129,0.1)', 
                                padding: '1.5rem', 
                                borderRadius: '50%',
                                border: '2px solid rgba(16,185,129,0.2)'
                            }}>
                                <CheckCircle size={60} color="#10b981" />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: '#10b981' }}>Félicitations !</h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginTop: '1rem', fontWeight: 500 }}>
                            Votre abonnement a été activé avec succès. Vous avez désormais accès à toutes les fonctionnalités de votre nouveau forfait.
                        </p>
                        <button 
                            onClick={handleContinue}
                            className="btn btn-primary"
                            style={{ 
                                width: '100%', 
                                marginTop: '2.5rem', 
                                height: '60px', 
                                borderRadius: '16px', 
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.8rem'
                            }}
                        >
                            Accéder à mon espace <ArrowRight size={20} />
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                            <div style={{ 
                                background: 'rgba(239,68,68,0.1)', 
                                padding: '1.5rem', 
                                borderRadius: '50%',
                                border: '2px solid rgba(239,68,68,0.2)'
                            }}>
                                <XCircle size={60} color="#ef4444" />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 950, color: '#ef4444' }}>Oups !</h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginTop: '1rem', fontWeight: 500 }}>
                            {errorMsg || "Une erreur est survenue lors de la validation de votre paiement."}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                            <button 
                                onClick={() => navigate(-1)}
                                className="btn btn-outline"
                                style={{ flex: 1, height: '56px', borderRadius: '14px', fontWeight: 700 }}
                            >
                                Réessayer
                            </button>
                            <button 
                                onClick={handleContinue}
                                className="btn btn-primary"
                                style={{ flex: 1, height: '56px', borderRadius: '14px', fontWeight: 700 }}
                            >
                                Retour
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
