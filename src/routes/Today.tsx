import { useLiveQuery } from 'dexie-react-hooks'
import { eventsOfDay } from '../db/events'
import { longDate, todayKey } from '../lib/datetime'
import { TimelineView } from '../components/TimelineView'

export function Today() {
  const key = todayKey()
  const events = useLiveQuery(() => eventsOfDay(key), [key], [])

  return (
    <div>
      <div class="day-group">
        <h2>{longDate(key)}</h2>
      </div>
      <TimelineView
        events={events ?? []}
        emptyHint="Aún no has registrado nada hoy. Usa los botones de abajo."
      />
    </div>
  )
}
