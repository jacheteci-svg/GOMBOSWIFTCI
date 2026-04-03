import { Client, Commande } from '../types';
import { insforge } from '../lib/insforge';

export const getAllClients = async (tenantId: string): Promise<Client[]> => {
  const { data, error } = await insforge.database
    .from('clients')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nom_complet', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const getClientCommandes = async (tenantId: string, clientId: string): Promise<Commande[]> => {
  const { data, error } = await insforge.database
    .from('commandes')
    .select('*')
    .eq('client_id', clientId)
    .eq('tenant_id', tenantId)
    .order('date_creation', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const searchClientByPhone = async (tenantId: string, phone: string): Promise<Client | null> => {
  const { data, error } = await insforge.database
    .from('clients')
    .select('*')
    .eq('telephone', phone)
    .eq('tenant_id', tenantId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data || null;
};

export const createClient = async (tenantId: string, client: Omit<Client, 'id'>): Promise<string> => {
  const { data, error } = await insforge.database
    .from('clients')
    .insert([{ ...client, tenant_id: tenantId }])
    .select();
  
  if (error) throw new Error(error.message || 'Insertion client impossible.');
  const id = data?.[0]?.id;
  if (!id) throw new Error('Client créé mais identifiant non retourné.');
  return id;
};

export interface ClientFidelityStats {
  total_commandes: number;
  total_brut: number;      // All orders
  total_encaisse: number;  // Only livree/terminee
  panier_moyen: number;
  derniere_commande: Date | null;
  segment: 'Diamant 💎' | 'Fidèle ✅' | 'À relancer ⚠️' | 'Nouveau 🆕';
}

export const getClientsWithIntelligence = async (tenantId: string): Promise<(Client & ClientFidelityStats)[]> => {
  const [clients, allOrdersResult] = await Promise.all([
    getAllClients(tenantId),
    insforge.database.from('commandes').select('*').eq('tenant_id', tenantId)
  ]);

  const orders = allOrdersResult.data || [];

  // Group orders by client_id once (O(N) instead of O(N*M))
  const ordersByClient: Record<string, Commande[]> = {};
  orders.forEach(o => {
    if (!ordersByClient[o.client_id]) ordersByClient[o.client_id] = [];
    ordersByClient[o.client_id].push(o);
  });

  return clients.map(client => {
    const clientOrders = ordersByClient[client.id] || [];
    const total_brut = clientOrders.reduce((acc, o) => acc + (Number(o.montant_total) || 0), 0);
    const settledOrders = clientOrders.filter(o => ['livree', 'terminee'].includes(o.statut_commande));
    const total_encaisse = settledOrders.reduce((acc, o) => acc + (Number(o.montant_total) || 0), 0);
    const total_commandes = clientOrders.length;
    
    // Segmentation logic based on SETTLED orders for loyalty, but also potential for recruitment
    let segment: any = 'Nouveau 🆕';
    if (settledOrders.length >= 5 || total_encaisse > 150000) segment = 'Diamant 💎';
    else if (settledOrders.length >= 2) segment = 'Fidèle ✅';
    
    // Check for "At Risk" (last order > 60 days ago)
    const now = new Date();
    const lastOrderDate = settledOrders.length > 0 ? new Date(settledOrders[0].date_creation) : null;
    if (lastOrderDate && (now.getTime() - lastOrderDate.getTime()) > 60 * 24 * 60 * 60 * 1000) {
      segment = 'À relancer ⚠️';
    }

    return {
      ...client,
      total_commandes,
      total_brut,
      total_encaisse,
      panier_moyen: settledOrders.length > 0 ? Math.round(total_encaisse / settledOrders.length) : 0,
      derniere_commande: lastOrderDate,
      segment
    };
  });
};
