// Controlador de autenticación
// TODO: Importar modelos de Sequelize cuando estén disponibles

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión de usuario
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar datos de entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // TODO: Integrar con Sequelize
    // Ejemplo de cómo podría verse:
    // const user = await User.findOne({ where: { email } });
    // if (!user) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Credenciales inválidas'
    //   });
    // }
    // 
    // const isValidPassword = await bcrypt.compare(password, user.password);
    // if (!isValidPassword) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Credenciales inválidas'
    //   });
    // }
    //
    // const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    //   expiresIn: '24h'
    // });

    // Respuesta temporal hasta integrar Sequelize
    res.status(501).json({
      success: false,
      message: 'Funcionalidad en desarrollo. Pendiente integración con Sequelize'
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validar datos de entrada
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña y nombre son requeridos'
      });
    }

    // TODO: Integrar con Sequelize
    // Ejemplo de cómo podría verse:
    // const existingUser = await User.findOne({ where: { email } });
    // if (existingUser) {
    //   return res.status(409).json({
    //     success: false,
    //     message: 'El usuario ya existe'
    //   });
    // }
    //
    // const hashedPassword = await bcrypt.hash(password, 10);
    // const user = await User.create({
    //   email,
    //   password: hashedPassword,
    //   name
    // });
    //
    // const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    //   expiresIn: '24h'
    // });
    //
    // res.status(201).json({
    //   success: true,
    //   message: 'Usuario registrado exitosamente',
    //   data: {
    //     user: {
    //       id: user.id,
    //       email: user.email,
    //       name: user.name
    //     },
    //     token
    //   }
    // });

    // Respuesta temporal hasta integrar Sequelize
    res.status(501).json({
      success: false,
      message: 'Funcionalidad en desarrollo. Pendiente integración con Sequelize'
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    // TODO: Implementar middleware de autenticación
    // El usuario vendrá en req.user después de validar el token

    // Respuesta temporal hasta integrar autenticación
    res.status(501).json({
      success: false,
      message: 'Funcionalidad en desarrollo. Pendiente integración con autenticación'
    });

  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

