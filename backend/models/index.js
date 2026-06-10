const { sequelize } = require('../config/database');
const Role = require('./role');
const User = require('./user');
const Student = require('./student');
const Guardian = require('./guardian');
const GuardianStudent = require('./guardianStudent');
const Recharge = require('./recharge');
const Consume = require('./consume');
const QrToken = require('./qrToken');
const Notification = require('./notification');
const Audit = require('./audit');
const SystemConfig = require('./systemConfig');

// 1. Roles & Users
Role.hasMany(User, { foreignKey: 'rol_id', as: 'usuarios' });
User.belongsTo(Role, { foreignKey: 'rol_id', as: 'rol' });

// 2. User & Student (One-to-One)
User.hasOne(Student, { foreignKey: 'usuario_id', as: 'estudiante' });
Student.belongsTo(User, { foreignKey: 'usuario_id', as: 'usuario' });

// 3. User & Guardian (One-to-One)
User.hasOne(Guardian, { foreignKey: 'usuario_id', as: 'acudiente' });
Guardian.belongsTo(User, { foreignKey: 'usuario_id', as: 'usuario' });

// 4. Guardian & Student (Many-to-Many through Relacion_Acudientes)
Guardian.belongsToMany(Student, { 
  through: GuardianStudent, 
  foreignKey: 'acudiente_id', 
  otherKey: 'estudiante_id', 
  as: 'estudiantes' 
});
Student.belongsToMany(Guardian, { 
  through: GuardianStudent, 
  foreignKey: 'estudiante_id', 
  otherKey: 'acudiente_id', 
  as: 'acudientes' 
});

// For direct queries on Relacion_Acudientes
GuardianStudent.belongsTo(Guardian, { foreignKey: 'acudiente_id', as: 'acudiente' });
GuardianStudent.belongsTo(Student, { foreignKey: 'estudiante_id', as: 'estudiante' });
Guardian.hasMany(GuardianStudent, { foreignKey: 'acudiente_id', as: 'relaciones' });
Student.hasMany(GuardianStudent, { foreignKey: 'estudiante_id', as: 'relaciones' });

// 5. Student & Recharges
Student.hasMany(Recharge, { foreignKey: 'estudiante_id', as: 'recargas' });
Recharge.belongsTo(Student, { foreignKey: 'estudiante_id', as: 'estudiante' });

// 6. Student & Consumes
Student.hasMany(Consume, { foreignKey: 'estudiante_id', as: 'consumos' });
Consume.belongsTo(Student, { foreignKey: 'estudiante_id', as: 'estudiante' });

// 7. Student & QrTokens
Student.hasMany(QrToken, { foreignKey: 'estudiante_id', as: 'qrTokens' });
QrToken.belongsTo(Student, { foreignKey: 'estudiante_id', as: 'estudiante' });

// 8. User & Notifications
User.hasMany(Notification, { foreignKey: 'usuario_id', as: 'notificaciones' });
Notification.belongsTo(User, { foreignKey: 'usuario_id', as: 'usuario' });

// 9. User & Audits
User.hasMany(Audit, { foreignKey: 'usuario_id', as: 'auditorias' });
Audit.belongsTo(User, { foreignKey: 'usuario_id', as: 'usuario' });

// 10. User & Recharges (Who registered it)
User.hasMany(Recharge, { foreignKey: 'usuario_registra_id', as: 'recargasRegistradas' });
Recharge.belongsTo(User, { foreignKey: 'usuario_registra_id', as: 'usuarioRegistra' });

// 11. User & Consumes (Who registered it)
User.hasMany(Consume, { foreignKey: 'usuario_registra_id', as: 'consumosRegistrados' });
Consume.belongsTo(User, { foreignKey: 'usuario_registra_id', as: 'usuarioRegistra' });

module.exports = {
  sequelize,
  Role,
  User,
  Student,
  Guardian,
  GuardianStudent,
  Recharge,
  Consume,
  QrToken,
  Notification,
  Audit,
  SystemConfig
};
