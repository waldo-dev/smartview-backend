import express from 'express';
import authRoutes from './authRoutes.js';

const router = express.Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Aquí se agregarán más rutas del proyecto
// Ejemplo:
// router.use('/users', userRoutes);

export default router;

