import Papa from 'papaparse'
import type { GiEvent, GasData, MealData, StoolData, SymptomData } from '../db/types'
import { localDateKey, localTime } from '../lib/datetime'
import { bristolInfo } from '../lib/bristol'
import { labelOf, yesNo } from '../lib/scales'

export const CSV_COLUMNS = [
  'fecha',
  'hora',
  'tipo',
  'contenido',
  'cantidad',
  'bristol',
  'bristol_desc',
  'urgencia',
  'esfuerzo',
  'evacuacion_incompleta',
  'dolor',
  'gases_intensidad',
  'hinchazon',
  'eructos',
  'flatulencia',
  'sintoma',
  'intensidad',
  'duracion_min',
  'notas',
] as const

export type CsvRow = Record<(typeof CSV_COLUMNS)[number], string>

const TYPE_LABEL: Record<GiEvent['type'], string> = {
  meal: 'Comida',
  stool: 'Deposición',
  gas: 'Gases',
  symptom: 'Síntoma',
}

function emptyRow(): CsvRow {
  return Object.fromEntries(CSV_COLUMNS.map((c) => [c, ''])) as CsvRow
}

export function eventToRow(ev: GiEvent): CsvRow {
  const row = emptyRow()
  row.fecha = localDateKey(ev.ts)
  row.hora = localTime(ev.ts)
  row.tipo = TYPE_LABEL[ev.type]
  row.notas = ev.notes ?? ''

  if (ev.type === 'meal') {
    const d = ev.data as MealData
    row.contenido = (d.items ?? []).map((i) => i.name.trim()).filter(Boolean).join(' + ')
    row.cantidad = d.amount?.trim() ?? ''
  } else if (ev.type === 'stool') {
    const d = ev.data as StoolData
    const info = bristolInfo(d.bristol)
    row.bristol = d.bristol ? String(d.bristol) : ''
    row.bristol_desc = info ? info.title : ''
    row.urgencia = labelOf('urgency', d.urgency)
    row.esfuerzo = labelOf('strain', d.strain)
    row.evacuacion_incompleta = yesNo(d.incomplete)
    row.dolor = yesNo(d.pain)
    if (d.gasRelated !== undefined) row.gases_intensidad = d.gasRelated ? 'Sí' : 'No'
  } else if (ev.type === 'gas') {
    const d = ev.data as GasData
    row.gases_intensidad = labelOf('gasIntensity', d.intensity)
    row.hinchazon = labelOf('bloating', d.bloating)
    row.eructos = yesNo(d.belching)
    row.flatulencia = yesNo(d.flatulence)
    row.dolor = yesNo(d.pain)
  } else if (ev.type === 'symptom') {
    const d = ev.data as SymptomData
    row.sintoma = d.symptomType ?? ''
    row.intensidad = d.intensity === undefined ? '' : String(d.intensity)
    row.duracion_min = d.durationMin === undefined ? '' : String(d.durationMin)
  }
  return row
}

export interface CsvOptions {
  delimiter?: ',' | ';'
  bom?: boolean
}

/** Marca de orden de bytes UTF-8 (para que Excel abra el CSV con acentos correctos). */
export const BOM = String.fromCharCode(0xfeff)

/** Genera el texto CSV. Filas ordenadas por hora ascendente. UTF-8 con BOM por defecto. */
export function buildCsv(events: GiEvent[], opts: CsvOptions = {}): string {
  const delimiter = opts.delimiter ?? ','
  const bom = opts.bom ?? true
  const rows = [...events].sort((a, b) => a.ts - b.ts).map(eventToRow)
  const body = Papa.unparse(
    { fields: [...CSV_COLUMNS], data: rows.map((r) => CSV_COLUMNS.map((c) => r[c])) },
    { delimiter, newline: '\r\n', quotes: false },
  )
  return (bom ? BOM : '') + body
}
