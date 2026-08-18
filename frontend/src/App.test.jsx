import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

function renderApp(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  )
}

describe('App routes', () => {
  it('renders the home route', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument()
    expect(screen.getByText(/dummy animated portfolio/i)).toBeInTheDocument()
  })

  it('renders the setup route directly', () => {
    renderApp('/setup')

    expect(screen.getByRole('heading', { name: /setup/i })).toBeInTheDocument()
    expect(screen.getByText(/basic setup instructions/i)).toBeInTheDocument()
  })

  it('navigates to setup from the navbar', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('link', { name: /setup/i }))

    expect(await screen.findByRole('heading', { name: /setup/i })).toBeInTheDocument()
    expect(await screen.findByText(/install dependencies/i)).toBeInTheDocument()
  })
})
