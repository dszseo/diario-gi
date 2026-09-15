// Escalas y etiquetas en español. Los valores internos son estables (para exportar
// de forma coherente) y las etiquetas son las que ve el usuario / salen en el CSV.

export type Level4 = 'none' | 'mild' | 'moderate' | 'strong'
export type GasIntensity = 'none' | 'mild' | 'moderate' | 'lots'
export type Bloating = 'none' | 'mild' | 'moderate' | 'intense'

export const URGENCY: { value: Level4; label: string }[] = [
  { value: 'none', label: 'Ninguna' },
  { value: 'mild', label: 'Leve' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'strong', label: 'Fuerte' },
]

export const STRAIN: { value: Level4; label: string }[] = [
  { value: 'none', label: 'Ninguno' },
  { value: 'mild', label: 'Leve' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'strong', label: 'Fuerte' },
]

export const GAS_INTENSITY: { value: GasIntensity; label: string }[] = [
  { value: 'none', label: 'Nada' },
  { value: 'mild', label: 'Leve' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'lots', label: 'Mucho' },
]

export const BLOATING: { value: Bloating; label: string }[] = [
  { value: 'none', label: 'Ninguna' },
  { value: 'mild', label: 'Leve' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'intense', label: 'Intensa' },
]

export type Portion = 'ligera' | 'normal' | 'copiosa'

export const PORTION: { value: Portion; label: string }[] = [
  { value: 'ligera', label: 'Ligera' },
  { value: 'normal', label: 'Normal' },
  { value: 'copiosa', label: 'Copiosa' },
]

// Cosas típicas que pueden sentar mal, no una lista exhaustiva de alérgenos.
export type MealTrigger = 'gluten' | 'lactosa' | 'alcohol' | 'picante' | 'fritos' | 'ultraprocesado'

export const MEAL_TRIGGERS: { value: MealTrigger; label: string }[] = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'lactosa', label: 'Lactosa' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'picante', label: 'Picante' },
  { value: 'fritos', label: 'Fritos' },
  { value: 'ultraprocesado', label: 'Ultraprocesado' },
]

const asMap = (arr: { value: string; label: string }[]) =>
  Object.fromEntries(arr.map((x) => [x.value, x.label]))

export const LABELS = {
  urgency: asMap(URGENCY),
  strain: asMap(STRAIN),
  gasIntensity: asMap(GAS_INTENSITY),
  bloating: asMap(BLOATING),
  portion: asMap(PORTION),
  mealTrigger: asMap(MEAL_TRIGGERS),
} as const

export function labelOf(scale: keyof typeof LABELS, value: string | undefined): string {
  if (!value) return ''
  return LABELS[scale][value] ?? value
}

export const yesNo = (v: boolean | undefined): string => (v === true ? 'Sí' : v === false ? 'No' : '')

export const SYMPTOM_PRESETS = [
  'Dolor abdominal',
  'Hinchazón',
  'Náuseas',
  'Acidez',
  'Gases',
  'Diarrea',
  'Estreñimiento',
]
