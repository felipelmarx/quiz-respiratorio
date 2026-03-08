import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { QuizProfile } from '@/lib/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProfileLabel(profile: QuizProfile): string {
  const labels: Record<QuizProfile, string> = {
    funcional: 'Respiração Funcional',
    atencao_moderada: 'Atenção Moderada',
    disfuncao: 'Disfunção Respiratória',
    disfuncao_severa: 'Disfunção Severa',
  }
  return labels[profile]
}

export function getProfileColor(profile: QuizProfile): string {
  const colors: Record<QuizProfile, string> = {
    funcional: 'text-green-600 bg-green-100',
    atencao_moderada: 'text-yellow-600 bg-yellow-100',
    disfuncao: 'text-orange-600 bg-orange-100',
    disfuncao_severa: 'text-red-600 bg-red-100',
  }
  return colors[profile]
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

export function generateCSV(
  headers: string[],
  rows: string[][]
): string {
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`
  const headerLine = headers.map(escape).join(',')
  const dataLines = rows.map((row) => row.map(escape).join(','))
  return [headerLine, ...dataLines].join('\n')
}
