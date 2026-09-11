const router = require('express').Router();

let todos = [];
let nextId = 1;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const resetTodos = () => {
  todos = [];
  nextId = 1;
};

const findTodo = (id) => todos.find((todo) => todo.id === id);

const validateCreate = (body) => {
  if (!body || !isNonEmptyString(body.title)) {
    return 'title is required';
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    return 'description must be a string';
  }
  if (body.completed !== undefined && typeof body.completed !== 'boolean') {
    return 'completed must be a boolean';
  }
  return null;
};

const validatePatch = (body) => {
  if (!body || typeof body !== 'object') {
    return 'request body is required';
  }
  if (body.title !== undefined && !isNonEmptyString(body.title)) {
    return 'title must be a non-empty string';
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    return 'description must be a string';
  }
  if (body.completed !== undefined && typeof body.completed !== 'boolean') {
    return 'completed must be a boolean';
  }
  return null;
};

// Create
router.post('/', (req, res) => {
  const validationError = validateCreate(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const todo = {
    id: String(nextId),
    title: req.body.title,
    description: req.body.description || '',
    completed: req.body.completed || false,
    created_at: new Date().toISOString(),
  };

  nextId += 1;
  todos.push(todo);

  return res.status(201).json(todo);
});

// List all
router.get('/', (_req, res) => {
  return res.json(todos);
});

// Get by id
router.get('/:id', (req, res) => {
  const todo = findTodo(req.params.id);
  if (!todo) return res.status(404).json({ error: 'not found' });
  return res.json(todo);
});

// Update partial
router.patch('/:id', (req, res) => {
  const todo = findTodo(req.params.id);
  if (!todo) return res.status(404).json({ error: 'not found' });

  const validationError = validatePatch(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  if (req.body.title !== undefined) todo.title = req.body.title;
  if (req.body.description !== undefined) todo.description = req.body.description;
  if (req.body.completed !== undefined) todo.completed = req.body.completed;

  return res.json(todo);
});

// Delete
router.delete('/:id', (req, res) => {
  const index = todos.findIndex((todo) => todo.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'not found' });

  todos.splice(index, 1);
  return res.status(204).send();
});

router.resetTodos = resetTodos;

module.exports = router;
