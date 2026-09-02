import { format, parse } from 'date-fns'
import { es } from 'date-fns/locale'

/** Fecha local en formato YYYY-MM-DD a partir de un epoch ms. */
export function localDateKey(ts: number): string {
  return format(ts, 'yyyy-MM-dd')
}

/** Hora local HH:mm a partir de un epoch ms. */
export function localTime(ts: number): string {
  return format(ts, 'HH:mm')
}

/** Valor para <input type="datetime-local"> (sin zona horaria). */
export function toDatetimeLocalValue(ts: number): string {
  return format(ts, "yyyy-MM-dd'T'HH:mm")
}

/** Convierte el valor de <input type="datetime-local"> a epoch ms (hora local). */
export function fromDatetimeLocalValue(value: string): number {
  const d = parse(value, "yyyy-MM-dd'T'HH:mm", new Date())
  return d.getTime()
}

/** "miércoles, 2 de septiembre de 2025" (con inicial en mayúscula). */
export function longDate(ts: number | string): string {
  const d = typeof ts === 'string' ? parse(ts, 'yyyy-MM-dd', new Date()) : new Date(ts)
  const s = format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "mié 2 sep" corto. */
export function shortDate(ts: number | string): string {
  const d = typeof ts === 'string' ? parse(ts, 'yyyy-MM-dd', new Date()) : new Date(ts)
  return format(d, 'EEE d MMM', { locale: es })
}

export function monthTitle(year: number, month0: number): string {
  const s = format(new Date(year, month0, 1), 'LLLL yyyy', { locale: es })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const todayKey = () => localDateKey(Date.now())

export function addDaysKey(key: string, delta: number): string {
  const d = parse(key, 'yyyy-MM-dd', new Date())
  d.setDate(d.getDate() + delta)
  return format(d, 'yyyy-MM-dd')
}
