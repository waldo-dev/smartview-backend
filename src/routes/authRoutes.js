import express from 'express';
import { login, register, verify, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

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
 * @route   GET /api/auth/verify
 * @desc    Verificar si un token JWT es válido
 * @access  Public (pero requiere token en header Authorization: Bearer <token> o en body)
 */
router.get('/verify', verify);
router.post('/verify', verify);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/me', authenticate, getMe);

export default router;

