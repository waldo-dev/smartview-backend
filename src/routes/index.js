import express from 'express';
import authRoutes from './authRoutes.js';
import companyRoutes from './companyRoutes.js';
import userRoutes from './userRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import userDashboardRoutes from './userDashboardRoutes.js';
import powerBiRoutes from './powerBiRoutes.js';
import dbDebugRoutes from './dbDebugRoutes.js';

const router = express.Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de empresas
router.use('/companies', companyRoutes);

// Rutas de usuarios
router.use('/users', userRoutes);

// Rutas de dashboards
router.use('/dashboards', dashboardRoutes);

// Rutas de permisos usuario-dashboard
router.use('/user-dashboards', userDashboardRoutes);

// Rutas de Power BI
router.use('/powerbi', powerBiRoutes);

// Rutas de debug (solo para desarrollo)
if (process.env.NODE_ENV !== 'production') {
  router.use('/debug', dbDebugRoutes);
}

export default router;


