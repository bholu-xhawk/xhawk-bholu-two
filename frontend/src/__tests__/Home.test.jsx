import { render, screen } from '@testing-library/react'
import Home from '../pages/Home'

describe('Home', () => {
  it('renders the welcome content', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument()
    expect(
      screen.getByText(/dummy animated portfolio built with React, Vite, and Framer Motion/i),
    ).toBeInTheDocument()
  })
})
