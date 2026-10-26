import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { exportDocument, type ExportFormat } from '../lib/export'
import { getErrorMessage } from '../utils/utils'
import { DropdownMenu } from './DropdownMenu'

export function ExportMenu({ editor, documentName = 'Untitled screenplay' }: { editor: Editor | null; documentName?: string }) {
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null)
  const pending = useRef(false)

  async function handleExport(format: ExportFormat) {
    if (!editor || pending.current) return
    pending.current = true
    setBusy(true)
    setFeedback(null)
    try {
      if (await exportDocument(editor.getJSON(), format, documentName)) {
        setFeedback({ text: `${format === 'pdf' ? 'PDF' : 'Fountain'} exported.`, error: false })
      }
    } catch (error) {
      setFeedback({ text: getErrorMessage(error), error: true })
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return <div className="menu-group">
    <DropdownMenu label={busy ? 'Exporting…' : 'Export'} disabled={!editor || busy} items={[
      { label: 'Export to PDF', onSelect: () => { void handleExport('pdf') } },
      { label: 'Export to Fountain', onSelect: () => { void handleExport('fountain') } },
    ]} />
    {feedback && <div className={`menu-feedback${feedback.error ? ' is-error' : ''}`} role={feedback.error ? 'alert' : 'status'}>
      <span>{feedback.text}</span><button type="button" aria-label="Dismiss export message" onClick={() => setFeedback(null)}>×</button>
    </div>}
  </div>
}
