import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCustomer, getCustomer, updateCustomer } from '../api/customers'

const emptyValues = {
  name: '',
  email: '',
  company: '',
}

function validate(values) {
  const errors = {}

  if (!values.name) errors.name = 'Name is required.'
  if (!values.email) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (!values.company) errors.company = 'Company is required.'

  return errors
}

export default function CustomerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)
  const [values, setValues] = useState(emptyValues)
  const [fieldErrors, setFieldErrors] = useState({})
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const fieldRefs = {
    name: useRef(null),
    email: useRef(null),
    company: useRef(null),
  }

  useEffect(() => {
    if (!isEditMode) {
      setValues(emptyValues)
      setFieldErrors({})
      setLoadError('')
      setLoading(false)
      return undefined
    }

    let ignore = false
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null

    async function loadCustomer() {
      setLoading(true)
      setLoadError('')
      setSaveError('')
      setFieldErrors({})
      try {
        const customer = await getCustomer(id, controller ? { signal: controller.signal } : {})
        if (ignore) return
        setValues({
          name: customer?.name || '',
          email: customer?.email || '',
          company: customer?.company || '',
        })
      } catch (err) {
        if (ignore || err.name === 'AbortError') return
        setLoadError(err.message || 'Unable to load customer')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadCustomer()

    return () => {
      ignore = true
      if (controller) controller.abort()
    }
  }, [id, isEditMode])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((currentValues) => ({ ...currentValues, [name]: value }))
    setFieldErrors((currentErrors) => {
      if (!currentErrors[name]) return currentErrors
      const { [name]: _removed, ...remainingErrors } = currentErrors
      return remainingErrors
    })
    if (saveError) setSaveError('')
  }

  function handleCancel() {
    navigate('/customers')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedValues = {
      name: values.name.trim(),
      email: values.email.trim(),
      company: values.company.trim(),
    }
    const nextErrors = validate(trimmedValues)

    setFieldErrors(nextErrors)
    setSaveError('')

    const firstInvalidField = ['name', 'email', 'company'].find((field) => nextErrors[field])
    if (firstInvalidField) {
      fieldRefs[firstInvalidField].current?.focus()
      return
    }

    setSaving(true)
    try {
      if (isEditMode) {
        await updateCustomer(id, trimmedValues)
      } else {
        await createCustomer(trimmedValues)
      }
      navigate('/customers')
    } catch (err) {
      setSaveError(err.message || `Unable to ${isEditMode ? 'update' : 'create'} customer`)
    } finally {
      setSaving(false)
    }
  }

  const title = isEditMode ? 'Edit customer' : 'Create customer'
  const saveLabel = isEditMode ? 'Save changes' : 'Create customer'
  const pendingLabel = isEditMode ? 'Saving…' : 'Creating…'

  return (
    <main className="customer-form-page" aria-labelledby="customer-form-title">
      <section className="customer-form-hero">
        <p className="eyebrow">Customer management</p>
        <h1 id="customer-form-title">{title}</h1>
        <p>{isEditMode ? 'Update this customer record.' : 'Add a customer to the shared customer list.'}</p>
      </section>

      {loadError && (
        <div className="customer-alert" role="alert">
          {loadError}
        </div>
      )}

      {saveError && (
        <div className="customer-alert" role="alert">
          {saveError}
        </div>
      )}

      {loading ? (
        <p className="customer-status">Loading customer…</p>
      ) : (
        <form className="customer-form" onSubmit={handleSubmit} noValidate>
          <div className="customer-field">
            <label htmlFor="customer-name">Name</label>
            <input
              id="customer-name"
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              disabled={saving}
              aria-invalid={fieldErrors.name ? 'true' : undefined}
              aria-describedby={fieldErrors.name ? 'customer-name-error' : undefined}
              ref={fieldRefs.name}
            />
            {fieldErrors.name && (
              <p className="customer-field-error" id="customer-name-error">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="customer-field">
            <label htmlFor="customer-email">Email</label>
            <input
              id="customer-email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              disabled={saving}
              aria-invalid={fieldErrors.email ? 'true' : undefined}
              aria-describedby={fieldErrors.email ? 'customer-email-error' : undefined}
              ref={fieldRefs.email}
            />
            {fieldErrors.email && (
              <p className="customer-field-error" id="customer-email-error">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="customer-field">
            <label htmlFor="customer-company">Company</label>
            <input
              id="customer-company"
              name="company"
              type="text"
              value={values.company}
              onChange={handleChange}
              disabled={saving}
              aria-invalid={fieldErrors.company ? 'true' : undefined}
              aria-describedby={fieldErrors.company ? 'customer-company-error' : undefined}
              ref={fieldRefs.company}
            />
            {fieldErrors.company && (
              <p className="customer-field-error" id="customer-company-error">
                {fieldErrors.company}
              </p>
            )}
          </div>

          <div className="customer-form-actions">
            <button type="submit" disabled={saving}>
              {saving ? pendingLabel : saveLabel}
            </button>
            <button type="button" className="secondary" onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </main>
  )
}
