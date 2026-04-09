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
            background: '#020617', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'Outfit, sans-serif'
        }}>
            <div className="card-elite" style={{ 
                maxWidth: '550px', 
                width: '100%', 
                padding: '4rem', 
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(30px)',
                borderRadius: '50px',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)',
                animation: 'modalScale 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {status === 'loading' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
                            <div style={{ position: 'relative' }}>
                               <Loader className="animate-spin text-cyan-500" size={80} strokeWidth={1} />
                               <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div className="size-4 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_20px_#06b6d4]"></div>
                               </div>
                            </div>
                        </div>
                        <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'white', letterSpacing: '-0.04em' }}>Vérification <span className="text-slate-500">en cours</span></h2>
                        <p style={{ color: '#94a3b8', marginTop: '1.5rem', fontSize: '1.1rem', fontWeight: 500, lineHeight: 1.6 }}>
                            Nous confirmons votre transaction avec Moneroo via nos serveurs sécurisés. 
                            Veuillez patienter quelques instants...
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
                            <div style={{ 
                                background: 'rgba(16,185,129,0.1)', 
                                padding: '2rem', 
                                borderRadius: '40px',
                                border: '1px solid rgba(16,185,129,0.2)',
                                boxShadow: '0 0 50px rgba(16,185,129,0.1)'
                            }}>
                                <CheckCircle size={70} color="#10b981" />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '3.2rem', fontWeight: 950, color: 'white', letterSpacing: '-0.05em' }}>Success !</h2>
                        <p style={{ fontSize: '1.2rem', color: '#cbd5e1', marginTop: '1.5rem', fontWeight: 500, lineHeight: 1.6 }}>
                            Votre abonnement <span className="text-emerald-400 font-black">Gombo Premium</span> est maintenant actif. 
                            Préparez-vous à transformer votre logistique.
                        </p>
                        <button 
                            onClick={handleContinue}
                            className="gombo-glow-button"
                            style={{ 
                                width: '100%', 
                                marginTop: '3.5rem', 
                                height: '75px', 
                                borderRadius: '24px', 
                                fontWeight: 950,
                                fontSize: '1.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '1rem',
                                boxShadow: '0 20px 40px rgba(6,182,212,0.3)',
                                cursor: 'pointer'
                            }}
                        >
                            Accéder au Dashboard <ArrowRight size={24} />
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
                            <div style={{ 
                                background: 'rgba(244,63,94,0.1)', 
                                padding: '2rem', 
                                borderRadius: '40px',
                                border: '1px solid rgba(244,63,94,0.2)',
                                boxShadow: '0 0 50px rgba(244,63,94,0.1)'
                            }}>
                                <XCircle size={70} color="#f43f5e" />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '2.8rem', fontWeight: 950, color: 'white', letterSpacing: '-0.04em' }}>Échec</h2>
                        <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginTop: '1.5rem', fontWeight: 500, lineHeight: 1.6 }}>
                            {errorMsg || "Une anomalie a été détectée lors du traitement de votre flux de paiement."}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '3.5rem' }}>
                            <button 
                                onClick={() => navigate(-1)}
                                style={{ 
                                    width: '100%', 
                                    height: '65px', 
                                    borderRadius: '20px', 
                                    background: 'white', 
                                    color: 'black', 
                                    fontWeight: 950, 
                                    fontSize: '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Réessayer le paiement
                            </button>
                            <button 
                                onClick={handleContinue}
                                style={{ 
                                    width: '100%', 
                                    height: '65px', 
                                    borderRadius: '20px', 
                                    background: 'rgba(255,255,255,0.05)', 
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', 
                                    fontWeight: 900, 
                                    fontSize: '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Retour à l'accueil
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
