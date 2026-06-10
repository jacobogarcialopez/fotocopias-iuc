const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GuardianStudent = sequelize.define('Relacion_Acudientes', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  acudiente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estudiante_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Relacion_Acudientes'
});

module.exports = GuardianStudent;
