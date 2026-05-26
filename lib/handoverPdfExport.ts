import jsPDF from 'jspdf';
import { ITAssetLoan } from '../types';

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
