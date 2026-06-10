const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemConfig = sequelize.define('Configuracion_Sistema', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  clave: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  valor: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'Configuracion_Sistema'
});

module.exports = SystemConfig;
