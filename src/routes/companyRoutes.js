import express from 'express';
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getUsersByCompany
} from '../controllers/companyController.js';
import {
  getDashboardsByCompany,
  assignDashboardToCompany,
  assignMultipleDashboardsToCompany
} from '../controllers/dashboardController.js';
import {
  getCompanyAssignments,
  assignDashboardToCompanyUsers,
  assignCompanyDashboardsToUser
} from '../controllers/userDashboardController.js';

const router = express.Router();

/**
 * @route   GET /api/companies
 * @desc    Obtener todas las empresas
 */
router.get('/', getAllCompanies);

/**
 * @route   POST /api/companies
 * @desc    Crear una nueva empresa
 */
router.post('/', createCompany);

// Rutas específicas (deben ir antes de las rutas genéricas :id)
/**
 * @route   GET /api/companies/:company_id/users
 * @desc    Obtener todos los usuarios de una empresa específica
 */
router.get('/:company_id/users', getUsersByCompany);

/**
 * @route   GET /api/companies/:company_id/assignments
 * @desc    Obtener todas las asignaciones de dashboards a usuarios de una empresa
 */
router.get('/:company_id/assignments', getCompanyAssignments);

/**
 * @route   GET /api/companies/:company_id/dashboards
 * @desc    Obtener todos los dashboards de una empresa específica
 */
router.get('/:company_id/dashboards', getDashboardsByCompany);

/**
 * @route   POST /api/companies/:company_id/dashboards
 * @desc    Asignar un dashboard a una empresa (crear nuevo o reasignar existente)
 */
router.post('/:company_id/dashboards', assignDashboardToCompany);

/**
 * @route   POST /api/companies/:company_id/dashboards/bulk
 * @desc    Asignar múltiples dashboards a una empresa
 */
router.post('/:company_id/dashboards/bulk', assignMultipleDashboardsToCompany);

/**
 * @route   POST /api/companies/:company_id/dashboards/:dashboard_id/assign-users
 * @desc    Asignar un dashboard a múltiples usuarios de la empresa
 */
router.post('/:company_id/dashboards/:dashboard_id/assign-users', assignDashboardToCompanyUsers);

/**
 * @route   POST /api/companies/:company_id/users/:user_id/assign-dashboards
 * @desc    Asignar múltiples dashboards de la empresa a un usuario
 */
router.post('/:company_id/users/:user_id/assign-dashboards', assignCompanyDashboardsToUser);

// Rutas genéricas de empresas (deben ir después de las rutas específicas)
/**
 * @route   GET /api/companies/:id
 * @desc    Obtener una empresa por ID
 */
router.get('/:id', getCompanyById);

/**
 * @route   PUT /api/companies/:id
 * @desc    Actualizar una empresa
 */
router.put('/:id', updateCompany);

/**
 * @route   DELETE /api/companies/:id
 * @desc    Eliminar una empresa (soft delete por defecto, hard delete con ?hard=true)
 */
router.delete('/:id', deleteCompany);

export default router;



