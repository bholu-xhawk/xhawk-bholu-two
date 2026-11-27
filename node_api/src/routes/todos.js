const router = require('express').Router();

const mockedTodos = [
  {
    id: 'mock-todo-1',
    title: 'Review the mocked todo endpoint',
    completed: true,
  },
  {
    id: 'mock-todo-2',
    title: 'Render read-only todo rows',
    completed: false,
  },
  {
    id: 'mock-todo-3',
    title: 'Keep the users sample backed by MongoDB',
    completed: false,
  },
];

router.get('/', (_req, res) => {
  res.status(200).json(mockedTodos);
});

module.exports = router;
