import powerBiService from '../services/powerBiService.js';
import { Dashboard, Company } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * @route   GET /api/powerbi/dashboards
 * @desc    Obtener lista de dashboards de Power BI
 * @access  Public/Private
 */
export const getDashboards = async (req, res) => {
  try {
    // Verificar que el servicio esté configurado
    if (!powerBiService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Power BI no está configurado. Verifica las variables de entorno.'
      });
    }

    const dashboards = await powerBiService.getDashboards();

    res.status(200).json({
      success: true,
      data: {
        dashboards
      }
    });
  } catch (error) {
    console.error('Error en getDashboards:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboards de Power BI',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/powerbi/dashboards/:id
 * @desc    Obtener información de un dashboard específico
 * @access  Public/Private
 */
export const getDashboardById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID del dashboard es requerido'
      });
    }

    // Verificar que el servicio esté configurado
    if (!powerBiService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Power BI no está configurado. Verifica las variables de entorno.'
      });
    }

    const dashboard = await powerBiService.getDashboardById(id);

    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error en getDashboardById:', error);
    
    if (error.message.includes('404') || error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboard de Power BI',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/powerbi/dashboards/:id/embed-token
 * @desc    Obtener embed token para un dashboard
 * @access  Public/Private
 */
export const getEmbedToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { accessLevel } = req.query; // 'View' o 'Edit'

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID del dashboard es requerido'
      });
    }

    // Verificar que el servicio esté configurado
    if (!powerBiService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Power BI no está configurado. Verifica las variables de entorno.'
      });
    }

    const validAccessLevels = ['View', 'Edit'];
    const finalAccessLevel = validAccessLevels.includes(accessLevel) ? accessLevel : 'View';

    const embedTokenData = await powerBiService.generateEmbedToken(id, finalAccessLevel);

    res.status(200).json({
      success: true,
      data: embedTokenData
    });
  } catch (error) {
    console.error('Error en getEmbedToken:', error);
    
    if (error.message.includes('404') || error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al generar embed token',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/powerbi/workspaces
 * @desc    Obtener lista de workspaces disponibles en Power BI
 * @access  Public/Private
 */
export const getWorkspaces = async (req, res) => {
  try {
    // Verificar que el servicio esté configurado
    if (!powerBiService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Power BI no está configurado. Verifica las variables de entorno.'
      });
    }

    const workspaces = await powerBiService.getWorkspaces();

    res.status(200).json({
      success: true,
      data: {
        workspaces
      }
    });
  } catch (error) {
    console.error('Error en getWorkspaces:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener workspaces de Power BI',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/powerbi/dashboards/sync
 * @desc    Sincronizar dashboards de Power BI con la base de datos
 * @access  Public/Private
 */
export const syncDashboards = async (req, res) => {
  try {
    const { company_id, update_existing } = req.body;

    // Verificar que el servicio esté configurado
    if (!powerBiService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Power BI no está configurado. Verifica las variables de entorno.'
      });
    }

    // Si se proporciona company_id, verificar que existe y está activa
    let company = null;
    if (company_id) {
      company = await Company.findByPk(company_id);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Empresa no encontrada'
        });
      }
      if (!company.is_active) {
        return res.status(400).json({
          success: false,
          message: 'No se pueden sincronizar dashboards para una empresa inactiva'
        });
      }
    }

    // Obtener dashboards de Power BI
    const powerBiDashboards = await powerBiService.getDashboards();
    
    if (!powerBiDashboards || powerBiDashboards.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No se encontraron dashboards en Power BI',
        data: {
          created: 0,
          updated: 0,
          skipped: 0,
          dashboards: []
        }
      });
    }

    const workspaceId = powerBiService.workspaceId;
    const created = [];
    const updated = [];
    const skipped = [];

    // Procesar cada dashboard
    for (const pbDashboard of powerBiDashboards) {
      try {
        // Buscar si ya existe en la BD usando powerbi_report_id
        const existingDashboard = await Dashboard.findOne({
          where: {
            powerbi_report_id: pbDashboard.id,
            powerbi_workspace_id: workspaceId
          }
        });

        if (existingDashboard) {
          // Si existe, decidir si actualizarlo
          if (update_existing === true) {
            // Actualizar información del dashboard existente
            const updateData = {
              name: pbDashboard.name
            };
            // Solo actualizar company_id si se proporciona en la solicitud
            if (company_id) {
              updateData.company_id = company_id;
            }
            await existingDashboard.update(updateData);
            updated.push({
              id: existingDashboard.id,
              name: existingDashboard.name,
              powerbi_report_id: existingDashboard.powerbi_report_id
            });
          } else {
            skipped.push({
              id: existingDashboard.id,
              name: existingDashboard.name,
              powerbi_report_id: existingDashboard.powerbi_report_id,
              reason: 'Ya existe en la base de datos'
            });
          }
        } else {
          // Si no existe y se requiere company_id, verificar que se haya proporcionado
          if (!company_id) {
            skipped.push({
              name: pbDashboard.name,
              powerbi_report_id: pbDashboard.id,
              reason: 'company_id es requerido para crear nuevos dashboards'
            });
            continue;
          }

          // Crear nuevo dashboard
          const newDashboard = await Dashboard.create({
            name: pbDashboard.name,
            description: null,
            company_id: company_id,
            powerbi_report_id: pbDashboard.id,
            powerbi_workspace_id: workspaceId,
            is_active: true
          });

          created.push({
            id: newDashboard.id,
            name: newDashboard.name,
            powerbi_report_id: newDashboard.powerbi_report_id,
            company_id: newDashboard.company_id
          });
        }
      } catch (error) {
        console.error(`Error procesando dashboard ${pbDashboard.id}:`, error);
        skipped.push({
          name: pbDashboard.name,
          powerbi_report_id: pbDashboard.id,
          reason: `Error: ${error.message}`
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Sincronización completada. ${created.length} creados, ${updated.length} actualizados, ${skipped.length} omitidos`,
      data: {
        created: created.length,
        updated: updated.length,
        skipped: skipped.length,
        created_dashboards: created,
        updated_dashboards: updated,
        skipped_dashboards: skipped,
        company: company ? {
          id: company.id,
          name: company.name
        } : null
      }
    });
  } catch (error) {
    console.error('Error en syncDashboards:', error);
    res.status(500).json({
      success: false,
      message: 'Error al sincronizar dashboards',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/powerbi/dashboards/sync/:company_id
 * @desc    Sincronizar dashboards de Power BI para una empresa específica
 * @desc    Busca un workspace en Power BI con el nombre de la empresa y sincroniza sus reportes
 * @access  Public/Private
 */
export const syncDashboardsForCompany = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { update_existing, exact_match } = req.query;

    // Verificar que el servicio esté configurado
    if (!powerBiService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Power BI no está configurado. Verifica las variables de entorno.'
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
        message: 'No se pueden sincronizar dashboards para una empresa inactiva'
      });
    }

    // Buscar workspace en Power BI por nombre de empresa
    const exactMatch = exact_match !== 'false'; // Por defecto true
    let workspaceData;
    
    try {
      workspaceData = await powerBiService.getDashboardsByCompanyName(company.name, exactMatch);
    } catch (error) {
      // Si no encuentra el workspace, intentar búsqueda parcial si estaba en exacto
      if (exactMatch && error.message.includes('No se encontró')) {
        console.log(`⚠️ No se encontró workspace exacto para "${company.name}", intentando búsqueda parcial...`);
        try {
          workspaceData = await powerBiService.getDashboardsByCompanyName(company.name, false);
        } catch (partialError) {
          return res.status(404).json({
            success: false,
            message: `No se encontró ningún workspace en Power BI con el nombre "${company.name}"`,
            error: partialError.message
          });
        }
      } else {
        throw error;
      }
    }

    const { workspace, dashboards: powerBiDashboards } = workspaceData;

    if (!powerBiDashboards || powerBiDashboards.length === 0) {
      return res.status(200).json({
        success: true,
        message: `Workspace "${workspace.name}" encontrado pero no contiene reportes`,
        data: {
          created: 0,
          updated: 0,
          skipped: 0,
          workspace: {
            id: workspace.id,
            name: workspace.name
          },
          dashboards: []
        }
      });
    }

    const created = [];
    const updated = [];
    const skipped = [];

    // Procesar cada dashboard
    for (const pbDashboard of powerBiDashboards) {
      try {
        // Buscar si ya existe en la BD usando powerbi_report_id
        const existingDashboard = await Dashboard.findOne({
          where: {
            powerbi_report_id: pbDashboard.id,
            powerbi_workspace_id: workspace.id
          }
        });

        if (existingDashboard) {
          // Si existe, decidir si actualizarlo
          if (update_existing === 'true') {
            // Actualizar información del dashboard existente
            const updateData = {
              name: pbDashboard.name,
              company_id: company_id // Asegurar que esté asociado a la empresa correcta
            };
            await existingDashboard.update(updateData);
            updated.push({
              id: existingDashboard.id,
              name: existingDashboard.name,
              powerbi_report_id: existingDashboard.powerbi_report_id
            });
          } else {
            skipped.push({
              id: existingDashboard.id,
              name: existingDashboard.name,
              powerbi_report_id: existingDashboard.powerbi_report_id,
              reason: 'Ya existe en la base de datos'
            });
          }
        } else {
          // Crear nuevo dashboard
          const newDashboard = await Dashboard.create({
            name: pbDashboard.name,
            description: null,
            company_id: company_id,
            powerbi_report_id: pbDashboard.id,
            powerbi_workspace_id: workspace.id,
            is_active: true
          });

          created.push({
            id: newDashboard.id,
            name: newDashboard.name,
            powerbi_report_id: newDashboard.powerbi_report_id,
            company_id: newDashboard.company_id
          });
        }
      } catch (error) {
        console.error(`Error procesando dashboard ${pbDashboard.id}:`, error);
        skipped.push({
          name: pbDashboard.name,
          powerbi_report_id: pbDashboard.id,
          reason: `Error: ${error.message}`
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Sincronización completada desde workspace "${workspace.name}". ${created.length} creados, ${updated.length} actualizados, ${skipped.length} omitidos`,
      data: {
        created: created.length,
        updated: updated.length,
        skipped: skipped.length,
        created_dashboards: created,
        updated_dashboards: updated,
        skipped_dashboards: skipped,
        workspace: {
          id: workspace.id,
          name: workspace.name
        },
        company: {
          id: company.id,
          name: company.name
        }
      }
    });
  } catch (error) {
    console.error('Error en syncDashboardsForCompany:', error);
    res.status(500).json({
      success: false,
      message: 'Error al sincronizar dashboards para la empresa',
      error: error.message
    });
  }
};



