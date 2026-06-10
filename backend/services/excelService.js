const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const UPLOADS_DIR = path.join(__dirname, '../uploads/comprobantes');

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Generates a styled Excel report.
 * @param {string} title - Report title
 * @param {Array} headers - Column definitions: [{ header: 'Col Title', key: 'field', width: 15, isCurrency: false }]
 * @param {Array} rows - Row data objects
 * @param {string} filename - File output name
 * @param {Array} kpis - Optional KPIs for the Summary sheet: [{ label: 'KPI', value: 123, isCurrency: false }]
 */
const generateReportExcel = async (title, headers, rows, filename, kpis = []) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IUC Monedero Digital';
    workbook.created = new Date();

    const GREEN_COLOR = 'FF1B5E20';
    const GOLD_COLOR = 'FFB59410';
    const LIGHT_GREEN = 'FFE8F5E9';
    const WHITE_COLOR = 'FFFFFFFF';

    // ----------------------------------------------------
    // Sheet 1: Resumen (Summary)
    // ----------------------------------------------------
    const wsSummary = workbook.addWorksheet('Resumen');
    wsSummary.views = [{ showGridLines: true }];

    // Header Title
    wsSummary.mergeCells('B2:E2');
    const titleCell = wsSummary.getCell('B2');
    titleCell.value = title.toUpperCase();
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: GREEN_COLOR } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Subtitle
    wsSummary.mergeCells('B3:E3');
    const subtitleCell = wsSummary.getCell('B3');
    subtitleCell.value = `Instituto Universitario de Caldas - Reporte Institucional`;
    subtitleCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF555555' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Draw KPIs
    let currentKpiRow = 5;
    wsSummary.getCell(`B${currentKpiRow}`).value = 'KPI / Indicador';
    wsSummary.getCell(`C${currentKpiRow}`).value = 'Valor';
    
    // Format KPI Header Row
    ['B', 'C'].forEach(col => {
      const cell = wsSummary.getCell(`${col}${currentKpiRow}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_COLOR } };
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: WHITE_COLOR } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: GOLD_COLOR } }
      };
    });

    currentKpiRow++;

    // Populate KPIs
    if (kpis && kpis.length > 0) {
      kpis.forEach(kpi => {
        wsSummary.getCell(`B${currentKpiRow}`).value = kpi.label;
        wsSummary.getCell(`B${currentKpiRow}`).font = { name: 'Arial', size: 10, bold: true };
        
        const valCell = wsSummary.getCell(`C${currentKpiRow}`);
        valCell.value = kpi.value;
        valCell.font = { name: 'Arial', size: 10 };

        if (kpi.isCurrency) {
          valCell.numberFormat = '"$"#,##0';
        }

        currentKpiRow++;
      });
    } else {
      // Default KPIs based on data
      wsSummary.getCell(`B${currentKpiRow}`).value = 'Total de Registros';
      wsSummary.getCell(`C${currentKpiRow}`).value = rows.length;
      wsSummary.getCell(`B${currentKpiRow}`).font = { name: 'Arial', size: 10, bold: true };
      currentKpiRow++;
    }

    // Adjust width of KPI columns
    wsSummary.getColumn('B').width = 35;
    wsSummary.getColumn('C').width = 20;

    // ----------------------------------------------------
    // Sheet 2: Detalle (Detailed Data)
    // ----------------------------------------------------
    const wsDetail = workbook.addWorksheet('Detalle');
    wsDetail.views = [{ showGridLines: true }];

    // Configure headers
    wsDetail.columns = headers.map(h => ({
      header: h.label,
      key: h.key,
      width: h.width || 15
    }));

    // Style the Header Row
    const headerRow = wsDetail.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: GREEN_COLOR }
      };
      cell.font = {
        name: 'Arial',
        size: 10,
        bold: true,
        color: { argb: WHITE_COLOR }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: GOLD_COLOR } }
      };
    });

    // Populate and format Data Rows
    rows.forEach((rowData, index) => {
      const row = wsDetail.addRow(rowData);
      row.height = 20;

      const isEven = index % 2 === 0;
      row.eachCell((cell, colNumber) => {
        // Alternating background color
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: LIGHT_GREEN }
          };
        }

        // Alignments and borders
        cell.font = { name: 'Arial', size: 9 };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };

        // Format cell values
        const colDef = headers[colNumber - 1];
        if (colDef) {
          if (colDef.isCurrency) {
            cell.numberFormat = '"$"#,##0';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else if (colDef.isNumber) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (colDef.isDate) {
            if (cell.value) {
              cell.value = new Date(cell.value);
              cell.numberFormat = 'yyyy-mm-dd hh:mm:ss';
            }
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        }
      });
    });

    // Auto-fit columns as a fallback safeguard
    wsDetail.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value) : '';
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      column.width = Math.max(maxLen + 4, 12);
    });

    const filePath = path.join(UPLOADS_DIR, filename);
    await workbook.xlsx.writeFile(filePath);
    logger.info(`Excel report generated successfully at ${filePath}`);
    return filename;
  } catch (error) {
    logger.error('Error generating Excel report:', error);
    throw error;
  }
};

module.exports = {
  generateReportExcel
};
