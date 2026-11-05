import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CustomerForm from './CustomerForm'
import { createCustomer, getCustomer, updateCustomer } from '../api/customers'

vi.mock('../api/customers', () => ({
  getCustomer: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}))

const existingCustomer = {
  _id: 'customer-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engines LLC',
}

function renderCustomerForm(route = '/customers/new') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />
        <Route path="/customers" element={<h1>Customers</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CustomerForm page', () => {
  it('shows required validation errors without calling the API', async () => {
    const user = userEvent.setup()

    renderCustomerForm()
    await user.click(screen.getByRole('button', { name: /create customer/i }))

    expect(screen.getByText('Name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Company is required.')).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/company/i)).toHaveAttribute('aria-invalid', 'true')
    expect(createCustomer).not.toHaveBeenCalled()
    expect(updateCustomer).not.toHaveBeenCalled()
  })

  it('shows malformed email validation without calling the API', async () => {
    const user = userEvent.setup()

    renderCustomerForm()
    await user.type(screen.getByLabelText(/name/i), 'Grace Hopper')
    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.type(screen.getByLabelText(/company/i), 'Compiler Co')
    await user.click(screen.getByRole('button', { name: /create customer/i }))

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(createCustomer).not.toHaveBeenCalled()
    expect(updateCustomer).not.toHaveBeenCalled()
  })

  it('creates a customer with trimmed values and returns to the list', async () => {
    const user = userEvent.setup()
    createCustomer.mockResolvedValueOnce({ _id: 'customer-2' })

    renderCustomerForm()
    await user.type(screen.getByLabelText(/name/i), '  Katherine Johnson  ')
    await user.type(screen.getByLabelText(/email/i), '  katherine@example.com  ')
    await user.type(screen.getByLabelText(/company/i), '  NASA  ')
    await user.click(screen.getByRole('button', { name: /create customer/i }))

    expect(createCustomer).toHaveBeenCalledWith({
      name: 'Katherine Johnson',
      email: 'katherine@example.com',
      company: 'NASA',
    })
    expect(await screen.findByRole('heading', { name: 'Customers' })).toBeInTheDocument()
  })

  it('loads and pre-populates an existing customer in edit mode', async () => {
    getCustomer.mockResolvedValueOnce(existingCustomer)

    renderCustomerForm('/customers/customer-1/edit')

    expect(screen.getByText(/loading customer/i)).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ada@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Analytical Engines LLC')).toBeInTheDocument()
    expect(getCustomer).toHaveBeenCalledWith('customer-1')
  })

  it('updates an existing customer with trimmed values and returns to the list', async () => {
    const user = userEvent.setup()
    getCustomer.mockResolvedValueOnce(existingCustomer)
    updateCustomer.mockResolvedValueOnce({ ...existingCustomer, company: 'Math Guild' })

    renderCustomerForm('/customers/customer-1/edit')
    const companyInput = await screen.findByLabelText(/company/i)
    await user.clear(companyInput)
    await user.type(companyInput, '  Math Guild  ')
    await user.click(screen.getByRole('button', { name: /save customer/i }))

    expect(updateCustomer).toHaveBeenCalledWith('customer-1', {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      company: 'Math Guild',
    })
    expect(await screen.findByRole('heading', { name: 'Customers' })).toBeInTheDocument()
  })

  it('cancels editing without saving changes', async () => {
    const user = userEvent.setup()
    getCustomer.mockResolvedValueOnce(existingCustomer)

    renderCustomerForm('/customers/customer-1/edit')
    const nameInput = await screen.findByLabelText(/name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Unsaved Name')
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(updateCustomer).not.toHaveBeenCalled()
    expect(createCustomer).not.toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: 'Customers' })).toBeInTheDocument()
  })

  it('shows load failures as request alerts', async () => {
    getCustomer.mockRejectedValueOnce(new Error('Customer not found'))

    renderCustomerForm('/customers/missing/edit')

    expect(await screen.findByRole('alert')).toHaveTextContent('Customer not found')
    expect(updateCustomer).not.toHaveBeenCalled()
  })

  it('preserves the draft and shows the API message when save fails', async () => {
    const user = userEvent.setup()
    createCustomer.mockRejectedValueOnce(new Error('Email already exists'))

    renderCustomerForm()
    await user.type(screen.getByLabelText(/name/i), 'Alan Turing')
    await user.type(screen.getByLabelText(/email/i), 'alan@example.com')
    await user.type(screen.getByLabelText(/company/i), 'Bletchley Park')
    await user.click(screen.getByRole('button', { name: /create customer/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already exists')
    expect(screen.getByLabelText(/name/i)).toHaveValue('Alan Turing')
    expect(screen.getByLabelText(/email/i)).toHaveValue('alan@example.com')
    expect(screen.getByLabelText(/company/i)).toHaveValue('Bletchley Park')
    expect(screen.queryByRole('heading', { name: 'Customers' })).not.toBeInTheDocument()
  })
})
