const express = require('express');
const router = express.Router();

const {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

router.post('/', createUser);
router.get('/', listUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
