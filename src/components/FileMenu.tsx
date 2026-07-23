import { useState, useEffect } from "react";
import { save, message, open, confirm } from '@tauri-apps/plugin-dialog';
import { readTextFile, create, exists, writeTextFile } from '@tauri-apps/plugin-fs';
import { FileMenuProps } from "../utils/interfaces";
import { SceneHeading } from "../nodes/screenplayNodes";
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
      <button onClick={() => setIsOpen(!isOpen)} className="px-3 py-1.5 text-lg rounded bg-gray-300 hover:bg-gray-100 text-gray-700"
      >File</button>
      {isOpen && (
        <div className="dropdown-menu">
          <button onClick={handleNew} className="dropdown-button w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">New</button>
          <button onClick={handleOpen} className="dropdown-button w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Open</button>
          <button onClick={handleSave} className="dropdown-button w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Save</button>
        </div>
      )}
    </span>
  )
}
