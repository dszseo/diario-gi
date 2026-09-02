import Dexie, { type Table } from 'dexie'
import type { FavoriteMeal, Food, GiEvent, MetaEntry, SymptomType } from './types'
import { SYMPTOM_PRESETS } from '../lib/scales'

export const SCHEMA_VERSION = 1

export class DiarioDB extends Dexie {
  events!: Table<GiEvent, string>
  foods!: Table<Food, string>
  favoriteMeals!: Table<FavoriteMeal, string>
  symptomTypes!: Table<SymptomType, string>
  meta!: Table<MetaEntry, string>

  constructor() {
    super('diario-gi')
    this.version(1).stores({
      events: 'id, ts, localDate, type, [localDate+ts]',
      foods: 'key, name, useCount, lastUsed',
      favoriteMeals: 'id, name, createdAt',
      symptomTypes: 'name, useCount',
      meta: 'key',
    })
    this.on('populate', () => {
      this.symptomTypes.bulkAdd(
        SYMPTOM_PRESETS.map((name) => ({ name, useCount: 0, preset: true })),
      )
    })
  }
}

export const db = new DiarioDB()

/** Asegura que los síntomas preset existen (útil tras una restauración parcial). */
export async function ensureSymptomPresets(): Promise<void> {
  const existing = new Set((await db.symptomTypes.toArray()).map((s) => s.name))
  const missing = SYMPTOM_PRESETS.filter((n) => !existing.has(n)).map((name) => ({
    name,
    useCount: 0,
    preset: true,
  }))
  if (missing.length) await db.symptomTypes.bulkAdd(missing)
}

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await db.meta.get(key)
  return row ? (row.value as T) : fallback
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value })
}
