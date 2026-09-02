import { db, ensureSymptomPresets, SCHEMA_VERSION, setMeta } from '../db/db'
import type { BackupFile, GiEvent } from '../db/types'
import { localDateKey } from '../lib/datetime'

/** Volcado completo de la base de datos (para copia de seguridad y export JSON). */
export async function buildBackup(events?: GiEvent[]): Promise<BackupFile> {
  const [evAll, foods, favoriteMeals, symptomTypes] = await Promise.all([
    events ? Promise.resolve(events) : db.events.orderBy('ts').toArray(),
    db.foods.toArray(),
    db.favoriteMeals.toArray(),
    db.symptomTypes.toArray(),
  ])
  return {
    app: 'diario-gi',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    events: [...evAll].sort((a, b) => a.ts - b.ts),
    foods,
    favoriteMeals,
    symptomTypes,
  }
}

export function backupToString(b: BackupFile): string {
  return JSON.stringify(b, null, 2)
}

export interface ParsedBackup {
  file: BackupFile
  counts: { events: number; foods: number; favoriteMeals: number; symptomTypes: number }
}

/** Valida y normaliza un archivo de copia de seguridad. Lanza Error con mensaje claro. */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  const b = raw as Partial<BackupFile>
  if (!b || b.app !== 'diario-gi') {
    throw new Error('Este archivo no es una copia de seguridad de Diario GI.')
  }
  if (typeof b.schemaVersion !== 'number' || b.schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `Versión de copia (${b.schemaVersion}) no compatible con esta app (${SCHEMA_VERSION}).`,
    )
  }
  const events = Array.isArray(b.events) ? b.events : []
  const foods = Array.isArray(b.foods) ? b.foods : []
  const favoriteMeals = Array.isArray(b.favoriteMeals) ? b.favoriteMeals : []
  const symptomTypes = Array.isArray(b.symptomTypes) ? b.symptomTypes : []

  // Reparaciones defensivas.
  for (const ev of events) {
    if (!ev.localDate && typeof ev.ts === 'number') ev.localDate = localDateKey(ev.ts)
    if (!ev.createdAt) ev.createdAt = ev.ts ?? Date.now()
    if (!ev.updatedAt) ev.updatedAt = ev.createdAt
  }

  return {
    file: { app: 'diario-gi', schemaVersion: b.schemaVersion, exportedAt: b.exportedAt ?? '', events, foods, favoriteMeals, symptomTypes },
    counts: {
      events: events.length,
      foods: foods.length,
      favoriteMeals: favoriteMeals.length,
      symptomTypes: symptomTypes.length,
    },
  }
}

export type RestoreMode = 'replace' | 'merge'

/** Restaura los datos. 'replace' borra todo primero; 'merge' hace upsert por clave. */
export async function restoreBackup(file: BackupFile, mode: RestoreMode): Promise<void> {
  await db.transaction('rw', db.events, db.foods, db.favoriteMeals, db.symptomTypes, db.meta, async () => {
    if (mode === 'replace') {
      await Promise.all([
        db.events.clear(),
        db.foods.clear(),
        db.favoriteMeals.clear(),
        db.symptomTypes.clear(),
      ])
    }
    await db.events.bulkPut(file.events)
    await db.foods.bulkPut(file.foods)
    await db.favoriteMeals.bulkPut(file.favoriteMeals)
    await db.symptomTypes.bulkPut(file.symptomTypes)
  })
  await ensureSymptomPresets()
  await setMeta('lastRestoreAt', Date.now())
}

export function backupFilename(prefix = 'diario-gi-backup'): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${prefix}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`
}
