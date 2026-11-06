import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Todos from './Todos'
import { createTodo, deleteTodo, listTodos, updateTodo } from '../api/todos'

vi.mock('../api/todos', () => ({
  listTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}))

const initialTodos = [
  { _id: 'todo-1', title: 'Write tests', completed: false, dueDate: '2026-11-05T00:00:00.000Z' },
  { _id: 'todo-2', title: 'Ship feature', completed: true, dueDate: '2026-11-04T00:00:00.000Z' },
]

const deadlineTodos = [
  { _id: 'past', title: 'Past incomplete', completed: false, dueDate: '2026-11-05T00:00:00.000Z' },
  { _id: 'today', title: 'Due today', completed: false, dueDate: '2026-11-06T00:00:00.000Z' },
  { _id: 'future', title: 'Future task', completed: false, dueDate: '2026-11-07T00:00:00.000Z' },
  { _id: 'missing', title: 'No date task', completed: false },
  { _id: 'done-past', title: 'Completed past task', completed: true, dueDate: '2026-11-01T00:00:00.000Z' },
]

const RealDate = Date

function renderTodos() {
  return render(<Todos />)
}

function setupUser() {
  return userEvent.setup()
}

function stubToday(isoDate) {
  class FixedDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super(isoDate)
      } else {
        super(...args)
      }
    }

    static now() {
      return new RealDate(isoDate).getTime()
    }

    static parse(value) {
      return RealDate.parse(value)
    }

    static UTC(...args) {
      return RealDate.UTC(...args)
    }
  }

  vi.stubGlobal('Date', FixedDate)
}

beforeEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.clearAllMocks()
  stubToday('2026-11-06T12:00:00Z')
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

afterEach(() => {
  vi.unstubAllGlobals()
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
    const user = setupUser()
    listTodos.mockResolvedValueOnce([])
    createTodo.mockResolvedValueOnce({
      _id: 'todo-3',
      title: 'New todo',
      completed: false,
      dueDate: '2026-11-07T00:00:00.000Z',
    })

    renderTodos()
    await screen.findByText(/no todos yet/i)
    await user.type(screen.getByLabelText(/new todo/i), ' New todo ')
    await user.type(screen.getByLabelText(/due date/i), '2026-11-07')
    await user.click(screen.getByRole('button', { name: /add todo/i }))

    expect(createTodo).toHaveBeenCalledWith('New todo', '2026-11-07')
    const list = within(screen.getByRole('list', { name: /todo list/i }))
    expect(list.getByText('New todo')).toBeInTheDocument()
    expect(list.getByText('Due 2026-11-07')).toBeInTheDocument()
    expect(screen.getByLabelText(/new todo/i)).toHaveValue('')
    expect(screen.getByLabelText(/due date/i)).toHaveValue('')
  })

  it('does not add a todo when creation fails', async () => {
    const user = setupUser()
    listTodos.mockResolvedValueOnce([])
    createTodo.mockRejectedValueOnce(new Error('Create failed'))

    renderTodos()
    await screen.findByText(/no todos yet/i)
    await user.type(screen.getByLabelText(/new todo/i), 'Broken todo')
    await user.click(screen.getByRole('button', { name: /add todo/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Create failed')
    expect(screen.queryByText('Broken todo')).not.toBeInTheDocument()
  })

  it('edits and cancels editing without changing state', async () => {
    const user = setupUser()
    listTodos.mockResolvedValueOnce(initialTodos)

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0])
    const editInput = screen.getByDisplayValue('Write tests')
    await user.clear(editInput)
    await user.type(editInput, 'Changed locally')
    const editDueDate = screen.getByDisplayValue('2026-11-05')
    await user.clear(editDueDate)
    await user.type(editDueDate, '2026-11-08')
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.getByText('Write tests')).toBeInTheDocument()
    expect(screen.getByText('Due 2026-11-05')).toBeInTheDocument()
    expect(screen.queryByText('Changed locally')).not.toBeInTheDocument()
    expect(updateTodo).not.toHaveBeenCalled()
  })

  it('saves title and due-date edits only after the API succeeds', async () => {
    const user = setupUser()
    listTodos.mockResolvedValueOnce(initialTodos)
    updateTodo.mockResolvedValueOnce({
      ...initialTodos[0],
      title: 'Write better tests',
      dueDate: '2026-11-08T00:00:00.000Z',
    })

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0])
    const editInput = screen.getByDisplayValue('Write tests')
    await user.clear(editInput)
    await user.type(editInput, 'Write better tests')
    const editDueDate = screen.getByDisplayValue('2026-11-05')
    await user.clear(editDueDate)
    await user.type(editDueDate, '2026-11-08')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(updateTodo).toHaveBeenCalledWith('todo-1', { title: 'Write better tests', dueDate: '2026-11-08' })
    expect(await screen.findByText('Write better tests')).toBeInTheDocument()
    expect(screen.getByText('Due 2026-11-08')).toBeInTheDocument()
  })

  it('sends null to clear an existing due date', async () => {
    const user = setupUser()
    listTodos.mockResolvedValueOnce(initialTodos)
    updateTodo.mockResolvedValueOnce({ ...initialTodos[0], dueDate: null })

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0])
    const editDueDate = screen.getByDisplayValue('2026-11-05')
    await user.clear(editDueDate)
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(updateTodo).toHaveBeenCalledWith('todo-1', { title: 'Write tests', dueDate: null })
    expect(await screen.findByText('No due date')).toBeInTheDocument()
  })

  it('keeps the original title when editing fails', async () => {
    const user = setupUser()
    listTodos.mockResolvedValueOnce(initialTodos)
    updateTodo.mockRejectedValueOnce(new Error('Edit failed'))

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0])
    const editInput = screen.getByDisplayValue('Write tests')
    await user.clear(editInput)
    await user.type(editInput, 'Failed title')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Edit failed')
    expect(screen.getByDisplayValue('Failed title')).toBeInTheDocument()
    expect(screen.queryByText('Failed title')).not.toBeInTheDocument()
  })

  it('toggles completion after the API succeeds', async () => {
    const user = setupUser()
    listTodos.mockResolvedValueOnce(initialTodos)
    updateTodo.mockResolvedValueOnce({ ...initialTodos[0], completed: true })

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getByRole('checkbox', { name: /incomplete/i }))

    expect(updateTodo).toHaveBeenCalledWith('todo-1', { completed: true })
    await waitFor(() => expect(within(screen.getByText('Write tests').closest('li')).getByRole('checkbox')).toBeChecked())
  })

  it('keeps completion unchanged when toggling fails', async () => {
    const user = setupUser()
    listTodos.mockResolvedValueOnce(initialTodos)
    updateTodo.mockRejectedValueOnce(new Error('Toggle failed'))

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getByRole('checkbox', { name: /incomplete/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Toggle failed')
    expect(screen.getByRole('checkbox', { name: /incomplete/i })).not.toBeChecked()
  })

  it('cancels deletion without calling the API', async () => {
    const user = setupUser()
    window.confirm.mockReturnValueOnce(false)
    listTodos.mockResolvedValueOnce(initialTodos)

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0])

    expect(deleteTodo).not.toHaveBeenCalled()
    expect(screen.getByText('Write tests')).toBeInTheDocument()
  })

  it('deletes a todo after confirmation and API success', async () => {
    const user = setupUser()
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
    const user = setupUser()
    listTodos.mockResolvedValueOnce(initialTodos)
    deleteTodo.mockRejectedValueOnce(new Error('Delete failed'))

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0])

    expect(await screen.findByRole('alert')).toHaveTextContent('Delete failed')
    expect(screen.getByText('Write tests')).toBeInTheDocument()
  })

  it('marks only past incomplete todos as overdue with visible status text', async () => {
    listTodos.mockResolvedValueOnce(deadlineTodos)

    renderTodos()
    await screen.findByText('Past incomplete')

    const pastRow = screen.getByText('Past incomplete').closest('li')
    const todayRow = screen.getByText('Due today').closest('li')
    const futureRow = screen.getByText('Future task').closest('li')
    const missingRow = screen.getByText('No date task').closest('li')
    const completedRow = screen.getByText('Completed past task').closest('li')

    expect(pastRow).toHaveClass('overdue')
    expect(within(pastRow).getByText('Overdue')).toBeInTheDocument()
    expect(todayRow).not.toHaveClass('overdue')
    expect(futureRow).not.toHaveClass('overdue')
    expect(missingRow).not.toHaveClass('overdue')
    expect(completedRow).toHaveClass('completed')
    expect(completedRow).not.toHaveClass('overdue')
    expect(screen.getByText('Due 2026-11-06')).toBeInTheDocument()
    expect(screen.getByText('No due date')).toBeInTheDocument()
  })

  it('filters to the same overdue rows and shows a dedicated no-results message', async () => {
    const user = setupUser()
    listTodos.mockResolvedValueOnce(deadlineTodos)
    updateTodo.mockResolvedValueOnce({ ...deadlineTodos[0], completed: true })

    renderTodos()
    await screen.findByText('Past incomplete')
    await user.click(screen.getByRole('checkbox', { name: /show overdue only/i }))

    expect(screen.getByText('Past incomplete')).toBeInTheDocument()
    expect(screen.queryByText('Due today')).not.toBeInTheDocument()
    expect(screen.queryByText('Future task')).not.toBeInTheDocument()
    expect(screen.queryByText('No date task')).not.toBeInTheDocument()
    expect(screen.queryByText('Completed past task')).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /incomplete/i }))

    expect(updateTodo).toHaveBeenCalledWith('past', { completed: true })
    expect(await screen.findByText(/no overdue todos/i)).toBeInTheDocument()
    expect(screen.queryByText(/no todos yet/i)).not.toBeInTheDocument()
  })

  it('removes an item from the active overdue filter after its due date is moved', async () => {
    const user = setupUser()
    listTodos.mockResolvedValueOnce(deadlineTodos)
    updateTodo.mockResolvedValueOnce({ ...deadlineTodos[0], dueDate: '2026-11-07T00:00:00.000Z' })

    renderTodos()
    await screen.findByText('Past incomplete')
    await user.click(screen.getByRole('checkbox', { name: /show overdue only/i }))
    await user.click(screen.getByRole('button', { name: /edit/i }))
    const editDueDate = screen.getByDisplayValue('2026-11-05')
    await user.clear(editDueDate)
    await user.type(editDueDate, '2026-11-07')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(updateTodo).toHaveBeenCalledWith('past', { title: 'Past incomplete', dueDate: '2026-11-07' })
    expect(await screen.findByText(/no overdue todos/i)).toBeInTheDocument()
    expect(screen.queryByText('Past incomplete')).not.toBeInTheDocument()
  })
})
