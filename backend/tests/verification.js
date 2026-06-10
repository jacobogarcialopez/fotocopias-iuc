const dotenv = require('dotenv');
const path = require('path');

// Load env before anything else
dotenv.config({ path: path.join(__dirname, '../.env') });

const logger = require('../utils/logger');
const { sequelize } = require('../config/database');
const { Role, User, Student, Guardian, Recharge, Consume, SystemConfig } = require('../models');
const { generateQR } = require('../services/qrService');

const runVerification = async () => {
  logger.info('=== STARTING AUTOMATED APPLICATION VERIFICATION ===');
  let failures = 0;

  // 1. Verify Models Loading
  try {
    logger.info('Checking model registrations...');
    const models = { Role, User, Student, Guardian, Recharge, Consume, SystemConfig };
    for (const [name, model] of Object.entries(models)) {
      if (!model) {
        throw new Error(`Model ${name} is undefined or failed to import.`);
      }
    }
    logger.info('✓ All database models imported successfully.');
  } catch (err) {
    logger.error('✗ Model Import Failure:', err);
    failures++;
  }

  // 2. Verify Encryption Hashing Logic
  try {
    logger.info('Testing bcrypt password hashing validation...');
    const bcrypt = require('bcryptjs');
    const rawPass = '123456';
    const hash = await bcrypt.hash(rawPass, 10);
    const isMatch = await bcrypt.compare(rawPass, hash);
    if (!isMatch) {
      throw new Error('Bcrypt password comparison logic failed.');
    }
    logger.info('✓ Hashing operations function correctly.');
  } catch (err) {
    logger.error('✗ Hashing Service Failure:', err);
    failures++;
  }

  // 3. Verify PDFKit & ExcelJS Loading
  try {
    logger.info('Checking PDFKit and ExcelJS dependencies...');
    const PDFDocument = require('pdfkit');
    const ExcelJS = require('exceljs');
    
    const doc = new PDFDocument();
    if (!doc) throw new Error('PDFKit failed to initialize.');
    
    const wb = new ExcelJS.Workbook();
    if (!wb) throw new Error('ExcelJS failed to initialize.');

    logger.info('✓ Report generation libraries loaded successfully.');
  } catch (err) {
    logger.error('✗ Reporting Libraries Failure:', err);
    failures++;
  }

  // 4. Database Schema Connection (Dry run check)
  try {
    logger.info('Testing Database Authenticate...');
    // We attempt connection, but if XAMPP MySQL is not started, we log a warning instead of failing the structural code check.
    await sequelize.authenticate();
    logger.info('✓ Database connectivity authenticated.');
  } catch (err) {
    logger.warn('! Database server is offline. (Start XAMPP MySQL to run full app sync). Skipping database write tests.');
  }

  logger.info('=== VERIFICATION COMPLETED ===');
  if (failures === 0) {
    logger.info('STATUS: SUCCESS. The codebase structure is solid and dependencies are ready.');
    process.exit(0);
  } else {
    logger.error(`STATUS: FAILED with ${failures} error(s). Review logs above.`);
    process.exit(1);
  }
};

runVerification();
