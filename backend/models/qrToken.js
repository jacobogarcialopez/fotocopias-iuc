const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QrToken = sequelize.define('Qr_Tokens', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  estudiante_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_expiracion: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'Qr_Tokens'
});

module.exports = QrToken;
