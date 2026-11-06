import React, { useEffect, useState } from 'react'
import { createTodo, deleteTodo, listTodos, updateTodo } from '../api/todos'

function dateOnlyFromValue(value) {
  if (typeof value !== 'string') return ''
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/)
  if (!match) return ''

  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const parsedDate = new Date(Date.UTC(year, month - 1, day))
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return ''
  }

  return `${yearText}-${monthText}-${dayText}`
}

function todayDateOnly() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isOverdue(todo) {
  const dueDate = dateOnlyFromValue(todo.dueDate)
  return Boolean(dueDate && !todo.completed && dueDate < todayDateOnly())
}

function dueDateLabel(todo) {
  const dueDate = dateOnlyFromValue(todo.dueDate)
  return dueDate ? `Due ${dueDate}` : 'No due date'
}

export default function Todos() {
  const [todos, setTodos] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDueDate, setEditingDueDate] = useState('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState(null)

  useEffect(() => {
    let ignore = false

    async function loadTodos() {
      setLoading(true)
      setError('')
      try {
        const loadedTodos = await listTodos()
        if (!ignore) setTodos(loadedTodos)
      } catch (err) {
        if (!ignore) setError(err.message || 'Unable to load todos')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadTodos()

    return () => {
      ignore = true
    }
  }, [])

  function replaceTodo(updatedTodo) {
    setTodos((currentTodos) => currentTodos.map((todo) => (todo._id === updatedTodo._id ? updatedTodo : todo)))
  }

  async function handleCreate(event) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) {
      setError('Enter a todo title before adding it.')
      return
    }

    setPendingAction('create')
    setError('')
    try {
      const createdTodo = await createTodo(title, newDueDate || undefined)
      setTodos((currentTodos) => [createdTodo, ...currentTodos])
      setNewTitle('')
      setNewDueDate('')
    } catch (err) {
      setError(err.message || 'Unable to create todo')
    } finally {
      setPendingAction(null)
    }
  }

  function beginEdit(todo) {
    setEditingId(todo._id)
    setEditingTitle(todo.title)
    setEditingDueDate(dateOnlyFromValue(todo.dueDate))
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingTitle('')
    setEditingDueDate('')
    setError('')
  }

  async function handleSave(todo) {
    const title = editingTitle.trim()
    if (!title) {
      setError('Enter a todo title before saving it.')
      return
    }

    setPendingAction(`edit:${todo._id}`)
    setError('')
    try {
      const updatedTodo = await updateTodo(todo._id, { title, dueDate: editingDueDate || null })
      replaceTodo(updatedTodo)
      setEditingId(null)
      setEditingTitle('')
      setEditingDueDate('')
    } catch (err) {
      setError(err.message || 'Unable to update todo')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleToggle(todo) {
    setPendingAction(`toggle:${todo._id}`)
    setError('')
    try {
      const updatedTodo = await updateTodo(todo._id, { completed: !todo.completed })
      replaceTodo(updatedTodo)
    } catch (err) {
      setError(err.message || 'Unable to update todo')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleDelete(todo) {
    const confirmed = window.confirm(`Delete "${todo.title}"?`)
    if (!confirmed) return

    setPendingAction(`delete:${todo._id}`)
    setError('')
    try {
      await deleteTodo(todo._id)
      setTodos((currentTodos) => currentTodos.filter((currentTodo) => currentTodo._id !== todo._id))
      if (editingId === todo._id) cancelEdit()
    } catch (err) {
      setError(err.message || 'Unable to delete todo')
    } finally {
      setPendingAction(null)
    }
  }

  const createPending = pendingAction === 'create'
  const visibleTodos = showOverdueOnly ? todos.filter(isOverdue) : todos

  return (
    <main className="todo-page" aria-labelledby="todo-title">
      <section className="todo-hero">
        <p className="eyebrow">MongoDB backed task list</p>
        <h1 id="todo-title">Todos</h1>
        <p>Capture tasks, mark them complete, and keep them persisted through the existing Express API.</p>
      </section>

      <form className="todo-create-form" onSubmit={handleCreate} aria-label="Create todo">
        <label htmlFor="new-todo">New todo</label>
        <div className="todo-create-row">
          <input
            id="new-todo"
            type="text"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="What needs to be done?"
            disabled={createPending}
          />
          <label className="todo-date-field" htmlFor="new-todo-due-date">
            <span>Due date</span>
            <input
              id="new-todo-due-date"
              type="date"
              value={newDueDate}
              onChange={(event) => setNewDueDate(event.target.value)}
              disabled={createPending}
            />
          </label>
          <button type="submit" disabled={createPending}>
            {createPending ? 'Adding…' : 'Add todo'}
          </button>
        </div>
      </form>

      {error && (
        <div className="todo-error" role="alert">
          {error}
        </div>
      )}

      {!loading && todos.length > 0 ? (
        <div className="todo-filter-bar">
          <label className="todo-filter">
            <input
              type="checkbox"
              checked={showOverdueOnly}
              onChange={(event) => setShowOverdueOnly(event.target.checked)}
            />
            <span>Show overdue only</span>
          </label>
        </div>
      ) : null}

      {loading ? (
        <p className="todo-status">Loading todos…</p>
      ) : todos.length === 0 ? (
        <p className="todo-empty">No todos yet. Add your first task above.</p>
      ) : visibleTodos.length === 0 ? (
        <p className="todo-empty">No overdue todos. Completed, undated, today, and future tasks are hidden by this filter.</p>
      ) : (
        <ul className="todo-list" aria-label="Todo list">
          {visibleTodos.map((todo) => {
            const isEditing = editingId === todo._id
            const editPending = pendingAction === `edit:${todo._id}`
            const togglePending = pendingAction === `toggle:${todo._id}`
            const deletePending = pendingAction === `delete:${todo._id}`
            const overdue = isOverdue(todo)

            return (
              <li className={`todo-item${todo.completed ? ' completed' : ''}${overdue ? ' overdue' : ''}`} key={todo._id}>
                <label className="todo-check">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggle(todo)}
                    disabled={togglePending || deletePending || editPending}
                  />
                  <span>{todo.completed ? 'Completed' : 'Incomplete'}</span>
                </label>

                <div className="todo-content">
                  {isEditing ? (
                    <div className="todo-edit-fields">
                      <label className="todo-edit-field" htmlFor={`edit-${todo._id}`}>
                        <span>Todo title</span>
                        <input
                          id={`edit-${todo._id}`}
                          className="todo-edit-input"
                          type="text"
                          value={editingTitle}
                          onChange={(event) => setEditingTitle(event.target.value)}
                          disabled={editPending}
                        />
                      </label>
                      <label className="todo-edit-field" htmlFor={`edit-due-${todo._id}`}>
                        <span>Due date</span>
                        <input
                          id={`edit-due-${todo._id}`}
                          className="todo-edit-input"
                          type="date"
                          value={editingDueDate}
                          onChange={(event) => setEditingDueDate(event.target.value)}
                          disabled={editPending}
                        />
                      </label>
                    </div>
                  ) : (
                    <>
                      <span className="todo-title">{todo.title}</span>
                      <span className="todo-due-date">{dueDateLabel(todo)}</span>
                      {overdue ? <span className="todo-overdue-status">Overdue</span> : null}
                    </>
                  )}
                </div>

                <div className="todo-actions">
                  {isEditing ? (
                    <>
                      <button type="button" onClick={() => handleSave(todo)} disabled={editPending}>
                        {editPending ? 'Saving…' : 'Save'}
                      </button>
                      <button type="button" className="secondary" onClick={cancelEdit} disabled={editPending}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button type="button" className="secondary" onClick={() => beginEdit(todo)} disabled={Boolean(pendingAction)}>
                      Edit
                    </button>
                  )}
                  <button type="button" className="danger" onClick={() => handleDelete(todo)} disabled={deletePending || editPending}>
                    {deletePending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
