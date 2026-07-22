import { useState, useEffect } from "react";

function handleOpen() {
}
function handleSave() {
}
function handleNew() {
}

export function ExportMenu() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <span className="toolbar-menu">
      <button onClick={() => setIsOpen(!isOpen)} className="px-3 py-1.5 text-lg rounded bg-gray-300 hover:bg-gray-100 text-gray-700">Export</button>
      {isOpen && (
        <div className="dropdown-menu">
          <button onClick={handleNew} className="dropdown-button w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Export to PDF</button>
          <button onClick={handleOpen} className="dropdown-button w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Export to FDX</button>
          <button onClick={handleSave} className="dropdown-button w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Export to Fountain</button>
        </div>
      )}
    </span>
  )
}
