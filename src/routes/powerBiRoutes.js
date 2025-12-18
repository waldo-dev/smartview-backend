import express from 'express';
import {
  getDashboards,
  getDashboardById,
  getEmbedToken,
  getWorkspaces,
  syncDashboards,
  syncDashboardsForCompany
} from '../controllers/powerBiController.js';

const router = express.Router();

/**
 * @route   GET /api/powerbi/workspaces
 * @desc    Obtener lista de workspaces disponibles en Power BI
 */
router.get('/workspaces', getWorkspaces);

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

/**
 * @route   POST /api/powerbi/dashboards/sync
 * @desc    Sincronizar dashboards de Power BI con la base de datos
 */
router.post('/dashboards/sync', syncDashboards);

/**
 * @route   POST /api/powerbi/dashboards/sync/:company_id
 * @desc    Sincronizar dashboards de Power BI para una empresa específica
 */
router.post('/dashboards/sync/:company_id', syncDashboardsForCompany);

export default router;



