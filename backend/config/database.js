const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

// Load environment variables
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'fotocopias_iuc',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: false, // Disabling default timestamps since schema uses custom datetime columns
      freezeTableName: true // Schema defines explicit table names
    }
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully with Sequelize.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
};
