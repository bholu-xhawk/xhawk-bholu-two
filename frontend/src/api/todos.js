const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
    return window.__API_BASE_URL__;
  }

  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_err) {
    return text;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const data = await parseResponse(response);

  if (!response.ok) {
    const message = data && typeof data === 'object' && data.error
      ? data.error
      : `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function listTodos() {
  return request('/todos');
}

export function createTodo(title) {
  return request('/todos', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export function updateTodoCompletion(id, completed) {
  return request(`/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
}

export function deleteTodo(id) {
  return request(`/todos/${id}`, { method: 'DELETE' });
}
