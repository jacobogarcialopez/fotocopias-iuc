const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('Usuarios', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  contrasena_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(20),
    defaultValue: 'activo'
  }
}, {
  tableName: 'Usuarios',
  hooks: {
    beforeCreate: async (user) => {
      if (user.contrasena_hash && !user.contrasena_hash.startsWith('$2a$') && !user.contrasena_hash.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.contrasena_hash = await bcrypt.hash(user.contrasena_hash, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('contrasena_hash') && !user.contrasena_hash.startsWith('$2a$') && !user.contrasena_hash.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.contrasena_hash = await bcrypt.hash(user.contrasena_hash, salt);
      }
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.contrasena_hash);
};

module.exports = User;
