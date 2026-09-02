import { describe, expect, it } from 'vitest'
import { buildCsv, CSV_COLUMNS, eventToRow } from '../src/export/csv'
import type { GiEvent } from '../src/db/types'

const base = (over: Partial<GiEvent>): GiEvent => ({
  id: over.id ?? 'x',
  type: over.type ?? 'meal',
  ts: over.ts ?? new Date('2025-09-02T08:15:00').getTime(),
  localDate: over.localDate ?? '2025-09-02',
  notes: over.notes,
  data: over.data ?? { items: [] },
  createdAt: 0,
  updatedAt: 0,
})

describe('eventToRow', () => {
  it('comida: contenido y cantidad, campos de bristol vacíos', () => {
    const row = eventToRow(
      base({
        type: 'meal',
        data: { items: [{ name: 'Café con leche' }, { name: '2 magdalenas' }], amount: 'normal' },
      }),
    )
    expect(row.fecha).toBe('2025-09-02')
    expect(row.hora).toBe('08:15')
    expect(row.tipo).toBe('Comida')
    expect(row.contenido).toBe('Café con leche + 2 magdalenas')
    expect(row.cantidad).toBe('normal')
    expect(row.bristol).toBe('')
    expect(row.sintoma).toBe('')
  })

  it('deposición: bristol + escalas en español', () => {
    const row = eventToRow(
      base({
        type: 'stool',
        data: { bristol: 6, urgency: 'moderate', strain: 'mild', incomplete: true, pain: false },
      }),
    )
    expect(row.tipo).toBe('Deposición')
    expect(row.bristol).toBe('6')
    expect(row.bristol_desc).toBe('Blanda/pastosa')
    expect(row.urgencia).toBe('Moderada')
    expect(row.esfuerzo).toBe('Leve')
    expect(row.evacuacion_incompleta).toBe('Sí')
    expect(row.dolor).toBe('No')
    expect(row.contenido).toBe('')
  })

  it('gases: intensidad e hinchazón', () => {
    const row = eventToRow(
      base({ type: 'gas', data: { intensity: 'lots', bloating: 'intense', flatulence: true } }),
    )
    expect(row.tipo).toBe('Gases')
    expect(row.gases_intensidad).toBe('Mucho')
    expect(row.hinchazon).toBe('Intensa')
    expect(row.flatulencia).toBe('Sí')
  })

  it('síntoma: nombre libre e intensidad, incluso 0', () => {
    const row = eventToRow(
      base({ type: 'symptom', data: { symptomType: 'Retortijón raro', intensity: 0, durationMin: 30 } }),
    )
    expect(row.tipo).toBe('Síntoma')
    expect(row.sintoma).toBe('Retortijón raro')
    expect(row.intensidad).toBe('0')
    expect(row.duracion_min).toBe('30')
  })
})

describe('buildCsv', () => {
  const events: GiEvent[] = [
    base({ id: 'b', type: 'stool', ts: new Date('2025-09-02T11:40:00').getTime(), data: { bristol: 4 } }),
    base({
      id: 'a',
      type: 'meal',
      ts: new Date('2025-09-02T08:15:00').getTime(),
      data: { items: [{ name: 'Té' }] },
      notes: 'con "comillas", y coma',
    }),
  ]

  it('empieza con BOM, cabecera y filas ordenadas por hora', () => {
    const csv = buildCsv(events)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    const lines = csv.slice(1).split('\r\n')
    expect(lines[0]).toBe(CSV_COLUMNS.join(','))
    expect(lines[1].startsWith('2025-09-02,08:15,Comida,')).toBe(true)
    expect(lines[2].startsWith('2025-09-02,11:40,Deposición,')).toBe(true)
  })

  it('escapa comillas y comas en notas', () => {
    const csv = buildCsv(events)
    expect(csv).toContain('"con ""comillas"", y coma"')
  })

  it('soporta delimitador ; para Excel español', () => {
    const csv = buildCsv(events, { delimiter: ';' })
    expect(csv.slice(1).split('\r\n')[0]).toBe(CSV_COLUMNS.join(';'))
  })

  it('conserva acentos y caracteres españoles', () => {
    const csv = buildCsv([
      base({ type: 'meal', data: { items: [{ name: 'Piña, jamón y ñoquis' }] } }),
    ])
    expect(csv).toContain('Piña')
    expect(csv).toContain('jamón')
    expect(csv).toContain('ñoquis')
  })
})
