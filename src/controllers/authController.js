// Controlador de autenticación
import { User } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Usuario desactivado'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role_id: user.role_id,
        company_id: user.company_id
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Excluir password de la respuesta
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userResponse,
        token: token
      }
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
    const { email, password, name, company_id, role_id } = req.body;

    // Validar datos de entrada
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña y nombre son requeridos'
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El usuario ya existe'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      company_id: company_id || null,
      role_id: role_id || 'user',
      is_active: true
    });

    // Generar token JWT
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role_id: user.role_id,
        company_id: user.company_id
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Excluir password de la respuesta
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: userResponse,
        token: token
      }
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
 * @route   GET /api/auth/verify
 * @desc    Verificar si un token JWT es válido
 * @access  Public (pero requiere token)
 */
export const verify = async (req, res) => {
  try {
    // Obtener el token del header Authorization o del body
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }
    
    // Si no está en el header, intentar obtenerlo del body
    if (!token && req.body?.token) {
      token = req.body.token;
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Token no proporcionado'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';

    try {
      // Verificar y decodificar el token
      const decoded = jwt.verify(token, jwtSecret);

      // Verificar que el usuario existe y está activo
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(200).json({
          success: true,
          valid: false,
          message: 'Usuario no encontrado'
        });
      }

      if (!user.is_active) {
        return res.status(200).json({
          success: true,
          valid: false,
          message: 'Usuario desactivado'
        });
      }

      // Token válido y usuario activo
      const userResponse = user.toJSON();
      
      return res.status(200).json({
        success: true,
        valid: true,
        message: 'Token válido',
        data: {
          user: userResponse,
          expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null
        }
      });

    } catch (jwtError) {
      // El token es inválido o expiró
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(200).json({
          success: true,
          valid: false,
          message: 'Token expirado',
          expired: true
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(200).json({
          success: true,
          valid: false,
          message: 'Token inválido'
        });
      }

      throw jwtError;
    }

  } catch (error) {
    console.error('Error en verify:', error);
    return res.status(500).json({
      success: false,
      valid: false,
      message: 'Error al verificar token',
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
    // El usuario viene del middleware de autenticación
    // Si no hay usuario, el middleware ya habrá respondido con error
    const userResponse = req.user.toJSON();

    res.status(200).json({
      success: true,
      data: {
        user: userResponse
      }
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

