import { UserDashboard, User, Dashboard, Company } from '../models/index.js';

/**
 * @route   GET /api/user-dashboards
 * @desc    Obtener todos los permisos de usuarios a dashboards
 * @access  Public/Private
 */
export const getAllUserDashboards = async (req, res) => {
  try {
    const { user_id, dashboard_id } = req.query;

    const where = {};
    if (user_id) where.user_id = user_id;
    if (dashboard_id) where.dashboard_id = dashboard_id;

    const userDashboards = await UserDashboard.findAll({
      where
    });

    // Enriquecer con datos de usuario y dashboard
    const enrichedData = await Promise.all(
      userDashboards.map(async (ud) => {
        const user = await User.findByPk(ud.user_id, {
          attributes: ['id', 'name', 'email', 'role_id']
        });
        const dashboard = await Dashboard.findByPk(ud.dashboard_id, {
          attributes: ['id', 'name', 'powerbi_report_id', 'powerbi_workspace_id']
        });
        return {
          user_id: ud.user_id,
          dashboard_id: ud.dashboard_id,
          user,
          dashboard
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedData
    });
  } catch (error) {
    console.error('Error en getAllUserDashboards:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/user-dashboards/user/:user_id
 * @desc    Obtener todos los dashboards de un usuario
 * @access  Public/Private
 */
export const getDashboardsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await User.findByPk(user_id, {
      include: [{
        model: Dashboard,
        as: 'dashboards',
        through: {
          attributes: []
        },
        where: { is_active: true }
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user.dashboards
    });
  } catch (error) {
    console.error('Error en getDashboardsByUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboards del usuario',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/user-dashboards/dashboard/:dashboard_id
 * @desc    Obtener todos los usuarios con acceso a un dashboard
 * @access  Public/Private
 */
export const getUsersByDashboard = async (req, res) => {
  try {
    const { dashboard_id } = req.params;

    const dashboard = await Dashboard.findByPk(dashboard_id, {
      include: [{
        model: User,
        as: 'users',
        through: {
          attributes: []
        },
        where: { is_active: true },
        attributes: { exclude: ['password'] }
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
      data: dashboard.users
    });
  } catch (error) {
    console.error('Error en getUsersByDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios del dashboard',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/user-dashboards
 * @desc    Asignar un dashboard a un usuario (crear permiso)
 * @access  Public/Private
 */
export const assignDashboardToUser = async (req, res) => {
  try {
    const { user_id, dashboard_id } = req.body;

    if (!user_id || !dashboard_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id y dashboard_id son requeridos'
      });
    }

    // Verificar que el usuario existe
    const user = await User.findByPk(user_id, {
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name']
      }]
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el dashboard existe
    const dashboard = await Dashboard.findByPk(dashboard_id, {
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name']
      }]
    });
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard no encontrado'
      });
    }

    // Validar que el usuario y el dashboard pertenezcan a la misma empresa
    if (user.company_id && dashboard.company_id && user.company_id !== dashboard.company_id) {
      return res.status(400).json({
        success: false,
        message: 'El usuario y el dashboard deben pertenecer a la misma empresa'
      });
    }

    // Verificar si ya existe el permiso
    const existingPermission = await UserDashboard.findOne({
      where: { user_id, dashboard_id }
    });

    if (existingPermission) {
      return res.status(409).json({
        success: false,
        message: 'El usuario ya tiene acceso a este dashboard'
      });
    }

    const userDashboard = await UserDashboard.create({
      user_id,
      dashboard_id
    });

    res.status(201).json({
      success: true,
      message: 'Permiso asignado exitosamente',
      data: {
        user_id: userDashboard.user_id,
        dashboard_id: userDashboard.dashboard_id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          company_id: user.company_id
        },
        dashboard: {
          id: dashboard.id,
          name: dashboard.name,
          company_id: dashboard.company_id
        }
      }
    });
  } catch (error) {
    console.error('Error en assignDashboardToUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar permiso',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/user-dashboards
 * @desc    Remover permiso de un usuario a un dashboard
 * @access  Public/Private
 */
export const removeDashboardFromUser = async (req, res) => {
  try {
    const { user_id, dashboard_id } = req.body;

    if (!user_id || !dashboard_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id y dashboard_id son requeridos'
      });
    }

    const userDashboard = await UserDashboard.findOne({
      where: { user_id, dashboard_id }
    });

    if (!userDashboard) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    await userDashboard.destroy();

    res.status(200).json({
      success: true,
      message: 'Permiso removido exitosamente'
    });
  } catch (error) {
    console.error('Error en removeDashboardFromUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al remover permiso',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/user-dashboards/bulk
 * @desc    Asignar múltiples dashboards a un usuario
 * @access  Public/Private
 */
export const assignMultipleDashboardsToUser = async (req, res) => {
  try {
    const { user_id, dashboard_ids } = req.body;

    if (!user_id || !Array.isArray(dashboard_ids)) {
      return res.status(400).json({
        success: false,
        message: 'user_id y dashboard_ids (array) son requeridos'
      });
    }

    // Verificar que el usuario existe
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const results = [];
    const errors = [];

    for (const dashboard_id of dashboard_ids) {
      try {
        // Verificar que el dashboard existe
        const dashboard = await Dashboard.findByPk(dashboard_id);
        if (!dashboard) {
          errors.push({ dashboard_id, error: 'Dashboard no encontrado' });
          continue;
        }

        // Verificar si ya existe el permiso
        const existing = await UserDashboard.findOne({
          where: { user_id, dashboard_id }
        });

        if (existing) {
          errors.push({ dashboard_id, error: 'Permiso ya existe' });
          continue;
        }

        const userDashboard = await UserDashboard.create({
          user_id,
          dashboard_id
        });
        results.push(userDashboard);
      } catch (error) {
        errors.push({ dashboard_id, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Se asignaron ${results.length} permisos`,
      data: {
        created: results.length,
        skipped: errors.length,
        permissions: results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Error en assignMultipleDashboardsToUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar permisos',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/companies/:company_id/assignments
 * @desc    Obtener todas las asignaciones de dashboards a usuarios de una empresa
 * @access  Public/Private
 */
export const getCompanyAssignments = async (req, res) => {
  try {
    const { company_id } = req.params;

    // Verificar que la empresa existe
    const company = await Company.findByPk(company_id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    // Obtener todos los dashboards de la empresa con sus usuarios asignados
    const dashboards = await Dashboard.findAll({
      where: { company_id, is_active: true },
      include: [{
        model: User,
        as: 'users',
        through: {
          attributes: []
        },
        where: { is_active: true, company_id },
        attributes: { exclude: ['password'] },
        required: false // LEFT JOIN para incluir dashboards sin usuarios asignados
      }],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        company: {
          id: company.id,
          name: company.name
        },
        dashboards: dashboards.map(dashboard => ({
          id: dashboard.id,
          name: dashboard.name,
          powerbi_report_id: dashboard.powerbi_report_id,
          users: dashboard.users || []
        }))
      }
    });
  } catch (error) {
    console.error('Error en getCompanyAssignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener asignaciones de la empresa',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/companies/:company_id/dashboards/:dashboard_id/assign-users
 * @desc    Asignar un dashboard a múltiples usuarios de la empresa
 * @access  Public/Private
 */
export const assignDashboardToCompanyUsers = async (req, res) => {
  try {
    const { company_id, dashboard_id } = req.params;
    const { user_ids } = req.body; // Array de user_ids

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'user_ids debe ser un array con al menos un elemento'
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

    // Verificar que el dashboard existe y pertenece a la empresa
    const dashboard = await Dashboard.findOne({
      where: { id: dashboard_id, company_id }
    });

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard no encontrado o no pertenece a esta empresa'
      });
    }

    // Verificar que todos los usuarios existen y pertenecen a la empresa
    const users = await User.findAll({
      where: {
        id: user_ids,
        company_id: company_id,
        is_active: true
      }
    });

    if (users.length !== user_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Uno o más usuarios no fueron encontrados o no pertenecen a esta empresa'
      });
    }

    const results = [];
    const skipped = [];
    const errors = [];

    for (const user_id of user_ids) {
      try {
        // Verificar si ya existe el permiso
        const existing = await UserDashboard.findOne({
          where: { user_id, dashboard_id }
        });

        if (existing) {
          skipped.push({
            user_id,
            reason: 'El usuario ya tiene acceso a este dashboard'
          });
          continue;
        }

        const userDashboard = await UserDashboard.create({
          user_id,
          dashboard_id
        });

        results.push(userDashboard);
      } catch (error) {
        errors.push({
          user_id,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Se asignó el dashboard a ${results.length} usuario(s) de la empresa`,
      data: {
        company: {
          id: company.id,
          name: company.name
        },
        dashboard: {
          id: dashboard.id,
          name: dashboard.name
        },
        assigned: results.length,
        skipped: skipped.length,
        errors: errors.length,
        details: {
          assigned_users: results.map(r => r.user_id),
          skipped_users: skipped,
          errors: errors.length > 0 ? errors : undefined
        }
      }
    });
  } catch (error) {
    console.error('Error en assignDashboardToCompanyUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar dashboard a usuarios de la empresa',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/companies/:company_id/users/:user_id/assign-dashboards
 * @desc    Asignar múltiples dashboards de la empresa a un usuario
 * @access  Public/Private
 */
export const assignCompanyDashboardsToUser = async (req, res) => {
  try {
    const { company_id, user_id } = req.params;
    const { dashboard_ids } = req.body; // Array de dashboard_ids

    if (!dashboard_ids || !Array.isArray(dashboard_ids) || dashboard_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'dashboard_ids debe ser un array con al menos un elemento'
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

    // Verificar que el usuario existe y pertenece a la empresa
    const user = await User.findOne({
      where: { id: user_id, company_id, is_active: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o no pertenece a esta empresa'
      });
    }

    // Verificar que todos los dashboards existen y pertenecen a la empresa
    const dashboards = await Dashboard.findAll({
      where: {
        id: dashboard_ids,
        company_id: company_id,
        is_active: true
      }
    });

    if (dashboards.length !== dashboard_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Uno o más dashboards no fueron encontrados o no pertenecen a esta empresa'
      });
    }

    const results = [];
    const skipped = [];
    const errors = [];

    for (const dashboard_id of dashboard_ids) {
      try {
        // Verificar si ya existe el permiso
        const existing = await UserDashboard.findOne({
          where: { user_id, dashboard_id }
        });

        if (existing) {
          skipped.push({
            dashboard_id,
            reason: 'El usuario ya tiene acceso a este dashboard'
          });
          continue;
        }

        const userDashboard = await UserDashboard.create({
          user_id,
          dashboard_id
        });

        results.push(userDashboard);
      } catch (error) {
        errors.push({
          dashboard_id,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Se asignaron ${results.length} dashboard(s) al usuario`,
      data: {
        company: {
          id: company.id,
          name: company.name
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        assigned: results.length,
        skipped: skipped.length,
        errors: errors.length,
        details: {
          assigned_dashboards: results.map(r => r.dashboard_id),
          skipped_dashboards: skipped,
          errors: errors.length > 0 ? errors : undefined
        }
      }
    });
  } catch (error) {
    console.error('Error en assignCompanyDashboardsToUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar dashboards al usuario',
      error: error.message
    });
  }
};

