import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCustomer, getCustomer, updateCustomer } from '../api/customers'

const emptyValues = {
  name: '',
  email: '',
  company: '',
}

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

  return { trimmedValues, errors }
}

export default function CustomerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)
  const [values, setValues] = useState(emptyValues)
  const [fieldErrors, setFieldErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEditMode) {
      setValues(emptyValues)
      setFieldErrors({})
      setRequestError('')
      setLoading(false)
      return undefined
    }

    let ignore = false

    async function loadCustomer() {
      setLoading(true)
      setRequestError('')
      setFieldErrors({})
      try {
        const customer = await getCustomer(id)
        if (!ignore) {
          setValues({
            name: customer?.name || '',
            email: customer?.email || '',
            company: customer?.company || '',
          })
        }
      } catch (err) {
        if (!ignore) setRequestError(err.message || 'Unable to load customer')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadCustomer()

    return () => {
      ignore = true
    }
  }, [id, isEditMode])

  function updateField(field, value) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }))
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: '' }))
  }

  function handleCancel() {
    navigate('/customers')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const { trimmedValues, errors } = validateCustomer(values)
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      setRequestError('')
      return
    }

    setSaving(true)
    setRequestError('')
    try {
      if (isEditMode) {
        await updateCustomer(id, trimmedValues)
      } else {
        await createCustomer(trimmedValues)
      }
      navigate('/customers')
    } catch (err) {
      setRequestError(err.message || `Unable to ${isEditMode ? 'update' : 'create'} customer`)
    } finally {
      setSaving(false)
    }
  }

  const title = isEditMode ? 'Edit customer' : 'Create customer'
  const saveLabel = saving ? 'Saving…' : isEditMode ? 'Save customer' : 'Create customer'
  const controlsDisabled = loading || saving

  return (
    <main className="customer-form-page" aria-labelledby="customer-form-title">
      <section className="customer-form-hero">
        <p className="eyebrow">Customer directory</p>
        <h1 id="customer-form-title">{title}</h1>
        <p>{isEditMode ? 'Update this customer record and keep the directory current.' : 'Add a customer to the directory with their primary contact details.'}</p>
      </section>

      {requestError && (
        <div className="customer-request-alert" role="alert">
          {requestError}
        </div>
      )}

      {loading ? <p className="customer-form-status">Loading customer…</p> : null}

      <form className="customer-form" onSubmit={handleSubmit} aria-label={title} noValidate>
        <div className="customer-field">
          <label htmlFor="customer-name">Name</label>
          <input
            id="customer-name"
            type="text"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'customer-name-error' : undefined}
            autoComplete="name"
            disabled={controlsDisabled}
          />
          {fieldErrors.name ? (
            <p className="customer-inline-error" id="customer-name-error">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div className="customer-field">
          <label htmlFor="customer-email">Email</label>
          <input
            id="customer-email"
            type="email"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'customer-email-error' : undefined}
            autoComplete="email"
            disabled={controlsDisabled}
          />
          {fieldErrors.email ? (
            <p className="customer-inline-error" id="customer-email-error">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="customer-field">
          <label htmlFor="customer-company">Company</label>
          <input
            id="customer-company"
            type="text"
            value={values.company}
            onChange={(event) => updateField('company', event.target.value)}
            aria-invalid={Boolean(fieldErrors.company)}
            aria-describedby={fieldErrors.company ? 'customer-company-error' : undefined}
            autoComplete="organization"
            disabled={controlsDisabled}
          />
          {fieldErrors.company ? (
            <p className="customer-inline-error" id="customer-company-error">
              {fieldErrors.company}
            </p>
          ) : null}
        </div>

        <div className="customer-form-actions">
          <button type="submit" disabled={controlsDisabled}>
            {saveLabel}
          </button>
          <button type="button" className="secondary" onClick={handleCancel} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  )
}
