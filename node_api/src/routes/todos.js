const router = require('express').Router();
const todoStore = require('../store/todos');

const TODO_FIELDS = new Set(['title', 'completed']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function error(res, status, message) {
  return res.status(status).json({ error: message });
}

function validateId(res, id) {
  if (!UUID_PATTERN.test(id)) {
    error(res, 400, 'invalid id');
    return false;
  }
  return true;
}

function validateBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'request body must be a JSON object' };
  }

  const unsupported = Object.keys(body).filter((field) => !TODO_FIELDS.has(field));
  if (unsupported.length > 0) {
    return { error: `unsupported field: ${unsupported[0]}` };
  }

  return {};
}

function titleFromBody(body, required = false) {
  if (body.title === undefined) {
    return required ? { error: 'title is required' } : {};
  }
  if (typeof body.title !== 'string') {
    return { error: 'title must be a string' };
  }
  const title = body.title.trim();
  if (!title) {
    return { error: 'title is required' };
  }
  return { title };
}

function completedFromBody(body) {
  if (body.completed === undefined) return {};
  if (typeof body.completed !== 'boolean') {
    return { error: 'completed must be a boolean' };
  }
  return { completed: body.completed };
}

function validatedTodoFields(body, { requireTitle = false } = {}) {
  const bodyResult = validateBody(body);
  if (bodyResult.error) return bodyResult;

  const titleResult = titleFromBody(body, requireTitle);
  if (titleResult.error) return titleResult;

  const completedResult = completedFromBody(body);
  if (completedResult.error) return completedResult;

  return { values: { ...titleResult, ...completedResult } };
}

router.get('/', (_req, res) => {
  return res.json(todoStore.listTodos());
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  if (!validateId(res, id)) return undefined;

  const todo = todoStore.getTodo(id);
  if (!todo) return error(res, 404, 'not found');

  return res.json(todo);
});

router.post('/', (req, res) => {
  const result = validatedTodoFields(req.body, { requireTitle: true });
  if (result.error) return error(res, 400, result.error);

  const todo = todoStore.createTodo(result.values);
  return res.status(201).json(todo);
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  if (!validateId(res, id)) return undefined;

  const result = validatedTodoFields(req.body);
  if (result.error) return error(res, 400, result.error);

  if (Object.keys(result.values).length === 0) {
    return error(res, 400, 'at least one of title or completed is required');
  }

  const todo = todoStore.patchTodo(id, result.values);
  if (!todo) return error(res, 404, 'not found');

  return res.json(todo);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  if (!validateId(res, id)) return undefined;

  if (!todoStore.deleteTodo(id)) return error(res, 404, 'not found');

  return res.status(204).send();
});

module.exports = router;
