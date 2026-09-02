import { render } from 'preact'
import { LocationProvider, Router, Route } from 'preact-iso'
import './styles/base.css'
import { Shell } from './app'
import { Today } from './routes/Today'
import { AddEditEvent } from './routes/AddEditEvent'
import { History } from './routes/History'
import { DayView } from './routes/DayView'
import { ExportView } from './routes/Export'
import { Settings } from './routes/Settings'
import { requestPersistentStorage } from './lib/persist'

requestPersistentStorage()

function App() {
  return (
    <LocationProvider>
      <Shell>
        <Router>
          <Route path="/" component={Today} />
          <Route path="/add/:type" component={AddEditEvent} />
          <Route path="/edit/:type/:id" component={AddEditEvent} />
          <Route path="/history" component={History} />
          <Route path="/day/:date" component={DayView} />
          <Route path="/export" component={ExportView} />
          <Route path="/settings" component={Settings} />
          <Route default component={Today} />
        </Router>
      </Shell>
    </LocationProvider>
  )
}

render(<App />, document.getElementById('app')!)
