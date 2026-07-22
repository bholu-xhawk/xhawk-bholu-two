import React, { useRef, useState } from 'react'

export default function TodoList() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const nextId = useRef(1)

  const selectedCount = todos.filter((todo) => todo.selected).length

  const handleAddTodo = (event) => {
    event.preventDefault()

    const text = newTodo.trim()
    if (!text) return

    const id = `todo-${nextId.current}`
    nextId.current += 1

    setTodos((currentTodos) => [
      ...currentTodos,
      { id, text, selected: false },
    ])
    setNewTodo('')
  }

  const handleToggleSelected = (id) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, selected: !todo.selected } : todo
      )
    )
  }

  const handleDeleteTodo = (id) => {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id))
  }

  const handleDeleteSelected = () => {
    setTodos((currentTodos) => currentTodos.filter((todo) => !todo.selected))
  }

  return (
    <section className="todo-card" aria-labelledby="todo-list-heading">
      <div className="todo-card-header">
        <h2 id="todo-list-heading">Todo List</h2>
        <p>{selectedCount} selected</p>
      </div>

      <form className="todo-form" onSubmit={handleAddTodo}>
        <label className="sr-only" htmlFor="new-todo">
          New todo
        </label>
        <input
          id="new-todo"
          type="text"
          value={newTodo}
          onChange={(event) => setNewTodo(event.target.value)}
          placeholder="Add a new todo"
        />
        <button type="submit">Add Todo</button>
      </form>

      {todos.length > 0 ? (
        <ul className="todo-list" aria-label="Todos">
          {todos.map((todo) => (
            <li
              className={todo.selected ? 'todo-item selected' : 'todo-item'}
              key={todo.id}
            >
              <label className="todo-item-label">
                <input
                  type="checkbox"
                  checked={todo.selected}
                  onChange={() => handleToggleSelected(todo.id)}
                />
                <span>{todo.text}</span>
              </label>
              <button
                className="todo-delete-button"
                type="button"
                onClick={() => handleDeleteTodo(todo.id)}
                aria-label={`Delete ${todo.text}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="todo-empty">No todos yet. Add one to get started.</p>
      )}

      <div className="todo-bulk-actions">
        <button
          type="button"
          onClick={handleDeleteSelected}
          disabled={selectedCount === 0}
        >
          Delete Selected
        </button>
      </div>
    </section>
  )
}
