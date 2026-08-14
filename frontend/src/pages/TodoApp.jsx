import React, { useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

function TodoApp() {
  const [todos, setTodos] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function requestJson(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    })

    if (response.status === 204) {
      return null
    }

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Request failed')
    }

    return data
  }

  async function fetchTodos() {
    try {
      setLoading(true)
      setError('')
      const data = await requestJson('/todos')
      setTodos(data)
    } catch (err) {
      setError(err.message || 'Unable to load todos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  async function createTodo(event) {
    event.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    try {
      setSaving(true)
      setError('')
      const todo = await requestJson('/todos', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      })
      setTodos((current) => [todo, ...current])
      setTitle('')
      setDescription('')
    } catch (err) {
      setError(err.message || 'Unable to create todo')
    } finally {
      setSaving(false)
    }
  }

  async function toggleTodo(todo) {
    try {
      setError('')
      const updated = await requestJson(`/todos/${todo._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !todo.completed }),
      })
      setTodos((current) => current.map((item) => (item._id === updated._id ? updated : item)))
    } catch (err) {
      setError(err.message || 'Unable to update todo')
    }
  }

  function startEditing(todo) {
    setEditingId(todo._id)
    setEditTitle(todo.title)
    setEditDescription(todo.description || '')
  }

  function cancelEditing() {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  async function saveTodo(todo) {
    if (!editTitle.trim()) {
      setError('Title is required')
      return
    }

    try {
      setSaving(true)
      setError('')
      const updated = await requestJson(`/todos/${todo._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      })
      setTodos((current) => current.map((item) => (item._id === updated._id ? updated : item)))
      cancelEditing()
    } catch (err) {
      setError(err.message || 'Unable to save todo')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTodo(todo) {
    try {
      setError('')
      await requestJson(`/todos/${todo._id}`, { method: 'DELETE' })
      setTodos((current) => current.filter((item) => item._id !== todo._id))
    } catch (err) {
      setError(err.message || 'Unable to delete todo')
    }
  }

  return (
    <section className="todo-app">
      <div className="hero-card">
        <p className="eyebrow">MongoDB + Express + React</p>
        <h1>Todo App</h1>
        <p className="hero-copy">Create todos, track completion, edit details, and keep everything persisted in the Node API.</p>
      </div>

      <form className="todo-form" onSubmit={createTodo}>
        <label htmlFor="todo-title">Title</label>
        <input
          id="todo-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to get done?"
          disabled={saving}
        />

        <label htmlFor="todo-description">Description</label>
        <textarea
          id="todo-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add optional details"
          rows="3"
          disabled={saving}
        />

        <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add todo'}</button>
      </form>

      {error && <div className="status-message error" role="alert">{error}</div>}
      {loading && <div className="status-message">Loading todos…</div>}

      {!loading && todos.length === 0 && (
        <div className="empty-state">No todos yet. Add your first task above.</div>
      )}

      <ul className="todo-list">
        {todos.map((todo) => (
          <li className={`todo-card ${todo.completed ? 'completed' : ''}`} key={todo._id}>
            {editingId === todo._id ? (
              <div className="edit-form">
                <input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  aria-label="Edit todo title"
                />
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  aria-label="Edit todo description"
                  rows="3"
                />
                <div className="todo-actions">
                  <button type="button" onClick={() => saveTodo(todo)} disabled={saving}>Save</button>
                  <button type="button" className="secondary" onClick={cancelEditing}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="todo-content">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo)}
                    />
                    <span>{todo.completed ? 'Completed' : 'Active'}</span>
                  </label>
                  <h2>{todo.title}</h2>
                  {todo.description && <p>{todo.description}</p>}
                  <time dateTime={todo.createdAt}>Created {new Date(todo.createdAt).toLocaleString()}</time>
                </div>
                <div className="todo-actions">
                  <button type="button" className="secondary" onClick={() => startEditing(todo)}>Edit</button>
                  <button type="button" className="danger" onClick={() => deleteTodo(todo)}>Delete</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default TodoApp
