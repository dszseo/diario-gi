import { useLocation } from 'preact-iso'
import type { GiEvent } from '../db/types'
import { localTime } from '../lib/datetime'
import { mainText, subText, TYPE_META } from '../lib/summary'

export function TimelineItem({
  ev,
  onDelete,
}: {
  ev: GiEvent
  onDelete: (ev: GiEvent) => void
}) {
  const loc = useLocation()
  const meta = TYPE_META[ev.type]
  const sub = subText(ev)
  return (
    <div class="tl-item">
      <div class="tl-time">{localTime(ev.ts)}</div>
      <div class="tl-body">
        <div class="tl-head">
          <span>{meta.emoji}</span>
          <span class={`tl-badge ${meta.cls}`}>{meta.label}</span>
        </div>
        <div class="tl-main">{mainText(ev)}</div>
        {sub && <div class="tl-sub">{sub}</div>}
      </div>
      <div class="tl-actions">
        <button
          class="icon-btn"
          aria-label="Editar"
          onClick={() => loc.route(`/edit/${ev.type}/${ev.id}`)}
        >
          ✏️
        </button>
        <button class="icon-btn" aria-label="Eliminar" onClick={() => onDelete(ev)}>
          🗑️
        </button>
      </div>
    </div>
  )
}
