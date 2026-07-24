import { useState } from "react";
import { exportToFountain } from "../utils/export";
import { FileMenuProps } from "../utils/interfaces";
import { save, message } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

export function ExportMenu({ editor, isDirty, setIsDirty }: FileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!editor) return null;

  const handleFountain = async () => {
    try {
      const content = exportToFountain(editor.getJSON())

      const path = await save({
        filters: [{ name: 'Fountain', extensions: ['fountain'] }],
      })
      if (path === null) return

      await writeTextFile(path, content)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await message(msg, { title: 'Export Failed', kind: 'error' })
    } finally {
      setIsOpen(false)
    }
  }

  return (
    <span className="toolbar-menu">
      <button onClick={() => setIsOpen(!isOpen)} className="px-3 py-1.5 text-lg rounded bg-gray-300 hover:bg-gray-100 text-gray-700">Export</button>
      {isOpen && (
        <div className="dropdown-menu">
          <button className="dropdown-button w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Export to PDF</button>
          <button className="dropdown-button w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Export to FDX</button>
          <button onClick={handleFountain} className="dropdown-button w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Export to Fountain</button>
        </div>
      )}
    </span>
  )
}
