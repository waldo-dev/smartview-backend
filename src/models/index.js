// Modelos de datos del proyecto
export { default as Company } from './Company.js';
export { default as User } from './User.js';
export { default as Dashboard } from './Dashboard.js';
export { default as UserDashboard } from './UserDashboard.js';

// Inicializar relaciones
import Company from './Company.js';
import User from './User.js';
import Dashboard from './Dashboard.js';
import UserDashboard from './UserDashboard.js';

// Relaciones belongsToMany (muchos a muchos a través de UserDashboard)
User.belongsToMany(Dashboard, {
  through: UserDashboard,
  foreignKey: 'user_id',
  otherKey: 'dashboard_id',
  as: 'dashboards'
});

Dashboard.belongsToMany(User, {
  through: UserDashboard,
  foreignKey: 'dashboard_id',
  otherKey: 'user_id',
  as: 'users'
});

// Relaciones directas con UserDashboard (hasMany y belongsTo)
User.hasMany(UserDashboard, {
  foreignKey: 'user_id',
  as: 'userDashboards'
});

Dashboard.hasMany(UserDashboard, {
  foreignKey: 'dashboard_id',
  as: 'userDashboards'
});

UserDashboard.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

UserDashboard.belongsTo(Dashboard, {
  foreignKey: 'dashboard_id',
  as: 'dashboard'
});

