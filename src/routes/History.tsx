import { useLiveQuery } from 'dexie-react-hooks'
import { useLocation } from 'preact-iso'
import { useState } from 'preact/hooks'
import { daysWithEvents } from '../db/events'
import { monthTitle, todayKey } from '../lib/datetime'

const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const DOT: Record<string, string> = {
  meal: 'var(--meal)',
  stool: 'var(--stool)',
  gas: 'var(--gas)',
  symptom: 'var(--symptom)',
}

function buildGrid(year: number, month0: number): (string | null)[] {
  const first = new Date(year, month0, 1)
  const startOffset = (first.getDay() + 6) % 7 // lunes = 0
  const daysInMonth = new Date(year, month0 + 1, 0).getDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push(key)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function History() {
  const loc = useLocation()
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const days = useLiveQuery(() => daysWithEvents(), [], undefined)
  const today = todayKey()

  const cells = buildGrid(ym.y, ym.m)

  const shift = (delta: number) => {
    const d = new Date(ym.y, ym.m + delta, 1)
    setYm({ y: d.getFullYear(), m: d.getMonth() })
  }

  return (
    <div>
      <div class="cal-head">
        <button class="icon-btn" aria-label="Mes anterior" onClick={() => shift(-1)}>
          ←
        </button>
        <h2>{monthTitle(ym.y, ym.m)}</h2>
        <button class="icon-btn" aria-label="Mes siguiente" onClick={() => shift(1)}>
          →
        </button>
      </div>

      <div class="cal-grid" style={{ marginBottom: '4px' }}>
        {DOW.map((d) => (
          <div class="cal-dow" key={d}>
            {d}
          </div>
        ))}
      </div>
      <div class="cal-grid">
        {cells.map((key, i) => {
          if (!key) return <div key={i} />
          const counts = days?.get(key)
          const dayNum = Number(key.slice(-2))
          return (
            <button
              key={key}
              class={`cal-cell ${key === today ? 'today' : ''}`}
              onClick={() => loc.route(`/day/${key}`)}
            >
              <span>{dayNum}</span>
              <span class="dots">
                {counts &&
                  (['meal', 'stool', 'gas', 'symptom'] as const)
                    .filter((t) => counts[t] > 0)
                    .map((t) => (
                      <span class="dot" key={t} style={{ background: DOT[t] }} />
                    ))}
              </span>
            </button>
          )
        })}
      </div>

      <p class="hint" style={{ marginTop: '14px' }}>
        Toca un día para ver todos sus registros. Los puntos indican qué tipos de
        acontecimiento hay ese día.
      </p>
    </div>
  )
}
