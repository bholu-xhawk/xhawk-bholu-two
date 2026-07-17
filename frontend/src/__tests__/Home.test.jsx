import { render, screen } from '@testing-library/react'
import Home from '../pages/Home'

describe('Home', () => {
  it('renders the welcome heading', () => {
    render(<Home />)

    expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument()
  })
})
