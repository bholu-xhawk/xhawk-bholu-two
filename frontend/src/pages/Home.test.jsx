import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import Home from './Home'

vi.mock('framer-motion', async () => {
  const React = await import('react')
  return {
    motion: {
      main: React.forwardRef(({ children, ...props }, ref) => <main ref={ref} {...props}>{children}</main>),
    },
  }
})

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  window.__API_BASE_URL__ = 'http://test.local/api'
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  delete window.__API_BASE_URL__
  delete window.__AUTH_TOKEN__
})

describe('Home', () => {
  it('loads and renders todos', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse([{ id: 'todo-1', title: 'Ship feature', completed: false }])
    )

    render(<Home />)

    expect(screen.getByText(/loading todos/i)).toBeInTheDocument()
    expect(await screen.findByText('Ship feature')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith('http://test.local/api/todos', expect.any(Object))
  })


  it('disables creation while the initial load is in flight', async () => {
    let resolveLoad
    vi.spyOn(globalThis, 'fetch').mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = () => resolve(jsonResponse([]))
      })
    )

    render(<Home />)

    const input = screen.getByLabelText(/new todo/i)
    const button = screen.getByRole('button', { name: /add todo/i })
    expect(input).toBeDisabled()
    expect(button).toBeDisabled()

    resolveLoad()

    await waitFor(() => expect(input).not.toBeDisabled())
  })

  it('adds a todo through the API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'todo-2', title: 'New task', completed: false }, 201))

    render(<Home />)

    await screen.findByText(/no todos yet/i)
    await userEvent.type(screen.getByLabelText(/new todo/i), 'New task')
    await userEvent.click(screen.getByRole('button', { name: /add todo/i }))

    expect(await screen.findByText('New task')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://test.local/api/todos',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: 'New task' }) })
    )
  })

  it('toggles a todo completion state', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse([{ id: 'todo-3', title: 'Toggle task', completed: false }]))
      .mockResolvedValueOnce(jsonResponse({ id: 'todo-3', title: 'Toggle task', completed: true }))

    render(<Home />)

    await userEvent.click(await screen.findByRole('checkbox', { name: /toggle task/i }))

    await waitFor(() => expect(screen.getByRole('checkbox', { name: /toggle task/i })).toBeChecked())
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://test.local/api/todos/todo-3',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ completed: true }) })
    )
  })

  it('deletes a todo through the API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse([{ id: 'todo-4', title: 'Remove task', completed: false }]))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    render(<Home />)

    expect(await screen.findByText('Remove task')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(screen.queryByText('Remove task')).not.toBeInTheDocument())
    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://test.local/api/todos/todo-4',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('shows API errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ error: 'database offline' }, 500))

    render(<Home />)

    expect(await screen.findByRole('alert')).toHaveTextContent('database offline')
  })
})
