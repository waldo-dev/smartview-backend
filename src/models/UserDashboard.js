import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Dashboard from './Dashboard.js';

const UserDashboard = sequelize.define('user_dashboard', {
  user_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'RESTRICT'
  },
  dashboard_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    references: {
      model: Dashboard,
      key: 'id'
    },
    onDelete: 'RESTRICT'
  }
}, {
  tableName: 'user_dashboard',
  timestamps: false,
  underscored: true
});

export default UserDashboard;

