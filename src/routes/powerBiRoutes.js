import express from 'express';
import {
  getDashboards,
  getDashboardById,
  getEmbedToken
} from '../controllers/powerBiController.js';

const router = express.Router();

/**
 * @route   GET /api/powerbi/dashboards
 * @desc    Obtener lista de dashboards de Power BI
 */
router.get('/dashboards', getDashboards);

/**
 * @route   GET /api/powerbi/dashboards/:id
 * @desc    Obtener información de un dashboard específico
 */
router.get('/dashboards/:id', getDashboardById);

/**
 * @route   GET /api/powerbi/dashboards/:id/embed-token
 * @desc    Obtener embed token para un dashboard
 */
router.get('/dashboards/:id/embed-token', getEmbedToken);

export default router;

