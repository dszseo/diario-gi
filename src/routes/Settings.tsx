import { useEffect, useRef, useState } from 'preact/hooks'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getMeta, setMeta, SCHEMA_VERSION } from '../db/db'
import { allEvents } from '../db/events'
import { allFoods, deleteFood } from '../db/foods'
import { deleteFavorite, listFavorites } from '../db/favorites'
import { deleteCustomSymptom, symptomOptions } from '../db/symptoms'
import {
  backupFilename,
  backupToString,
  buildBackup,
  parseBackup,
  restoreBackup,
  type RestoreMode,
} from '../export/json'
import { downloadText, readFileAsText } from '../lib/download'
import { requestPersistentStorage, storageStatus } from '../lib/persist'
import { SYMPTOM_PRESETS } from '../lib/scales'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { toast } from '../lib/toast'

export function Settings() {
  return (
    <div>
      <BackupSection />
      <StorageSection />
      <FavoritesSection />
      <FoodsSection />
      <SymptomsSection />
      <AboutSection />
    </div>
  )
}

function daysSince(ts: number | null): number | null {
  if (!ts) return null
  return Math.floor((Date.now() - ts) / 86_400_000)
}

function BackupSection() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [lastBackup, setLastBackup] = useState<number | null>(null)
  const [pending, setPending] = useState<
    | { text: string; counts: Record<string, number>; file: Parameters<typeof restoreBackup>[0] }
    | null
  >(null)

  useEffect(() => {
    getMeta<number | null>('lastBackupAt', null).then(setLastBackup)
  }, [])

  async function doBackup() {
    const backup = await buildBackup()
    downloadText(backupFilename(), backupToString(backup), 'application/json')
    const now = Date.now()
    await setMeta('lastBackupAt', now)
    setLastBackup(now)
    toast('Copia de seguridad descargada')
  }

  async function onFile(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    try {
      const text = await readFileAsText(file)
      const parsed = parseBackup(text)
      setPending({ text, counts: parsed.counts, file: parsed.file })
    } catch (err) {
      toast((err as Error).message)
    }
  }

  const d = daysSince(lastBackup)

  return (
    <section class="section">
      <h2>Copia de seguridad</h2>
      <p class="hint">
        Restaura exactamente los datos de la app. Guárdala en un sitio seguro (Drive, PC…).
      </p>
      {d !== null && d >= 7 && (
        <div class="note-banner">⚠️ Última copia hace {d} días. Te recomendamos hacer una nueva.</div>
      )}
      <div class="stack">
        <button class="btn primary block" onClick={doBackup}>
          ⬇️ Descargar copia de seguridad
        </button>
        <button class="btn block" onClick={() => fileRef.current?.click()}>
          ⬆️ Restaurar desde archivo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={onFile}
        />
      </div>
      {lastBackup && (
        <p class="hint">Última copia: {new Date(lastBackup).toLocaleString('es-ES')}</p>
      )}

      {pending && (
        <RestoreDialog
          counts={pending.counts}
          onCancel={() => setPending(null)}
          onConfirm={async (mode) => {
            await restoreBackup(pending.file, mode)
            setPending(null)
            toast('Datos restaurados')
          }}
        />
      )}
    </section>
  )
}

function RestoreDialog({
  counts,
  onConfirm,
  onCancel,
}: {
  counts: Record<string, number>
  onConfirm: (mode: RestoreMode) => void
  onCancel: () => void
}) {
  const [mode, setMode] = useState<RestoreMode>('replace')
  return (
    <div class="dialog-backdrop" onClick={onCancel}>
      <div class="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Restaurar copia</h2>
        <p class="hint">
          {counts.events} registros · {counts.foods} alimentos · {counts.favoriteMeals} comidas
          habituales · {counts.symptomTypes} tipos de síntoma
        </p>
        <div class="field" style={{ marginTop: '10px' }}>
          <label>Modo</label>
          <div class="seg">
            <button type="button" aria-pressed={mode === 'replace'} onClick={() => setMode('replace')}>
              Reemplazar todo
            </button>
            <button type="button" aria-pressed={mode === 'merge'} onClick={() => setMode('merge')}>
              Fusionar
            </button>
          </div>
          <div class="hint">
            {mode === 'replace'
              ? 'Borra los datos actuales y deja solo los del archivo.'
              : 'Añade o actualiza registros por identificador; conserva el resto.'}
          </div>
        </div>
        <div class="actions">
          <button class="btn ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button class={`btn ${mode === 'replace' ? 'danger' : 'primary'}`} onClick={() => onConfirm(mode)}>
            Restaurar
          </button>
        </div>
      </div>
    </div>
  )
}

function StorageSection() {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof storageStatus>> | null>(null)
  const refresh = () => storageStatus().then(setStatus)
  useEffect(() => {
    refresh()
  }, [])

  return (
    <section class="section">
      <h2>Almacenamiento</h2>
      {status && (
        <>
          <p class="hint">
            Persistente:{' '}
            <strong>{status.persisted ? 'sí ✓' : status.supported ? 'no' : 'no soportado'}</strong>
            {status.usageMB != null && ` · uso ${status.usageMB} MB`}
            {status.quotaMB != null && ` de ~${status.quotaMB} MB`}
          </p>
          {!status.persisted && status.supported && (
            <button
              class="btn block"
              onClick={async () => {
                const ok = await requestPersistentStorage()
                toast(ok ? 'Almacenamiento persistente activado' : 'El navegador no lo concedió')
                refresh()
              }}
            >
              Activar almacenamiento persistente
            </button>
          )}
          <p class="hint">
            Con el almacenamiento persistente activado, el navegador no borra tus datos para
            liberar espacio. Aun así, haz copias de seguridad periódicas.
          </p>
        </>
      )}
    </section>
  )
}

function FavoritesSection() {
  const favorites = useLiveQuery(() => listFavorites(), [], [])
  const [del, setDel] = useState<string | null>(null)
  if (!favorites?.length) {
    return (
      <section class="section">
        <h2>Comidas habituales</h2>
        <p class="hint">Todavía no has creado ninguna. Se crean al registrar una comida.</p>
      </section>
    )
  }
  return (
    <section class="section">
      <h2>Comidas habituales ({favorites.length})</h2>
      <div class="card">
        {favorites.map((f) => (
          <div class="list-row" key={f.id}>
            <div class="grow">
              <div>⭐ {f.name}</div>
              <div class="sub">{f.items.map((i) => i.name).join(', ')}</div>
            </div>
            <button class="icon-btn" aria-label="Eliminar" onClick={() => setDel(f.id)}>
              🗑️
            </button>
          </div>
        ))}
      </div>
      {del && (
        <ConfirmDialog
          title="Eliminar comida habitual"
          message="No afecta a las comidas ya registradas."
          onConfirm={async () => {
            await deleteFavorite(del)
            setDel(null)
            toast('Eliminada')
          }}
          onCancel={() => setDel(null)}
        />
      )}
    </section>
  )
}

function FoodsSection() {
  const foods = useLiveQuery(() => allFoods(), [], [])
  const [open, setOpen] = useState(false)
  if (!foods?.length) return null
  return (
    <section class="section">
      <h2>Alimentos guardados ({foods.length})</h2>
      <button class="btn ghost block" onClick={() => setOpen((v) => !v)}>
        {open ? 'Ocultar lista' : 'Ver / editar lista'}
      </button>
      {open && (
        <div class="card" style={{ marginTop: '8px' }}>
          {foods.map((f) => (
            <div class="list-row" key={f.key}>
              <div class="grow">
                {f.name}
                <div class="sub">usado {f.useCount}×</div>
              </div>
              <button
                class="icon-btn"
                aria-label="Eliminar"
                onClick={async () => {
                  await deleteFood(f.key)
                  toast('Alimento eliminado')
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
      <p class="hint">Eliminar un alimento solo lo quita del autocompletado.</p>
    </section>
  )
}

function SymptomsSection() {
  const [list, setList] = useState<{ name: string; preset: boolean }[]>([])
  const refresh = () => symptomOptions().then((l) => setList(l.map((s) => ({ name: s.name, preset: s.preset }))))
  useEffect(() => {
    refresh()
  }, [])
  const custom = list.filter((s) => !SYMPTOM_PRESETS.includes(s.name))
  if (!custom.length) return null
  return (
    <section class="section">
      <h2>Síntomas personalizados ({custom.length})</h2>
      <div class="card">
        {custom.map((s) => (
          <div class="list-row" key={s.name}>
            <div class="grow">{s.name}</div>
            <button
              class="icon-btn"
              aria-label="Eliminar"
              onClick={async () => {
                await deleteCustomSymptom(s.name)
                refresh()
                toast('Eliminado')
              }}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function AboutSection() {
  const count = useLiveQuery(() => db.events.count(), [], 0)
  const [danger, setDanger] = useState(false)
  return (
    <section class="section">
      <h2>Acerca de</h2>
      <p class="hint">
        Diario GI · formato de datos v{SCHEMA_VERSION} · {count} registros. Todos los datos
        se guardan solo en este dispositivo. La app funciona sin conexión.
      </p>
      <button class="btn danger ghost block" onClick={() => setDanger(true)}>
        Borrar todos los datos
      </button>
      {danger && (
        <ConfirmDialog
          title="Borrar todos los datos"
          message="Se eliminarán todos los registros, alimentos y comidas habituales de este dispositivo. Haz una copia de seguridad antes si quieres conservarlos."
          confirmLabel="Borrar todo"
          onConfirm={async () => {
            const events = await allEvents()
            if (events.length) {
              const backup = await buildBackup(events)
              downloadText(backupFilename('diario-gi-antes-de-borrar'), backupToString(backup), 'application/json')
            }
            await Promise.all([
              db.events.clear(),
              db.foods.clear(),
              db.favoriteMeals.clear(),
              db.symptomTypes.clear(),
              db.meta.clear(),
            ])
            setDanger(false)
            toast('Datos borrados')
          }}
          onCancel={() => setDanger(false)}
        />
      )}
    </section>
  )
}
