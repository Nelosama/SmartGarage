/**
 * Formatea un número como moneda en Lempiras hondureñas (L).
 * Ejemplo: 1234.56 -> "L 1,234.56"
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  const value = Number(amount) || 0
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value).replace('HNL', 'L').trim()
}

/**
 * Formatea una fecha en formato legible en español.
 * Ejemplo: "2026-06-15" -> "15 de junio de 2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  // Verificar si la fecha es válida
  if (isNaN(d.getTime())) return '-'

  return new Intl.DateTimeFormat('es-HN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}
