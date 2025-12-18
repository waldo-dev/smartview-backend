import express from 'express';
import {
  getAllUserDashboards,
  getDashboardsByUser,
  getUsersByDashboard,
  assignDashboardToUser,
  removeDashboardFromUser,
  assignMultipleDashboardsToUser
} from '../controllers/userDashboardController.js';

const router = express.Router();

/**
 * @route   GET /api/user-dashboards
 * @desc    Obtener todos los permisos
 */
router.get('/', getAllUserDashboards);

/**
 * @route   GET /api/user-dashboards/user/:user_id
 * @desc    Obtener todos los dashboards de un usuario
 */
router.get('/user/:user_id', getDashboardsByUser);

/**
 * @route   GET /api/user-dashboards/dashboard/:dashboard_id
 * @desc    Obtener todos los usuarios con acceso a un dashboard
 */
router.get('/dashboard/:dashboard_id', getUsersByDashboard);

/**
 * @route   POST /api/user-dashboards
 * @desc    Asignar un dashboard a un usuario
 */
router.post('/', assignDashboardToUser);

/**
 * @route   POST /api/user-dashboards/bulk
 * @desc    Asignar múltiples dashboards a un usuario
 */
router.post('/bulk', assignMultipleDashboardsToUser);

/**
 * @route   DELETE /api/user-dashboards
 * @desc    Remover permiso de un usuario a un dashboard
 */
router.delete('/', removeDashboardFromUser);

export default router;

