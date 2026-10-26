import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DropdownMenu } from './DropdownMenu'

function setup() {
  const onSelect = vi.fn()
  render(<><DropdownMenu label="File" items={[
    { label: 'First', onSelect }, { label: 'Second', onSelect }, { label: 'Third', onSelect },
  ]} /><button>Outside</button></>)
  return { user: userEvent.setup(), onSelect }
}

describe('Dropdown menu accessibility', () => {
  it('opens with keyboard, focuses the first item, and cycles items', async () => {
    const { user } = setup()
    screen.getByRole('button', { name: 'File' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'First' })).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Third' })).toHaveFocus()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Second' })).toHaveFocus()
    await user.keyboard('{End}')
    expect(screen.getByRole('menuitem', { name: 'Third' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('menuitem', { name: 'First' })).toHaveFocus()
  })
  it('closes with Escape and restores trigger focus', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'File' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'File' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'File' })).toHaveAttribute('aria-expanded', 'false')
  })
  it('closes after selecting an item', async () => {
    const { user, onSelect } = setup()
    await user.click(screen.getByRole('button', { name: 'File' }))
    await user.click(screen.getByRole('menuitem', { name: 'Second' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
  it('dismisses on outside click', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'File' }))
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
  it('dismisses when focus leaves', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'File' }))
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
