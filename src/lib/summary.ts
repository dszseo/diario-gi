import type { GiEvent, GasData, MealData, StoolData, SymptomData } from '../db/types'
import { bristolInfo } from './bristol'
import { labelOf } from './scales'

export const TYPE_META: Record<GiEvent['type'], { emoji: string; label: string; cls: string }> = {
  meal: { emoji: '🍽️', label: 'Comida', cls: 'b-meal' },
  stool: { emoji: '💩', label: 'Deposición', cls: 'b-stool' },
  gas: { emoji: '💨', label: 'Gases', cls: 'b-gas' },
  symptom: { emoji: '🤕', label: 'Síntoma', cls: 'b-symptom' },
}

/** Texto principal de la tarjeta de la línea temporal. */
export function mainText(ev: GiEvent): string {
  switch (ev.type) {
    case 'meal': {
      const d = ev.data as MealData
      const items = d.items ?? []
      if (!items.length) return '(sin detalle)'
      const base = items.map((i) => i.name).join(' + ')
      return d.amount ? `${base} · ${d.amount}` : base
    }
    case 'stool': {
      const d = ev.data as StoolData
      const info = bristolInfo(d.bristol)
      return info ? `Bristol ${d.bristol} — ${info.title.toLowerCase()}` : 'Deposición'
    }
    case 'gas': {
      const d = ev.data as GasData
      const parts: string[] = []
      if (d.intensity) parts.push(labelOf('gasIntensity', d.intensity))
      if (d.bloating && d.bloating !== 'none')
        parts.push(`hinchazón ${labelOf('bloating', d.bloating).toLowerCase()}`)
      return parts.join(' · ') || 'Gases'
    }
    case 'symptom': {
      const d = ev.data as SymptomData
      const i = d.intensity === undefined ? '' : ` · ${d.intensity}/10`
      return `${d.symptomType}${i}`
    }
  }
}

/** Línea secundaria opcional (detalles relevantes). */
export function subText(ev: GiEvent): string {
  const bits: string[] = []
  if (ev.type === 'stool') {
    const d = ev.data as StoolData
    if (d.urgency && d.urgency !== 'none')
      bits.push(`urgencia ${labelOf('urgency', d.urgency).toLowerCase()}`)
    if (d.strain && d.strain !== 'none')
      bits.push(`esfuerzo ${labelOf('strain', d.strain).toLowerCase()}`)
    if (d.incomplete) bits.push('evacuación incompleta')
    if (d.pain) bits.push('dolor')
    if (d.gasRelated) bits.push('gases relacionados')
  }
  if (ev.type === 'gas') {
    const d = ev.data as GasData
    if (d.belching) bits.push('eructos')
    if (d.flatulence) bits.push('flatulencia')
    if (d.pain) bits.push('dolor')
  }
  if (ev.type === 'symptom') {
    const d = ev.data as SymptomData
    if (d.durationMin) bits.push(`duración ${d.durationMin} min`)
  }
  if (ev.notes) bits.push(ev.notes)
  return bits.join(' · ')
}
