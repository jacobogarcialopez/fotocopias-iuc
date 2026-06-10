const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Recharge = sequelize.define('Recargas', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  estudiante_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  comprobante_pdf: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  usuario_registra_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Recargas'
});

module.exports = Recharge;
