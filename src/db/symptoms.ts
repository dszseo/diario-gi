import { db } from './db'
import type { SymptomType } from './types'
import { SYMPTOM_PRESETS } from '../lib/scales'

/** Incrementa el uso de un tipo de síntoma, creándolo si es personalizado. */
export async function bumpSymptomType(name: string): Promise<void> {
  const clean = name.trim()
  if (!clean) return
  const existing = await db.symptomTypes.get(clean)
  if (existing) {
    await db.symptomTypes.update(clean, { useCount: existing.useCount + 1 })
  } else {
    await db.symptomTypes.add({
      name: clean,
      useCount: 1,
      preset: SYMPTOM_PRESETS.includes(clean),
    })
  }
}

/** Lista para el selector: presets primero (en orden), luego personalizados por uso. */
export async function symptomOptions(): Promise<SymptomType[]> {
  const all = await db.symptomTypes.toArray()
  const presets = SYMPTOM_PRESETS.map(
    (name) => all.find((s) => s.name === name) ?? { name, useCount: 0, preset: true },
  )
  const custom = all
    .filter((s) => !SYMPTOM_PRESETS.includes(s.name))
    .sort((a, b) => b.useCount - a.useCount || a.name.localeCompare(b.name, 'es'))
  return [...presets, ...custom]
}

export async function deleteCustomSymptom(name: string): Promise<void> {
  if (SYMPTOM_PRESETS.includes(name)) return
  await db.symptomTypes.delete(name)
}
