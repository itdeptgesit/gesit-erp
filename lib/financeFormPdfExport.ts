import jsPDF from 'jspdf';
import { PurchaseRequisition } from '../types';

/**
 * Format date to Indonesian style: "DD MMMM YYYY"
 */
const formatIndonesianDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    // We want the format dd/mm/yy as requested in the image (dd/mm/yy)
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = String(date.getFullYear()).slice(-2);
    return `${d}/${m}/${y}`;
  } catch (e) {
    return dateStr;
  }
};

/**
 * Format number to currency
 */
const formatCurrency = (num: number, currency: string = 'IDR') => {
  const c = String(currency || 'IDR').toUpperCase();
  if (c.includes('USD') || c === 'DOLLAR') {
    const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    return `$ ${formatted}`;
  }
  const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(num);
  return `Rp ${formatted}`;
};

const loadLogoImage = (): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = '/image/logo.png';
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
};

const loadLogoBase64 = async (): Promise<string | null> => {
  try {
    const res = await fetch('/image/logo.png');
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const u8 = new Uint8Array(buf);
    let binary = '';
    const len = u8.byteLength;
    for (let i = 0; i < len; i += 8192) {
      binary += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + 8192, len)) as any);
    }
    return btoa(binary);
  } catch (e) {
    console.error('Error fetching logo:', e);
    return null;
  }
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 8192) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 8192, len)) as any);
  }
  return btoa(binary);
}

/**
 * Load Calibri (Carlito) font dynamically from local public assets folder
 */
async function loadCalibriFont(doc: jsPDF) {
  // Check if already registered
  if (doc.getFontList()['calibri']) {
    return;
  }
  
  try {
    const resReg = await fetch('/fonts/carlito-regular.ttf');
    if (resReg.ok) {
        const bufReg = await resReg.arrayBuffer();
        const b64Reg = arrayBufferToBase64(bufReg);
        doc.addFileToVFS('calibri-normal.ttf', b64Reg);
        doc.addFont('calibri-normal.ttf', 'calibri', 'normal');
    }

    const resBold = await fetch('/fonts/carlito-bold.ttf');
    if (resBold.ok) {
        const bufBold = await resBold.arrayBuffer();
        const b64Bold = arrayBufferToBase64(bufBold);
        doc.addFileToVFS('calibri-bold.ttf', b64Bold);
        doc.addFont('calibri-bold.ttf', 'calibri', 'bold');
    }
  } catch (e) {
    console.error('Error loading Calibri font:', e);
    doc.addFont('Helvetica', 'calibri', 'normal');
    doc.addFont('Helvetica-Bold', 'calibri', 'bold');
  }
}

function convertNumberToWords(amount: number): string {
  if (amount === 0) return "Nol Rupiah";
  
  const units = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  
  function toWords(num: number): string {
    if (num < 12) return units[num];
    if (num < 20) return toWords(num - 10) + " Belas";
    if (num < 100) return toWords(Math.floor(num / 10)) + " Puluh" + (num % 10 > 0 ? " " + toWords(num % 10) : "");
    if (num < 200) return "Seratus" + (num % 100 > 0 ? " " + toWords(num % 100) : "");
    if (num < 1000) return toWords(Math.floor(num / 100)) + " Ratus" + (num % 100 > 0 ? " " + toWords(num % 100) : "");
    if (num < 2000) return "Seribu" + (num % 1000 > 0 ? " " + toWords(num % 1000) : "");
    if (num < 1000000) return toWords(Math.floor(num / 1000)) + " Ribu" + (num % 1000 > 0 ? " " + toWords(num % 1000) : "");
    if (num < 1000000000) return toWords(Math.floor(num / 1000000)) + " Juta" + (num % 1000000 > 0 ? " " + toWords(num % 1000000) : "");
    if (num < 1000000000000) return toWords(Math.floor(num / 1000000000)) + " Milyar" + (num % 1000000000 > 0 ? " " + toWords(num % 1000000000) : "");
    if (num < 1000000000000000) return toWords(Math.floor(num / 1000000000000)) + " Triliun" + (num % 1000000000000 > 0 ? " " + toWords(num % 1000000000000) : "");
    return "";
  }
  
  return toWords(amount) + " Rupiah";
}

export interface FinanceFormData {
    companyName: string;
    projectName: string;
    cekBgNo: string;
    bankName: string;
    paymentMethod: 'Cash' | 'Transfer';
    transferTo: string;
    amount?: number; // Optional override
}

export async function exportFinanceFormPDF(
    req: PurchaseRequisition, 
    type: 'cash_advance' | 'payment_requisition', 
    formData: FinanceFormData
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // A4 Landscape is 297 x 210. 
  // We want to draw on the left half, which is effectively A5 Portrait (148.5 x 210).
  const pageW = 148.5;
  const pageH = 210;
  const marginL = 10;
  const marginR = 10;
  const contentW = pageW - marginL - marginR; // 128.5mm

  const logoImg = await loadLogoImage();
  const logoBase64 = await loadLogoBase64();

  await loadCalibriFont(doc);

  let y = 12;

  // 1. LOGO & COMPANY NAME
  if (logoImg && logoBase64) {
    const originalW = logoImg.naturalWidth || logoImg.width || 100;
    const originalH = logoImg.naturalHeight || logoImg.height || 100;
    const aspect = originalW / originalH;
    const logoH = 10;
    const logoW = logoH * aspect;
    
    const companyText = 'THE GESIT COMPANIES';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0); // Image has black text for this
    
    const textW = doc.getTextWidth(companyText);
    const emblemX = marginL; 
    const textX = marginL + logoW + 3;
    
    doc.addImage(logoBase64, 'PNG', emblemX, y - 4, logoW, logoH, undefined, 'FAST');
    doc.text(companyText, textX, y + 2.5);
  }

  y += 15; // Space between logo and title

  // 2. MAIN TITLE
  doc.setFont('calibri', 'bold');
  doc.setFontSize(14);
  const titleText = type === 'cash_advance' ? 'CASH ADVANCE' : 'PAYMENT REQUISITION';
  doc.text(titleText, pageW / 2, y, { align: 'center' });
  
  // Title Underline
  const titleW = doc.getTextWidth(titleText);
  doc.setLineWidth(0.4);
  doc.line((pageW / 2) - (titleW / 2), y + 1.5, (pageW / 2) + (titleW / 2), y + 1.5);

  y += 12;

  // 3. METADATA HEADER
  doc.setFont('calibri', 'normal');
  doc.setFontSize(8.5); // Slightly smaller to fit long names
  
  const col1X = marginL;
  const col1LabelW = 25;
  const col1ValX = col1X + col1LabelW + 2;
  
  const col2LabelW = 18;
  const col2LineW = 25; // Reduced from 30 to give col1 more space
  const col2X = marginL + contentW - col2LabelW - col2LineW - 2; // Right aligned block
  const col2ValX = col2X + col2LabelW + 2;
  
  const col1LineW = col2X - col1ValX - 3; // Fill available space until col2

  const rowHeight = 8.5; // Increased from 7 to give vertical breathing room

  // Row 1
  doc.text('Company', col1X, y);
  doc.text(':', col1X + col1LabelW, y);
  doc.text(formData.companyName || '', col1ValX, y);
  doc.line(col1ValX, y + 1, col1ValX + col1LineW, y + 1);

  y += rowHeight;

  // Row 2
  doc.text('Project Name', col1X, y);
  doc.text(':', col1X + col1LabelW, y);
  const projNameLines = doc.splitTextToSize(formData.projectName || '', col1LineW);
  doc.text(projNameLines, col1ValX, y);
  const projNameOffset = (projNameLines.length - 1) * 4;
  doc.line(col1ValX, y + 1 + projNameOffset, col1ValX + col1LineW, y + 1 + projNameOffset);

  doc.text('Cek / BG No.', col2X, y);
  doc.text(':', col2X + col2LabelW, y);
  doc.text(formData.cekBgNo || '', col2ValX, y);
  doc.line(col2ValX, y + 1, col2ValX + col2LineW, y + 1);

  y += rowHeight + projNameOffset;

  // Row 3
  doc.text('Request Date', col1X, y);
  doc.text(':', col1X + col1LabelW, y);
  doc.text(formatIndonesianDate(req.requestDate), col1ValX, y);
  doc.line(col1ValX, y + 1, col1ValX + col1LineW, y + 1);

  doc.text('Bank', col2X, y);
  doc.text(':', col2X + col2LabelW, y);
  doc.text(formData.bankName || '', col2ValX, y);
  doc.line(col2ValX, y + 1, col2ValX + col2LineW, y + 1);

  y += rowHeight;

  // Pay to
  doc.text('Pay to', col1X, y);
  doc.text(':', col1X + col1LabelW, y);
  const paidTo = req.paidTo || formData.transferTo || '';
  const paidToW = marginL + contentW - col1ValX;
  const paidToLines = doc.splitTextToSize(paidTo, paidToW);
  doc.text(paidToLines, col1ValX, y);
  const paidToOffset = (paidToLines.length - 1) * 4;
  doc.line(col1ValX, y + 1 + paidToOffset, marginL + contentW, y + 1 + paidToOffset);

  y += rowHeight + paidToOffset;

  // Payment Method
  doc.text('Payment Method', col1X, y);
  doc.text(':', col1X + col1LabelW, y);

  // Checkbox Cash
  const boxY = y - 3.5;
  doc.rect(col1ValX, boxY, 4, 4);
  doc.text('Cash', col1ValX + 6, y);
  if (formData.paymentMethod === 'Cash') {
    doc.line(col1ValX, boxY, col1ValX + 4, boxY + 4);
    doc.line(col1ValX + 4, boxY, col1ValX, boxY + 4);
  }

  // Checkbox Transfer
  const transferX = col1ValX + 16;
  doc.rect(transferX, boxY, 4, 4);
  doc.text('Transfer to :', transferX + 6, y);
  if (formData.paymentMethod === 'Transfer') {
    doc.line(transferX, boxY, transferX + 4, boxY + 4);
    doc.line(transferX + 4, boxY, transferX, boxY + 4);
  }

  // Transfer destination line
  const transferDestX = transferX + 22;
  if (formData.paymentMethod === 'Transfer') {
    doc.text(formData.transferTo || req.bankAccount || '', transferDestX + 2, y);
  }
  doc.line(transferDestX, y + 1, marginL + contentW, y + 1);

  y += 9;

  // 4. TABLE
  const colW = [8, 24, 46.5, 20, 30]; // Total 128.5
  let colX: number[] = [marginL];
  for (let i = 0; i < colW.length - 1; i++) {
    colX.push(colX[i] + colW[i]);
  }

  const tableHeaderH = 8;
  doc.setLineWidth(0.3);

  // Header Background & Borders
  doc.rect(marginL, y, contentW, tableHeaderH);
  for (let i = 1; i < colX.length; i++) {
    doc.line(colX[i], y, colX[i], y + tableHeaderH);
  }

  doc.setFont('calibri', 'bold');
  doc.setFontSize(8.5);
  doc.text('No.', colX[0] + colW[0] / 2, y + 5, { align: 'center' });
  doc.text('Cost Center /\nDepartment', colX[1] + colW[1] / 2, y + 3.5, { align: 'center' });
  doc.text('Description', colX[2] + colW[2] / 2, y + 5, { align: 'center' });
  doc.text('Currency', colX[3] + colW[3] / 2, y + 5, { align: 'center' });
  doc.text('Amount', colX[4] + colW[4] / 2, y + 5, { align: 'center' });

  y += tableHeaderH;

  const minTableH = 60;
  const tableDataH = minTableH; // Keep it fixed for this form to look like a standard voucher

  doc.rect(marginL, y, contentW, tableDataH);
  for (let i = 1; i < colX.length; i++) {
    doc.line(colX[i], y, colX[i], y + tableDataH);
  }

  // Table Data
  doc.setFont('calibri', 'normal');
  doc.setFontSize(8);
  let rowY = y + 4;
  const items = req.itRecommendations || req.requestedItems || [];
  
  if (items.length > 0) {
      // For Cash Advance or Payment Req, often there's just one summarized line or list.
      // We will list the items if they fit, or just a summary.
      // Assuming a few items.
      for (let i = 0; i < Math.min(items.length, 5); i++) {
          const item = items[i];
          doc.text(String(i + 1), colX[0] + colW[0] / 2, rowY, { align: 'center' });
          
          if (i === 0) {
              // Print dept on first row only
              doc.text(req.department || '', colX[1] + colW[1] / 2, rowY, { align: 'center' });
          }
          
          const descLines = doc.splitTextToSize(item.description || '-', colW[2] - 4);
          doc.text(descLines, colX[2] + 2, rowY);
          
          if ('price' in item && (item as any).price) {
            doc.text(req.currency || 'IDR', colX[3] + colW[3] / 2, rowY, { align: 'center' });
            
            const totalItemAmount = ((item as any).price || 0) * (item.qty || 1);
            doc.text(new Intl.NumberFormat('id-ID').format(totalItemAmount), colX[4] + colW[4] - 2, rowY, { align: 'right' });
          }
          
          rowY += descLines.length * 3.5 + 1.5;
      }
  }

  y += tableDataH;

  // Footer Total Row
  const footerH = 6;
  doc.rect(marginL, y, contentW, footerH);
  doc.line(colX[3], y, colX[3], y + footerH);
  doc.line(colX[4], y, colX[4], y + footerH);
  
  doc.setFont('calibri', 'bold');
  doc.text('Total', colX[3] + colW[3] / 2, y + 4, { align: 'center' });
  
  const finalAmount = formData.amount !== undefined ? formData.amount : (req.grandTotal || 0);
  if (finalAmount > 0) {
    doc.text(new Intl.NumberFormat('id-ID').format(finalAmount), colX[4] + colW[4] - 2, y + 4, { align: 'right' });
  }

  y += footerH + 10;

  // 5. IN WORDS
  doc.setFont('calibri', 'normal');
  doc.setFontSize(9);
  doc.text('In Words :', marginL, y);
  
  const wordsText = finalAmount > 0 ? convertNumberToWords(finalAmount) : '';
  doc.text(wordsText, marginL + 16, y);
  doc.line(marginL + 14, y + 1, marginL + contentW, y + 1);

  y += 12;

  // 6. SIGNATURE BOXES
  const sigBoxW = 21;
  const sigBoxH = 18;
  const sigHeaderH = 6;
  
  const headers = ['Requested by', 'Approved by', 'Finance', 'Accounting'];
  
  let sigX = marginL;
  for (let i = 0; i < headers.length; i++) {
    doc.rect(sigX, y, sigBoxW, sigBoxH);
    doc.line(sigX, y + sigHeaderH, sigX + sigBoxW, y + sigHeaderH);
    
    doc.setFont('calibri', 'bold');
    doc.setFontSize(8);
    doc.text(headers[i], sigX + sigBoxW / 2, y + 4, { align: 'center' });
    
    doc.setFont('calibri', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('(Name)', sigX + sigBoxW / 2, y + sigBoxH - 2, { align: 'center' });
    doc.setTextColor(0);
    
    sigX += sigBoxW;
  }

  // Received by
  const recX = sigX + 12;
  doc.setFont('calibri', 'bold');
  doc.setFontSize(8);
  doc.text('Received by', recX + (sigBoxW / 2), y + 4, { align: 'center' });
  
  doc.line(recX, y + sigBoxH - 5, recX + sigBoxW, y + sigBoxH - 5);
  doc.setFont('calibri', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text('(Name)', recX + (sigBoxW / 2), y + sigBoxH - 2, { align: 'center' });
  
  // --- CUTTING GUIDE LINE ---
  // Draw a dashed vertical line at the center of A4 landscape (x = 148.5mm)
  // This marks the A5 boundary for cutting.
  const cutX = 148.5;
  doc.setDrawColor(180, 180, 180); // light gray
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 2], 0); // dashed: 2mm on, 2mm off

  // Draw dashes manually for full page height
  const dashLen = 2;
  const gapLen = 2;
  let dy = 0;
  while (dy < 210) {
    doc.line(cutX, dy, cutX, Math.min(dy + dashLen, 210));
    dy += dashLen + gapLen;
  }

  // Small scissors label at top
  doc.setLineDashPattern([], 0); // reset dash
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(160, 160, 160);
  doc.text('✂', cutX, 4, { align: 'center' });

  // Reset drawing color
  doc.setDrawColor(0);
  doc.setTextColor(0);

  // Save PDF
  const cleanId = String(req.id || '000').padStart(4, '0');
  const typeStr = type === 'cash_advance' ? 'CA' : 'PRQ';
  doc.save(`${typeStr}-${cleanId}.pdf`);
}
