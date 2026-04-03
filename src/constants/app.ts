/** Nom produit affiché dans l’UI (chargement, titres). Surcharge via VITE_APP_NAME. */
export const APP_NAME: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_NAME) || 'GomboSwiftCI';
