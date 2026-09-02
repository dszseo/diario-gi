import { useState } from 'preact/hooks'
import { eventsInRange } from '../db/events'
import { PERIODS, type PeriodId, resolveRange, rangeLabel } from '../export/range'
import { buildCsv } from '../export/csv'
import { buildBackup, backupToString } from '../export/json'
import { downloadText } from '../lib/download'
import { todayKey } from '../lib/datetime'
import { toast } from '../lib/toast'

export function ExportView() {
  const [period, setPeriod] = useState<PeriodId>('30')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState(todayKey())
  const [delimiter, setDelimiter] = useState<',' | ';'>(',')
  const [busy, setBusy] = useState(false)

  const range = resolveRange(period, { from, to })

  async function collect() {
    return eventsInRange(range.fromKey, range.toKey)
  }

  async function exportCsv() {
    setBusy(true)
    try {
      const events = await collect()
      if (!events.length) {
        toast('No hay registros en ese periodo')
        return
      }
      const csv = buildCsv(events, { delimiter, bom: true })
      downloadText(`diario-gi-${range.fromKey}_a_${range.toKey}.csv`, csv, 'text/csv')
      toast(`Exportados ${events.length} registros`)
    } finally {
      setBusy(false)
    }
  }

  async function exportJson() {
    setBusy(true)
    try {
      const events = await collect()
      const backup = await buildBackup(events)
      downloadText(
        `diario-gi-datos-${range.fromKey}_a_${range.toKey}.json`,
        backupToString(backup),
        'application/json',
      )
      toast(`Exportados ${events.length} registros (JSON)`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div class="section">
        <h2>Periodo</h2>
        <div class="seg">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={period === p.id}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div class="row" style={{ marginTop: '10px' }}>
            <div>
              <label class="hint">Desde</label>
              <input type="date" value={from} onInput={(e) => setFrom((e.target as HTMLInputElement).value)} />
            </div>
            <div>
              <label class="hint">Hasta</label>
              <input type="date" value={to} onInput={(e) => setTo((e.target as HTMLInputElement).value)} />
            </div>
          </div>
        )}

        <p class="hint" style={{ marginTop: '8px' }}>Intervalo: {rangeLabel(range)}</p>
      </div>

      <div class="section">
        <h2>CSV (recomendado para análisis)</h2>
        <div class="field">
          <label>Separador de columnas</label>
          <div class="seg">
            <button type="button" aria-pressed={delimiter === ','} onClick={() => setDelimiter(',')}>
              Coma ( , )
            </button>
            <button type="button" aria-pressed={delimiter === ';'} onClick={() => setDelimiter(';')}>
              Punto y coma ( ; )
            </button>
          </div>
          <div class="hint">
            Coma: ideal para Python / pandas / IA. Punto y coma: para abrir directamente en
            Excel en español. En ambos casos el archivo es UTF-8 con BOM (acentos correctos).
          </div>
        </div>
        <button class="btn primary block" disabled={busy} onClick={exportCsv}>
          ⬇️ Exportar CSV
        </button>
      </div>

      <div class="section">
        <h2>JSON (copia completa del periodo)</h2>
        <p class="hint">
          Incluye todos los campos de cada acontecimiento más alimentos, comidas habituales
          y tipos de síntoma. Útil como respaldo legible o para procesarlo con código.
        </p>
        <button class="btn block" disabled={busy} onClick={exportJson}>
          ⬇️ Exportar JSON
        </button>
      </div>

      <div class="note-banner">
        Para restaurar la app usa <strong>Ajustes → Copia de seguridad</strong>. La
        exportación de aquí está pensada para analizar los datos fuera de la app.
      </div>
    </div>
  )
}
