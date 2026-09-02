import { useEffect, useState } from 'preact/hooks'
import { symptomOptions } from '../db/symptoms'

export function SymptomPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [options, setOptions] = useState<string[]>([])
  const [custom, setCustom] = useState('')

  useEffect(() => {
    symptomOptions().then((list) => setOptions(list.map((s) => s.name)))
  }, [])

  const isPreset = options.includes(value)

  return (
    <div>
      <div class="chips">
        {options.map((name) => (
          <button
            key={name}
            type="button"
            class={`chip selectable ${value === name ? 'on' : ''}`}
            onClick={() => onChange(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div class="field" style={{ marginTop: '10px', marginBottom: 0 }}>
        <label>Síntoma personalizado</label>
        <input
          type="text"
          placeholder="Escribe otro síntoma…"
          value={isPreset ? '' : value}
          onInput={(e) => {
            const v = (e.target as HTMLInputElement).value
            setCustom(v)
            onChange(v)
          }}
        />
        {custom && !isPreset && (
          <div class="hint">Se guardará «{custom.trim()}» como tipo de síntoma para la próxima vez.</div>
        )}
      </div>
    </div>
  )
}
