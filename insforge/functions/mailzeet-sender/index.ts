// Edge Function: mailzeet-sender
// Cette fonction tourne sur le backend sécurisé d'InsForge
// Elle reçoit une requête, valide les données, et appelle l'API Mailzeet

export default async function handler(req: Request): Promise<Response> {
  const MAILZEET_API_KEY = Deno.env.get('MAILZEET_API_KEY');
  const MAILZEET_API_URL = 'https://api.mailzeet.com/v1/emails/send';
  // 1. Gérer les requêtes CORS (Options)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { to, subject, body, templateId, variables } = await req.json();

    if (!to || (!body && !templateId)) {
      return new Response(JSON.stringify({ error: 'Données manquantes' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 2. Préparation du payload pour Mailzeet
    const payload = {
      to: to,
      subject: subject,
      ...(templateId ? { template_id: templateId, variables: variables } : { html: body })
    };

    // 3. Appel de l'API Mailzeet
    const response = await fetch(MAILZEET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILZEET_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      status: response.status,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
    });
  }
}
