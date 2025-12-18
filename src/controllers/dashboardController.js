import { Dashboard, Company } from '../models/index.js';

/**
 * @route   GET /api/dashboards
 * @desc    Obtener todos los dashboards
 * @access  Public/Private
 */
export const getAllDashboards = async (req, res) => {
  try {
    const { company_id, is_active } = req.query;

    const where = {};
    if (company_id) where.company_id = company_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const dashboards = await Dashboard.findAll({
      where,
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'industry']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: dashboards
    });
  } catch (error) {
    console.error('Error en getAllDashboards:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboards',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/dashboards/:id
 * @desc    Obtener un dashboard por ID
 * @access  Public/Private
 */
export const getDashboardById = async (req, res) => {
  try {
    const { id } = req.params;

    const dashboard = await Dashboard.findByPk(id, {
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'industry']
      }]
    });

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error en getDashboardById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboard',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/dashboards
 * @desc    Crear un nuevo dashboard
 * @access  Public/Private
 */
export const createDashboard = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      company_id, 
      powerbi_report_id, 
      powerbi_workspace_id, 
      is_active 
    } = req.body;

    if (!name || !company_id || !powerbi_report_id || !powerbi_workspace_id) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, company_id, powerbi_report_id y powerbi_workspace_id son requeridos'
      });
    }

    // Verificar que la empresa existe
    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    const dashboard = await Dashboard.create({
      name,
      description,
      company_id,
      powerbi_report_id,
      powerbi_workspace_id,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json({
      success: true,
      message: 'Dashboard creado exitosamente',
      data: dashboard
    });
  } catch (error) {
    console.error('Error en createDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear dashboard',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/dashboards/:id
 * @desc    Actualizar un dashboard
 * @access  Public/Private
 */
export const updateDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      company_id, 
      powerbi_report_id, 
      powerbi_workspace_id, 
      is_active 
    } = req.body;

    const dashboard = await Dashboard.findByPk(id);

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard no encontrado'
      });
    }

    // Verificar que la empresa existe si se está cambiando
    if (company_id && company_id !== dashboard.company_id) {
      const company = await Company.findByPk(company_id);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Empresa no encontrada'
        });
      }
    }

    await dashboard.update({
      name: name || dashboard.name,
      description: description !== undefined ? description : dashboard.description,
      company_id: company_id || dashboard.company_id,
      powerbi_report_id: powerbi_report_id || dashboard.powerbi_report_id,
      powerbi_workspace_id: powerbi_workspace_id || dashboard.powerbi_workspace_id,
      is_active: is_active !== undefined ? is_active : dashboard.is_active
    });

    res.status(200).json({
      success: true,
      message: 'Dashboard actualizado exitosamente',
      data: dashboard
    });
  } catch (error) {
    console.error('Error en updateDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar dashboard',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/dashboards/:id
 * @desc    Eliminar un dashboard
 * @access  Public/Private
 */
export const deleteDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    const dashboard = await Dashboard.findByPk(id);

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard no encontrado'
      });
    }

    if (hard === 'true') {
      await dashboard.destroy();
      return res.status(200).json({
        success: true,
        message: 'Dashboard eliminado permanentemente'
      });
    } else {
      // Soft delete
      await dashboard.update({ is_active: false });
      return res.status(200).json({
        success: true,
        message: 'Dashboard desactivado exitosamente',
        data: dashboard
      });
    }
  } catch (error) {
    console.error('Error en deleteDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar dashboard',
      error: error.message
    });
  }
};


