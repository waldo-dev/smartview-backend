import { Company, User, Dashboard } from '../models/index.js';
import { logDelete, logCascadeDelete } from '../utils/dbLogger.js';

/**
 * @route   GET /api/companies/:company_id/users
 * @desc    Obtener todos los usuarios de una empresa específica
 * @access  Public/Private
 */
export const getUsersByCompany = async (req, res) => {
  try {
    const { company_id } = req.params;
    const { is_active, role_id } = req.query;

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
    if (role_id) {
      where.role_id = role_id;
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
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
        users
      }
    });
  } catch (error) {
    console.error('Error en getUsersByCompany:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios de la empresa',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/companies
 * @desc    Obtener todas las empresas
 * @access  Public/Private (ajustar según necesidad)
 */
export const getAllCompanies = async (req, res) => {
  try {
    const { is_active } = req.query;
    const sequelize = Company.sequelize;
    
    // Diagnosticar: verificar conexión y schema actual
    const [currentDb] = await sequelize.query(`SELECT current_database() as db, current_schema() as schema`);
    console.log(`🔍 Base de datos actual: ${currentDb[0]?.db}`);
    console.log(`🔍 Schema actual: ${currentDb[0]?.schema}`);
    
    // Verificar si la tabla existe
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'company'
      ) as exists
    `);
    console.log(`🔍 Tabla public.company existe: ${tableExists[0]?.exists}`);
    
    // Query SQL directa para verificar datos reales - usar schema explícito
    const [rawData] = await sequelize.query(`
      SELECT id, name, industry, is_active, 
             COALESCE("createdAt") as "createdAt"
      FROM company
    `);
    
    // También verificar con COUNT
    const [countResult] = await sequelize.query(`SELECT COUNT(*) as total FROM company`);
    const totalCount = parseInt(countResult[0]?.total || 0);
    
    console.log(`📊 Query SQL directa (public.company) - Registros encontrados: ${rawData.length}`);
    console.log(`📊 COUNT directo: ${totalCount}`);
    
    if (rawData.length > 0) {
      console.log('📋 Primer registro:', rawData[0]);
      console.log('📋 Columnas disponibles:', Object.keys(rawData[0]));
    } else if (totalCount > 0) {
      console.warn(`⚠️ COUNT dice que hay ${totalCount} registros pero SELECT no los trae`);
      // Intentar traer todos sin límite
      const [allData] = await sequelize.query(`SELECT * FROM company LIMIT 5`);
      console.log(`📊 Query SELECT * trajo: ${allData.length} registros`);
      if (allData.length > 0) {
        console.log('📋 Primer registro completo:', allData[0]);
      }
    } else {
      // Si COUNT también es 0, realmente no hay datos
      console.warn('⚠️ No se encontraron registros en la tabla public.company');
      // Verificar todas las tablas en public
      const [allTables] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      console.log('📋 Tablas disponibles en public:', allTables.map(t => t.table_name).join(', '));
    }
    
    const where = {};
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    // Query con Sequelize
    const companies = await Company.findAll({
      where
    });
    
    console.log(`📊 Sequelize - Registros encontrados: ${companies.length}`);
    
    // Si hay datos en raw pero no en Sequelize, puede ser problema de mapeo
    if (rawData.length > 0 && companies.length === 0) {
      console.warn('⚠️ PROBLEMA DE MAPEO: Hay datos en BD pero Sequelize no los encuentra');
      console.warn('⚠️ Posible causa: Mapeo incorrecto de columnas entre modelo y BD');
      
      // Retornar datos raw como fallback
      return res.status(200).json({
        success: true,
        data: rawData,
        warning: 'Datos obtenidos mediante query SQL directa (problema de mapeo detectado)'
      });
    }

    // Ordenar por createdAt si existe
    if (companies.length > 0) {
      companies.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.dataValues?.createdAt || 0);
        const dateB = new Date(b.createdAt || b.dataValues?.createdAt || 0);
        return dateB - dateA;
      });
    }

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
      await company.destroy();
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


