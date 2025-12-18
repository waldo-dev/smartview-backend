import express from 'express';
import { login, register, getMe } from '../controllers/authController.js';
// TODO: Importar middleware de autenticación cuando esté disponible
// import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
// router.get('/me', authenticate, getMe);
router.get('/me', getMe);

export default router;

