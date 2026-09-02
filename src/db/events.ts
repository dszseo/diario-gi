import { db } from './db'
import type { EventData, EventType, GiEvent, MealData, SymptomData } from './types'
import { localDateKey } from '../lib/datetime'
import { registerFoods } from './foods'
import { bumpSymptomType } from './symptoms'

export interface EventInput {
  type: EventType
  ts: number
  notes?: string
  data: EventData
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

async function applySideEffects(input: EventInput): Promise<void> {
  if (input.type === 'meal') {
    const items = (input.data as MealData).items ?? []
    await registerFoods(items.map((i) => i.name), input.ts)
  }
  if (input.type === 'symptom') {
    const name = (input.data as SymptomData).symptomType?.trim()
    if (name) await bumpSymptomType(name)
  }
}

export async function createEvent(input: EventInput): Promise<string> {
  const now = Date.now()
  const ev: GiEvent = {
    id: uuid(),
    type: input.type,
    ts: input.ts,
    localDate: localDateKey(input.ts),
    notes: input.notes?.trim() || undefined,
    data: input.data,
    createdAt: now,
    updatedAt: now,
  }
  await db.events.add(ev)
  await applySideEffects(input)
  return ev.id
}

export async function updateEvent(id: string, input: EventInput): Promise<void> {
  await db.events.update(id, {
    type: input.type,
    ts: input.ts,
    localDate: localDateKey(input.ts),
    notes: input.notes?.trim() || undefined,
    data: input.data,
    updatedAt: Date.now(),
  })
  await applySideEffects(input)
}

export async function deleteEvent(id: string): Promise<void> {
  await db.events.delete(id)
}

export function getEvent(id: string): Promise<GiEvent | undefined> {
  return db.events.get(id)
}

/** Eventos de un día concreto, ordenados por hora ascendente. */
export async function eventsOfDay(dateKey: string): Promise<GiEvent[]> {
  const rows = await db.events.where('localDate').equals(dateKey).toArray()
  return rows.sort((a, b) => a.ts - b.ts)
}

/** Todos los días (YYYY-MM-DD) que tienen al menos un evento, con recuento por tipo. */
export async function daysWithEvents(): Promise<Map<string, Record<EventType, number>>> {
  const out = new Map<string, Record<EventType, number>>()
  await db.events.each((ev) => {
    const cur = out.get(ev.localDate) ?? { meal: 0, stool: 0, gas: 0, symptom: 0 }
    cur[ev.type]++
    out.set(ev.localDate, cur)
  })
  return out
}

/** Eventos dentro de un rango de fechas locales [fromKey, toKey] inclusive. */
export async function eventsInRange(fromKey: string, toKey: string): Promise<GiEvent[]> {
  const rows = await db.events.where('localDate').between(fromKey, toKey, true, true).toArray()
  return rows.sort((a, b) => a.ts - b.ts)
}

export function allEvents(): Promise<GiEvent[]> {
  return db.events.orderBy('ts').toArray()
}
