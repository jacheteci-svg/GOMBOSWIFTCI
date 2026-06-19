export const importCommandesBulk = async (
  tenantId: string, 
  lignes: { nom: string; tel: string; commune: string; adresse: string; produit: Produit; qte: number; frais: number }[],
  agentAppelId?: string
) => {
  // It will import one by one
}
