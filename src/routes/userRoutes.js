import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener un usuario por ID
 */
router.get('/:id', getUserById);

/**
 * @route   POST /api/users
 * @desc    Crear un nuevo usuario
 */
router.post('/', createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar un usuario
 */
router.put('/:id', updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Eliminar un usuario (soft delete por defecto, hard delete con ?hard=true)
 */
router.delete('/:id', deleteUser);

export default router;



