import '@testing-library/jest-dom/vitest'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { getCustomer } from './api/customers'
import { listTodos } from './api/todos'

vi.mock('./api/customers', () => ({
  getCustomer: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}))

vi.mock('./api/todos', () => ({
  listTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}))

function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  listTodos.mockResolvedValue([])
})

describe('App routes', () => {
  it('renders the default todos route', async () => {
    renderApp()

    expect(await screen.findByRole('heading', { name: /todos/i })).toBeInTheDocument()
    expect(listTodos).toHaveBeenCalledTimes(1)
  })

  it('renders the customer create route', () => {
    renderApp('/customers/new')

    expect(screen.getByRole('heading', { name: /create customer/i })).toBeInTheDocument()
    expect(getCustomer).not.toHaveBeenCalled()
  })

  it('renders the customer edit route', async () => {
    getCustomer.mockResolvedValueOnce({ name: 'Route Customer', email: 'route@example.com', company: 'Route Co' })

    renderApp('/customers/customer-1/edit')

    expect(screen.getByRole('heading', { name: /edit customer/i })).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Route Customer')).toBeInTheDocument()
    expect(getCustomer).toHaveBeenCalledWith('customer-1', expect.objectContaining({ signal: expect.any(AbortSignal) }))
  })
})
