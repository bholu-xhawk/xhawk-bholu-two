import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCustomer, getCustomer, updateCustomer } from '../api/customers'

const EMPTY_FORM = {
  name: '',
  email: '',
  company: '',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateCustomer(values) {
  const nextErrors = {}
  const name = values.name.trim()
  const email = values.email.trim()
  const company = values.company.trim()

  if (!name) nextErrors.name = 'Enter a customer name.'
  if (!email) {
    nextErrors.email = 'Enter an email address.'
  } else if (!EMAIL_PATTERN.test(email)) {
    nextErrors.email = 'Enter a valid email address.'
  }
  if (!company) nextErrors.company = 'Enter a company name.'

  return nextErrors
}

export default function CustomerFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)
  const [values, setValues] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [loading, setLoading] = useState(isEditMode)
  const [loadFailed, setLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const fieldRefs = {
    name: useRef(null),
    email: useRef(null),
    company: useRef(null),
  }

  useEffect(() => {
    if (!isEditMode) {
      setValues(EMPTY_FORM)
      setFieldErrors({})
      setRequestError('')
      setLoadFailed(false)
      setLoading(false)
      return undefined
    }

    let ignore = false

    async function loadCustomer() {
      setLoading(true)
      setFieldErrors({})
      setRequestError('')
      setLoadFailed(false)
      try {
        const customer = await getCustomer(id)
        if (!ignore) {
          setValues({
            name: customer?.name || '',
            email: customer?.email || '',
            company: customer?.company || '',
          })
        }
      } catch (error) {
        if (!ignore) {
          setLoadFailed(true)
          setRequestError(error.message || 'Unable to load customer')
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

  function updateField(field, value) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }))
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors
      const { [field]: _cleared, ...remainingErrors } = currentErrors
      return remainingErrors
    })
  }

  function handleCancel() {
    navigate('/customers')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = validateCustomer(values)
    setFieldErrors(nextErrors)
    setRequestError('')

    const firstInvalidField = Object.keys(nextErrors)[0]
    if (firstInvalidField) {
      fieldRefs[firstInvalidField].current?.focus()
      return
    }

    const trimmedValues = {
      name: values.name.trim(),
      email: values.email.trim(),
      company: values.company.trim(),
    }

    setSaving(true)
    try {
      if (isEditMode) {
        await updateCustomer(id, trimmedValues)
      } else {
        await createCustomer(trimmedValues)
      }
      navigate('/customers')
    } catch (error) {
      setRequestError(error.message || `Unable to ${isEditMode ? 'update' : 'create'} customer`)
    } finally {
      setSaving(false)
    }
  }

  const title = isEditMode ? 'Edit customer' : 'New customer'
  const description = isEditMode
    ? 'Update the customer details loaded from the customer API.'
    : 'Create a customer record with contact and company details.'
  const formDisabled = loading || saving || loadFailed

  return (
    <main className="customer-form-page" aria-labelledby="customer-form-title">
      <section className="customer-form-hero">
        <p className="eyebrow">Customer directory</p>
        <h1 id="customer-form-title">{title}</h1>
        <p>{description}</p>
      </section>

      {requestError && (
        <div className="request-error" role="alert">
          {requestError}
        </div>
      )}

      {loading ? <p className="customer-form-status">Loading customer…</p> : null}

      <form className="customer-form" onSubmit={handleSubmit} noValidate aria-busy={saving}>
        <div className="form-field">
          <label htmlFor="customer-name">Name</label>
          <input
            id="customer-name"
            ref={fieldRefs.name}
            type="text"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            disabled={formDisabled}
            aria-invalid={fieldErrors.name ? 'true' : 'false'}
            aria-describedby={fieldErrors.name ? 'customer-name-error' : undefined}
            autoComplete="name"
          />
          {fieldErrors.name && (
            <p className="field-error" id="customer-name-error">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="customer-email">Email</label>
          <input
            id="customer-email"
            ref={fieldRefs.email}
            type="email"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            disabled={formDisabled}
            aria-invalid={fieldErrors.email ? 'true' : 'false'}
            aria-describedby={fieldErrors.email ? 'customer-email-error' : undefined}
            autoComplete="email"
          />
          {fieldErrors.email && (
            <p className="field-error" id="customer-email-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="customer-company">Company</label>
          <input
            id="customer-company"
            ref={fieldRefs.company}
            type="text"
            value={values.company}
            onChange={(event) => updateField('company', event.target.value)}
            disabled={formDisabled}
            aria-invalid={fieldErrors.company ? 'true' : 'false'}
            aria-describedby={fieldErrors.company ? 'customer-company-error' : undefined}
            autoComplete="organization"
          />
          {fieldErrors.company && (
            <p className="field-error" id="customer-company-error">
              {fieldErrors.company}
            </p>
          )}
        </div>

        <div className="customer-form-actions">
          <button type="submit" disabled={formDisabled}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="secondary" onClick={handleCancel} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  )
}
