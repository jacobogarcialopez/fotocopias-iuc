const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Consume = sequelize.define('Consumos', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  estudiante_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cantidad_copias: {
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
  usuario_registra_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Consumos'
});

module.exports = Consume;
