import { useState } from "react";
import { save, message, open, confirm } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { FileMenuProps } from "../utils/interfaces";
import { getErrorMessage } from "../utils/utils";

const emptyDoc = {
  type: 'doc',
  content: [
    { type: 'sceneHeading', content: [] }
  ]
}

export function FileMenu({ editor, isDirty, setIsDirty }: FileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleSave() {
    if (!editor) return;

    try {
      const path = await save({
        filters: [{ name: 'quill', extensions: ['quill'] }],
      })
      if (path === null) return;

      const content = JSON.stringify(editor.getJSON());
      await writeTextFile(path, content);
      setIsDirty(false);
    } catch (err) {
      await message(getErrorMessage(err), { title: 'Tauri', kind: 'error' });
    }
  }

  async function handleOpen() {
    if (!editor) return
    try {
      const path = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'quill', extensions: ['quill'] }],
      });
      if (path === null) return;

      const file = await readTextFile(path);
      const doc = JSON.parse(file);
      editor.commands.setContent(doc);

    } catch (err) {
      await message(getErrorMessage(err), { title: 'Tauri', kind: 'error' });
    }
  }

  async function handleNew() {
    if (editor === null) return;
    if (isDirty) {
      const shouldSave = await confirm('You have unsaved changes. Save before creating a new file?', {
        title: 'Unsaved Changes',
        okLabel: 'Save',
        cancelLabel: "Don't Save",
      })
      if (shouldSave) handleSave();
    }
    try {
      editor.commands.setContent(emptyDoc);
    } catch (err) {
      await message(getErrorMessage(err), { title: 'Tauri', kind: 'error' });
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
        File
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          <button type="button" onClick={handleNew} className="dropdown-button">New</button>
          <button type="button" onClick={handleOpen} className="dropdown-button">Open</button>
          <button type="button" onClick={handleSave} className="dropdown-button">Save</button>
        </div>
      )}
    </span>
  )
}
