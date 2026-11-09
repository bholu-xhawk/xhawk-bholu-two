import '@testing-library/jest-dom/vitest'
import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CustomerForm from './CustomerForm'
import { createCustomer, listCustomers, updateCustomer } from '../api/customers'

vi.mock('../api/customers', () => ({
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}))

const customers = [
  { _id: 'customer-1', name: 'Ada Lovelace', email: 'ada@example.com', company: 'Math Co' },
  { _id: 'customer-2', name: 'Grace Hopper', email: 'grace@example.com', company: 'Navy' },
]

function renderCustomerForm(initialEntry = '/customers/new') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />
        <Route path="/customers" element={<h1>Customers table</h1>} />
      </Routes>
    </MemoryRouter>,
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

async function fillValidCustomer(user, overrides = {}) {
  await user.type(screen.getByLabelText(/^name$/i), overrides.name ?? ' Ada Lovelace ')
  await user.type(screen.getByLabelText(/^email$/i), overrides.email ?? ' ada@example.com ')
  await user.type(screen.getByLabelText(/^company$/i), overrides.company ?? ' Math Co ')
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CustomerForm page', () => {
  it('shows inline validation errors for blank required fields', async () => {
    const user = userEvent.setup()

    renderCustomerForm()
    await user.click(screen.getByRole('button', { name: /save customer/i }))

    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Company is required.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^name$/i)).toHaveAttribute('aria-invalid', 'true')
    expect(createCustomer).not.toHaveBeenCalled()
  })

  it('shows an inline validation error for malformed email', async () => {
    const user = userEvent.setup()

    renderCustomerForm()
    await fillValidCustomer(user, { email: 'not-an-email' })
    await user.click(screen.getByRole('button', { name: /save customer/i }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('aria-describedby', 'customer-email-error')
    expect(createCustomer).not.toHaveBeenCalled()
  })

  it('creates a customer with trimmed values and returns to the customer table', async () => {
    const user = userEvent.setup()
    createCustomer.mockResolvedValueOnce({ _id: 'customer-3', name: 'Ada Lovelace', email: 'ada@example.com', company: 'Math Co' })

    renderCustomerForm()
    await fillValidCustomer(user)
    await user.click(screen.getByRole('button', { name: /save customer/i }))

    expect(createCustomer).toHaveBeenCalledWith({ name: 'Ada Lovelace', email: 'ada@example.com', company: 'Math Co' })
    expect(await screen.findByRole('heading', { name: /customers table/i })).toBeInTheDocument()
  })

  it('cancels without sending a request', async () => {
    const user = userEvent.setup()

    renderCustomerForm()
    await fillValidCustomer(user)
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(createCustomer).not.toHaveBeenCalled()
    expect(updateCustomer).not.toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: /customers table/i })).toBeInTheDocument()
  })

  it('loads an existing customer in edit mode and saves changes with PATCH payload', async () => {
    const user = userEvent.setup()
    listCustomers.mockResolvedValueOnce(customers)
    updateCustomer.mockResolvedValueOnce({ ...customers[1], company: 'Computer Bureau' })

    renderCustomerForm('/customers/customer-2/edit')

    expect(screen.getByText(/loading customer/i)).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Grace Hopper')).toBeInTheDocument()

    const company = screen.getByLabelText(/^company$/i)
    await user.clear(company)
    await user.type(company, ' Computer Bureau ')
    await user.click(screen.getByRole('button', { name: /save customer/i }))

    expect(updateCustomer).toHaveBeenCalledWith('customer-2', {
      name: 'Grace Hopper',
      email: 'grace@example.com',
      company: 'Computer Bureau',
    })
    expect(await screen.findByRole('heading', { name: /customers table/i })).toBeInTheDocument()
  })

  it('reports a missing edit record and keeps save unavailable', async () => {
    listCustomers.mockResolvedValueOnce(customers)

    renderCustomerForm('/customers/missing/edit')

    expect(await screen.findByRole('alert')).toHaveTextContent('Customer not found.')
    expect(screen.getByRole('button', { name: /save customer/i })).toBeDisabled()
    expect(updateCustomer).not.toHaveBeenCalled()
  })

  it('preserves edited values when the API rejects a save', async () => {
    const user = userEvent.setup()
    listCustomers.mockResolvedValueOnce(customers)
    updateCustomer.mockRejectedValueOnce(new Error('Update failed'))

    renderCustomerForm('/customers/customer-1/edit')
    expect(await screen.findByDisplayValue('Ada Lovelace')).toBeInTheDocument()

    const name = screen.getByLabelText(/^name$/i)
    await user.clear(name)
    await user.type(name, ' Ada Byron ')
    await user.click(screen.getByRole('button', { name: /save customer/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Update failed')
    expect(screen.getByLabelText(/^name$/i)).toHaveValue(' Ada Byron ')
  })

  it('disables fields and actions while a save is pending to prevent duplicate submissions', async () => {
    const user = userEvent.setup()
    const save = deferred()
    createCustomer.mockReturnValueOnce(save.promise)

    renderCustomerForm()
    await fillValidCustomer(user)
    await user.click(screen.getByRole('button', { name: /save customer/i }))

    expect(createCustomer).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    expect(screen.getByLabelText(/^name$/i)).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /saving/i }))
    expect(createCustomer).toHaveBeenCalledTimes(1)

    save.resolve({ _id: 'customer-3', name: 'Ada Lovelace', email: 'ada@example.com', company: 'Math Co' })
    expect(await screen.findByRole('heading', { name: /customers table/i })).toBeInTheDocument()
  })
})
