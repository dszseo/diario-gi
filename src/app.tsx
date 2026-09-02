import type { ComponentChildren } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { useLocation } from './router'
import { registerSW } from 'virtual:pwa-register'
import { toastMessage } from './lib/toast'

const TITLES: Record<string, string> = {
  '/': 'Diario GI',
  '/history': 'Calendario',
  '/export': 'Exportar datos',
  '/settings': 'Ajustes',
}

function useUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null)
  useEffect(() => {
    const fn = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true)
      },
    })
    setUpdateSW(() => fn)
  }, [])
  return { needRefresh, apply: () => updateSW?.() }
}

export function Shell({ children }: { children: ComponentChildren }) {
  const loc = useLocation()
  const { path } = loc
  const { needRefresh, apply } = useUpdatePrompt()

  const isHome = path === '/'
  const title = TITLES[path] ?? 'Diario GI'
  const showQuickbar = isHome || path.startsWith('/day/')

  return (
    <div class="app-shell">
      <header class="topbar">
        {!isHome && (
          <button class="icon-btn" aria-label="Atrás" onClick={() => history.back()}>
            ←
          </button>
        )}
        <h1>{title}</h1>
        {isHome && (
          <>
            <button
              class="icon-btn"
              aria-label="Calendario"
              onClick={() => loc.route('/history')}
            >
              📅
            </button>
            <button
              class="icon-btn"
              aria-label="Exportar"
              onClick={() => loc.route('/export')}
            >
              ⬇️
            </button>
            <button
              class="icon-btn"
              aria-label="Ajustes"
              onClick={() => loc.route('/settings')}
            >
              ⚙️
            </button>
          </>
        )}
      </header>

      <main class="content">{children}</main>

      {showQuickbar && <QuickBar />}

      {toastMessage.value && <div class="toast">{toastMessage.value}</div>}

      {needRefresh && (
        <div class="update-bar">
          <span>Hay una versión nueva de la app.</span>
          <button onClick={apply}>Actualizar</button>
        </div>
      )}
    </div>
  )
}

function QuickBar() {
  const loc = useLocation()
  // En vista de día concreto, preseleccionar esa fecha al crear.
  const m = loc.path.match(/^\/day\/(\d{4}-\d{2}-\d{2})/)
  const dateParam = m ? m[1] : undefined
  const q = (type: string) =>
    loc.route(`/add/${type}${dateParam ? `?date=${dateParam}` : ''}`)
  return (
    <nav class="quickbar">
      <div class="wrap">
        <button class="quick-btn" onClick={() => q('meal')}>
          <span class="em">🍽️</span>Comida
        </button>
        <button class="quick-btn" onClick={() => q('stool')}>
          <span class="em">💩</span>Deposición
        </button>
        <button class="quick-btn" onClick={() => q('gas')}>
          <span class="em">💨</span>Gases
        </button>
        <button class="quick-btn" onClick={() => q('symptom')}>
          <span class="em">🤕</span>Síntoma
        </button>
      </div>
    </nav>
  )
}
