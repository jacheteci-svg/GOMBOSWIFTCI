export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Supprimer tous les espaces, tirets, points, parenthèses et caractères non numériques (sauf le +)
  let cleaned = phone.replace(/[\s\-\.\(\)]/g, '').trim();
  
  // Si le numéro commence par +, on garde le + et les chiffres
  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.replace(/\D/g, '');
  } else {
    // Sinon on ne garde que les chiffres
    cleaned = cleaned.replace(/\D/g, '');
  }
  
  return cleaned;
}
