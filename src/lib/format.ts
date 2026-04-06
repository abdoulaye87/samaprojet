/**
 * Utilitaires de formatage — Sama Économie V2
 */

/** Formate un nombre en FCFA : "1 234 567 FCFA" */
export function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(n) + ' FCFA';
}

/** Formate un nombre avec décimales */
export function fmtDecimal(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + ' FCFA';
}

/** Formate un pourcentage */
export function pct(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'always',
  }).format(n) + '%';
}

/** Formate une date ISO */
export function fmtDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Formate une date courte */
export function fmtDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

/** Retourne la couleur CSS pour un type de transaction */
export function txColor(type: string): string {
  const colors: Record<string, string> = {
    pret: 'text-amber-600',
    remboursement: 'text-emerald-600',
    achat: 'text-blue-600',
    vente: 'text-green-600',
    transfert: 'text-purple-600',
    don: 'text-pink-600',
    taxe: 'text-red-600',
    frais_judiciaire: 'text-red-800',
    jeu: 'text-indigo-600',
  };
  return colors[type] || 'text-gray-600';
}

/** Libellé français d'un type de transaction */
export function txLabel(type: string): string {
  const labels: Record<string, string> = {
    pret: 'Prêt',
    remboursement: 'Remboursement',
    achat: 'Achat',
    vente: 'Vente',
    transfert: 'Transfert',
    don: 'Don',
    taxe: 'Taxe',
    frais_judiciaire: 'Frais judiciaire',
    jeu: 'Pari',
  };
  return labels[type] || type;
}

/** Libellé d'un statut */
export function statusLabel(s: string): string {
  const labels: Record<string, string> = {
    active: 'Actif',
    pending: 'En attente',
    pending_approval: 'En attente de validation',
    paid: 'Payé',
    defaulted: 'Défaillant',
    succeeded: 'Réussi',
    failed: 'Échoué',
    abandoned: 'Abandonné',
    owned: 'Possédé',
    seized: 'Saisi',
    sold: 'Vendu',
    open: 'Ouvert',
    in_progress: 'En cours',
    closed: 'Fermé',
    expired: 'Expiré',
    available: 'Disponible',
    completed: 'Terminé',
    cancelled: 'Annulé',
    accepted: 'Accepté',
    rejected: 'Rejeté',
    suspended: 'Suspendu',
    banned: 'Banni',
  };
  return labels[s] || s;
}

/** Couleur de badge pour un statut */
export function statusColor(s: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    pending_approval: 'bg-amber-100 text-amber-800',
    paid: 'bg-emerald-100 text-emerald-800',
    defaulted: 'bg-red-100 text-red-800',
    succeeded: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    abandoned: 'bg-gray-100 text-gray-800',
    owned: 'bg-blue-100 text-blue-800',
    open: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[s] || 'bg-gray-100 text-gray-800';
}

/** Catégorie en emoji */
export function categoryEmoji(cat: string): string {
  const emojis: Record<string, string> = {
    commerce: '🏪',
    elevage: '🐔',
    transport: '🚗',
    agriculture: '🌾',
    technologie: '💻',
    immobilier: '🏗️',
    or: '🥇',
    diamant: '💎',
    vehicule: '🚘',
    luxe: '✨',
    alimentaire: '🍌',
    materiel: '🔧',
    produit: '📦',
    service: '🛠️',
    emploi: '💼',
    partenariat: '🤝',
  };
  return emojis[cat] || '📋';
}
