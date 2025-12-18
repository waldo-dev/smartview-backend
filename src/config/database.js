import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Configurar logging personalizado para detectar DELETE
const logging = process.env.NODE_ENV === 'development' 
  ? (query) => {
      // Loggear especialmente las operaciones DELETE
      if (query.includes('DELETE') || query.includes('delete')) {
        console.warn(`⚠️ [DELETE QUERY] ${new Date().toISOString()}:`, query);
      } else {
        console.log(query);
      }
    }
  : false;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: logging,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export default sequelize;


