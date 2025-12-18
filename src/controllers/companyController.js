import { Company, User, Dashboard } from '../models/index.js';
import { logDelete, logCascadeDelete } from '../utils/dbLogger.js';

/**
 * @route   GET /api/companies
 * @desc    Obtener todas las empresas
 * @access  Public/Private (ajustar según necesidad)
 */
export const getAllCompanies = async (req, res) => {
  try {
    const { is_active } = req.query;
    
    const where = {};
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    const companies = await Company.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Error en getAllCompanies:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener empresas',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/companies/:id
 * @desc    Obtener una empresa por ID
 * @access  Public/Private
 */
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error en getCompanyById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener empresa',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/companies
 * @desc    Crear una nueva empresa
 * @access  Public/Private
 */
export const createCompany = async (req, res) => {
  try {
    const { name, industry, is_active } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    const company = await Company.create({
      name,
      industry,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json({
      success: true,
      message: 'Empresa creada exitosamente',
      data: company
    });
  } catch (error) {
    console.error('Error en createCompany:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear empresa',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/companies/:id
 * @desc    Actualizar una empresa
 * @access  Public/Private
 */
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, industry, is_active } = req.body;

    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    await company.update({
      name: name || company.name,
      industry: industry !== undefined ? industry : company.industry,
      is_active: is_active !== undefined ? is_active : company.is_active
    });

    res.status(200).json({
      success: true,
      message: 'Empresa actualizada exitosamente',
      data: company
    });
  } catch (error) {
    console.error('Error en updateCompany:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar empresa',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/companies/:id
 * @desc    Eliminar una empresa (soft delete cambiando is_active)
 * @access  Public/Private
 */
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query; // Si hard=true, elimina físicamente

    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    if (hard === 'true') {
      // Loggear antes de eliminar para rastrear CASCADE
      const companyId = company.id;
      logDelete('company', companyId);
      console.warn(`⚠️ ADVERTENCIA: Eliminando empresa ${companyId} - Esto eliminará en CASCADE todos los usuarios y dashboards relacionados`);
      
      await company.destroy();
      
      logCascadeDelete('company', companyId, ['user', 'dashboard', 'user_dashboard']);
      
      return res.status(200).json({
        success: true,
        message: 'Empresa eliminada permanentemente'
      });
    } else {
      // Soft delete
      await company.update({ is_active: false });
      return res.status(200).json({
        success: true,
        message: 'Empresa desactivada exitosamente',
        data: company
      });
    }
  } catch (error) {
    console.error('Error en deleteCompany:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar empresa',
      error: error.message
    });
  }
};


