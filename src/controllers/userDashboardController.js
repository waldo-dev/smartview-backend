import { UserDashboard, User, Dashboard } from '../models/index.js';

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
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el dashboard existe
    const dashboard = await Dashboard.findByPk(dashboard_id);
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard no encontrado'
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
      data: userDashboard
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
      data: results,
      errors: errors.length > 0 ? errors : undefined
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

