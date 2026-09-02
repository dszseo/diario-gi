import { useLiveQuery } from 'dexie-react-hooks'
import { useLocation } from '../router'
import { eventsOfDay } from '../db/events'
import { addDaysKey, longDate, todayKey } from '../lib/datetime'
import { TimelineView } from '../components/TimelineView'

export function DayView({ date }: { date?: string }) {
  const loc = useLocation()
  const key = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKey()
  const events = useLiveQuery(() => eventsOfDay(key), [key], [])
  const isToday = key === todayKey()

  return (
    <div>
      <div class="cal-head">
        <button class="icon-btn" aria-label="Día anterior" onClick={() => loc.route(`/day/${addDaysKey(key, -1)}`)}>
          ←
        </button>
        <h2>{longDate(key)}</h2>
        <button
          class="icon-btn"
          aria-label="Día siguiente"
          disabled={isToday}
          style={{ opacity: isToday ? 0.3 : 1 }}
          onClick={() => !isToday && loc.route(`/day/${addDaysKey(key, 1)}`)}
        >
          →
        </button>
      </div>
      <TimelineView events={events ?? []} showFilter emptyHint="Ningún registro este día." />
    </div>
  )
}
