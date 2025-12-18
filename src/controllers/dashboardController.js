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

/**
 * @route   GET /api/companies/:company_id/dashboards
 * @desc    Obtener todos los dashboards de una empresa específica
 * @access  Public/Private
 */
export const getDashboardsByCompany = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { is_active } = req.query;

    // Verificar que la empresa existe
    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    const where = { company_id };
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

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
      data: {
        company: {
          id: company.id,
          name: company.name,
          industry: company.industry
        },
        dashboards
      }
    });
  } catch (error) {
    console.error('Error en getDashboardsByCompany:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboards de la empresa',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/companies/:company_id/dashboards
 * @desc    Asignar un dashboard a una empresa (crear o actualizar)
 * @access  Public/Private
 */
export const assignDashboardToCompany = async (req, res) => {
  try {
    const { company_id } = req.params;
    const {
      dashboard_id,
      name,
      description,
      powerbi_report_id,
      powerbi_workspace_id,
      is_active
    } = req.body;

    // Verificar que la empresa existe y está activa
    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    if (!company.is_active) {
      return res.status(400).json({
        success: false,
        message: 'No se puede asignar un dashboard a una empresa inactiva'
      });
    }

    // Si se proporciona dashboard_id, actualizar el dashboard existente
    if (dashboard_id) {
      const dashboard = await Dashboard.findByPk(dashboard_id);
      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Dashboard no encontrado'
        });
      }

      await dashboard.update({
        company_id,
        name: name || dashboard.name,
        description: description !== undefined ? description : dashboard.description,
        powerbi_report_id: powerbi_report_id || dashboard.powerbi_report_id,
        powerbi_workspace_id: powerbi_workspace_id || dashboard.powerbi_workspace_id,
        is_active: is_active !== undefined ? is_active : dashboard.is_active
      });

      return res.status(200).json({
        success: true,
        message: 'Dashboard reasignado a la empresa exitosamente',
        data: dashboard
      });
    }

    // Si no hay dashboard_id, crear uno nuevo
    if (!name || !powerbi_report_id || !powerbi_workspace_id) {
      return res.status(400).json({
        success: false,
        message: 'Para crear un nuevo dashboard se requieren: name, powerbi_report_id y powerbi_workspace_id'
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
      message: 'Dashboard asignado a la empresa exitosamente',
      data: dashboard
    });
  } catch (error) {
    console.error('Error en assignDashboardToCompany:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar dashboard a la empresa',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/dashboards/:id/assign-company
 * @desc    Reasignar un dashboard a otra empresa
 * @access  Public/Private
 */
export const reassignDashboardCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id } = req.body;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'company_id es requerido'
      });
    }

    const dashboard = await Dashboard.findByPk(id);
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard no encontrado'
      });
    }

    // Verificar que la nueva empresa existe y está activa
    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    if (!company.is_active) {
      return res.status(400).json({
        success: false,
        message: 'No se puede reasignar un dashboard a una empresa inactiva'
      });
    }

    const oldCompanyId = dashboard.company_id;
    await dashboard.update({ company_id });
    
    // Recargar el dashboard con la información de la empresa
    await dashboard.reload({
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'industry']
      }]
    });

    const message = oldCompanyId 
      ? `Dashboard reasignado de empresa ${oldCompanyId} a ${company.name}`
      : `Dashboard asignado a la empresa ${company.name}`;

    res.status(200).json({
      success: true,
      message,
      data: {
        dashboard,
        previous_company_id: oldCompanyId || null,
        new_company_id: company_id,
        company: {
          id: company.id,
          name: company.name,
          industry: company.industry
        }
      }
    });
  } catch (error) {
    console.error('Error en reassignDashboardCompany:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reasignar dashboard',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/companies/:company_id/dashboards/bulk
 * @desc    Asignar múltiples dashboards a una empresa
 * @access  Public/Private
 */
export const assignMultipleDashboardsToCompany = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { dashboard_ids } = req.body; // Array de dashboard IDs

    if (!dashboard_ids || !Array.isArray(dashboard_ids) || dashboard_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'dashboard_ids debe ser un array con al menos un elemento'
      });
    }

    // Verificar que la empresa existe y está activa
    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    if (!company.is_active) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden asignar dashboards a una empresa inactiva'
      });
    }

    // Verificar que todos los dashboards existen
    const dashboards = await Dashboard.findAll({
      where: { id: dashboard_ids }
    });

    if (dashboards.length !== dashboard_ids.length) {
      return res.status(404).json({
        success: false,
        message: 'Uno o más dashboards no fueron encontrados'
      });
    }

    // Reasignar todos los dashboards a la empresa
    const updatePromises = dashboards.map(dashboard =>
      dashboard.update({ company_id })
    );

    await Promise.all(updatePromises);

    // Obtener los dashboards actualizados
    const updatedDashboards = await Dashboard.findAll({
      where: { id: dashboard_ids },
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'industry']
      }]
    });

    res.status(200).json({
      success: true,
      message: `${updatedDashboards.length} dashboard(s) asignado(s) a la empresa exitosamente`,
      data: {
        company: {
          id: company.id,
          name: company.name,
          industry: company.industry
        },
        dashboards: updatedDashboards
      }
    });
  } catch (error) {
    console.error('Error en assignMultipleDashboardsToCompany:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar múltiples dashboards',
      error: error.message
    });
  }
};



