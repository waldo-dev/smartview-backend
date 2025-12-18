import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Company from './Company.js';

const User = sequelize.define('user', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Company,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  role_id: {
    type: DataTypes.STRING(20),
    defaultValue: 'user'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'createdAt',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user',
  timestamps: false,
  underscored: true
});

// Relación con Company
User.belongsTo(Company, {
  foreignKey: 'company_id',
  as: 'company'
});

Company.hasMany(User, {
  foreignKey: 'company_id',
  as: 'users'
});

export default User;

