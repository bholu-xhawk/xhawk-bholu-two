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
  { _id: 'todo-1', title: 'Write tests', completed: false, dueDate: null },
  { _id: 'todo-2', title: 'Ship feature', completed: true, dueDate: '2026-05-10' },
]

function renderTodos() {
  return render(<Todos />)
}

function renderedTitles(container) {
  return Array.from(container.querySelectorAll('.todo-title')).map((title) => title.textContent)
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

  it('creates a todo with a due date after the API succeeds', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce([])
    createTodo.mockResolvedValueOnce({ _id: 'todo-3', title: 'New todo', completed: false, dueDate: '2026-06-15' })

    renderTodos()
    await screen.findByText(/no todos yet/i)
    await user.type(screen.getByLabelText(/new todo/i), ' New todo ')
    await user.type(screen.getByLabelText(/due date \(optional\)/i), '2026-06-15')
    await user.click(screen.getByRole('button', { name: /add todo/i }))

    expect(createTodo).toHaveBeenCalledWith('New todo', '2026-06-15')
    const list = screen.getByRole('list', { name: /todo list/i })
    expect(within(list).getByText('New todo')).toBeInTheDocument()
    expect(within(list).getByText('2026-06-15')).toHaveAttribute('datetime', '2026-06-15')
    expect(screen.getByLabelText(/new todo/i)).toHaveValue('')
    expect(screen.getByLabelText(/due date \(optional\)/i)).toHaveValue('')
  })

  it('sends null when creating without a due date', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce([])
    createTodo.mockResolvedValueOnce({ _id: 'todo-3', title: 'New todo', completed: false, dueDate: null })

    renderTodos()
    await screen.findByText(/no todos yet/i)
    await user.type(screen.getByLabelText(/new todo/i), 'New todo')
    await user.click(screen.getByRole('button', { name: /add todo/i }))

    expect(createTodo).toHaveBeenCalledWith('New todo', null)
    expect(screen.getByText('No due date')).toBeInTheDocument()
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

  it('saves title and due-date edits only after the API succeeds', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce(initialTodos)
    updateTodo.mockResolvedValueOnce({ ...initialTodos[0], title: 'Write better tests', dueDate: '2026-07-20' })

    renderTodos()
    await screen.findByText('Write tests')
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0])
    const editInput = screen.getByDisplayValue('Write tests')
    await user.clear(editInput)
    await user.type(editInput, 'Write better tests')
    await user.type(screen.getByLabelText(/^due date$/i), '2026-07-20')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(updateTodo).toHaveBeenCalledWith('todo-1', { title: 'Write better tests', dueDate: '2026-07-20' })
    expect(await screen.findByText('Write better tests')).toBeInTheDocument()
    expect(screen.getByText('2026-07-20')).toHaveAttribute('datetime', '2026-07-20')
  })

  it('sends null to clear a saved due date', async () => {
    const user = userEvent.setup()
    listTodos.mockResolvedValueOnce(initialTodos)
    updateTodo.mockResolvedValueOnce({ ...initialTodos[1], dueDate: null })

    renderTodos()
    await screen.findByText('Ship feature')
    await user.click(screen.getAllByRole('button', { name: /edit/i })[1])
    const dueDateInput = screen.getByLabelText(/^due date$/i)
    expect(dueDateInput).toHaveValue('2026-05-10')
    await user.clear(dueDateInput)
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(updateTodo).toHaveBeenCalledWith('todo-2', { title: 'Ship feature', dueDate: null })
    await waitFor(() => expect(screen.queryByText('2026-05-10')).not.toBeInTheDocument())
    expect(screen.getAllByText('No due date')).toHaveLength(2)
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

  it('keeps default newest-first API order and does not refetch when sorting by due date', async () => {
    const user = userEvent.setup()
    const todos = [
      { _id: 'todo-newest', title: 'Newest undated', completed: false, dueDate: null },
      { _id: 'todo-late', title: 'Later due date', completed: false, dueDate: '2026-12-01' },
      { _id: 'todo-tie-a', title: 'Tie first', completed: false, dueDate: '2026-04-01' },
      { _id: 'todo-tie-b', title: 'Tie second', completed: false, dueDate: '2026-04-01' },
      { _id: 'todo-early', title: 'Earliest due date', completed: false, dueDate: '2026-01-15' },
      { _id: 'todo-missing', title: 'Missing due date', completed: false },
    ]
    listTodos.mockResolvedValueOnce(todos)

    const { container } = renderTodos()
    await screen.findByText('Newest undated')
    expect(renderedTitles(container)).toEqual([
      'Newest undated',
      'Later due date',
      'Tie first',
      'Tie second',
      'Earliest due date',
      'Missing due date',
    ])

    await user.selectOptions(screen.getByLabelText(/sort todos/i), 'dueDate')

    expect(listTodos).toHaveBeenCalledTimes(1)
    expect(renderedTitles(container)).toEqual([
      'Earliest due date',
      'Tie first',
      'Tie second',
      'Later due date',
      'Newest undated',
      'Missing due date',
    ])
  })

  it('reorders the due-date view immediately after successful create and edit mutations', async () => {
    const user = userEvent.setup()
    const todos = [
      { _id: 'todo-late', title: 'Later due date', completed: false, dueDate: '2026-12-01' },
      { _id: 'todo-middle', title: 'Middle due date', completed: false, dueDate: '2026-06-01' },
      { _id: 'todo-undated', title: 'No date task', completed: false, dueDate: null },
    ]
    listTodos.mockResolvedValueOnce(todos)
    createTodo.mockResolvedValueOnce({ _id: 'todo-early', title: 'Earliest due date', completed: false, dueDate: '2026-01-01' })
    updateTodo.mockResolvedValueOnce({ ...todos[0], dueDate: '2026-02-01' })

    const { container } = renderTodos()
    await screen.findByText('Later due date')
    await user.selectOptions(screen.getByLabelText(/sort todos/i), 'dueDate')
    expect(renderedTitles(container)).toEqual(['Middle due date', 'Later due date', 'No date task'])

    await user.type(screen.getByLabelText(/new todo/i), 'Earliest due date')
    await user.type(screen.getByLabelText(/due date \(optional\)/i), '2026-01-01')
    await user.click(screen.getByRole('button', { name: /add todo/i }))
    await waitFor(() => expect(renderedTitles(container)).toEqual(['Earliest due date', 'Middle due date', 'Later due date', 'No date task']))

    await user.click(screen.getAllByRole('button', { name: /edit/i })[2])
    await user.clear(screen.getByLabelText(/^due date$/i))
    await user.type(screen.getByLabelText(/^due date$/i), '2026-02-01')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(updateTodo).toHaveBeenCalledWith('todo-late', { title: 'Later due date', dueDate: '2026-02-01' })
    await waitFor(() => expect(renderedTitles(container)).toEqual(['Earliest due date', 'Later due date', 'Middle due date', 'No date task']))
    expect(listTodos).toHaveBeenCalledTimes(1)
  })
})
