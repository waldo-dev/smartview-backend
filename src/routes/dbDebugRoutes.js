import express from 'express';
import sequelize from '../config/database.js';

const router = express.Router();

/**
 * @route   GET /api/debug/db-info
 * @desc    Información de debug de la base de datos
 * @access  Public (solo para desarrollo)
 */
router.get('/db-info', async (req, res) => {
  try {
    // Información de conexión
    const config = sequelize.config;
    const dbInfo = {
      database: config.database,
      host: config.host,
      port: config.port,
      username: config.username,
      dialect: config.dialect
    };

    // Verificar tablas existentes
    const [tables] = await sequelize.query(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    // Contar registros en cada tabla
    const tableCounts = {};
    for (const table of tables) {
      try {
        const [count] = await sequelize.query(`SELECT COUNT(*) as total FROM ${table.table_name}`);
        tableCounts[table.table_name] = count[0]?.total || 0;
      } catch (err) {
        tableCounts[table.table_name] = `Error: ${err.message}`;
      }
    }

    // Ver estructura de tabla company si existe
    let companyStructure = null;
    if (tables.some(t => t.table_name === 'company')) {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'company' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      companyStructure = columns;

      // Ver todos los registros de company
      const [companyData] = await sequelize.query('SELECT * FROM company');
      tableCounts['company_data'] = companyData;
    }

    res.status(200).json({
      success: true,
      data: {
        connection: dbInfo,
        tables: tables.map(t => t.table_name),
        tableCounts,
        companyStructure,
        note: 'Verifica que estés conectado a la base de datos correcta'
      }
    });
  } catch (error) {
    console.error('Error en db-info:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información de la base de datos',
      error: error.message
    });
  }
});

export default router;

