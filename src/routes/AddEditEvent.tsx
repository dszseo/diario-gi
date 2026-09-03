import { useEffect, useMemo, useState } from 'preact/hooks'
import { useLocation } from '../router'
import type {
  EventType,
  GasData,
  MealData,
  MealItem,
  StoolData,
  SymptomData,
} from '../db/types'
import { createEvent, deleteEvent, getEvent, updateEvent } from '../db/events'
import { listFavorites, createFavorite } from '../db/favorites'
import { useLiveQuery } from 'dexie-react-hooks'
import { DateTimeField } from '../components/DateTimeField'
import { BristolSelector } from '../components/BristolSelector'
import { SegmentedScale, YesNo } from '../components/SegmentedScale'
import { FoodChipsInput } from '../components/FoodChipsInput'
import { SymptomPicker } from '../components/SymptomPicker'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { BLOATING, GAS_INTENSITY, STRAIN, URGENCY } from '../lib/scales'
import { fromDatetimeLocalValue } from '../lib/datetime'
import { toast } from '../lib/toast'

const TITLES: Record<EventType, string> = {
  meal: 'Comida',
  stool: 'Deposición',
  gas: 'Gases',
  symptom: 'Síntoma',
}

function initialTs(dateParam: string | null): number {
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    // fecha indicada + hora actual
    const now = new Date()
    return fromDatetimeLocalValue(
      `${dateParam}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    )
  }
  return Date.now()
}

export function AddEditEvent({ type, id }: { type?: string; id?: string }) {
  const loc = useLocation()
  const evType = (type ?? 'meal') as EventType
  const editing = !!id

  const [ts, setTs] = useState<number>(() => initialTs(loc.query.get('date')))
  const [notes, setNotes] = useState('')
  const [meal, setMeal] = useState<MealData>({ items: [], amount: '' })
  const [mealPending, setMealPending] = useState('')
  const [stool, setStool] = useState<StoolData>({})
  const [gas, setGas] = useState<GasData>({})
  const [symptom, setSymptom] = useState<SymptomData>({ symptomType: '', intensity: 5 })
  const [loaded, setLoaded] = useState(!editing)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showSaveFav, setShowSaveFav] = useState(false)
  const [favName, setFavName] = useState('')

  useEffect(() => {
    if (!id) return
    getEvent(id).then((ev) => {
      if (!ev) {
        toast('Registro no encontrado')
        loc.route('/')
        return
      }
      setTs(ev.ts)
      setNotes(ev.notes ?? '')
      if (ev.type === 'meal') {
        const md = ev.data as MealData
        setMeal({ items: md.items ?? [], amount: md.amount ?? '' })
      }
      if (ev.type === 'stool') setStool(ev.data as StoolData)
      if (ev.type === 'gas') setGas(ev.data as GasData)
      if (ev.type === 'symptom') setSymptom(ev.data as SymptomData)
      setLoaded(true)
    })
  }, [id])

  const favorites = useLiveQuery(() => listFavorites(), [], [])

  const canSave = useMemo(() => {
    if (evType === 'meal') return meal.items.length > 0 || mealPending.trim().length > 0
    if (evType === 'stool') return true
    if (evType === 'gas') return true
    if (evType === 'symptom') return symptom.symptomType.trim().length > 0
    return false
  }, [evType, meal, mealPending, symptom])

  if (!loaded) return <p class="hint">Cargando…</p>

  async function save() {
    // Incluye el alimento escrito aunque el usuario no lo haya convertido en chip,
    // y elimina duplicados por nombre (sin distinguir mayúsculas).
    const pending = mealPending.trim()
    const seen = new Set<string>()
    const mealItems = [...meal.items, ...(pending ? [{ name: pending }] : [])].filter((i) => {
      const k = i.name.trim().toLowerCase()
      if (!k || seen.has(k)) return false
      seen.add(k)
      return true
    })
    const data =
      evType === 'meal'
        ? { items: mealItems, amount: meal.amount?.trim() || undefined }
        : evType === 'stool'
          ? stool
          : evType === 'gas'
            ? gas
            : { ...symptom, symptomType: symptom.symptomType.trim() }
    const input = { type: evType, ts, notes, data }
    if (editing && id) {
      await updateEvent(id, input)
      toast('Cambios guardados')
    } else {
      await createEvent(input)
      toast(`${TITLES[evType]} registrada`)
    }
    loc.route('/')
  }

  return (
    <div>
      <DateTimeField ts={ts} onChange={setTs} />

      {evType === 'meal' && (
        <MealForm
          data={meal}
          onChange={setMeal}
          onPendingChange={setMealPending}
          favorites={favorites ?? []}
          onSaveFavorite={() => {
            setFavName(guessFavName())
            setShowSaveFav(true)
          }}
        />
      )}
      {evType === 'stool' && <StoolForm data={stool} onChange={setStool} />}
      {evType === 'gas' && <GasForm data={gas} onChange={setGas} />}
      {evType === 'symptom' && <SymptomForm data={symptom} onChange={setSymptom} />}

      <div class="field">
        <label>Notas</label>
        <textarea
          value={notes}
          placeholder="Opcional"
          onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      {editing && (
        <button class="btn danger block" onClick={() => setConfirmDelete(true)}>
          Eliminar registro
        </button>
      )}

      <div style={{ height: '20px' }} />

      <div class="savebar">
        <div class="wrap">
          <button class="btn ghost" onClick={() => history.back()}>
            Cancelar
          </button>
          <button class="btn primary" disabled={!canSave} onClick={save}>
            {editing ? 'Guardar' : 'Registrar'}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar registro"
          message="Esta acción no se puede deshacer."
          onConfirm={async () => {
            if (id) await deleteEvent(id)
            toast('Registro eliminado')
            loc.route('/')
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {showSaveFav && (
        <div class="dialog-backdrop" onClick={() => setShowSaveFav(false)}>
          <div class="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Guardar como comida habitual</h2>
            <div class="field">
              <label>Nombre</label>
              <input
                type="text"
                value={favName}
                onInput={(e) => setFavName((e.target as HTMLInputElement).value)}
                placeholder="Ej. Desayuno habitual"
              />
            </div>
            <div class="hint">{meal.items.map((i) => i.name).join(', ')}</div>
            <div class="actions">
              <button class="btn ghost" onClick={() => setShowSaveFav(false)}>
                Cancelar
              </button>
              <button
                class="btn primary"
                disabled={!favName.trim() || meal.items.length === 0}
                onClick={async () => {
                  await createFavorite(favName, meal.items)
                  setShowSaveFav(false)
                  toast('Comida habitual guardada')
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  function guessFavName(): string {
    const h = new Date(ts).getHours()
    if (h < 11) return 'Desayuno habitual'
    if (h < 16) return 'Comida habitual'
    if (h < 20) return 'Merienda habitual'
    return 'Cena habitual'
  }
}

// ---------- Sub-formularios ----------

function MealForm({
  data,
  onChange,
  onPendingChange,
  favorites,
  onSaveFavorite,
}: {
  data: MealData
  onChange: (d: MealData) => void
  onPendingChange: (text: string) => void
  favorites: { id: string; name: string; items: MealItem[] }[]
  onSaveFavorite: () => void
}) {
  return (
    <>
      {favorites.length > 0 && (
        <div class="field">
          <label>⭐ Comidas habituales</label>
          <div class="chips">
            {favorites.map((f) => (
              <button
                key={f.id}
                type="button"
                class="chip selectable"
                onClick={() => {
                  const names = new Set(data.items.map((i) => i.name.toLowerCase()))
                  const merged = [
                    ...data.items,
                    ...f.items.filter((i) => !names.has(i.name.toLowerCase())),
                  ]
                  onChange({ ...data, items: merged })
                }}
              >
                {f.name}
              </button>
            ))}
          </div>
          <div class="hint">Añade sus alimentos; puedes modificarlos antes de guardar.</div>
        </div>
      )}

      <div class="field">
        <label>Alimentos / platos</label>
        <FoodChipsInput
          items={data.items}
          onChange={(items) => onChange({ ...data, items })}
          onPendingChange={onPendingChange}
        />
      </div>

      <div class="field">
        <label>Cantidad</label>
        <input
          type="text"
          placeholder="Opcional (ej. plato grande, 2 unidades…)"
          value={data.amount ?? ''}
          onInput={(e) => onChange({ ...data, amount: (e.target as HTMLInputElement).value })}
        />
      </div>

      {data.items.length > 0 && (
        <button class="btn ghost block" type="button" onClick={onSaveFavorite}>
          ⭐ Guardar como comida habitual
        </button>
      )}
    </>
  )
}

function StoolForm({ data, onChange }: { data: StoolData; onChange: (d: StoolData) => void }) {
  return (
    <>
      <div class="field">
        <label>Escala de Bristol</label>
        <BristolSelector value={data.bristol} onChange={(bristol) => onChange({ ...data, bristol })} />
      </div>

      <div class="field">
        <label>Urgencia</label>
        <SegmentedScale options={URGENCY} value={data.urgency} onChange={(urgency) => onChange({ ...data, urgency })} />
      </div>

      <CollapsibleSection title="Más detalles">
        <div class="field">
          <label>Esfuerzo</label>
          <SegmentedScale options={STRAIN} value={data.strain} onChange={(strain) => onChange({ ...data, strain })} />
        </div>
        <div class="field">
          <label>Evacuación incompleta</label>
          <YesNo value={data.incomplete} onChange={(incomplete) => onChange({ ...data, incomplete })} />
        </div>
        <div class="field">
          <label>Dolor o molestia</label>
          <YesNo value={data.pain} onChange={(pain) => onChange({ ...data, pain })} />
        </div>
        <div class="field">
          <label>Gases relacionados</label>
          <YesNo value={data.gasRelated} onChange={(gasRelated) => onChange({ ...data, gasRelated })} />
        </div>
      </CollapsibleSection>
    </>
  )
}

function GasForm({ data, onChange }: { data: GasData; onChange: (d: GasData) => void }) {
  return (
    <>
      <div class="field">
        <label>Cantidad / intensidad</label>
        <SegmentedScale
          options={GAS_INTENSITY}
          value={data.intensity}
          onChange={(intensity) => onChange({ ...data, intensity })}
        />
      </div>
      <div class="field">
        <label>Hinchazón</label>
        <SegmentedScale options={BLOATING} value={data.bloating} onChange={(bloating) => onChange({ ...data, bloating })} />
      </div>
      <CollapsibleSection title="Más detalles">
        <div class="field">
          <label>Eructos</label>
          <YesNo value={data.belching} onChange={(belching) => onChange({ ...data, belching })} />
        </div>
        <div class="field">
          <label>Flatulencia</label>
          <YesNo value={data.flatulence} onChange={(flatulence) => onChange({ ...data, flatulence })} />
        </div>
        <div class="field">
          <label>Dolor o molestia</label>
          <YesNo value={data.pain} onChange={(pain) => onChange({ ...data, pain })} />
        </div>
      </CollapsibleSection>
    </>
  )
}

function SymptomForm({
  data,
  onChange,
}: {
  data: SymptomData
  onChange: (d: SymptomData) => void
}) {
  return (
    <>
      <div class="field">
        <label>Tipo de síntoma</label>
        <SymptomPicker
          value={data.symptomType}
          onChange={(symptomType) => onChange({ ...data, symptomType })}
        />
      </div>
      <div class="field">
        <label>Intensidad: {data.intensity ?? 0}/10</label>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={data.intensity ?? 0}
          onInput={(e) => onChange({ ...data, intensity: Number((e.target as HTMLInputElement).value) })}
        />
      </div>
      <CollapsibleSection title="Más detalles">
        <div class="field">
          <label>Duración (minutos)</label>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Opcional"
            value={data.durationMin ?? ''}
            onInput={(e) => {
              const v = (e.target as HTMLInputElement).value
              onChange({ ...data, durationMin: v === '' ? undefined : Number(v) })
            }}
          />
        </div>
      </CollapsibleSection>
    </>
  )
}
