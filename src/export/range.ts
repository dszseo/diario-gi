import { addDaysKey, todayKey } from '../lib/datetime'

export type PeriodId = 'all' | '7' | '14' | '30' | 'custom'

export interface DateRange {
  fromKey: string // YYYY-MM-DD inclusive
  toKey: string // YYYY-MM-DD inclusive
}

export const PERIODS: { id: PeriodId; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: '7', label: 'Últimos 7 días' },
  { id: '14', label: 'Últimos 14 días' },
  { id: '30', label: 'Últimos 30 días' },
  { id: 'custom', label: 'Personalizado' },
]

const MIN_KEY = '0000-01-01'
const MAX_KEY = '9999-12-31'

/**
 * Resuelve un periodo a un rango de fechas locales inclusivo.
 * Para "últimos N días" el rango es [hoy - (N-1), hoy], es decir N días naturales
 * contando el de hoy.
 */
export function resolveRange(
  period: PeriodId,
  custom?: { from?: string; to?: string },
  today: string = todayKey(),
): DateRange {
  switch (period) {
    case 'all':
      return { fromKey: MIN_KEY, toKey: MAX_KEY }
    case '7':
      return { fromKey: addDaysKey(today, -6), toKey: today }
    case '14':
      return { fromKey: addDaysKey(today, -13), toKey: today }
    case '30':
      return { fromKey: addDaysKey(today, -29), toKey: today }
    case 'custom': {
      const from = custom?.from || MIN_KEY
      const to = custom?.to || today
      return from <= to
        ? { fromKey: from, toKey: to }
        : { fromKey: to, toKey: from }
    }
  }
}

export function rangeLabel(r: DateRange): string {
  const from = r.fromKey === MIN_KEY ? '(inicio)' : r.fromKey
  const to = r.toKey === MAX_KEY ? '(hoy)' : r.toKey
  return `${from} → ${to}`
}
