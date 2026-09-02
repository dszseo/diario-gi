import { useState } from 'preact/hooks'
import type { EventType, GiEvent } from '../db/types'
import { TimelineItem } from './TimelineItem'
import { ConfirmDialog } from './ConfirmDialog'
import { deleteEvent } from '../db/events'
import { toast } from '../lib/toast'
import { TYPE_META } from '../lib/summary'

const FILTERS: { id: EventType | 'all'; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'meal', label: 'Comidas' },
  { id: 'stool', label: 'Deposiciones' },
  { id: 'gas', label: 'Gases' },
  { id: 'symptom', label: 'Síntomas' },
]

export function TimelineView({
  events,
  showFilter = false,
  emptyHint = 'Sin registros todavía.',
}: {
  events: GiEvent[]
  showFilter?: boolean
  emptyHint?: string
}) {
  const [filter, setFilter] = useState<EventType | 'all'>('all')
  const [toDelete, setToDelete] = useState<GiEvent | null>(null)

  const shown = [...events]
    .filter((e) => filter === 'all' || e.type === filter)
    .sort((a, b) => a.ts - b.ts)

  return (
    <div>
      {showFilter && (
        <div class="filterbar">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div class="empty">
          <span class="em">🗒️</span>
          {emptyHint}
        </div>
      ) : (
        <div class="card">
          {shown.map((ev) => (
            <TimelineItem key={ev.id} ev={ev} onDelete={setToDelete} />
          ))}
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Eliminar registro"
          message={`¿Eliminar este registro de ${TYPE_META[toDelete.type].label.toLowerCase()}? No se puede deshacer.`}
          onConfirm={async () => {
            await deleteEvent(toDelete.id)
            setToDelete(null)
            toast('Registro eliminado')
          }}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
