import type { Bloating, GasIntensity, Level4 } from '../lib/scales'

export type EventType = 'meal' | 'stool' | 'gas' | 'symptom'

export interface MealItem {
  name: string
}

export interface MealData {
  items: MealItem[]
  amount?: string // cantidad (opcional, a nivel de comida)
}

export interface StoolData {
  bristol?: number // 1..7
  urgency?: Level4
  strain?: Level4
  incomplete?: boolean
  pain?: boolean
  gasRelated?: boolean
}

export interface GasData {
  intensity?: GasIntensity
  bloating?: Bloating
  belching?: boolean
  flatulence?: boolean
  pain?: boolean
}

export interface SymptomData {
  symptomType: string
  intensity?: number // 0..10
  durationMin?: number
}

export type EventData = MealData | StoolData | GasData | SymptomData

export interface GiEvent {
  id: string
  type: EventType
  ts: number // epoch ms del acontecimiento
  localDate: string // YYYY-MM-DD (hora local) — índice para día/calendario
  notes?: string
  data: EventData
  createdAt: number
  updatedAt: number
}

export interface Food {
  key: string // nombre normalizado (minúsculas, sin acentos)
  name: string // como lo escribió el usuario la última vez
  useCount: number
  lastUsed: number
}

export interface FavoriteMeal {
  id: string
  name: string
  items: MealItem[]
  createdAt: number
}

export interface SymptomType {
  name: string
  useCount: number
  preset: boolean
}

export interface MetaEntry {
  key: string
  value: unknown
}

export interface BackupFile {
  app: 'diario-gi'
  schemaVersion: number
  exportedAt: string
  events: GiEvent[]
  foods: Food[]
  favoriteMeals: FavoriteMeal[]
  symptomTypes: SymptomType[]
}
