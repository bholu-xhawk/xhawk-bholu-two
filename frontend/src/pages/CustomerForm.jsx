import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCustomer, listCustomers, updateCustomer } from '../api/customers'

const blankValues = { name: '', email: '', company: '' }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateCustomer(values) {
  const trimmedValues = {
    name: values.name.trim(),
    email: values.email.trim(),
    company: values.company.trim(),
  }
  const errors = {}

  if (!trimmedValues.name) errors.name = 'Name is required.'
  if (!trimmedValues.email) {
    errors.email = 'Email is required.'
  } else if (!emailPattern.test(trimmedValues.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (!trimmedValues.company) errors.company = 'Company is required.'

  return { errors, values: trimmedValues }
}

export default function CustomerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)
  const [values, setValues] = useState(blankValues)
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [customerFound, setCustomerFound] = useState(!isEditMode)

  const title = isEditMode ? 'Edit customer' : 'New customer'
  const formDisabled = loading || saving || !customerFound

  const fieldConfigs = useMemo(
    () => [
      { id: 'customer-name', name: 'name', label: 'Name', type: 'text', autoComplete: 'name' },
      { id: 'customer-email', name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
      { id: 'customer-company', name: 'company', label: 'Company', type: 'text', autoComplete: 'organization' },
    ],
    [],
  )

  useEffect(() => {
    if (!isEditMode) return undefined

    let ignore = false

    async function loadCustomer() {
      setLoading(true)
      setLoadError('')
      setRequestError('')
      setCustomerFound(false)

      try {
        const customers = await listCustomers()
        const customer = customers.find((currentCustomer) => currentCustomer._id === id)

        if (ignore) return

        if (!customer) {
          setLoadError('Customer not found.')
          setCustomerFound(false)
          setValues(blankValues)
          return
        }

        setValues({
          name: customer.name || '',
          email: customer.email || '',
          company: customer.company || '',
        })
        setCustomerFound(true)
      } catch (err) {
        if (!ignore) {
          setLoadError(err.message || 'Unable to load customer')
          setCustomerFound(false)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadCustomer()

    return () => {
      ignore = true
    }
  }, [id, isEditMode])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((currentValues) => ({ ...currentValues, [name]: value }))
    setFieldErrors((currentErrors) => {
      if (!currentErrors[name]) return currentErrors
      const nextErrors = { ...currentErrors }
      delete nextErrors[name]
      return nextErrors
    })
    setRequestError('')
  }

  function handleCancel() {
    navigate('/customers')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (formDisabled) return

    const validation = validateCustomer(values)
    setFieldErrors(validation.errors)
    setRequestError('')

    if (Object.keys(validation.errors).length > 0) return

    setSaving(true)
    try {
      if (isEditMode) {
        await updateCustomer(id, validation.values)
      } else {
        await createCustomer(validation.values)
      }
      navigate('/customers')
    } catch (err) {
      setRequestError(err.message || `Unable to ${isEditMode ? 'update' : 'create'} customer`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="customer-page" aria-labelledby="customer-form-title">
      <section className="customer-card">
        <p className="eyebrow">Customer records</p>
        <h1 id="customer-form-title">{title}</h1>
        <p className="customer-intro">
          {isEditMode
            ? 'Update the selected customer details from the existing customer API.'
            : 'Add a customer using the existing customer API.'}
        </p>

        {loading ? <p className="customer-status">Loading customer…</p> : null}
        {loadError ? (
          <div className="customer-error" role="alert">
            {loadError}
          </div>
        ) : null}
        {requestError ? (
          <div className="customer-error" role="alert">
            {requestError}
          </div>
        ) : null}

        <form className="customer-form" onSubmit={handleSubmit} noValidate>
          {fieldConfigs.map((field) => {
            const error = fieldErrors[field.name]
            const errorId = `${field.id}-error`

            return (
              <div className="customer-field" key={field.name}>
                <label htmlFor={field.id}>{field.label}</label>
                <input
                  id={field.id}
                  name={field.name}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  value={values[field.name]}
                  onChange={handleChange}
                  disabled={formDisabled}
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? errorId : undefined}
                />
                {error ? (
                  <p className="customer-field-error" id={errorId} role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            )
          })}

          <div className="customer-actions">
            <button type="submit" disabled={formDisabled}>
              {saving ? 'Saving…' : 'Save customer'}
            </button>
            <button type="button" className="secondary" onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
