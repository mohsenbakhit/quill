import { useState } from "react";
import { exportToFountain, formatEditorContent } from "../utils/export";
import { FileMenuProps } from "../utils/interfaces";
import { save, message } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { invoke } from "@tauri-apps/api/core";

export function ExportMenu({ editor }: FileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!editor) return null;

  const handleFountain = async () => {
    try {
      const content = exportToFountain(editor.getJSON());

      const path = await save({
        filters: [{ name: 'Fountain', extensions: ['fountain'] }],
      })
      if (path === null) return;

      await writeTextFile(path, content)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await message(msg, { title: 'Export Failed', kind: 'error' })
    } finally {
      setIsOpen(false);
    }
  }


    const handlePdf = async () => {
        try {
            const path = await save({
                filters: [{ name: 'PDF', extensions: ['pdf'] }],
            });
            if (path === null) return;

            const content = formatEditorContent(editor.getJSON());
            await invoke("export_to_pdf", {
                screenplay: content,
                outputPath: path,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            await message(msg, { title: 'PDF Export Failed', kind: 'error' });
        } finally {
            setIsOpen(false);
        }
    }
  return (
    <span className="toolbar-menu">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`toolbar-action-button${isOpen ? ' active' : ''}`}
        aria-expanded={isOpen}
      >
        Export
      </button>
      {isOpen && (
        <div className="dropdown-menu">
              <button type="button" onClick={handlePdf} className="dropdown-button">Export to PDF</button>
          {/*<button className="dropdown-button w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Export to FDX</button>*/}
          <button type="button" onClick={handleFountain} className="dropdown-button">Export to Fountain</button>
        </div>
      )}
    </span>
  )
}
