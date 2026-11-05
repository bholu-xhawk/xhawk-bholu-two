import '@testing-library/jest-dom/vitest'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./pages/Customers', () => ({
  default: () => <main><h1>Customers</h1></main>,
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
}))

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  )
}

describe('App routing', () => {
  it('registers and links the customers page without replacing todos at the root', () => {
    renderApp('/customers')

    expect(screen.getByRole('heading', { name: 'Customers' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Customers' })).toHaveAttribute('href', '/customers')
    expect(screen.getByRole('link', { name: 'Todos' })).toHaveAttribute('href', '/')
  })
})
