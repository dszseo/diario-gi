import { describe, expect, it } from 'vitest'
import { resolveRange } from '../src/export/range'
import { localDateKey, addDaysKey } from '../src/lib/datetime'

describe('resolveRange', () => {
  const today = '2025-09-15'

  it('"todo" cubre desde el año 0 hasta el 9999', () => {
    const r = resolveRange('all', undefined, today)
    expect(r.fromKey < '2000-01-01').toBe(true)
    expect(r.toKey > '2100-01-01').toBe(true)
  })

  it('últimos 7 días = hoy y los 6 anteriores', () => {
    expect(resolveRange('7', undefined, today)).toEqual({ fromKey: '2025-09-09', toKey: today })
  })

  it('últimos 30 días', () => {
    expect(resolveRange('30', undefined, today)).toEqual({ fromKey: '2025-08-17', toKey: today })
  })

  it('personalizado respeta las fechas dadas', () => {
    expect(resolveRange('custom', { from: '2025-01-01', to: '2025-01-31' }, today)).toEqual({
      fromKey: '2025-01-01',
      toKey: '2025-01-31',
    })
  })

  it('personalizado invertido se ordena', () => {
    expect(resolveRange('custom', { from: '2025-02-10', to: '2025-02-01' }, today)).toEqual({
      fromKey: '2025-02-01',
      toKey: '2025-02-10',
    })
  })
})

describe('localDateKey', () => {
  it('usa la fecha local, no UTC', () => {
    const d = new Date(2025, 8, 2, 23, 30) // 2 sep 23:30 local
    expect(localDateKey(d.getTime())).toBe('2025-09-02')
  })
})

describe('addDaysKey', () => {
  it('cruza fin de mes', () => {
    expect(addDaysKey('2025-01-31', 1)).toBe('2025-02-01')
    expect(addDaysKey('2025-03-01', -1)).toBe('2025-02-28')
  })
})
