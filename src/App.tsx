import { useState, useEffect } from "react";
import { Toolbar } from './components/Toolbar';
import { ScreenplayEditor } from './ScreenplayEditor';
import { useEditor, EditorContent } from '@tiptap/react';
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
        { type: 'sceneHeading', content: [{ type: 'text', text: 'INT. COFFEE SHOP - DAY' }] },
      ],
    },
    onUpdate: () => {
        setIsDirty(true)
      },
  })
  return (
    <div className="app">
      <Toolbar editor={editor} isDirty={isDirty} setIsDirty={setIsDirty}/>
      <ScreenplayEditor editor={editor} isDirty={isDirty}  setIsDirty={setIsDirty}/>
    </div>
  )
}

export default App
