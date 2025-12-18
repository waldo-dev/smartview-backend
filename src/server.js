import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import sequelize from './config/database.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API smartview funcionando correctamente',
    version: '1.0.0'
  });
});

// Ruta de health check
app.get('/health', async (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    checks: {
      server: {
        status: 'OK',
        message: 'Server is running'
      },
      database: {
        status: 'unknown',
        message: 'Checking...'
      },
      powerbi: {
        status: 'unknown',
        message: 'Not checked',
        configured: false
      }
    }
  };

  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    healthStatus.checks.database = {
      status: 'OK',
      message: 'Database connection successful'
    };
  } catch (error) {
    healthStatus.checks.database = {
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message
    };
    healthStatus.status = 'DEGRADED';
  }

  // Verificar configuración de Power BI (sin hacer conexión real)
  try {
    const powerBiService = (await import('./services/powerBiService.js')).default;
    healthStatus.checks.powerbi.configured = powerBiService.isConfigured();
    if (healthStatus.checks.powerbi.configured) {
      healthStatus.checks.powerbi.status = 'CONFIGURED';
      healthStatus.checks.powerbi.message = 'Power BI service is configured';
    } else {
      healthStatus.checks.powerbi.status = 'NOT_CONFIGURED';
      healthStatus.checks.powerbi.message = 'Power BI service is not configured';
    }
  } catch (error) {
    healthStatus.checks.powerbi.status = 'ERROR';
    healthStatus.checks.powerbi.message = 'Error checking Power BI configuration';
  }

  // Determinar código de estado HTTP
  const httpStatus = healthStatus.status === 'OK' ? 200 : 
                     healthStatus.status === 'DEGRADED' ? 200 : 503;

  res.status(httpStatus).json(healthStatus);
});

// Ruta de login (para redirección del frontend)
app.get('/login', (req, res) => {
  res.json({ 
    message: 'Por favor, usa el endpoint POST /api/auth/login para autenticarte',
    loginEndpoint: '/api/auth/login'
  });
});

// Rutas de la API
app.use('/api', routes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicializar base de datos y servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente');

    // Sincronizar modelos (solo en desarrollo)
    // En producción, usar migraciones
    if (process.env.NODE_ENV !== 'production') {
      // await sequelize.sync({ alter: true });
      // console.log('✅ Modelos sincronizados con la base de datos');
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

