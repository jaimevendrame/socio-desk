// Domain-specific colors for Socio Desk
// Based on: socio-desk-standards.md

// Member status colors
export const memberStatusColors = {
  ativo: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: 'text-green-600',
  },
  inadimplente: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: 'text-red-600',
  },
  suspenso: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
  },
  cancelado: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    icon: 'text-gray-500',
  },
} as const;

// Reservation status colors
export const reservationStatusColors = {
  pendente: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    icon: 'text-yellow-500',
  },
  confirmada: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: 'text-blue-500',
  },
  cancelada: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-200',
    icon: 'text-gray-400',
  },
  concluida: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: 'text-green-500',
  },
} as const;

// Payment status colors
export const paymentStatusColors = {
  pending: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    icon: 'text-yellow-500',
  },
  paid: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: 'text-green-500',
  },
  overdue: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: 'text-red-500',
  },
  cancelled: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-200',
    icon: 'text-gray-400',
  },
} as const;

// Space category colors
export const spaceCategoryColors = {
  esportivo: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    icon: 'text-emerald-500',
  },
  social: {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    icon: 'text-purple-500',
  },
  equipamento: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    icon: 'text-amber-500',
  },
} as const;
