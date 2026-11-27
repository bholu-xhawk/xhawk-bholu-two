import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Todos from './Todos'
import { listTodos } from '../api/todos'

vi.mock('../api/todos', () => ({
  listTodos: vi.fn(),
}))

const mockedTodos = [
  { id: 'mock-todo-1', title: 'Review the mocked todo endpoint', completed: true },
  { id: 'mock-todo-2', title: 'Render read-only todo rows', completed: false },
  { id: 'mock-todo-3', title: 'Keep the users sample backed by MongoDB', completed: false },
]

function renderTodos() {
  return render(<Todos />)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Todos page', () => {
  it('shows the loading state while the mocked GET request is pending', () => {
    listTodos.mockReturnValueOnce(new Promise(() => {}))

    renderTodos()

    expect(screen.getByText(/loading todos/i)).toBeInTheDocument()
    expect(listTodos).toHaveBeenCalledTimes(1)
  })

  it('renders mocked todos in order with read-only completion status', async () => {
    listTodos.mockResolvedValueOnce(mockedTodos)

    renderTodos()

    const list = await screen.findByRole('list', { name: /read-only todo list/i })
    const items = within(list).getAllByRole('listitem')

    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Review the mocked todo endpoint')
    expect(items[0]).toHaveTextContent('Completed')
    expect(items[1]).toHaveTextContent('Render read-only todo rows')
    expect(items[1]).toHaveTextContent('Incomplete')
    expect(items[2]).toHaveTextContent('Keep the users sample backed by MongoDB')
    expect(items[2]).toHaveTextContent('Incomplete')
  })

  it('shows an empty state when the mocked endpoint returns no todos', async () => {
    listTodos.mockResolvedValueOnce([])

    renderTodos()

    expect(await screen.findByText(/no mocked todos are available/i)).toBeInTheDocument()
  })

  it('shows load errors from the mocked GET request', async () => {
    listTodos.mockRejectedValueOnce(new Error('API is down'))

    renderTodos()

    expect(await screen.findByRole('alert')).toHaveTextContent('API is down')
  })

  it('does not expose create, edit, toggle, or delete controls', async () => {
    listTodos.mockResolvedValueOnce(mockedTodos)

    renderTodos()

    await screen.findByText('Review the mocked todo endpoint')

    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/new todo/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add todo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })
})
