import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Todos from './Todos'
import { clearCompletedTodos, createTodo, deleteTodo, listTodos, updateTodo } from '../api/todos'

vi.mock('../api/todos', () => ({
  listTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  clearCompletedTodos: vi.fn(),
}))

const initialTodos = [
  { _id: 'todo-1', title: 'Write tests', completed: false },
  { _id: 'todo-2', title: 'Ship feature', completed: true },
]

function renderTodos() {
  return render(<Todos />)
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
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
    createTodo.mockResolvedValueOnce({ _id: 'todo-3', title: 'New todo', completed: false })

    renderTodos()
    await screen.findByText(/no todos yet/i)
    await user.type(screen.getByLabelText(/new todo/i), ' New todo ')
    await user.click(screen.getByRole('button', { name: /add todo/i }))

    expect(createTodo).toHaveBeenCalledWith('New todo')
    expect(within(screen.getByRole('list', { name: /todo list/i })).getByText('New todo')).toBeInTheDocument()
    expect(screen.getByLabelText(/new todo/i)).toHaveValue('')
  })

  it('does not add a todo when creation fails', async () => {
    const user = userEvent.setup()
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
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce(initialTodos)

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0])
    const editInput = screen.getByDisplayValue('Write tests')
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
    updateTodo.mockResolvedValueOnce({ ...initialTodos[0], title: 'Write better tests' })

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0])
    const editInput = screen.getByDisplayValue('Write tests')
    await user.clear(editInput)
    await user.type(editInput, 'Write better tests')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(updateTodo).toHaveBeenCalledWith('todo-1', { title: 'Write better tests' })
    expect(await screen.findByText('Write better tests')).toBeInTheDocument()
  })

  it('keeps the original title when editing fails', async () => {
    const user = userEvent.setup()
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

  it('disables clear completed when no todos are completed', async () => {
    listTodos.mockResolvedValueOnce([{ _id: 'todo-1', title: 'Still active', completed: false }])

    renderTodos()

    expect(await screen.findByRole('button', { name: /clear completed/i })).toBeDisabled()
  })

  it('cancels clearing completed todos without calling the API', async () => {
    const user = userEvent.setup()
    window.confirm.mockReturnValueOnce(false)
    listTodos.mockResolvedValueOnce(initialTodos)

    renderTodos()
    await screen.findByText('Ship feature')
    await user.click(screen.getByRole('button', { name: /clear completed/i }))

    expect(window.confirm).toHaveBeenCalledWith('Clear 1 completed todo?')
    expect(clearCompletedTodos).not.toHaveBeenCalled()
    expect(screen.getByText('Write tests')).toBeInTheDocument()
    expect(screen.getByText('Ship feature')).toBeInTheDocument()
  })

  it('clears completed todos after confirmation and API success', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce([
      ...initialTodos,
      { _id: 'todo-3', title: 'Archive docs', completed: true },
    ])
    clearCompletedTodos.mockResolvedValueOnce(null)

    renderTodos()
    await screen.findByText('Archive docs')
    await user.click(screen.getByRole('button', { name: /clear completed/i }))

    expect(window.confirm).toHaveBeenCalledWith('Clear 2 completed todos?')
    expect(clearCompletedTodos).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.queryByText('Ship feature')).not.toBeInTheDocument()
      expect(screen.queryByText('Archive docs')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Write tests')).toBeInTheDocument()
  })

  it('disables the clear and item controls while clearing completed todos', async () => {
    const user = userEvent.setup()
    let resolveClear
    listTodos.mockResolvedValueOnce(initialTodos)
    clearCompletedTodos.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveClear = resolve
      }),
    )

    renderTodos()
    await screen.findByText('Ship feature')
    await user.click(screen.getByRole('button', { name: /clear completed/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /clear completed/i })).toBeDisabled())
    screen.getAllByRole('checkbox').forEach((checkbox) => expect(checkbox).toBeDisabled())
    screen.getAllByRole('button', { name: /edit/i }).forEach((button) => expect(button).toBeDisabled())
    screen.getAllByRole('button', { name: /delete/i }).forEach((button) => expect(button).toBeDisabled())

    resolveClear(null)
    await waitFor(() => expect(screen.queryByText('Ship feature')).not.toBeInTheDocument())
  })

  it('keeps all todos and shows an alert when clearing completed todos fails', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce(initialTodos)
    clearCompletedTodos.mockRejectedValueOnce(new Error('Clear failed'))

    renderTodos()
    await screen.findByText('Ship feature')
    await user.click(screen.getByRole('button', { name: /clear completed/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Clear failed')
    expect(screen.getByText('Write tests')).toBeInTheDocument()
    expect(screen.getByText('Ship feature')).toBeInTheDocument()
  })
})
