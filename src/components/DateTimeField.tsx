import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../lib/datetime'

export function DateTimeField({
  ts,
  onChange,
}: {
  ts: number
  onChange: (ts: number) => void
}) {
  return (
    <div class="field">
      <label>Fecha y hora</label>
      <div class="row">
        <input
          type="datetime-local"
          value={toDatetimeLocalValue(ts)}
          onInput={(e) => {
            const v = (e.target as HTMLInputElement).value
            if (v) onChange(fromDatetimeLocalValue(v))
          }}
        />
        <button
          type="button"
          class="btn"
          style={{ flex: '0 0 auto' }}
          onClick={() => onChange(Date.now())}
        >
          Ahora
        </button>
      </div>
    </div>
  )
}
