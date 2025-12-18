import { User, Company } from '../models/index.js';
import bcrypt from 'bcrypt';

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios
 * @access  Public/Private
 */
export const getAllUsers = async (req, res) => {
  try {
    const { company_id, is_active, role_id } = req.query;

    const where = {};
    if (company_id) where.company_id = company_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (role_id) where.role_id = role_id;

    const users = await User.findAll({
      where,
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'industry']
      }],
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Obtener un usuario por ID
 * @access  Public/Private
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'industry']
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error en getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/users
 * @desc    Crear un nuevo usuario
 * @access  Public/Private
 * 
 * @body    {string} email - Email del usuario (requerido, único)
 * @body    {string} password - Contraseña del usuario (requerido, mínimo 6 caracteres)
 * @body    {string} [name] - Nombre del usuario (opcional)
 * @body    {string} [company_id] - UUID de la empresa asociada (opcional)
 * @body    {string} [role_id] - Rol del usuario: 'admin' o 'user' (default: 'user')
 * @body    {boolean} [is_active] - Estado activo del usuario (default: true)
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password: pass, company_id, role_id, is_active } = req.body;

    // Validaciones básicas
    if (!email || !pass) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del email no es válido'
      });
    }

    // Validar longitud mínima de contraseña
    if (pass.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está en uso'
      });
    }

    // Si se proporciona company_id, verificar que la empresa existe
    if (company_id) {
      const company = await Company.findByPk(company_id);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'La empresa especificada no existe'
        });
      }
    }

    // Validar role_id
    const validRoles = [1, 2];
    const finalRoleId = role_id || 'user';
    if (!validRoles.includes(finalRoleId)) {
      return res.status(400).json({
        success: false,
        message: `role_id debe ser uno de: ${validRoles.join(', ')}`
      });
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const password = await bcrypt.hash(pass, saltRounds);

    // Crear el usuario
    const user = await User.create({
      name: name || null,
      email,
      password,
      company_id: company_id || null,
      role_id: finalRoleId,
      is_active: is_active !== undefined ? is_active : true
    });

    // Obtener el usuario con la relación de empresa incluida
    const userWithCompany = await User.findByPk(user.id, {
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'industry']
      }],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: userWithCompany
    });
  } catch (error) {
    console.error('Error en createUser:', error);
    
    // Manejar errores específicos de la base de datos
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'El email ya está en uso'
      });
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'La empresa especificada no es válida'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
};

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar un usuario
 * @access  Public/Private
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, company_id, role_id, is_active } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si el email ya existe en otro usuario
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (company_id !== undefined) updateData.company_id = company_id;
    if (role_id !== undefined) updateData.role_id = role_id;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Si se proporciona una nueva contraseña, hashearla
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    await user.update(updateData);

    // Excluir password_hash de la respuesta
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: userResponse
    });
  } catch (error) {
    console.error('Error en updateUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Eliminar un usuario
 * @access  Public/Private
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (hard === 'true') {
      await user.destroy();
      return res.status(200).json({
        success: true,
        message: 'Usuario eliminado permanentemente'
      });
    } else {
      // Soft delete
      await user.update({ is_active: false });
      const userResponse = user.toJSON();
      delete userResponse.password;
      return res.status(200).json({
        success: true,
        message: 'Usuario desactivado exitosamente',
        data: userResponse
      });
    }
  } catch (error) {
    console.error('Error en deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

