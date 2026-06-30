import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export default function Uploads() {
  const [items, setItems] = useState([])
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/uploads`)
      .then(r => r.json())
      .then(setItems)
      .catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!file) { setError('Please choose an image'); return }
    const form = new FormData()
    form.append('file', file)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/uploads`, { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }
      const data = await res.json()
      setItems(prev => [data, ...prev])
      setFile(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="uploads-page">
      <h2>Image Uploads</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button type="submit" disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
      </form>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div className="gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
        {items.map(item => (
          <div key={item.id} style={{ border: '1px solid #ccc', padding: '4px' }}>
            <img src={`${API_BASE}${item.sizes.thumb.url}`} alt={item.originalName} style={{ width: '100%', height: 'auto' }} />
            <div style={{ fontSize: '0.8rem' }}>{item.originalName}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
