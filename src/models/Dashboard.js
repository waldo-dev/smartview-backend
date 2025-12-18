import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Company from './Company.js';

const Dashboard = sequelize.define('dashboard', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Company,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  powerbi_report_id: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  powerbi_workspace_id: {
    type: DataTypes.STRING(100),
    allowNull: false
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
  tableName: 'dashboard',
  timestamps: false,
  underscored: true
});

// Relación con Company
Dashboard.belongsTo(Company, {
  foreignKey: 'company_id',
  as: 'company'
});

Company.hasMany(Dashboard, {
  foreignKey: 'company_id',
  as: 'dashboards'
});

export default Dashboard;

