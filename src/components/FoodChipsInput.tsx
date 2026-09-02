import { useEffect, useRef, useState } from 'preact/hooks'
import type { MealItem } from '../db/types'
import { suggestFoods } from '../db/foods'

export function FoodChipsInput({
  items,
  onChange,
}: {
  items: MealItem[]
  onChange: (items: MealItem[]) => void
}) {
  const [text, setText] = useState('')
  const [sugs, setSugs] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let alive = true
    const q = text.trim()
    if (!q) {
      setSugs([])
      return
    }
    suggestFoods(q, 6).then((r) => {
      if (!alive) return
      const chosen = new Set(items.map((i) => i.name.toLowerCase()))
      setSugs(r.map((f) => f.name).filter((n) => !chosen.has(n.toLowerCase())))
    })
    return () => {
      alive = false
    }
  }, [text, items])

  function add(name: string) {
    const clean = name.trim()
    if (!clean) return
    if (items.some((i) => i.name.toLowerCase() === clean.toLowerCase())) {
      setText('')
      return
    }
    onChange([...items, { name: clean }])
    setText('')
    setSugs([])
    inputRef.current?.focus()
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {items.length > 0 && (
        <div class="chips" style={{ marginBottom: '8px' }}>
          {items.map((it, i) => (
            <span class="chip" key={`${it.name}-${i}`}>
              {it.name}
              <button type="button" aria-label={`Quitar ${it.name}`} onClick={() => remove(i)}>
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        placeholder="Añadir alimento y pulsar Intro…"
        value={text}
        enterkeyhint="done"
        onInput={(e) => setText((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add(text)
          } else if (e.key === 'Backspace' && !text && items.length) {
            remove(items.length - 1)
          }
        }}
      />
      {sugs.length > 0 && (
        <div class="chips" style={{ marginTop: '8px' }}>
          {sugs.map((s) => (
            <button type="button" class="chip selectable" key={s} onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
      {text.trim() && !sugs.some((s) => s.toLowerCase() === text.trim().toLowerCase()) && (
        <div class="hint">Pulsa Intro para añadir «{text.trim()}» como alimento nuevo.</div>
      )}
    </div>
  )
}
