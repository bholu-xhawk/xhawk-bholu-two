import '@testing-library/jest-dom/vitest'
import React from 'react'
import { Route, Routes, MemoryRouter, useLocation } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CustomerFormPage from './CustomerFormPage'
import { createCustomer, getCustomer, updateCustomer } from '../api/customers'

vi.mock('../api/customers', () => ({
  getCustomer: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}))

function LocationStatus() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname}</p>
}

function renderCustomerForm(initialEntry = '/customers/new') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/customers/new" element={<CustomerFormPage />} />
        <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
        <Route path="/customers" element={<h1>Customer list</h1>} />
      </Routes>
      <LocationStatus />
    </MemoryRouter>,
  )
}

async function fillCustomerForm(user, values) {
  await user.clear(screen.getByLabelText(/name/i))
  await user.type(screen.getByLabelText(/name/i), values.name)
  await user.clear(screen.getByLabelText(/email/i))
  await user.type(screen.getByLabelText(/email/i), values.email)
  await user.clear(screen.getByLabelText(/company/i))
  await user.type(screen.getByLabelText(/company/i), values.company)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CustomerFormPage', () => {
  it('shows required-field validation without calling the API', async () => {
    const user = userEvent.setup()
    renderCustomerForm()

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText('Enter a customer name.')).toBeInTheDocument()
    expect(screen.getByText('Enter an email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter a company name.')).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toHaveFocus()
    expect(createCustomer).not.toHaveBeenCalled()
    expect(updateCustomer).not.toHaveBeenCalled()
  })

  it('shows malformed email validation without calling the API', async () => {
    const user = userEvent.setup()
    renderCustomerForm()

    await fillCustomerForm(user, { name: 'Ada Lovelace', email: 'not-an-email', company: 'Analytical Engines' })
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(createCustomer).not.toHaveBeenCalled()
  })

  it('creates a customer and navigates back to the customer list', async () => {
    const user = userEvent.setup()
    createCustomer.mockResolvedValueOnce({ _id: 'customer-1', name: 'Ada Lovelace', email: 'ada@example.com', company: 'Math' })
    renderCustomerForm()

    await fillCustomerForm(user, { name: ' Ada Lovelace ', email: ' ada@example.com ', company: ' Math ' })
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(createCustomer).toHaveBeenCalledWith({ name: 'Ada Lovelace', email: 'ada@example.com', company: 'Math' })
    expect(updateCustomer).not.toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: /customer list/i })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/customers')
  })

  it('loads and prepopulates an existing customer in edit mode', async () => {
    getCustomer.mockResolvedValueOnce({ _id: 'customer-2', name: 'Grace Hopper', email: 'grace@example.com', company: 'Navy' })

    renderCustomerForm('/customers/customer-2/edit')

    expect(screen.getByText(/loading customer/i)).toBeInTheDocument()
    expect(getCustomer).toHaveBeenCalledWith('customer-2')
    expect(await screen.findByDisplayValue('Grace Hopper')).toBeInTheDocument()
    expect(screen.getByDisplayValue('grace@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Navy')).toBeInTheDocument()
  })

  it('updates a customer and navigates back to the customer list', async () => {
    const user = userEvent.setup()
    getCustomer.mockResolvedValueOnce({ _id: 'customer-3', name: 'Katherine Johnson', email: 'kj@example.com', company: 'NACA' })
    updateCustomer.mockResolvedValueOnce({ _id: 'customer-3', name: 'Katherine Johnson', email: 'kj@example.com', company: 'NASA' })
    renderCustomerForm('/customers/customer-3/edit')

    const companyInput = await screen.findByLabelText(/company/i)
    await user.clear(companyInput)
    await user.type(companyInput, ' NASA ')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(updateCustomer).toHaveBeenCalledWith('customer-3', {
      name: 'Katherine Johnson',
      email: 'kj@example.com',
      company: 'NASA',
    })
    expect(createCustomer).not.toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: /customer list/i })).toBeInTheDocument()
  })

  it('cancels without calling create or update', async () => {
    const user = userEvent.setup()
    renderCustomerForm()

    await fillCustomerForm(user, { name: 'Local Customer', email: 'local@example.com', company: 'Local Co' })
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(createCustomer).not.toHaveBeenCalled()
    expect(updateCustomer).not.toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: /customer list/i })).toBeInTheDocument()
  })

  it('shows load failures in edit mode', async () => {
    getCustomer.mockRejectedValueOnce(new Error('Customer not found'))

    renderCustomerForm('/customers/missing/edit')

    expect(await screen.findByRole('alert')).toHaveTextContent('Customer not found')
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeEnabled()
  })

  it('shows save failures and retains entered values', async () => {
    const user = userEvent.setup()
    createCustomer.mockRejectedValueOnce(new Error('Email already exists'))
    renderCustomerForm()

    await fillCustomerForm(user, { name: 'Retry Customer', email: 'retry@example.com', company: 'Retry Co' })
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already exists')
    expect(screen.getByLabelText(/name/i)).toHaveValue('Retry Customer')
    expect(screen.getByLabelText(/email/i)).toHaveValue('retry@example.com')
    expect(screen.getByLabelText(/company/i)).toHaveValue('Retry Co')
    expect(screen.queryByRole('heading', { name: /customer list/i })).not.toBeInTheDocument()
  })

  it('disables controls while a save is pending', async () => {
    const user = userEvent.setup()
    let resolveCreate
    createCustomer.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve
        }),
    )
    renderCustomerForm()

    await fillCustomerForm(user, { name: 'Pending Customer', email: 'pending@example.com', company: 'Pending Co' })
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    expect(screen.getByLabelText(/name/i)).toBeDisabled()
    expect(screen.getByLabelText(/email/i)).toBeDisabled()
    expect(screen.getByLabelText(/company/i)).toBeDisabled()

    resolveCreate({ _id: 'customer-4', name: 'Pending Customer', email: 'pending@example.com', company: 'Pending Co' })
    await waitFor(() => expect(screen.getByRole('heading', { name: /customer list/i })).toBeInTheDocument())
  })
})
