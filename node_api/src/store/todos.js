const { randomUUID } = require('crypto');

const todos = new Map();
let order = [];

function clone(todo) {
  return { ...todo };
}

function now() {
  return new Date().toISOString();
}

function listTodos() {
  return order.map((id) => clone(todos.get(id)));
}

function getTodo(id) {
  const todo = todos.get(id);
  return todo ? clone(todo) : null;
}

function createTodo({ title, completed = false }) {
  const timestamp = now();
  const todo = {
    _id: randomUUID(),
    title,
    completed,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  todos.set(todo._id, todo);
  order.unshift(todo._id);

  return clone(todo);
}

function patchTodo(id, updates) {
  const todo = todos.get(id);
  if (!todo) return null;

  const updated = {
    ...todo,
    ...updates,
    updatedAt: now(),
  };

  todos.set(id, updated);
  return clone(updated);
}

function deleteTodo(id) {
  if (!todos.has(id)) return false;

  todos.delete(id);
  order = order.filter((todoId) => todoId !== id);
  return true;
}

function resetTodosForTest() {
  todos.clear();
  order = [];
}

module.exports = {
  listTodos,
  getTodo,
  createTodo,
  patchTodo,
  deleteTodo,
  resetTodosForTest,
};
