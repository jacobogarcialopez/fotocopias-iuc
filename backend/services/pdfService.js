const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const UPLOADS_DIR = path.join(__dirname, '../uploads/comprobantes');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Format currency
const formatCOP = (value) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};

const generateRechargePDF = (recharge, student, user, adminUser) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A6' }); // Small size receipt
      const filename = `comprobante_${recharge.id}_${Date.now()}.pdf`;
      const filePath = path.join(UPLOADS_DIR, filename);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // --- Header: Institutional Style ---
      doc.rect(0, 0, doc.page.width, 15).fill('#1b5e20'); // Dark Green Banner
      doc.rect(0, 15, doc.page.width, 5).fill('#b59410'); // Gold Accent line

      doc.moveDown(1.5);
      doc.fillColor('#1b5e20')
         .fontSize(10)
         .text('INSTITUTO UNIVERSITARIO DE CALDAS', { align: 'center', bold: true })
         .fontSize(8)
         .fillColor('#555555')
         .text('Monedero Digital de Fotocopias', { align: 'center' });

      doc.moveDown(1);
      doc.strokeColor('#e0e0e0')
         .lineWidth(1)
         .moveTo(20, doc.y)
         .lineTo(doc.page.width - 20, doc.y)
         .stroke();

      doc.moveDown(1);
      doc.fillColor('#1b5e20')
         .fontSize(9)
         .text('COMPROBANTE DE RECARGA', { align: 'center', bold: true });

      doc.moveDown(0.8);

      // --- Receipt Details ---
      doc.fillColor('#333333').fontSize(8);
      const labelX = 25;
      const valX = 130;

      const drawRow = (label, val, isBold = false) => {
        const y = doc.y;
        doc.text(label, labelX, y, { bold: isBold });
        doc.text(val, valX, y, { align: 'left', bold: isBold });
        doc.moveDown(0.6);
      };

      drawRow('Transacción N°:', `#REC-${recharge.id}`);
      drawRow('Fecha:', new Date(recharge.fecha).toLocaleString('es-CO'));
      drawRow('Código Estudiante:', student.codigo_estudiante);
      drawRow('Estudiante:', `${user.nombre} ${user.apellido}`);
      drawRow('Registrado por:', `${adminUser.nombre} ${adminUser.apellido}`);

      doc.moveDown(0.5);
      doc.strokeColor('#e0e0e0')
         .lineWidth(1)
         .moveTo(20, doc.y)
         .lineTo(doc.page.width - 20, doc.y)
         .stroke();
      doc.moveDown(0.8);

      // --- Financial breakdown ---
      doc.fillColor('#1b5e20')
         .fontSize(10)
         .text('Valor Recargado:', labelX, doc.y, { bold: true })
         .text(formatCOP(recharge.valor), valX, doc.y, { bold: true });
      doc.moveDown(0.6);

      doc.fillColor('#333333')
         .fontSize(8)
         .text('Nuevo Saldo:', labelX, doc.y)
         .text(formatCOP(student.saldo_actual), valX, doc.y);

      doc.moveDown(1.5);
      doc.fontSize(6)
         .fillColor('#888888')
         .text('Conserve este comprobante como soporte legal de su recarga.', { align: 'center' })
         .text('IUC - Manizales, Caldas', { align: 'center' });

      // --- Footer ---
      doc.rect(0, doc.page.height - 10, doc.page.width, 10).fill('#1b5e20');

      doc.end();

      writeStream.on('finish', () => {
        resolve(filename);
      });

      writeStream.on('error', (err) => {
        logger.error('PDF Write Stream Error:', err);
        reject(err);
      });
    } catch (error) {
      logger.error('Error generating PDF:', error);
      reject(error);
    }
  });
};

const generateReportPDF = (title, headers, rows, filename) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const filePath = path.join(UPLOADS_DIR, filename);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Header Banner
      doc.rect(0, 0, doc.page.width, 25).fill('#1b5e20');
      doc.rect(0, 25, doc.page.width, 5).fill('#b59410');

      doc.moveDown(2);
      doc.fillColor('#1b5e20')
         .fontSize(16)
         .text('INSTITUTO UNIVERSITARIO DE CALDAS', { align: 'center', bold: true })
         .fontSize(11)
         .fillColor('#555555')
         .text('Sistema de Control e Información de Servicios de Fotocopiado', { align: 'center' })
         .moveDown(0.5)
         .fontSize(14)
         .fillColor('#1b5e20')
         .text(title.toUpperCase(), { align: 'center', bold: true });

      doc.moveDown(1);
      doc.fontSize(8)
         .fillColor('#777777')
         .text(`Fecha de Reporte: ${new Date().toLocaleString('es-CO')}`, { align: 'right' })
         .moveDown(1);

      // Draw table headers
      const startY = doc.y;
      const columnWidths = headers.map(h => h.width);
      let currentX = 40;

      doc.rect(40, startY - 5, doc.page.width - 80, 20).fill('#1b5e20');
      doc.fillColor('#ffffff').fontSize(9);

      headers.forEach((header, idx) => {
        doc.text(header.label, currentX, startY, { width: columnWidths[idx], align: 'left', bold: true });
        currentX += columnWidths[idx];
      });

      doc.moveDown(0.8);

      // Draw table rows
      let rowY = doc.y + 5;
      doc.fillColor('#333333').fontSize(8);

      rows.forEach((row, rowIdx) => {
        // Page break if near bottom
        if (rowY > doc.page.height - 60) {
          doc.addPage();
          doc.rect(0, 0, doc.page.width, 25).fill('#1b5e20');
          doc.rect(0, 25, doc.page.width, 5).fill('#b59410');
          doc.moveDown(2);
          rowY = doc.y;
        }

        // Zebra striping
        if (rowIdx % 2 === 0) {
          doc.rect(40, rowY - 3, doc.page.width - 80, 15).fill('#f9f9f9');
          doc.fillColor('#333333');
        } else {
          doc.fillColor('#333333');
        }

        currentX = 40;
        headers.forEach((header, colIdx) => {
          doc.text(String(row[header.key] || ''), currentX, rowY, { width: columnWidths[colIdx], align: 'left' });
          currentX += columnWidths[colIdx];
        });

        rowY += 15;
      });

      // Signature / Footer
      doc.moveDown(3);
      const signatureY = doc.y;
      if (signatureY < doc.page.height - 100) {
        doc.strokeColor('#cccccc')
           .lineWidth(1)
           .moveTo(100, signatureY)
           .lineTo(250, signatureY)
           .moveTo(doc.page.width - 250, signatureY)
           .lineTo(doc.page.width - 100, signatureY)
           .stroke();

        doc.fillColor('#555555')
           .fontSize(8)
           .text('Firma Encargado', 100, signatureY + 5, { width: 150, align: 'center' })
           .text('Firma Autorizada Rectoría', doc.page.width - 250, signatureY + 5, { width: 150, align: 'center' });
      }

      // Bottom green banner
      doc.rect(0, doc.page.height - 15, doc.page.width, 15).fill('#1b5e20');

      doc.end();

      writeStream.on('finish', () => {
        resolve(filename);
      });

      writeStream.on('error', (err) => {
        logger.error('PDF Report Stream Error:', err);
        reject(err);
      });
    } catch (error) {
      logger.error('Error generating Report PDF:', error);
      reject(error);
    }
  });
};

module.exports = {
  generateRechargePDF,
  generateReportPDF
};
