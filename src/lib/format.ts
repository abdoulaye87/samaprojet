/**
 * Utilitaires de formatage pour le dashboard économique
 */

/** Formate un nombre en "1 234 F" (locale française, sans décimales) */
export function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(n) + ' F';
}

/** Formate un nombre avec 2 décimales "1 234,56 F" */
export function fmtDecimal(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + ' F';
}

/** Formate un nombre en pourcentage "2,0%" */
export function pct(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'always',
  }).format(n) + '%';
}

/** Retourne les classes de couleur Tailwind selon le type de transaction */
export function typeColor(type: string): string {
  const colors: Record<string, string> = {
    achat: 'bg-blue-500 text-blue-500',
    vente: 'bg-green-500 text-green-500',
    pret: 'bg-amber-500 text-amber-500',
    remboursement: 'bg-emerald-500 text-emerald-500',
    crash: 'bg-red-500 text-red-500',
    inflation: 'bg-purple-500 text-purple-500',
    depot: 'bg-emerald-500 text-emerald-500',
    info: 'bg-gray-500 text-gray-500',
    creation: 'bg-pink-500 text-pink-500',
  };
  return colors[type] || 'bg-gray-400 text-gray-400';
}

/** Retourne le libellé français d'un type de transaction */
export function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    achat: 'Achat',
    vente: 'Vente',
    pret: 'Prêt',
    remboursement: 'Remboursement',
    crash: 'Crash',
    inflation: 'Inflation',
    depot: 'Dépôt',
    info: 'Info',
    creation: 'Création',
  };
  return labels[type] || type;
}

/** Formate une date ISO en format lisible */
export function fmtDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
