import '@testing-library/jest-dom/vitest'
import React from 'react'
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CustomerForm from './CustomerForm'
import { createCustomer, getCustomer, updateCustomer } from '../api/customers'

vi.mock('../api/customers', () => ({
  getCustomer: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}))

function renderCustomerForm(route = '/customers/new', extraRoutes = null) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />
        <Route path="/customers" element={<h1>Customer list</h1>} />
        {extraRoutes}
      </Routes>
    </MemoryRouter>
  )
}

function deferred() {
  let resolve
  let reject
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CustomerForm', () => {
  it('renders empty create mode without loading a customer', () => {
    renderCustomerForm()

    expect(screen.getByRole('heading', { name: /create customer/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toHaveValue('')
    expect(screen.getByLabelText(/email/i)).toHaveValue('')
    expect(screen.getByLabelText(/company/i)).toHaveValue('')
    expect(getCustomer).not.toHaveBeenCalled()
  })

  it('loads and prepopulates edit mode', async () => {
    getCustomer.mockResolvedValueOnce({ name: 'Ada Lovelace', email: 'ada@example.com', company: 'Analytical Engines' })

    renderCustomerForm('/customers/customer-1/edit')

    expect(screen.getByText(/loading customer/i)).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toHaveValue('ada@example.com')
    expect(screen.getByLabelText(/company/i)).toHaveValue('Analytical Engines')
    expect(getCustomer).toHaveBeenCalledWith('customer-1', expect.objectContaining({ signal: expect.any(AbortSignal) }))
  })

  it('shows accessible required-field errors and skips the API for invalid input', async () => {
    const user = userEvent.setup()
    renderCustomerForm()

    await user.click(screen.getByRole('button', { name: /create customer/i }))

    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const companyInput = screen.getByLabelText(/company/i)
    expect(nameInput).toHaveFocus()
    expect(nameInput).toHaveAttribute('aria-invalid', 'true')
    expect(nameInput).toHaveAccessibleDescription('Name is required.')
    expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    expect(emailInput).toHaveAccessibleDescription('Email is required.')
    expect(companyInput).toHaveAttribute('aria-invalid', 'true')
    expect(companyInput).toHaveAccessibleDescription('Company is required.')
    expect(createCustomer).not.toHaveBeenCalled()
    expect(updateCustomer).not.toHaveBeenCalled()
  })

  it('shows a malformed-email error without calling the API', async () => {
    const user = userEvent.setup()
    renderCustomerForm()

    await user.type(screen.getByLabelText(/name/i), 'Grace Hopper')
    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.type(screen.getByLabelText(/company/i), 'Compiler Co')
    await user.click(screen.getByRole('button', { name: /create customer/i }))

    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toHaveFocus()
    expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    expect(emailInput).toHaveAccessibleDescription('Enter a valid email address.')
    expect(createCustomer).not.toHaveBeenCalled()
  })

  it('creates customers with trimmed values and navigates to the list', async () => {
    const user = userEvent.setup()
    createCustomer.mockResolvedValueOnce({ id: 'customer-1' })
    renderCustomerForm()

    await user.type(screen.getByLabelText(/name/i), '  Grace Hopper  ')
    await user.type(screen.getByLabelText(/email/i), ' grace@example.com ')
    await user.type(screen.getByLabelText(/company/i), ' Navy ')
    await user.click(screen.getByRole('button', { name: /create customer/i }))

    expect(createCustomer).toHaveBeenCalledWith({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      company: 'Navy',
    })
    expect(await screen.findByRole('heading', { name: /customer list/i })).toBeInTheDocument()
  })

  it('updates customers with trimmed values and navigates to the list', async () => {
    const user = userEvent.setup()
    getCustomer.mockResolvedValueOnce({ name: 'Alan Turing', email: 'alan@example.com', company: 'Bletchley Park' })
    updateCustomer.mockResolvedValueOnce({ id: 'customer-2' })
    renderCustomerForm('/customers/customer-2/edit')

    const nameInput = await screen.findByDisplayValue('Alan Turing')
    await user.clear(nameInput)
    await user.type(nameInput, '  Alan Mathison Turing  ')
    await user.clear(screen.getByLabelText(/email/i))
    await user.type(screen.getByLabelText(/email/i), ' alan.turing@example.com ')
    await user.clear(screen.getByLabelText(/company/i))
    await user.type(screen.getByLabelText(/company/i), ' Codebreakers ')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(updateCustomer).toHaveBeenCalledWith('customer-2', {
      name: 'Alan Mathison Turing',
      email: 'alan.turing@example.com',
      company: 'Codebreakers',
    })
    expect(await screen.findByRole('heading', { name: /customer list/i })).toBeInTheDocument()
  })

  it('disables save and cancel while a create request is pending', async () => {
    const user = userEvent.setup()
    const pendingCreate = deferred()
    createCustomer.mockReturnValueOnce(pendingCreate.promise)
    renderCustomerForm()

    await user.type(screen.getByLabelText(/name/i), 'Katherine Johnson')
    await user.type(screen.getByLabelText(/email/i), 'katherine@example.com')
    await user.type(screen.getByLabelText(/company/i), 'NASA')
    await user.click(screen.getByRole('button', { name: /create customer/i }))

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()

    pendingCreate.resolve({ id: 'customer-3' })
    expect(await screen.findByRole('heading', { name: /customer list/i })).toBeInTheDocument()
  })

  it('ignores stale edit loads after the route changes', async () => {
    const firstLoad = deferred()
    getCustomer.mockImplementation((customerId) => {
      if (customerId === 'customer-1') return firstLoad.promise
      return Promise.resolve({ name: 'Second Customer', email: 'second@example.com', company: 'Second Co' })
    })

    function SwitchCustomerButton() {
      const navigate = useNavigate()
      return (
        <button type="button" onClick={() => navigate('/customers/customer-2/edit')}>
          Switch customer
        </button>
      )
    }

    render(
      <MemoryRouter initialEntries={['/customers/customer-1/edit']}>
        <SwitchCustomerButton />
        <Routes>
          <Route path="/customers/:id/edit" element={<CustomerForm />} />
        </Routes>
      </MemoryRouter>
    )

    await userEvent.click(screen.getByRole('button', { name: /switch customer/i }))
    expect(await screen.findByDisplayValue('Second Customer')).toBeInTheDocument()

    firstLoad.resolve({ name: 'Stale Customer', email: 'stale@example.com', company: 'Stale Co' })

    await waitFor(() => expect(screen.getByLabelText(/name/i)).toHaveValue('Second Customer'))
    expect(screen.queryByDisplayValue('Stale Customer')).not.toBeInTheDocument()
  })

  it('shows load failures on the page', async () => {
    getCustomer.mockRejectedValueOnce(new Error('Customer unavailable'))

    renderCustomerForm('/customers/missing/edit')

    expect(await screen.findByRole('alert')).toHaveTextContent('Customer unavailable')
    expect(screen.getByRole('heading', { name: /edit customer/i })).toBeInTheDocument()
  })

  it('shows save failures and preserves entered values', async () => {
    const user = userEvent.setup()
    createCustomer.mockRejectedValueOnce(new Error('Create failed'))
    renderCustomerForm()

    await user.type(screen.getByLabelText(/name/i), 'Margaret Hamilton')
    await user.type(screen.getByLabelText(/email/i), 'margaret@example.com')
    await user.type(screen.getByLabelText(/company/i), 'Apollo')
    await user.click(screen.getByRole('button', { name: /create customer/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Create failed')
    expect(screen.getByLabelText(/name/i)).toHaveValue('Margaret Hamilton')
    expect(screen.getByLabelText(/email/i)).toHaveValue('margaret@example.com')
    expect(screen.getByLabelText(/company/i)).toHaveValue('Apollo')
  })

  it('cancels to the customer list without saving', async () => {
    const user = userEvent.setup()
    renderCustomerForm()

    await user.type(screen.getByLabelText(/name/i), 'No Save')
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(createCustomer).not.toHaveBeenCalled()
    expect(updateCustomer).not.toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: /customer list/i })).toBeInTheDocument()
  })

  it('keeps regular links working around the form routes', async () => {
    render(
      <MemoryRouter initialEntries={['/customers/new']}>
        <Link to="/customers">Back to list</Link>
        <Routes>
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/customers" element={<h1>Customer list</h1>} />
        </Routes>
      </MemoryRouter>
    )

    await userEvent.click(screen.getByRole('link', { name: /back to list/i }))

    expect(await screen.findByRole('heading', { name: /customer list/i })).toBeInTheDocument()
  })
})
