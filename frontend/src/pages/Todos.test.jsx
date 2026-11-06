import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Todos from './Todos'
import { createTodo, deleteTodo, listTodos, updateTodo } from '../api/todos'

vi.mock('../api/todos', () => ({
  listTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}))

const initialTodos = [
  { _id: 'todo-1', title: 'Write tests', completed: false, dueDate: '2026-12-01T00:00:00.000Z' },
  { _id: 'todo-2', title: 'Ship feature', completed: true, dueDate: null },
]

function renderTodos() {
  return render(<Todos />)
}

function todoRow(name) {
  const title = screen.queryByText(name, { selector: '.todo-title' }) || screen.queryByDisplayValue(name)
  return title.closest('li')
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.useRealTimers()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('Todos page', () => {
  it('shows loading and then an empty state', async () => {
    listTodos.mockResolvedValueOnce([])

    renderTodos()

    expect(screen.getByText(/loading todos/i)).toBeInTheDocument()
    expect(await screen.findByText(/no todos yet/i)).toBeInTheDocument()
  })

  it('shows load errors', async () => {
    listTodos.mockRejectedValueOnce(new Error('API is down'))

    renderTodos()

    expect(await screen.findByRole('alert')).toHaveTextContent('API is down')
  })

  it('creates a todo after the API succeeds', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce([])
    createTodo.mockResolvedValueOnce({
      _id: 'todo-3',
      title: 'New todo',
      completed: false,
      dueDate: '2026-02-14T00:00:00.000Z',
    })

    renderTodos()
    await screen.findByText(/no todos yet/i)
    await user.type(screen.getByLabelText(/new todo/i), ' New todo ')
    await user.type(screen.getByLabelText(/due date/i), '2026-02-14')
    await user.click(screen.getByRole('button', { name: /add todo/i }))

    expect(createTodo).toHaveBeenCalledWith('New todo', '2026-02-14')
    expect(within(screen.getByRole('list', { name: /todo list/i })).getByText('New todo')).toBeInTheDocument()
    expect(screen.getByText(/due feb 14, 2026/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/new todo/i)).toHaveValue('')
    expect(screen.getByLabelText(/due date/i)).toHaveValue('')
  })

  it('does not add a todo when creation fails', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce([])
    createTodo.mockRejectedValueOnce(new Error('Create failed'))

    renderTodos()
    await screen.findByText(/no todos yet/i)
    await user.type(screen.getByLabelText(/new todo/i), 'Broken todo')
    await user.click(screen.getByRole('button', { name: /add todo/i }))

    expect(createTodo).toHaveBeenCalledWith('Broken todo', undefined)
    expect(await screen.findByRole('alert')).toHaveTextContent('Create failed')
    expect(screen.queryByText('Broken todo')).not.toBeInTheDocument()
  })

  it('edits and cancels editing without changing state', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce(initialTodos)

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0])
    const editInput = screen.getByDisplayValue('Write tests')
    expect(within(todoRow('Write tests')).getByLabelText(/due date/i)).toHaveValue('2026-12-01')
    await user.clear(editInput)
    await user.type(editInput, 'Changed locally')
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.getByText('Write tests')).toBeInTheDocument()
    expect(screen.queryByText('Changed locally')).not.toBeInTheDocument()
    expect(updateTodo).not.toHaveBeenCalled()
  })

  it('saves edits only after the API succeeds', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce(initialTodos)
    updateTodo.mockResolvedValueOnce({ ...initialTodos[0], title: 'Write better tests', dueDate: '2026-12-31T00:00:00.000Z' })

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0])
    const editInput = screen.getByDisplayValue('Write tests')
    const editDueDate = within(todoRow('Write tests')).getByLabelText(/due date/i)
    await user.clear(editInput)
    await user.type(editInput, 'Write better tests')
    await user.clear(editDueDate)
    await user.type(editDueDate, '2026-12-31')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(updateTodo).toHaveBeenCalledWith('todo-1', { title: 'Write better tests', dueDate: '2026-12-31' })
    expect(await screen.findByText('Write better tests')).toBeInTheDocument()
    expect(screen.getByText(/due dec 31, 2026/i)).toBeInTheDocument()
  })

  it('clears a due date when an edited existing date is removed', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce(initialTodos)
    updateTodo.mockResolvedValueOnce({ ...initialTodos[0], dueDate: null })

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0])
    const editDueDate = within(todoRow('Write tests')).getByLabelText(/due date/i)
    await user.clear(editDueDate)
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(updateTodo).toHaveBeenCalledWith('todo-1', { title: 'Write tests', dueDate: null })
    await waitFor(() => expect(screen.queryByText(/due dec 1, 2026/i)).not.toBeInTheDocument())
  })

  it('keeps the current edit form values and original row when editing fails', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce(initialTodos)
    updateTodo.mockRejectedValueOnce(new Error('Edit failed'))

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0])
    const editInput = screen.getByDisplayValue('Write tests')
    const editDueDate = within(todoRow('Write tests')).getByLabelText(/due date/i)
    await user.clear(editInput)
    await user.type(editInput, 'Failed title')
    await user.clear(editDueDate)
    await user.type(editDueDate, '2026-11-30')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Edit failed')
    expect(screen.getByDisplayValue('Failed title')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-11-30')).toBeInTheDocument()
    expect(screen.queryByText('Failed title')).not.toBeInTheDocument()
  })

  it('toggles completion after the API succeeds', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce(initialTodos)
    updateTodo.mockResolvedValueOnce({ ...initialTodos[0], completed: true })

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getByRole('checkbox', { name: /incomplete/i }))

    expect(updateTodo).toHaveBeenCalledWith('todo-1', { completed: true })
    await waitFor(() => expect(screen.getAllByRole('checkbox')[0]).toBeChecked())
  })

  it('keeps completion unchanged when toggling fails', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce(initialTodos)
    updateTodo.mockRejectedValueOnce(new Error('Toggle failed'))

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getByRole('checkbox', { name: /incomplete/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Toggle failed')
    expect(screen.getByRole('checkbox', { name: /incomplete/i })).not.toBeChecked()
  })

  it('cancels deletion without calling the API', async () => {
    const user = userEvent.setup()
    window.confirm.mockReturnValueOnce(false)
    listTodos.mockResolvedValueOnce(initialTodos)

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0])

    expect(deleteTodo).not.toHaveBeenCalled()
    expect(screen.getByText('Write tests')).toBeInTheDocument()
  })

  it('deletes a todo after confirmation and API success', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce(initialTodos)
    deleteTodo.mockResolvedValueOnce(null)

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0])

    expect(window.confirm).toHaveBeenCalledWith('Delete "Write tests"?')
    expect(deleteTodo).toHaveBeenCalledWith('todo-1')
    await waitFor(() => expect(screen.queryByText('Write tests')).not.toBeInTheDocument())
  })

  it('keeps a todo when deletion fails', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce(initialTodos)
    deleteTodo.mockRejectedValueOnce(new Error('Delete failed'))

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0])

    expect(await screen.findByRole('alert')).toHaveTextContent('Delete failed')
    expect(screen.getByText('Write tests')).toBeInTheDocument()
  })

  it('marks only incomplete todos before the local current date as overdue', async () => {
    vi.setSystemTime(new Date(2026, 5, 15, 9, 0, 0))
    listTodos.mockResolvedValueOnce([
      { _id: 'past', title: 'Past incomplete', completed: false, dueDate: '2026-06-14T00:00:00.000Z' },
      { _id: 'today', title: 'Due today', completed: false, dueDate: '2026-06-15T00:00:00.000Z' },
      { _id: 'future', title: 'Future task', completed: false, dueDate: '2026-06-16T00:00:00.000Z' },
      { _id: 'done-past', title: 'Completed late', completed: true, dueDate: '2026-06-01T00:00:00.000Z' },
      { _id: 'undated', title: 'No deadline', completed: false, dueDate: null },
    ])

    renderTodos()
    await screen.findByText('Past incomplete')

    expect(todoRow('Past incomplete')).toHaveClass('overdue')
    expect(within(todoRow('Past incomplete')).getByText(/overdue/i)).toBeInTheDocument()
    expect(todoRow('Due today')).not.toHaveClass('overdue')
    expect(todoRow('Future task')).not.toHaveClass('overdue')
    expect(todoRow('Completed late')).not.toHaveClass('overdue')
    expect(todoRow('No deadline')).not.toHaveClass('overdue')
  })

  it('filters to overdue todos in their existing order and updates after completion', async () => {
    vi.setSystemTime(new Date(2026, 5, 15, 9, 0, 0))
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce([
      { _id: 'past-1', title: 'First past', completed: false, dueDate: '2026-06-01T00:00:00.000Z' },
      { _id: 'today', title: 'Due today', completed: false, dueDate: '2026-06-15T00:00:00.000Z' },
      { _id: 'past-2', title: 'Second past', completed: false, dueDate: '2026-06-14T00:00:00.000Z' },
      { _id: 'done-past', title: 'Done past', completed: true, dueDate: '2026-06-01T00:00:00.000Z' },
    ])
    updateTodo.mockResolvedValueOnce({
      _id: 'past-1',
      title: 'First past',
      completed: true,
      dueDate: '2026-06-01T00:00:00.000Z',
    })
    updateTodo.mockResolvedValueOnce({
      _id: 'past-2',
      title: 'Second past',
      completed: true,
      dueDate: '2026-06-14T00:00:00.000Z',
    })

    renderTodos()
    await screen.findByText('First past')
    await user.click(screen.getByRole('button', { name: /^overdue$/i }))

    let visibleRows = within(screen.getByRole('list', { name: /todo list/i })).getAllByRole('listitem')
    expect(visibleRows.map((row) => within(row).getByText(/past/i).textContent)).toEqual(['First past', 'Second past'])
    expect(screen.queryByText('Due today')).not.toBeInTheDocument()
    expect(screen.queryByText('Done past')).not.toBeInTheDocument()

    await user.click(within(todoRow('First past')).getByRole('checkbox', { name: /incomplete/i }))
    await waitFor(() => expect(screen.queryByText('First past')).not.toBeInTheDocument())
    expect(screen.getByText('Second past')).toBeInTheDocument()

    await user.click(within(todoRow('Second past')).getByRole('checkbox', { name: /incomplete/i }))
    expect(await screen.findByText(/no overdue todos/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^all$/i }))
    expect(screen.getByText('First past')).toBeInTheDocument()
    expect(screen.getByText('Due today')).toBeInTheDocument()
    expect(screen.getByText('Second past')).toBeInTheDocument()
    expect(screen.getByText('Done past')).toBeInTheDocument()
  })
})
