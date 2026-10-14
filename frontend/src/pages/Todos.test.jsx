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
})
