import React, { useEffect, useMemo, useState } from 'react'
import { createTodo, deleteTodo, listTodos, updateTodo } from '../api/todos'

function hasDueDate(todo) {
  return typeof todo.dueDate === 'string' && todo.dueDate.length > 0
}

function sortByDueDate(todos) {
  return todos
    .map((todo, index) => ({ todo, index }))
    .sort((left, right) => {
      const leftHasDate = hasDueDate(left.todo)
      const rightHasDate = hasDueDate(right.todo)

      if (leftHasDate && rightHasDate && left.todo.dueDate !== right.todo.dueDate) {
        return left.todo.dueDate < right.todo.dueDate ? -1 : 1
      }
      if (leftHasDate !== rightHasDate) return leftHasDate ? -1 : 1
      return left.index - right.index
    })
    .map(({ todo }) => todo)
}

export default function Todos() {
  const [todos, setTodos] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDueDate, setEditingDueDate] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
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

  const visibleTodos = useMemo(() => {
    if (sortOrder !== 'dueDate') return todos
    return sortByDueDate(todos)
  }, [sortOrder, todos])

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
      const createdTodo = await createTodo(title, newDueDate || null)
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
    setEditingDueDate(hasDueDate(todo) ? todo.dueDate : '')
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
          <div className="todo-date-field">
            <label htmlFor="new-todo-due-date">Due date (optional)</label>
            <input
              id="new-todo-due-date"
              type="date"
              value={newDueDate}
              onChange={(event) => setNewDueDate(event.target.value)}
              disabled={createPending}
            />
          </div>
          <button type="submit" disabled={createPending}>
            {createPending ? 'Adding…' : 'Add todo'}
          </button>
        </div>
      </form>

      <div className="todo-toolbar">
        <label htmlFor="todo-sort">Sort todos</label>
        <select id="todo-sort" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
          <option value="newest">Newest first</option>
          <option value="dueDate">Due date</option>
        </select>
      </div>

      {error && (
        <div className="todo-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="todo-status">Loading todos…</p>
      ) : todos.length === 0 ? (
        <p className="todo-empty">No todos yet. Add your first task above.</p>
      ) : (
        <ul className="todo-list" aria-label="Todo list">
          {visibleTodos.map((todo) => {
            const isEditing = editingId === todo._id
            const editPending = pendingAction === `edit:${todo._id}`
            const togglePending = pendingAction === `toggle:${todo._id}`
            const deletePending = pendingAction === `delete:${todo._id}`

            return (
              <li className={`todo-item${todo.completed ? ' completed' : ''}`} key={todo._id}>
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
                    <>
                      <label className="sr-only" htmlFor={`edit-${todo._id}`}>
                        Edit {todo.title}
                      </label>
                      <input
                        id={`edit-${todo._id}`}
                        className="todo-edit-input"
                        type="text"
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        disabled={editPending}
                      />
                      <label className="todo-edit-date-label" htmlFor={`edit-due-date-${todo._id}`}>
                        Due date
                      </label>
                      <input
                        id={`edit-due-date-${todo._id}`}
                        className="todo-edit-date-input"
                        type="date"
                        value={editingDueDate}
                        onChange={(event) => setEditingDueDate(event.target.value)}
                        disabled={editPending}
                      />
                    </>
                  ) : (
                    <>
                      <span className="todo-title">{todo.title}</span>
                      <span className="todo-due-date">
                        {hasDueDate(todo) ? (
                          <>
                            Due <time dateTime={todo.dueDate}>{todo.dueDate}</time>
                          </>
                        ) : (
                          'No due date'
                        )}
                      </span>
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
