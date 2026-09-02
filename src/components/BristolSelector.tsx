import { BRISTOL } from '../lib/bristol'
import { BristolIcon } from './BristolIcons'

export function BristolSelector({
  value,
  onChange,
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
}) {
  return (
    <div class="bristol-list">
      {BRISTOL.map((b) => (
        <button
          key={b.type}
          type="button"
          class="bristol-opt"
          aria-pressed={value === b.type}
          onClick={() => onChange(value === b.type ? undefined : b.type)}
        >
          <BristolIcon type={b.type} />
          <span>
            <span class="b-num">Tipo {b.type}</span>
            <div class="b-title">{b.title}</div>
            <div class="b-desc">{b.description}</div>
          </span>
        </button>
      ))}
    </div>
  )
}
