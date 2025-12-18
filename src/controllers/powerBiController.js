import powerBiService from '../services/powerBiService.js';

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

