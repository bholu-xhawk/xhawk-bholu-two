import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'

describe('Navbar', () => {
  it('renders the portfolio brand and expected navigation links', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    const navigation = screen.getByRole('navigation')
    expect(within(navigation).getByRole('link', { name: 'My Portfolio' })).toHaveAttribute('href', '/')

    for (const name of ['Home', 'About', 'Projects', 'Skills', 'Experience', 'Blog', 'Resume', 'Setup', 'Contact']) {
      expect(within(navigation).getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('marks the current route link as active', () => {
    render(
      <MemoryRouter initialEntries={['/projects']}>
        <Navbar />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Projects' })).toHaveClass('active')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveClass('active')
  })
})
