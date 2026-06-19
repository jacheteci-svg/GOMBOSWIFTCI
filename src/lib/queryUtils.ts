
/**
 * Divise un tableau de paramètres en lots (batches) et exécute la requête pour chaque lot.
 * Permet d'éviter l'erreur d'URL trop longue avec les clauses .in() de postgrest.
 */
export async function runBatchedQuery<T, P>(
  items: P[],
  batchSize: number,
  queryFn: (batch: P[]) => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const { data, error } = await queryFn(batch);
    
    if (error) throw error;
    if (data) results.push(...data);
  }
  
  return results;
}
