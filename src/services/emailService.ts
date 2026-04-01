import { insforge } from '../lib/insforge';

/**
 * Service pour l'envoi d'emails transactionnels via Mailzeet (Edge Functions)
 */
export const emailService = {
  /**
   * Envoie un email transactionnel via l'Edge Function dédiée
   * 
   * @param to Destinataire (ex: 'client@email.com')
   * @param subject Objet de l'email
   * @param options Corps HTML ou Template ID
   */
  async sendEmail(
    to: string, 
    subject: string, 
    options: { body?: string; templateId?: string; variables?: Record<string, any>; tenantId?: string }
  ) {
    try {
      // 1. Appel de l'Edge Function InsForge
      const { data, error: functionError } = await insforge.functions.invoke('mailzeet-sender', {
        body: {
          to,
          subject,
          body: options.body,
          templateId: options.templateId,
          variables: options.variables
        }
      });

      // 2. Journalisation dans la table email_logs (Base de données)
      const { error: dbError } = await insforge.database
        .from('email_logs')
        .insert({
          tenant_id: options.tenantId,
          recipient_email: to,
          subject: subject,
          template_id: options.templateId,
          status: functionError ? 'failed' : 'sent',
          error_message: functionError?.message || '',
          metadata: options.variables || {}
        });

      if (functionError) throw functionError;
      if (dbError) console.warn("Erreur de log email:", dbError);

      return { success: true, data };
    } catch (error: any) {
      console.error("Erreur d'envoi email:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Email de bienvenue lors d'une nouvelle inscription
   */
  async sendWelcomeEmail(to: string, nom: string, tenantName: string) {
    return this.sendEmail(to, `Bienvenue chez GomboSwift - ${tenantName}`, {
      templateId: 'welcome-tenant', // ID à créer dans Mailzeet
      variables: {
        nom: nom,
        organisation: tenantName,
        date: new Date().toLocaleDateString()
      }
    });
  },

  /**
   * Alerte de fin de période (Abonnement)
   */
  async sendExpirationWarning(to: string, tenantName: string, daysRemaining: number) {
    return this.sendEmail(to, `Alerte : Votre abonnement GomboSwift expire bientôt !`, {
      templateId: 'subscription-expiration',
      variables: {
        organisation: tenantName,
        jours: daysRemaining,
        link: `https://gomboswiftci.com/pricing`
      }
    });
  }
};
