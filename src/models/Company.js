import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Company = sequelize.define('company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  industry: {
    type: DataTypes.STRING(),
    allowNull: true
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
  tableName: 'company',
  timestamps: false,
  underscored: true
});

export default Company;

