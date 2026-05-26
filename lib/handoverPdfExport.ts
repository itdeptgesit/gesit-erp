import jsPDF from 'jspdf';
import { ITAssetLoan, ITAsset } from '../types';

/**
 * Format a date string into formal Indonesian long format: "Hari, DD Bulan YYYY"
 */
const formatIndonesianLongDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

/**
 * Format a date string into formal Indonesian short format: "DD Bulan YYYY"
 */
const formatIndonesianShortDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

export function exportHandoverBAST(loan: ITAssetLoan) {
  // Create an A4 Portrait PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageW = 210;
  const pageH = 297;
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR; // 170mm

  // 1. Top Decorative Sleek Bar (Corporate Theme Accent)
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageW, 6, 'F');

  let currentY = 18;

  // 2. Document Header / Brand Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('GESIT CORE SYSTEM', marginL, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Information Technology Department', marginL, currentY + 4);

  // Logo placeholder text / emblem on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.text('TGC ENTERPRISE', pageW - marginR, currentY, { align: 'right' });

  currentY += 8;

  // Thin separator line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.5);
  doc.line(marginL, currentY, pageW - marginR, currentY);

  currentY += 12;

  // 3. Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text('BERITA ACARA SERAH TERIMA BARANG (BAST)', pageW / 2, currentY, { align: 'center' });

  // Generate dynamic document number format BAST/IT/TGC/YYYY/MM/Sequential-ID
  const now = new Date(loan.loanDate || Date.now());
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const cleanId = String(loan.id || '000').padStart(3, '0');
  const docNumber = `BAST/IT/TGC/${year}/${month}/${cleanId}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text(`Nomor: ${docNumber}`, pageW / 2, currentY + 5.5, { align: 'center' });

  currentY += 18;

  // 4. Opening Statement
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const openingText = `Pada hari ini, ${formatIndonesianLongDate(loan.loanDate)}, bertempat di Kantor TGC, kami yang bertanda tangan di bawah ini:`;
  const splitOpening = doc.splitTextToSize(openingText, contentW);
  doc.text(splitOpening, marginL, currentY);

  currentY += (splitOpening.length * 4.5) + 3;

  // 5. Parties Blocks (Beautiful Cards style)
  const drawPartyBlock = (title: string, name: string, dept: string, phone: string, statusText: string, yPos: number) => {
    // Left bar indicator
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(marginL, yPos, 2, 22, 'F');

    // Background panel
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(marginL + 2, yPos, contentW - 2, 22, 'F');
    
    // Border around panel
    doc.setDrawColor(241, 245, 249); // Slate-100
    doc.setLineWidth(0.25);
    doc.rect(marginL + 2, yPos, contentW - 2, 22);

    // Write contents
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235);
    doc.text(title, marginL + 6, yPos + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Nama         :   ${name}`, marginL + 6, yPos + 10.5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Departemen:   ${dept}`, marginL + 6, yPos + 15.5);
    doc.text(`Kontak       :   ${phone || '-'}`, marginL + 6, yPos + 20);

    // Role Indicator
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(statusText, pageW - marginR - 6, yPos + 4.5, { align: 'right' });
  };

  // First Party (IT / Handover Personnel)
  drawPartyBlock(
    'PIHAK PERTAMA (Yang Menyerahkan)',
    loan.itPersonnel || 'IT Support TGC',
    'Information Technology (IT)',
    '-',
    'PEMBERI TUGAS / IT DEPT',
    currentY
  );

  currentY += 26;

  // Second Party (Recipient)
  drawPartyBlock(
    'PIHAK KEDUA (Yang Menerima)',
    loan.borrowerName,
    loan.borrowerDept,
    loan.borrowerPhone || '-',
    'KARYAWAN PENERIMA',
    currentY
  );

  currentY += 28;

  // 6. Transfer Statement
  const statementText = 'Pihak Pertama menyerahkan barang inventaris kantor kepada Pihak Kedua, dan Pihak Kedua menyatakan telah menerima barang tersebut dalam kondisi baik, lengkap, dan berfungsi normal dengan rincian spesifikasi sebagai berikut:';
  const splitStatement = doc.splitTextToSize(statementText, contentW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(splitStatement, marginL, currentY);

  currentY += (splitStatement.length * 4.5) + 3;

  // 7. Specifications / Asset Details Table (Enterprise Grade Styling)
  const tableY = currentY;
  const colW = [10, 55, 30, 45, 30]; // Sums to 170 (contentW)
  const colX = [
    marginL,
    marginL + colW[0],
    marginL + colW[0] + colW[1],
    marginL + colW[0] + colW[1] + colW[2],
    marginL + colW[0] + colW[1] + colW[2] + colW[3]
  ];

  // Header row
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(marginL, tableY, contentW, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('No', colX[0] + colW[0] / 2, tableY + 5.5, { align: 'center' });
  doc.text('Nama Barang / Deskripsi', colX[1] + 3, tableY + 5.5);
  doc.text('Kategori', colX[2] + 3, tableY + 5.5);
  doc.text('Serial Number (S/N)', colX[3] + 3, tableY + 5.5);
  doc.text('Kondisi Fisik', colX[4] + colW[4] / 2, tableY + 5.5, { align: 'center' });

  // Data row 1
  const rowY = tableY + 8;
  doc.setFillColor(255, 255, 255);
  doc.rect(marginL, rowY, contentW, 10, 'F');
  
  // Table borders (gridlines)
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.3);
  doc.rect(marginL, tableY, contentW, 18);
  
  // Draw vertical lines
  for (let i = 1; i < colX.length; i++) {
    doc.line(colX[i], tableY, colX[i], tableY + 18);
  }
  doc.line(marginL, rowY, pageW - marginR, rowY);

  // Write Row Values
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1', colX[0] + colW[0] / 2, rowY + 6, { align: 'center' });
  
  // Truncate long item names safely
  const rawItem = loan.assetName || 'IT Asset Device';
  const cleanItem = rawItem.length > 28 ? rawItem.substring(0, 26) + '...' : rawItem;
  doc.setFont('helvetica', 'bold');
  doc.text(cleanItem, colX[1] + 3, rowY + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.text(loan.assetCategory || 'IT Asset', colX[2] + 3, rowY + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.text(loan.assetSerial || '-', colX[3] + 3, rowY + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Emerald-500
  doc.text('Baik (Good)', colX[4] + colW[4] / 2, rowY + 6, { align: 'center' });

  currentY += 24;

  // 8. Terms & Conditions Section (Polished Box)
  doc.setFillColor(254, 254, 254);
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  const tcBoxH = 40;
  doc.rect(marginL, currentY, contentW, tcBoxH);

  // T&C Header Ribbon
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.rect(marginL + 0.2, currentY + 0.2, contentW - 0.4, 7, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('KETENTUAN PENGGUNAAN & PERTANGGUNGJAWABAN ASET:', marginL + 4, currentY + 5);

  const tcLines = [
    '1. Pihak Kedua bertanggung jawab penuh atas keamanan, pemeliharaan, dan penggunaan barang tersebut.',
    '2. Barang inventaris ini merupakan milik TGC dan hanya boleh digunakan untuk menunjang kegiatan operasional resmi perusahaan.',
    '3. Apabila terjadi kerusakan karena kelalaian atau kehilangan, Pihak Kedua wajib segera melaporkan ke IT Department dalam 24 jam.',
    '4. Pihak Kedua wajib mengembalikan barang inventaris dalam keadaan lengkap jika mengundurkan diri (resign) atau dinonaktifkan.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  tcLines.forEach((line, idx) => {
    doc.text(line, marginL + 4, currentY + 13 + (idx * 5.5));
  });

  currentY += tcBoxH + 6;

  // 9. Closing Statement
  const closingText = 'Demikian Berita Acara Serah Terima ini dibuat secara sadar, tanpa paksaan, dan ditandatangani oleh kedua belah pihak untuk dipergunakan sebagai bukti pertanggungjawaban inventarisasi yang sah.';
  const splitClosing = doc.splitTextToSize(closingText, contentW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(splitClosing, marginL, currentY);

  currentY += (splitClosing.length * 4) + 6;

  // 10. Signatures Section (Clean, symmetrical grid)
  const sigY = currentY;

  // City and date header
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Jakarta, ${formatIndonesianShortDate(loan.loanDate)}`, pageW - marginR, sigY, { align: 'right' });

  const sigBlockY = sigY + 6;
  const colSigW = 65;

  // Left Column (Recipient)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('PIHAK KEDUA (Yang Menerima)', marginL + 5, sigBlockY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Tanda Tangan & Nama Terang', marginL + 5, sigBlockY + 4);

  // Placeholder Line for signature
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(marginL + 5, sigBlockY + 23, marginL + colSigW, sigBlockY + 23);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(loan.borrowerName, marginL + 5, sigBlockY + 28);

  // Right Column (Handover)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('PIHAK PERTAMA (Yang Menyerahkan)', pageW - marginR - colSigW, sigBlockY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Tanda Tangan & Nama Terang', pageW - marginR - colSigW, sigBlockY + 4);

  // Placeholder Line for IT signature
  doc.line(pageW - marginR - colSigW, sigBlockY + 23, pageW - marginR - 5, sigBlockY + 23);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(loan.itPersonnel || 'IT Support Dept.', pageW - marginR - colSigW, sigBlockY + 28);

  // 11. Footer Notes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('GESIT CORE • Dokumen Berita Acara resmi IT Department TGC.', marginL, pageH - 8);
  doc.text('Halaman 1 dari 1', pageW - marginR, pageH - 8, { align: 'right' });

  // Save the BAST PDF dynamically
  const cleanName = loan.borrowerName.replace(/\s+/g, '-').substring(0, 15);
  doc.save(`BAST-${loan.loanId}-${cleanName}.pdf`);
}

export interface AssetTransferInfo {
  originatorCompany: string;
  originatorName: string;
  originatorPosition: string;
  originatorDept: string;
  
  recipientName: string;
  recipientCompany: string;
  recipientPosition: string;
  recipientDivision: string;
  recipientDept: string;
  recipientLocation: string;
  
  handoverDate: string;
  docNo: string;
  
  supportingEquipment: Array<{ name: string; serialNo: string; remarks: string }>;
  note: string;
}

export function exportAssetTransferForm(
  asset: ITAsset,
  info: AssetTransferInfo
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageW = 210;
  const pageH = 297;
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR; // 180mm

  // 1. Top Decorative Bar
  doc.setFillColor(15, 32, 67); // Corporate Dark Blue
  doc.rect(0, 0, pageW, 5, 'F');

  let currentY = 14;

  // Title block on left (bordered box)
  doc.setDrawColor(15, 32, 67);
  doc.setLineWidth(0.6);
  doc.rect(marginL, currentY, 75, 12);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 32, 67);
  doc.text('ASSET TRANSFER FORM', marginL + 5, currentY + 7.5);

  // Logo text on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('THE GESIT COMPANIES', pageW - marginR, currentY + 5.5, { align: 'right' });

  // Thin line below brand header
  currentY += 16;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginL, currentY, pageW - marginR, currentY);

  currentY += 4;

  // Top Metadata Grid (Right side)
  const metaX = pageW - marginR - 80;
  const metaW = 80;
  
  const drawMetaRow = (label: string, val: string, yPos: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 32, 67);
    doc.text(label, metaX, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`:  ${val}`, metaX + 32, yPos);
  };

  // Convert handover date to DD-MMM-YY format (e.g. 20-Apr-26)
  const formatShortMMM = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const yy = String(date.getFullYear()).substring(2);
      return `${date.getDate()}-${months[date.getMonth()]}-${yy}`;
    } catch {
      return dateStr;
    }
  };

  drawMetaRow('HANDOVER DATE', formatShortMMM(info.handoverDate), currentY);
  drawMetaRow('DOC NO', info.docNo, currentY + 4.5);
  drawMetaRow('RETURN DATE', ':', currentY + 9);
  drawMetaRow('RETURN CONDITION', ':  __________________', currentY + 13.5);

  currentY += 18;

  // Helper to draw Section Header
  const drawSectionHeader = (title: string, yPos: number) => {
    doc.setFillColor(15, 32, 67); // Corporate Dark Blue
    doc.rect(marginL, yPos, contentW, 6, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(title, marginL + 3, yPos + 4.2);
  };

  // --- 2. SECTION: DATA ORIGINATOR ---
  drawSectionHeader('DATA ORIGINATOR', currentY);
  currentY += 6;

  // Grid for Originator
  const origGridY = currentY;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.rect(marginL, origGridY, contentW, 14);
  
  // Vertical split line
  doc.line(marginL + (contentW / 2), origGridY, marginL + (contentW / 2), origGridY + 14);
  doc.line(marginL, origGridY + 7, pageW - marginR, origGridY + 7);

  const drawFieldInGrid = (label: string, value: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + 3, y + 4.5);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(value || '-', x + 35, y + 4.5);
  };

  drawFieldInGrid('COMPANY', info.originatorCompany, marginL, origGridY);
  drawFieldInGrid('NAME', info.originatorName, marginL + (contentW / 2), origGridY);
  drawFieldInGrid('POSITION', info.originatorPosition, marginL, origGridY + 7);
  drawFieldInGrid('DEPARTMENT', info.originatorDept, marginL + (contentW / 2), origGridY + 7);

  currentY += 19;

  // --- 3. SECTION: DATA FIXED ASET ---
  drawSectionHeader('DATA FIXED ASSET', currentY);
  currentY += 6.5;

  // Asset Type indicator
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 32, 67);
  doc.text('ASSET TYPE', marginL, currentY + 3.5);
  
  doc.setFillColor(15, 32, 67);
  doc.rect(marginL + 25, currentY + 1, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Hardware', marginL + 30, currentY + 3.5);

  doc.setDrawColor(15, 32, 67);
  doc.rect(marginL + 55, currentY + 1, 3, 3, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Software', marginL + 60, currentY + 3.5);

  currentY += 7.5;

  // Table 1: Main Asset Table
  const drawMainAssetTable = (yPos: number) => {
    const tableW = [10, 60, 40, 40, 30]; // Sums to 180 (contentW)
    const tableX = [
      marginL,
      marginL + tableW[0],
      marginL + tableW[0] + tableW[1],
      marginL + tableW[0] + tableW[1] + tableW[2],
      marginL + tableW[0] + tableW[1] + tableW[2] + tableW[3]
    ];

    // Header Row
    doc.setFillColor(241, 245, 249);
    doc.rect(marginL, yPos, contentW, 6, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(marginL, yPos, contentW, 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 32, 67);
    doc.text('NO', tableX[0] + tableW[0] / 2, yPos + 4.2, { align: 'center' });
    doc.text('ASSET NAME', tableX[1] + 3, yPos + 4.2);
    doc.text('SERIAL NO', tableX[2] + 3, yPos + 4.2);
    doc.text('ASSET REGISTER NO', tableX[3] + 3, yPos + 4.2);
    doc.text('REMARKS', tableX[4] + 3, yPos + 4.2);

    // Row 1 (Data)
    const rowY = yPos + 6;
    doc.rect(marginL, rowY, contentW, 8);
    
    // Vertical grid lines
    for (let i = 1; i < tableX.length; i++) {
      doc.line(tableX[i], yPos, tableX[i], rowY + 8);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1', tableX[0] + tableW[0] / 2, rowY + 5.2, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.text(asset.item || 'Vivobook', tableX[1] + 3, rowY + 5.2);
    
    doc.setFont('helvetica', 'normal');
    doc.text(asset.serialNumber || '-', tableX[2] + 3, rowY + 5.2);
    doc.setFont('helvetica', 'bold');
    doc.text(asset.assetId || '-', tableX[3] + 3, rowY + 5.2);
    doc.setFont('helvetica', 'normal');
    doc.text(asset.remarks || asset.brand || '-', tableX[4] + 3, rowY + 5.2);

    // Rows 2 & 3 (Blank Placeholders)
    const row2Y = rowY + 8;
    doc.rect(marginL, row2Y, contentW, 6);
    doc.rect(marginL, row2Y + 6, contentW, 6);
    for (let i = 1; i < tableX.length; i++) {
      doc.line(tableX[i], row2Y, tableX[i], row2Y + 12);
    }
  };

  drawMainAssetTable(currentY);
  currentY += 28;

  // Table 2: Supporting Equipment
  const drawSupportingEquipmentTable = (yPos: number) => {
    const tableW = [10, 80, 45, 45]; // Sums to 180 (contentW)
    const tableX = [
      marginL,
      marginL + tableW[0],
      marginL + tableW[0] + tableW[1],
      marginL + tableW[0] + tableW[1] + tableW[2]
    ];

    // Header Row
    doc.setFillColor(241, 245, 249);
    doc.rect(marginL, yPos, contentW, 6, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(marginL, yPos, contentW, 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 32, 67);
    doc.text('NO', tableX[0] + tableW[0] / 2, yPos + 4.2, { align: 'center' });
    doc.text('SUPPORTING EQUIPMENT', tableX[1] + 3, yPos + 4.2);
    doc.text('SERIAL NO', tableX[2] + 3, yPos + 4.2);
    doc.text('REMARKS', tableX[3] + 3, yPos + 4.2);

    const rowH = 6;
    // Print supporting equip rows dynamically
    for (let i = 0; i < 5; i++) {
      const rowY = yPos + 6 + (i * rowH);
      doc.rect(marginL, rowY, contentW, rowH);
      for (let j = 1; j < tableX.length; j++) {
        doc.line(tableX[j], yPos, tableX[j], rowY + rowH);
      }

      const equip = info.supportingEquipment[i];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      doc.text(String(i + 1), tableX[0] + tableW[0] / 2, rowY + 4.2, { align: 'center' });
      
      if (equip) {
        doc.setFont('helvetica', 'bold');
        doc.text(equip.name || '', tableX[1] + 3, rowY + 4.2);
        doc.setFont('helvetica', 'normal');
        doc.text(equip.serialNo || '-', tableX[2] + 3, rowY + 4.2);
        doc.text(equip.remarks || '-', tableX[3] + 3, rowY + 4.2);
      }
    }
  };

  drawSupportingEquipmentTable(currentY);
  currentY += 38;

  // Note Banner Box
  doc.setFillColor(15, 32, 67);
  doc.rect(marginL, currentY, 20, 6, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Note :', marginL + 3, currentY + 4.2);

  doc.setDrawColor(15, 32, 67);
  doc.rect(marginL + 20, currentY, contentW - 20, 6);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(info.note || '-', marginL + 23, currentY + 4.2);

  currentY += 11;

  // --- 4. SECTION: DATA RECIPIENT ---
  drawSectionHeader('DATA RECIPIENT', currentY);
  currentY += 6;

  // Symmetrical Grid of fields
  const recipGridY = currentY;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.rect(marginL, recipGridY, contentW, 21);
  
  // Horizontal splits
  doc.line(marginL, recipGridY + 7, pageW - marginR, recipGridY + 7);
  doc.line(marginL, recipGridY + 14, pageW - marginR, recipGridY + 14);
  // Vertical split
  doc.line(marginL + (contentW / 2), recipGridY, marginL + (contentW / 2), recipGridY + 21);

  drawFieldInGrid('NAME', info.recipientName, marginL, recipGridY);
  drawFieldInGrid('COMPANY', info.recipientCompany, marginL + (contentW / 2), recipGridY);
  drawFieldInGrid('POSITION', info.recipientPosition, marginL, recipGridY + 7);
  drawFieldInGrid('DIVISION', info.recipientDivision, marginL + (contentW / 2), recipGridY + 7);
  drawFieldInGrid('DEPARTEMENT', info.recipientDept, marginL, recipGridY + 14);
  drawFieldInGrid('LOCATION', info.recipientLocation, marginL + (contentW / 2), recipGridY + 14);

  currentY += 27;

  // --- 5. SECTION: ACKNOWLEDGEMENT AND DECLARATION ---
  const declY = currentY;
  doc.setFillColor(248, 250, 252);
  doc.rect(marginL, declY, contentW, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(marginL, declY, contentW, 14);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const declText = 'I, as received, hereby acknowledge that I received above mentioned asset. I understand that asset belong to company and hereby assure that I will take care of the assets of the company to the best possible extend. Minimum for next 3 years.';
  const splitDecl = doc.splitTextToSize(declText, contentW - 8);
  doc.text(splitDecl, marginL + 4, declY + 4.8);

  currentY += 20;

  // --- 6. SECTION: SIGNATURES BLOCK ---
  const sigW = contentW / 3;
  const drawSigColumn = (header: string, role: string, xPos: number, yPos: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 32, 67);
    doc.text(header, xPos + (sigW / 2), yPos, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(role, xPos + (sigW / 2), yPos + 4, { align: 'center' });

    // Signature Area Box outline
    doc.setDrawColor(226, 232, 240);
    doc.rect(xPos + 5, yPos + 6, sigW - 10, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Signature:', xPos + 8, yPos + 25);
    doc.text('Date:', xPos + 8, yPos + 29);
  };

  drawSigColumn('PREPARED by:', 'IT Specialist', marginL, currentY);
  drawSigColumn('VERIFIED by:', 'Office Manager', marginL + sigW, currentY);
  drawSigColumn('RECEIVED by:', 'User / Recipient', marginL + (sigW * 2), currentY);

  currentY += 34;

  // Footer notes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('INFORMATION TECHNOLOGY', marginL, pageH - 8);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 32, 67);
  doc.text(info.originatorCompany.toUpperCase(), pageW - marginR, pageH - 8, { align: 'right' });

  // Save Document
  const cleanName = info.recipientName.replace(/\s+/g, '-').substring(0, 15);
  doc.save(`Asset_Transfer_Form_${asset.assetId}_${cleanName}.pdf`);
}

