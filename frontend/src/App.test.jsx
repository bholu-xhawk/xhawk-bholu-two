import React from 'react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

vi.mock('framer-motion', async () => {
  const React = await import('react')
  return {
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      main: React.forwardRef(({ children, ...props }, ref) => <main ref={ref} {...props}>{children}</main>),
    },
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  delete window.__API_BASE_URL__
  delete window.__AUTH_TOKEN__
})

describe('App', () => {
  it('renders navigation and the todos home page', async () => {
    window.__API_BASE_URL__ = 'http://test.local/api'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
    )

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /todos/i })).toBeInTheDocument()
  })
})
