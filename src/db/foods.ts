import { db } from './db'
import type { Food } from './types'

// Marcas diacríticas combinantes U+0300–U+036F (se escribe con escapes para robustez).
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')

/** Normaliza para buscar/deduplicar: minúsculas, sin acentos, espacios colapsados. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/** Registra (o incrementa) los alimentos usados en una comida. */
export async function registerFoods(names: string[], ts: number): Promise<void> {
  const seen = new Set<string>()
  for (const raw of names) {
    const name = raw.trim()
    if (!name) continue
    const key = normalize(name)
    if (!key || seen.has(key)) continue
    seen.add(key)
    const existing = await db.foods.get(key)
    if (existing) {
      await db.foods.update(key, {
        name,
        useCount: existing.useCount + 1,
        lastUsed: Math.max(existing.lastUsed, ts),
      })
    } else {
      await db.foods.add({ key, name, useCount: 1, lastUsed: ts })
    }
  }
}

/** Sugerencias de alimentos para el autocompletado, ordenadas por uso y recencia. */
export async function suggestFoods(query: string, limit = 8): Promise<Food[]> {
  const q = normalize(query)
  const all = await db.foods.toArray()
  const scored = all
    .filter((f) => (q ? f.key.includes(q) : true))
    .sort((a, b) => {
      if (q) {
        const aStarts = a.key.startsWith(q) ? 0 : 1
        const bStarts = b.key.startsWith(q) ? 0 : 1
        if (aStarts !== bStarts) return aStarts - bStarts
      }
      if (b.useCount !== a.useCount) return b.useCount - a.useCount
      return b.lastUsed - a.lastUsed
    })
  return scored.slice(0, limit)
}

export function allFoods(): Promise<Food[]> {
  return db.foods.orderBy('name').toArray()
}

export function deleteFood(key: string): Promise<void> {
  return db.foods.delete(key)
}
