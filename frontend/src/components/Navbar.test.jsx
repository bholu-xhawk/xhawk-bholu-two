import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'

const renderNavbar = (initialPath = '/') => render(
  <MemoryRouter
    initialEntries={[initialPath]}
    future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
  >
    <Navbar />
  </MemoryRouter>
)

describe('Navbar', () => {
  it('renders the brand and navigation links', () => {
    renderNavbar()

    expect(screen.getByRole('link', { name: 'My Portfolio' })).toHaveAttribute('href', '/')

    for (const name of ['Home', 'About', 'Projects', 'Skills', 'Experience', 'Blog', 'Resume', 'Setup', 'Contact']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('marks the home link active on the root route', () => {
    renderNavbar()

    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('active')
    expect(screen.getByRole('link', { name: 'About' })).not.toHaveClass('active')
  })
})
