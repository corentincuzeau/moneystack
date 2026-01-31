export const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
];

export const ACCOUNT_ICONS = [
  'bank',
  'wallet',
  'piggy-bank',
  'credit-card',
  'cash',
  'building',
  'landmark',
  'briefcase',
  'safe',
  'coins',
];

export const CATEGORY_ICONS = {
  income: [
    'briefcase',
    'trending-up',
    'gift',
    'award',
    'dollar-sign',
    'percent',
  ],
  expense: [
    'shopping-cart',
    'home',
    'car',
    'utensils',
    'film',
    'heart',
    'book',
    'plane',
    'smartphone',
    'wifi',
    'zap',
    'droplet',
    'thermometer',
    'shirt',
    'scissors',
    'dumbbell',
    'pill',
    'dog',
    'baby',
    'graduation-cap',
  ],
};

export const DEFAULT_CATEGORIES = {
  income: [
    { name: 'Salaire', icon: 'briefcase', color: '#10B981' },
    { name: 'Freelance', icon: 'laptop', color: '#3B82F6' },
    { name: 'Investissements', icon: 'trending-up', color: '#8B5CF6' },
    { name: 'Cadeaux', icon: 'gift', color: '#EC4899' },
    { name: 'Remboursements', icon: 'rotate-ccw', color: '#06B6D4' },
    { name: 'Autres revenus', icon: 'plus-circle', color: '#6366F1' },
  ],
  expense: [
    { name: 'Alimentation', icon: 'utensils', color: '#F59E0B' },
    { name: 'Transport', icon: 'car', color: '#3B82F6' },
    { name: 'Logement', icon: 'home', color: '#10B981' },
    { name: 'Santé', icon: 'heart', color: '#EF4444' },
    { name: 'Loisirs', icon: 'film', color: '#8B5CF6' },
    { name: 'Shopping', icon: 'shopping-cart', color: '#EC4899' },
    { name: 'Restaurants', icon: 'coffee', color: '#F97316' },
    { name: 'Abonnements', icon: 'tv', color: '#06B6D4' },
    { name: 'Éducation', icon: 'book', color: '#6366F1' },
    { name: 'Voyages', icon: 'plane', color: '#84CC16' },
    { name: 'Factures', icon: 'file-text', color: '#64748B' },
    { name: 'Autres dépenses', icon: 'more-horizontal', color: '#94A3B8' },
  ],
};

export const SUBSCRIPTION_PRESETS = [
  { name: 'Netflix', icon: 'tv', color: '#E50914', defaultAmount: 13.49 },
  { name: 'Spotify', icon: 'music', color: '#1DB954', defaultAmount: 10.99 },
  { name: 'Amazon Prime', icon: 'package', color: '#FF9900', defaultAmount: 6.99 },
  { name: 'Disney+', icon: 'tv', color: '#113CCF', defaultAmount: 8.99 },
  { name: 'Apple Music', icon: 'music', color: '#FC3C44', defaultAmount: 10.99 },
  { name: 'YouTube Premium', icon: 'youtube', color: '#FF0000', defaultAmount: 12.99 },
  { name: 'Canal+', icon: 'tv', color: '#000000', defaultAmount: 24.99 },
  { name: 'Gym', icon: 'dumbbell', color: '#F97316', defaultAmount: 29.99 },
  { name: 'Cloud Storage', icon: 'cloud', color: '#3B82F6', defaultAmount: 2.99 },
  { name: 'Assurance', icon: 'shield', color: '#10B981', defaultAmount: 50.0 },
];

export const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Quotidien',
  WEEKLY: 'Hebdomadaire',
  BIWEEKLY: 'Bimensuel',
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  YEARLY: 'Annuel',
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Compte courant',
  SAVINGS: 'Épargne',
  CASH: 'Espèces',
  INVESTMENT: 'Investissement',
  CREDIT_CARD: 'Carte de crédit',
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Revenu',
  EXPENSE: 'Dépense',
  TRANSFER: 'Transfert',
};

export const CREDIT_TYPE_LABELS: Record<string, string> = {
  MORTGAGE: 'Immobilier',
  AUTO: 'Auto',
  PERSONAL: 'Personnel',
  STUDENT: 'Étudiant',
  OTHER: 'Autre',
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'En cours',
  COMPLETED: 'Terminé',
  PAUSED: 'En pause',
  CANCELLED: 'Annulé',
};

export const LOW_BALANCE_THRESHOLD_DEFAULT = 100;
export const REMINDER_DAYS_DEFAULT = 3;
export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;
