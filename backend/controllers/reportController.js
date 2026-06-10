const { Consume, Recharge, Student, User } = require('../models');
const { generateReportPDF } = require('../services/pdfService');
const { generateReportExcel } = require('../services/excelService');
const { logAudit } = require('../services/auditService');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

const UPLOADS_DIR = path.join(__dirname, '../uploads/comprobantes');

const exportConsumos = async (req, res) => {
  const { format, fecha_inicio, fecha_fin } = req.query;
  const userId = req.user.id;

  try {
    // Build query conditions
    const where = {};
    if (fecha_inicio && fecha_fin) {
      where.fecha = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    // Query DB
    const consumes = await Consume.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'estudiante',
          include: { model: User, as: 'usuario' }
        },
        {
          model: User,
          as: 'usuarioRegistra'
        }
      ],
      order: [['fecha', 'DESC']]
    });

    const headers = [
      { label: 'ID Transacción', key: 'id', width: 15 },
      { label: 'Código Estudiante', key: 'codigo', width: 18, isNumber: true },
      { label: 'Nombre Estudiante', key: 'estudiante', width: 30 },
      { label: 'Cantidad Copias', key: 'cantidad', width: 15, isNumber: true },
      { label: 'Costo Total', key: 'valor', width: 18, isCurrency: true },
      { label: 'Fecha Consumo', key: 'fecha', width: 22, isDate: true },
      { label: 'Operador Responsable', key: 'operador', width: 25 }
    ];

    const rows = consumes.map(c => ({
      id: `CON-${c.id}`,
      codigo: c.estudiante ? c.estudiante.codigo_estudiante : 'N/A',
      estudiante: c.estudiante && c.estudiante.usuario ? `${c.estudiante.usuario.nombre} ${c.estudiante.usuario.apellido}` : 'N/A',
      cantidad: c.cantidad_copias,
      valor: parseFloat(c.valor),
      fecha: c.fecha,
      operador: c.usuarioRegistra ? `${c.usuarioRegistra.nombre} ${c.usuarioRegistra.apellido}` : 'N/A'
    }));

    // Calculate KPIs
    const totalCopies = rows.reduce((sum, r) => sum + r.cantidad, 0);
    const totalAmount = rows.reduce((sum, r) => sum + r.valor, 0);
    const avgAmount = rows.length > 0 ? totalAmount / rows.length : 0;
    
    const kpis = [
      { label: 'Total Consumos Registrados', value: rows.length },
      { label: 'Total Copias Impresas', value: totalCopies },
      { label: 'Total Recaudado por Consumos', value: totalAmount, isCurrency: true },
      { label: 'Costo Promedio de Transacción', value: avgAmount, isCurrency: true }
    ];

    const title = 'Reporte de Consumos de Fotocopiadora';
    const timestamp = Date.now();

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logAudit(userId, `Exportó reporte de consumos (Formato: ${format || 'pdf'})`, ip);

    if (format === 'excel') {
      const filename = `reporte_consumos_${timestamp}.xlsx`;
      await generateReportExcel(title, headers, rows, filename, kpis);
      return res.download(path.join(UPLOADS_DIR, filename));
    } else {
      // Default: PDF
      const filename = `reporte_consumos_${timestamp}.pdf`;
      await generateReportPDF(title, headers, rows, filename);
      return res.download(path.join(UPLOADS_DIR, filename));
    }

  } catch (error) {
    logger.error('Error exporting consumes report:', error);
    return res.status(500).json({ success: false, message: 'Error al generar el reporte de consumos.' });
  }
};

const exportRecargas = async (req, res) => {
  const { format, fecha_inicio, fecha_fin } = req.query;
  const userId = req.user.id;

  try {
    const where = {};
    if (fecha_inicio && fecha_fin) {
      where.fecha = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const recharges = await Recharge.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'estudiante',
          include: { model: User, as: 'usuario' }
        },
        {
          model: User,
          as: 'usuarioRegistra'
        }
      ],
      order: [['fecha', 'DESC']]
    });

    const headers = [
      { label: 'ID Transacción', key: 'id', width: 15 },
      { label: 'Código Estudiante', key: 'codigo', width: 18, isNumber: true },
      { label: 'Nombre Estudiante', key: 'estudiante', width: 30 },
      { label: 'Valor Recarga', key: 'valor', width: 18, isCurrency: true },
      { label: 'Fecha Recarga', key: 'fecha', width: 22, isDate: true },
      { label: 'Administrativo Responsable', key: 'admin', width: 25 }
    ];

    const rows = recharges.map(r => ({
      id: `REC-${r.id}`,
      codigo: r.estudiante ? r.estudiante.codigo_estudiante : 'N/A',
      estudiante: r.estudiante && r.estudiante.usuario ? `${r.estudiante.usuario.nombre} ${r.estudiante.usuario.apellido}` : 'N/A',
      valor: parseFloat(r.valor),
      fecha: r.fecha,
      admin: r.usuarioRegistra ? `${r.usuarioRegistra.nombre} ${r.usuarioRegistra.apellido}` : 'N/A'
    }));

    const totalAmount = rows.reduce((sum, r) => sum + r.valor, 0);
    const avgAmount = rows.length > 0 ? totalAmount / rows.length : 0;

    const kpis = [
      { label: 'Total Recargas Registradas', value: rows.length },
      { label: 'Total Recaudado por Recargas', value: totalAmount, isCurrency: true },
      { label: 'Valor Promedio de Recarga', value: avgAmount, isCurrency: true }
    ];

    const title = 'Reporte de Recargas de Saldo';
    const timestamp = Date.now();

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logAudit(userId, `Exportó reporte de recargas (Formato: ${format || 'pdf'})`, ip);

    if (format === 'excel') {
      const filename = `reporte_recargas_${timestamp}.xlsx`;
      await generateReportExcel(title, headers, rows, filename, kpis);
      return res.download(path.join(UPLOADS_DIR, filename));
    } else {
      const filename = `reporte_recargas_${timestamp}.pdf`;
      await generateReportPDF(title, headers, rows, filename);
      return res.download(path.join(UPLOADS_DIR, filename));
    }

  } catch (error) {
    logger.error('Error exporting recharges report:', error);
    return res.status(500).json({ success: false, message: 'Error al generar el reporte de recargas.' });
  }
};

const exportSaldos = async (req, res) => {
  const { format } = req.query;
  const userId = req.user.id;

  try {
    const students = await Student.findAll({
      include: {
        model: User,
        as: 'usuario',
        where: { estado: 'activo' }
      },
      order: [['saldo_actual', 'DESC']]
    });

    const headers = [
      { label: 'Código Estudiante', key: 'codigo', width: 18, isNumber: true },
      { label: 'Nombre Completo', key: 'estudiante', width: 35 },
      { label: 'Correo Institucional', key: 'correo', width: 30 },
      { label: 'Saldo Actual', key: 'saldo', width: 20, isCurrency: true }
    ];

    const rows = students.map(s => ({
      codigo: s.codigo_estudiante,
      estudiante: `${s.usuario.nombre} ${s.usuario.apellido}`,
      correo: s.usuario.correo,
      saldo: parseFloat(s.saldo_actual)
    }));

    const totalWalletFunds = rows.reduce((sum, r) => sum + r.saldo, 0);
    const avgWalletBalance = rows.length > 0 ? totalWalletFunds / rows.length : 0;

    const kpis = [
      { label: 'Total Estudiantes Activos', value: rows.length },
      { label: 'Fondos Totales Custodiados (Monedero)', value: totalWalletFunds, isCurrency: true },
      { label: 'Saldo Promedio por Estudiante', value: avgWalletBalance, isCurrency: true }
    ];

    const title = 'Reporte General de Saldos Custodiados';
    const timestamp = Date.now();

    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    await logAudit(userId, `Exportó reporte de saldos de estudiantes (Formato: ${format || 'pdf'})`, ip);

    if (format === 'excel') {
      const filename = `reporte_saldos_${timestamp}.xlsx`;
      await generateReportExcel(title, headers, rows, filename, kpis);
      return res.download(path.join(UPLOADS_DIR, filename));
    } else {
      const filename = `reporte_saldos_${timestamp}.pdf`;
      await generateReportPDF(title, headers, rows, filename);
      return res.download(path.join(UPLOADS_DIR, filename));
    }

  } catch (error) {
    logger.error('Error exporting balances report:', error);
    return res.status(500).json({ success: false, message: 'Error al generar el reporte de saldos.' });
  }
};

module.exports = {
  exportConsumos,
  exportRecargas,
  exportSaldos
};
