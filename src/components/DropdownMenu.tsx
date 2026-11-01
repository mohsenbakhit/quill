import { useEffect, useId, useRef, useState } from 'react'

interface MenuItem {
  label: string
  shortcut?: string
  onSelect: () => void
}

interface DropdownMenuProps {
  label: string
  items: MenuItem[]
  disabled?: boolean
}

export function DropdownMenu({ label, items, disabled = false }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    root.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  useEffect(() => { if (disabled) setOpen(false) }, [disabled])

  return (
    <div className="toolbar-menu" ref={root} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    }} onKeyDown={event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        trigger.current?.focus()
      }
      if (!open) return
      const buttons = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
      const next = event.key === 'ArrowDown' ? (index + 1) % buttons.length
        : event.key === 'ArrowUp' ? (index - 1 + buttons.length) % buttons.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : null
      if (next !== null) {
        event.preventDefault()
        buttons[next]?.focus()
      }
    }}>
      <button ref={trigger} type="button" className="menu-trigger" aria-haspopup="menu" aria-controls={menuId}
        aria-expanded={open} disabled={disabled} onClick={() => setOpen(value => !value)}
        onKeyDown={event => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault()
            setOpen(true)
          }
        }}>
        {label}<span className="menu-chevron" aria-hidden="true">⌄</span>
      </button>
      {open && <div className="dropdown-menu" id={menuId} role="menu" aria-label={label}>
        {items.map(item => <button type="button" className="dropdown-button" role="menuitem" key={item.label}
          onClick={() => {
            setOpen(false)
            trigger.current?.focus()
            item.onSelect()
          }}>
          <span>{item.label}</span>{item.shortcut && <kbd>{item.shortcut}</kbd>}
        </button>)}
      </div>}
    </div>
  )
}
