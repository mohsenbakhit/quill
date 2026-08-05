import { useState } from "react";
import { Toolbar } from './components/Toolbar';
import { ScreenplayEditor } from './ScreenplayEditor';
import { useEditor } from '@tiptap/react';
import { screenplayExtensions } from './extensions';

import './styles/screenplay.css'
import './styles/toolbar.css'

function App() {
  const [isDirty, setIsDirty] = useState(true);
  const editor = useEditor({
    extensions: screenplayExtensions,
    content: {
      type: 'doc',
      content: [
        { type: 'sceneHeading', content: [{ type: 'text*', text: 'INT. COFFEE SHOP - DAY' }] },
      ],
    },
    onUpdate: () => {
        setIsDirty(true)
      },
  })
  return (
    <div className="app">
      <header className="title-bar">
        <Toolbar editor={editor} isDirty={isDirty} setIsDirty={setIsDirty}/>
      </header>
      <main className="editor-view">
        <div className="screenplay-editor"
          onClick={() => {editor?.commands.focus()}}>
          <ScreenplayEditor editor={editor} isDirty={isDirty} setIsDirty={setIsDirty} />
        </div>
      </main>
    </div>
  )
}

export default App
