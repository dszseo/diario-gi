import { useEffect, useRef, useState } from 'preact/hooks'
import type { MealItem } from '../db/types'
import { suggestFoods } from '../db/foods'

export function FoodChipsInput({
  items,
  onChange,
  onPendingChange,
}: {
  items: MealItem[]
  onChange: (items: MealItem[]) => void
  /** Texto escrito pero aún no convertido en chip (para que el padre lo pueda guardar). */
  onPendingChange?: (text: string) => void
}) {
  const [text, setTextRaw] = useState('')
  const [sugs, setSugs] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  // Se pone a true mientras se pulsa una sugerencia o el botón «Añadir», para que
  // el onBlur del input no añada el texto a medio escribir y borre la sugerencia
  // antes de que llegue su click (pasaba en Chrome Android).
  const pickingRef = useRef(false)

  function setText(v: string) {
    setTextRaw(v)
    onPendingChange?.(v)
  }

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
    pickingRef.current = false
    const clean = name.trim()
    if (!clean) return
    if (!items.some((i) => i.name.toLowerCase() === clean.toLowerCase())) {
      onChange([...items, { name: clean }])
    }
    setText('')
    setSugs([])
    inputRef.current?.focus()
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  // Marca que se está pulsando un botón (sugerencia o «Añadir») para que el onBlur
  // del input lo ignore. Va en pointerdown, que se dispara antes del blur tanto con
  // ratón como táctil, y sin preventDefault (cancelar el gesto cancelaría el click).
  const markPicking = () => {
    pickingRef.current = true
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
      <div class="row">
        <input
          ref={inputRef}
          type="text"
          placeholder="Escribe un alimento…"
          value={text}
          enterkeyhint="done"
          autocomplete="off"
          onInput={(e) => setText((e.target as HTMLInputElement).value)}
          onBlur={() => {
            if (pickingRef.current) {
              pickingRef.current = false
              return
            }
            if (text.trim()) add(text)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add(text)
            } else if (e.key === 'Backspace' && !text && items.length) {
              remove(items.length - 1)
            }
          }}
        />
        <button
          type="button"
          class="btn primary"
          style={{ flex: '0 0 auto' }}
          disabled={!text.trim()}
          onPointerDown={markPicking}
          onClick={() => add(text)}
        >
          Añadir
        </button>
      </div>
      {sugs.length > 0 && (
        <div class="chips" style={{ marginTop: '8px' }}>
          {sugs.map((s) => (
            <button
              type="button"
              class="chip selectable"
              key={s}
              onPointerDown={markPicking}
              onClick={() => add(s)}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
      <div class="hint">Añade los alimentos uno a uno (botón «Añadir» o la tecla Intro).</div>
    </div>
  )
}
