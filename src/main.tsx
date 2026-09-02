import { render } from 'preact'
import './styles/base.css'
import { Router } from './router'
import { Shell } from './app'
import { Today } from './routes/Today'
import { AddEditEvent } from './routes/AddEditEvent'
import { History } from './routes/History'
import { DayView } from './routes/DayView'
import { ExportView } from './routes/Export'
import { Settings } from './routes/Settings'
import { requestPersistentStorage } from './lib/persist'

requestPersistentStorage()

const routes = [
  { pattern: '/', component: Today },
  { pattern: '/add/:type', component: AddEditEvent },
  { pattern: '/edit/:type/:id', component: AddEditEvent },
  { pattern: '/history', component: History },
  { pattern: '/day/:date', component: DayView },
  { pattern: '/export', component: ExportView },
  { pattern: '/settings', component: Settings },
]

function App() {
  return (
    <Shell>
      <Router routes={routes} fallback={Today} />
    </Shell>
  )
}

render(<App />, document.getElementById('app')!)
