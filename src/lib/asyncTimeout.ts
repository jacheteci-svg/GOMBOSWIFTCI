/** Évite les promesses bloquées indéfiniment (API / réseau). Accepte les thenables (ex. client PostgREST). */
export function withTimeout<T>(promise: Promise<T> | PromiseLike<T>, ms: number, label = 'operation'): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`${label} — délai dépassé (${ms} ms)`));
    }, ms);
    Promise.resolve(promise)
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}
