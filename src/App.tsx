import { Toolbar } from './components/Toolbar'
import { ScreenplayEditor } from './ScreenplayEditor'
import './styles/screenplay.css'
import './styles/toolbar.css'

function App() {
  return (
    <div className="app">
      <Toolbar />
      <ScreenplayEditor />
    </div>
  )
}

export default App
