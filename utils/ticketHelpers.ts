import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

export const formatDate = (val?: string) => {
  if (!val) return '-'
  return format(new Date(val), 'dd MMM yyyy, HH:mm')
}

export const formatDateOnly = (val?: string) => {
  if (!val) return '-'
  return format(new Date(val), 'dd MMM yyyy')
}

export const formatRelativeTime = (val?: string) => {
  if (!val) return '-'
  return formatDistanceToNow(new Date(val), { addSuffix: true, locale: id })
}

export const getCategoryLabel = (category: string) => {
  const map: Record<string, string> = {
    top_up: 'Top Up Saldo',
    ad_account: 'Akun Iklan',
    technical: 'Masalah Teknis',
    other: 'Lainnya'
  }
  return map[category] || category.replace('_', ' ').toUpperCase()
}

export const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    open: 'Terbuka',
    in_progress: 'In Progress',
    answered: 'Dijawab',
    pending: 'Ditunda',
    closed: 'Ditutup',
    resolved: 'Selesai'
  }
  return map[status] || status
}

export const getStatusOutlineClass = (status: string) => {
  const base = "px-3 py-1 border rounded-lg font-bold text-[10px] tracking-widest whitespace-nowrap"
  if (status === 'open') return `${base} border-red-500 text-red-600 bg-red-50`
  if (status === 'in_progress') return `${base} border-orange-500 text-orange-600 bg-orange-50`
  if (status === 'answered' || status === 'resolved') return `${base} border-blue-500 text-blue-600 bg-blue-50`
  if (status === 'pending') return `${base} border-yellow-500 text-yellow-600 bg-yellow-50`
  if (status === 'closed') return `${base} border-ink-400 text-ink-600 bg-ink-50`
  return `${base} border-ink-300 text-ink-600 bg-white`
}

export const getPriorityClass = (priority: string) => {
  const base = "px-3 py-1 rounded-lg font-extrabold text-[10px] tracking-widest whitespace-nowrap"
  if (priority === 'high') return `${base} bg-red-100 text-red-700`
  if (priority === 'normal') return `${base} bg-green-100 text-green-700`
  if (priority === 'low') return `${base} bg-ink-100 text-ink-700`
  return `${base} bg-green-100 text-green-700`
}
