import express from 'express';
import {
  getAllDashboards,
  getDashboardById,
  createDashboard,
  updateDashboard,
  deleteDashboard
} from '../controllers/dashboardController.js';

const router = express.Router();

/**
 * @route   GET /api/dashboards
 * @desc    Obtener todos los dashboards
 */
router.get('/', getAllDashboards);

/**
 * @route   GET /api/dashboards/:id
 * @desc    Obtener un dashboard por ID
 */
router.get('/:id', getDashboardById);

/**
 * @route   POST /api/dashboards
 * @desc    Crear un nuevo dashboard
 */
router.post('/', createDashboard);

/**
 * @route   PUT /api/dashboards/:id
 * @desc    Actualizar un dashboard
 */
router.put('/:id', updateDashboard);

/**
 * @route   DELETE /api/dashboards/:id
 * @desc    Eliminar un dashboard (soft delete por defecto, hard delete con ?hard=true)
 */
router.delete('/:id', deleteDashboard);

export default router;

