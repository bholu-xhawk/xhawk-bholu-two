import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

describe('App', () => {
  it('renders the home route with the portfolio navigation', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Portfolio' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument()
  })
})
