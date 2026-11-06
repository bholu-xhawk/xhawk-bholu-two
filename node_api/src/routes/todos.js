const router = require('express').Router();
const mongoose = require('mongoose');
const Todo = require('../models/Todo');

function error(res, status, message) {
  return res.status(status).json({ error: message });
}

function validateId(res, id) {
  if (!mongoose.isValidObjectId(id)) {
    error(res, 400, 'invalid id');
    return false;
  }
  return true;
}

function titleFromBody(body, required = false) {
  if (!body || body.title === undefined) {
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
  if (!body || body.completed === undefined) return {};
  if (typeof body.completed !== 'boolean') {
    return { error: 'completed must be a boolean' };
  }
  return { completed: body.completed };
}

function dueDateFromBody(body) {
  if (!body || body.dueDate === undefined) return {};
  if (body.dueDate === null) return { dueDate: null };
  if (typeof body.dueDate !== 'string') {
    return { error: 'dueDate must be a YYYY-MM-DD string or null' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) {
    return { error: 'dueDate must be a valid YYYY-MM-DD date' };
  }

  const [year, month, day] = body.dueDate.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return { error: 'dueDate must be a valid YYYY-MM-DD date' };
  }

  return { dueDate: parsedDate };
}

router.get('/', async (_req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1, _id: -1 }).lean();
  return res.json(todos);
});

router.post('/', async (req, res) => {
  const titleResult = titleFromBody(req.body, true);
  if (titleResult.error) return error(res, 400, titleResult.error);

  const completedResult = completedFromBody(req.body);
  if (completedResult.error) return error(res, 400, completedResult.error);

  const dueDateResult = dueDateFromBody(req.body);
  if (dueDateResult.error) return error(res, 400, dueDateResult.error);

  try {
    const todo = await Todo.create({ ...titleResult, ...completedResult, ...dueDateResult });
    return res.status(201).json(todo);
  } catch (_err) {
    return error(res, 400, 'invalid todo');
  }
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  if (!validateId(res, id)) return undefined;

  const titleResult = titleFromBody(req.body);
  if (titleResult.error) return error(res, 400, titleResult.error);

  const completedResult = completedFromBody(req.body);
  if (completedResult.error) return error(res, 400, completedResult.error);

  const dueDateResult = dueDateFromBody(req.body);
  if (dueDateResult.error) return error(res, 400, dueDateResult.error);

  const updates = { ...titleResult, ...completedResult, ...dueDateResult };
  if (Object.keys(updates).length === 0) {
    return error(res, 400, 'at least one of title, completed, or dueDate is required');
  }

  try {
    const todo = await Todo.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!todo) return error(res, 404, 'not found');
    return res.json(todo);
  } catch (_err) {
    return error(res, 400, 'invalid todo');
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!validateId(res, id)) return undefined;

  const deleted = await Todo.findByIdAndDelete(id);
  if (!deleted) return error(res, 404, 'not found');
  return res.status(204).send();
});

module.exports = router;
