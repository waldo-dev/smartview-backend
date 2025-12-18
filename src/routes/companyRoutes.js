import express from 'express';
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
} from '../controllers/companyController.js';

const router = express.Router();

/**
 * @route   GET /api/companies
 * @desc    Obtener todas las empresas
 */
router.get('/', getAllCompanies);

/**
 * @route   GET /api/companies/:id
 * @desc    Obtener una empresa por ID
 */
router.get('/:id', getCompanyById);

/**
 * @route   POST /api/companies
 * @desc    Crear una nueva empresa
 */
router.post('/', createCompany);

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


