const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Guardian = sequelize.define('Acudientes', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: false
  }
}, {
  tableName: 'Acudientes'
});

module.exports = Guardian;
