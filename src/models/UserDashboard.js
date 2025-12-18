import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserDashboard = sequelize.define('user_dashboard', {
  user_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false
  },
  dashboard_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false
  }
}, {
  tableName: 'user_dashboard',
  timestamps: false,
  underscored: true
});

export default UserDashboard;

