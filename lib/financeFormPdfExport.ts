import jsPDF from 'jspdf';
import { PurchaseRequisition } from '../types';
import { supabase } from './supabaseClient';

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
  costCenter: string;   // abbreviation e.g. "GA" for "GESIT ALUMAS"
  projectName: string;
  cekBgNo: string;
  bankName: string;
  paymentMethod: 'Cash' | 'Transfer';
  transferTo: string;
  paidTo?: string;
  requestDate?: string;
  amount?: number; // Optional override
  paperSize?: 'a4_half' | 'a5' | 'a4_duplicate';
}

/**
 * Draw a single finance voucher (Cash Advance or Payment Requisition)
 * Sized for A5 (148.5 x 210 mm)
 */
const drawSingleFinanceVoucher = (
  doc: jsPDF,
  req: PurchaseRequisition,
  type: 'cash_advance' | 'payment_requisition',
  formData: FinanceFormData,
  logoImg: HTMLImageElement | null,
  logoBase64: string | null,
  offsetX: number = 0,
  isCopy: boolean = false
) => {
  const pageW = 148.5;
  const pageH = 210;
  const marginL = 8;
  const marginR = 8;
  const contentW = pageW - marginL - marginR; // 132.5mm

  let y = 8;

  // 1. LOGO & COMPANY NAME
  if (logoImg && logoBase64) {
    const originalW = logoImg.naturalWidth || logoImg.width || 100;
    const originalH = logoImg.naturalHeight || logoImg.height || 100;
    const aspect = originalW / originalH;
    const logoH = 9.5;
    const logoW = logoH * aspect;

    const companyText = 'THE GESIT COMPANIES';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    const emblemX = offsetX + marginL;
    const textX = emblemX + logoW + 3;

    doc.addImage(logoBase64, 'PNG', emblemX, y - 4, logoW, logoH, undefined, 'FAST');
    doc.text(companyText, textX, y + 2.5);
  }

  // Duplicate badge if isCopy
  if (isCopy) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text('[ ARSIP / COPY ]', offsetX + pageW - marginR, y + 2.5, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  y += 14;

  // 2. MAIN TITLE
  doc.setFont('calibri', 'bold');
  doc.setFontSize(13.5);
  const titleText = type === 'cash_advance' ? 'CASH ADVANCE' : 'PAYMENT REQUISITION';
  const centerX = offsetX + (pageW / 2);
  doc.text(titleText, centerX, y, { align: 'center' });

  // Title Underline
  const titleW = doc.getTextWidth(titleText);
  doc.setLineWidth(0.4);
  doc.line(centerX - (titleW / 2), y + 1.5, centerX + (titleW / 2), y + 1.5);

  y += 10;

  // 3. METADATA HEADER
  doc.setFont('calibri', 'normal');
  doc.setFontSize(8.5);

  const col1X = offsetX + marginL;
  const col1LabelW = 24;
  const col1ValX = col1X + col1LabelW + 2;

  const col2LabelW = 18;
  const col2LineW = 24;
  const col2X = offsetX + marginL + contentW - col2LabelW - col2LineW - 2;
  const col2ValX = col2X + col2LabelW + 2;

  const col1LineW = col2X - col1ValX - 3;
  const rowHeight = 7.5;

  // Row 1: Company & Cek/BG No.
  doc.text('Company', col1X, y);
  doc.text(':', col1X + col1LabelW, y);
  doc.text(formData.companyName || '', col1ValX, y);
  doc.setLineWidth(0.15);
  doc.line(col1ValX, y + 0.8, col1ValX + col1LineW, y + 0.8);

  doc.text('Cek / BG No.', col2X, y);
  doc.text(':', col2X + col2LabelW, y);
  doc.text(formData.cekBgNo || '', col2ValX, y);
  doc.line(col2ValX, y + 0.8, col2ValX + col2LineW, y + 0.8);

  y += rowHeight;

  // Row 2: Project Name & Bank
  doc.text('Project Name', col1X, y);
  doc.text(':', col1X + col1LabelW, y);
  const projNameLines = doc.splitTextToSize(formData.projectName || '', col1LineW);
  doc.text(projNameLines[0] || '', col1ValX, y);
  doc.line(col1ValX, y + 0.8, col1ValX + col1LineW, y + 0.8);

  doc.text('Bank', col2X, y);
  doc.text(':', col2X + col2LabelW, y);
  doc.text(formData.bankName || '', col2ValX, y);
  doc.line(col2ValX, y + 0.8, col2ValX + col2LineW, y + 0.8);

  y += rowHeight;

  // Row 3: Request Date & Pay to
  doc.text('Request Date', col1X, y);
  doc.text(':', col1X + col1LabelW, y);
  doc.text(formatIndonesianDate(formData.requestDate || req.requestDate), col1ValX, y);
  doc.line(col1ValX, y + 0.8, col1ValX + col1LineW, y + 0.8);

  const paidToText = formData.paidTo || req.paidTo || formData.transferTo || '';
  doc.text('Pay to', col2X, y);
  doc.text(':', col2X + col2LabelW, y);
  const paidToLines = doc.splitTextToSize(paidToText, col2LineW + 2);
  doc.text(paidToLines[0] || '', col2ValX, y);
  doc.line(col2ValX, y + 0.8, col2ValX + col2LineW, y + 0.8);

  y += rowHeight;

  // Row 4: Payment Method
  doc.text('Payment Method', col1X, y);
  doc.text(':', col1X + col1LabelW, y);

  // Checkbox Cash
  const boxY = y - 3.2;
  doc.setLineWidth(0.2);
  doc.rect(col1ValX, boxY, 3.5, 3.5);
  doc.text('Cash', col1ValX + 5.5, y);
  if (formData.paymentMethod === 'Cash') {
    doc.setLineWidth(0.35);
    doc.line(col1ValX + 0.5, boxY + 1.8, col1ValX + 1.3, boxY + 2.7);
    doc.line(col1ValX + 1.3, boxY + 2.7, col1ValX + 3.0, boxY + 0.8);
    doc.setLineWidth(0.2);
  }

  // Checkbox Transfer
  const transferX = col1ValX + 16;
  doc.rect(transferX, boxY, 3.5, 3.5);
  doc.text('Transfer to :', transferX + 5.5, y);
  if (formData.paymentMethod === 'Transfer') {
    doc.setLineWidth(0.35);
    doc.line(transferX + 0.5, boxY + 1.8, transferX + 1.3, boxY + 2.7);
    doc.line(transferX + 1.3, boxY + 2.7, transferX + 3.0, boxY + 0.8);
    doc.setLineWidth(0.2);
  }

  // Transfer destination line
  const transferDestX = transferX + 22;
  const transferDestW = (offsetX + marginL + contentW) - transferDestX;
  if (formData.paymentMethod === 'Transfer') {
    const destText = formData.transferTo || req.bankAccount || '';
    const destLines = doc.splitTextToSize(destText, transferDestW - 2);
    doc.text(destLines[0] || '', transferDestX + 1, y);
  }
  doc.setLineWidth(0.15);
  doc.line(transferDestX, y + 0.8, offsetX + marginL + contentW, y + 0.8);

  y += 8;

  // 4. ITEMS TABLE
  const colW = [8, 24, 48.5, 20, 32]; // Total 132.5 mm
  let colX: number[] = [offsetX + marginL];
  for (let i = 0; i < colW.length - 1; i++) {
    colX.push(colX[i] + colW[i]);
  }

  const tableHeaderH = 7.5;
  doc.setLineWidth(0.25);

  // Header Background & Borders
  doc.rect(offsetX + marginL, y, contentW, tableHeaderH);
  for (let i = 1; i < colX.length; i++) {
    doc.line(colX[i], y, colX[i], y + tableHeaderH);
  }

  doc.setFont('calibri', 'bold');
  doc.setFontSize(8);
  doc.text('No.', colX[0] + colW[0] / 2, y + 4.8, { align: 'center' });
  doc.text('Cost Center /\nDepartment', colX[1] + colW[1] / 2, y + 3.2, { align: 'center' });
  doc.text('Description', colX[2] + colW[2] / 2, y + 4.8, { align: 'center' });
  doc.text('Currency', colX[3] + colW[3] / 2, y + 4.8, { align: 'center' });
  doc.text('Amount', colX[4] + colW[4] / 2, y + 4.8, { align: 'center' });

  y += tableHeaderH;

  // Items
  const items = req.itRecommendations || req.requestedItems || [];
  const itemRowH = 5;
  const lineH = 3.5;

  // Pre-calculate heights & overflow prevention
  // Footer (6mm) + spacing (7mm) + in words (9mm) + signatures (22mm) + margin (6mm) = ~50mm
  const maxTableH = Math.max(25, pageH - y - 50);

  let measuredRowsH = 0;
  let visibleCount = 0;
  for (const item of items) {
    const descLines = doc.splitTextToSize(item.description || '-', colW[2] - 4);
    const rh = descLines.length * lineH + (itemRowH - lineH);
    if (measuredRowsH + rh > maxTableH && visibleCount > 0) {
      break;
    }
    measuredRowsH += rh;
    visibleCount++;
  }

  const tableDataH = Math.max(measuredRowsH + 4, 18);

  doc.setLineWidth(0.25);
  doc.rect(offsetX + marginL, y, contentW, tableDataH);
  for (let i = 1; i < colX.length; i++) {
    doc.line(colX[i], y, colX[i], y + tableDataH);
  }

  doc.setFont('calibri', 'normal');
  doc.setFontSize(7.5);
  let rowY = y + 4;

  if (items.length === 0) {
    doc.text('1', colX[0] + colW[0] / 2, rowY, { align: 'center' });
    doc.text(formData.costCenter || req.department || '', colX[1] + colW[1] / 2, rowY, { align: 'center' });
    doc.text(formData.projectName || 'Pengeluaran Operasional / IT', colX[2] + 2, rowY);
    doc.text(req.currency || 'IDR', colX[3] + colW[3] / 2, rowY, { align: 'center' });
    const finalAmt = formData.amount !== undefined ? formData.amount : (req.grandTotal || 0);
    if (finalAmt > 0) {
      doc.text(new Intl.NumberFormat('id-ID').format(finalAmt), colX[4] + colW[4] - 2, rowY, { align: 'right' });
    }
  } else {
    for (let i = 0; i < visibleCount; i++) {
      const item = items[i];
      doc.text(String(i + 1), colX[0] + colW[0] / 2, rowY, { align: 'center' });

      if (i === 0) {
        doc.text(formData.costCenter || req.department || '', colX[1] + colW[1] / 2, rowY, { align: 'center' });
      }

      const descLines = doc.splitTextToSize(item.description || '-', colW[2] - 4);
      doc.text(descLines, colX[2] + 2, rowY);

      if ('price' in item && (item as any).price) {
        doc.text(req.currency || 'IDR', colX[3] + colW[3] / 2, rowY, { align: 'center' });
        const totalItemAmount = ((item as any).price || 0) * (item.qty || 1);
        doc.text(new Intl.NumberFormat('id-ID').format(totalItemAmount), colX[4] + colW[4] - 2, rowY, { align: 'right' });
      }

      rowY += descLines.length * lineH + (itemRowH - lineH);
    }

    if (items.length > visibleCount) {
      doc.setFont('calibri', 'italic');
      doc.setFontSize(6.5);
      doc.text(`+ ${items.length - visibleCount} item lainnya (lihat lampiran)`, colX[2] + 2, y + tableDataH - 1.5);
      doc.setFont('calibri', 'normal');
      doc.setFontSize(7.5);
    }
  }

  y += tableDataH;

  // Footer Total Row
  const footerH = 6;
  doc.rect(offsetX + marginL, y, contentW, footerH);
  doc.line(colX[3], y, colX[3], y + footerH);
  doc.line(colX[4], y, colX[4], y + footerH);

  doc.setFont('calibri', 'bold');
  doc.setFontSize(8);
  doc.text('Total', colX[3] + colW[3] / 2, y + 4.2, { align: 'center' });

  const finalAmount = formData.amount !== undefined ? formData.amount : (req.grandTotal || 0);
  if (finalAmount > 0) {
    doc.text(new Intl.NumberFormat('id-ID').format(finalAmount), colX[4] + colW[4] - 2, y + 4.2, { align: 'right' });
  }

  y += footerH + 7;

  // 5. IN WORDS
  doc.setFont('calibri', 'normal');
  doc.setFontSize(8);
  doc.text('In Words :', offsetX + marginL, y);

  const wordsText = finalAmount > 0 ? convertNumberToWords(finalAmount) : '';
  const wordsLines = doc.splitTextToSize(wordsText, contentW - 20);
  doc.text(wordsLines[0] || '', offsetX + marginL + 18, y);
  doc.setLineWidth(0.15);
  doc.line(offsetX + marginL + 16, y + 0.8, offsetX + marginL + contentW, y + 0.8);

  y += 9;

  // 6. SIGNATURE BOXES
  const boxedHeaders = ['Requested by', 'Approved by', 'Finance', 'Accounting'];
  const sigBoxW = contentW / 5; // 26.5 mm each
  const sigBoxH = 22;
  const sigHeaderH = 7;

  // First 4: bordered boxes
  let sigX = offsetX + marginL;
  for (let i = 0; i < boxedHeaders.length; i++) {
    doc.setLineWidth(0.25);
    doc.rect(sigX, y, sigBoxW, sigBoxH);
    doc.line(sigX, y + sigHeaderH, sigX + sigBoxW, y + sigHeaderH);

    doc.setFont('calibri', 'bold');
    doc.setFontSize(8);
    doc.text(boxedHeaders[i], sigX + sigBoxW / 2, y + 4.8, { align: 'center' });

    sigX += sigBoxW;
  }

  // Received by: no outer border — just label + underline
  const recCenterX = sigX + sigBoxW / 2;
  doc.setFont('calibri', 'bold');
  doc.setFontSize(8);
  doc.text('Received by', recCenterX, y + 4.8, { align: 'center' });

  const lineInset = 3;
  doc.setLineWidth(0.25);
  doc.line(sigX + lineInset, y + sigBoxH - 3, sigX + sigBoxW - lineInset, y + sigBoxH - 3);
};

/**
 * Cutting guide line in the middle of A4 landscape (x = 148.5 mm)
 */
const drawCuttingGuide = (doc: jsPDF, pageH: number = 210) => {
  const cutX = 148.5;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.25);
  doc.setLineDashPattern([2, 2], 0);

  // Full page height dashed line
  doc.line(cutX, 0, cutX, pageH);

  doc.setLineDashPattern([], 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text('✂ POTONG DI SINI / CUT HERE', cutX, 5, { align: 'center' });

  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(0, 0, 0);
};

export async function exportFinanceFormPDF(
  req: PurchaseRequisition,
  type: 'cash_advance' | 'payment_requisition',
  formData: FinanceFormData
) {
  const paperSize = formData.paperSize || 'a4_half';

  let doc: jsPDF;
  if (paperSize === 'a5') {
    doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });
  } else {
    // 'a4_half' and 'a4_duplicate' both use A4 landscape
    doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
  }

  const logoImg = await loadLogoImage();
  const logoBase64 = await loadLogoBase64();

  await loadCalibriFont(doc);

  if (paperSize === 'a5') {
    // Full A5 single voucher
    drawSingleFinanceVoucher(doc, req, type, formData, logoImg, logoBase64, 0, false);
  } else if (paperSize === 'a4_duplicate') {
    // Left half: Original
    drawSingleFinanceVoucher(doc, req, type, formData, logoImg, logoBase64, 0, false);
    // Right half: Copy
    drawSingleFinanceVoucher(doc, req, type, formData, logoImg, logoBase64, 148.5, true);
    // Cutting guide line in middle
    drawCuttingGuide(doc, 210);
  } else {
    // 'a4_half' (Default): Left half voucher, center cutting line
    drawSingleFinanceVoucher(doc, req, type, formData, logoImg, logoBase64, 0, false);
    drawCuttingGuide(doc, 210);
  }

  const cleanId = String(req.id || '000').padStart(4, '0');
  const typeStr = type === 'cash_advance' ? 'CA' : 'PRQ';
  doc.save(`${typeStr}-${cleanId}.pdf`);
}

// ==========================================
// EXPENSE APPROVAL — Cash Advance Settlement
// ==========================================

export interface ExpenseApprovalFormData {
  companyName: string;
  costCenter: string;
  projectName: string;
  cekBgNo: string;
  bankName: string;
  paymentMethod: 'Cash' | 'Transfer';
  transferTo: string;
  paidTo: string;
  requestDate: string;
  note: string;
  actualExpense: number;
  cashAdvanceAmount: number;
}

export interface ExpenseApprovalData {
  expense_number: string;
  company: string;
  department: string;
  project_name: string;
  request_date: string;
  paid_to: string;
  note: string;
  total_amount: number;
  // Settlement fields (matching Cash Advance settlement voucher)
  cash_advance_amount?: number;
  actual_expense?: number;
  refund_amount?: number;
  items_description?: string;
  // Fallback invoice fields
  invoice_number?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  // Signatures
  prepared_by_name: string;
  prepared_by_id?: string;
  approved_by_name?: string;
  approved_by_id?: string;
  status?: string;
}

// Map: user email → local e-sign image path (in /public/image/e-sign/)
const E_SIGN_MAP: Record<string, string> = {
  'sylvia@gesit.co.id': '/image/e-sign/sylvia.png',
  'rudi.siarudin@gesit.co.id': '/image/e-sign/siarudin.png',
  'desi@gesit.co.id': '/image/e-sign/desi.png',
  'natalia@gesit.co.id': '/image/e-sign/e-sign_bu-nata.png',
};

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(''); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve('');
      img.src = URL.createObjectURL(blob);
    });
  } catch {
    return null;
  }
};

const fetchGrayscaleLogoAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(''); return; }
        ctx.drawImage(img, 0, 0);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const luma = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = luma;
            data[i + 1] = luma;
            data[i + 2] = luma;
          }
          ctx.putImageData(imageData, 0, 0);
        } catch {
          // ignore security canvas error if any
        }
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve('');
      img.src = URL.createObjectURL(blob);
    });
  } catch {
    return null;
  }
};

const resolveESignImage = async (eSignUrlOrPath?: string | null): Promise<string | null> => {
  if (!eSignUrlOrPath) return null;
  const trimmed = eSignUrlOrPath.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  return await fetchImageAsBase64(trimmed);
};

const prefetchESignMap = async (): Promise<Record<string, string | null>> => {
  const cache: Record<string, string | null> = {};
  try {
    const { data: users } = await supabase
      .from('user_accounts')
      .select('id, email, full_name, e_sign_url');

    if (users && Array.isArray(users)) {
      for (const u of users) {
        let sign = u.e_sign_url ? await resolveESignImage(u.e_sign_url) : null;
        if (!sign && u.email) {
          const fallback = E_SIGN_MAP[u.email.toLowerCase().trim()];
          if (fallback) sign = await fetchImageAsBase64(fallback);
        }

        if (sign) {
          if (u.id) cache[String(u.id).toLowerCase().trim()] = sign;
          if (u.email) cache[u.email.toLowerCase().trim()] = sign;
          if (u.full_name) cache[u.full_name.toLowerCase().trim()] = sign;
        }
      }
    }
  } catch (err) {
    console.error('Error prefetching e-signs:', err);
  }
  return cache;
};

const getSign = (
  eSignMap: Record<string, string | null>,
  userId?: string,
  userName?: string
): string | null => {
  if (userId) {
    const key = String(userId).toLowerCase().trim();
    if (eSignMap[key]) return eSignMap[key];
  }
  if (userName) {
    const key = userName.toLowerCase().trim();
    if (eSignMap[key]) return eSignMap[key];
    if (E_SIGN_MAP[key]) return E_SIGN_MAP[key] || null;
  }
  return null;
};

const formatCardDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
};

const formatRupiahWithDot = (num: number): string => {
  return `Rp. ${new Intl.NumberFormat('id-ID').format(Math.round(num || 0))}`;
};


export const generateExpenseApprovalPdf = async (dataList: ExpenseApprovalData[]) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210;
  const pageH = 297;
  const cellW = 105;
  const cellH = 99;

  let logoBase64 = await fetchGrayscaleLogoAsBase64('/image/logo.png');
  if (!logoBase64) {
    logoBase64 = await loadLogoBase64();
  }

  const eSignMap = await prefetchESignMap();

  const drawPageCutGuides = (targetDoc: jsPDF) => {
    targetDoc.setDrawColor(180, 180, 180);
    targetDoc.setLineWidth(0.25);
    targetDoc.setLineDashPattern([2, 2], 0);

    targetDoc.line(cellW, 0, cellW, pageH);
    targetDoc.line(0, cellH, pageW, cellH);
    targetDoc.line(0, cellH * 2, pageW, cellH * 2);

    targetDoc.setLineDashPattern([], 0);
    targetDoc.setFont('helvetica', 'normal');
    targetDoc.setFontSize(5);
    targetDoc.setTextColor(150, 150, 150);

    targetDoc.text('✂', cellW, 3, { align: 'center' });
    targetDoc.text('✂', cellW, cellH + 3, { align: 'center' });
    targetDoc.text('✂', cellW, cellH * 2 + 3, { align: 'center' });

    targetDoc.setDrawColor(0, 0, 0);
    targetDoc.setTextColor(0, 0, 0);
  };

  const drawCard = (data: ExpenseApprovalData, index: number, offsetX: number, offsetY: number) => {
    // 1. Dashed cell frame
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([2, 2], 0);
    doc.setLineWidth(0.2);
    doc.rect(offsetX, offsetY, cellW, cellH);
    doc.setDrawColor(0, 0, 0);
    doc.setLineDashPattern([], 0);

    // 2. Logo + company header
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', offsetX + 5, offsetY + 4, 7.5, 7.5, undefined, 'FAST');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('THE GESIT COMPANIES', offsetX + 14, offsetY + 8.5);
    } else {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('THE GESIT COMPANIES', offsetX + 5, offsetY + 8.5);
    }

    // 3. Title: "Expenses Approval" (Centered & Underlined)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    const title = 'Expenses Approval';
    const titleWidth = doc.getTextWidth(title);
    const titleX = offsetX + (cellW - titleWidth) / 2;
    doc.text(title, titleX, offsetY + 15.5);
    doc.setLineWidth(0.4);
    doc.line(titleX, offsetY + 16.5, titleX + titleWidth, offsetY + 16.5);

    // 4. Metadata Fields (2 columns)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setLineWidth(0.2);

    const col1X = offsetX + 5;
    const col1ColonX = offsetX + 22;
    const col1ValX = offsetX + 24;
    const col1EndX = offsetX + 51;

    const col2X = offsetX + 54;
    const col2ColonX = offsetX + 66;
    const col2ValX = offsetX + 68;
    const col2EndX = offsetX + 100;

    const drawFieldLine = (
      label: string,
      val: string,
      lX: number,
      cX: number,
      vX: number,
      eX: number,
      yPos: number
    ) => {
      doc.text(label, lX, yPos);
      doc.text(':', cX, yPos);
      const split = doc.splitTextToSize(val || '', eX - vX);
      doc.text(split[0] || '', vX, yPos);
      doc.line(vX, yPos + 0.9, eX, yPos + 0.9);
    };

    // Row 1: Company & Dept.
    drawFieldLine('Company', data.company || '', col1X, col1ColonX, col1ValX, col1EndX, offsetY + 22);
    drawFieldLine('Dept.', data.department || '', col2X, col2ColonX, col2ValX, col2EndX, offsetY + 22);

    // Row 2: Project & Paid to
    drawFieldLine('Project', data.project_name || '', col1X, col1ColonX, col1ValX, col1EndX, offsetY + 29);
    drawFieldLine('Paid to', data.paid_to || 'Finance & Accounting', col2X, col2ColonX, col2ValX, col2EndX, offsetY + 29);

    // Row 3: Date & Note (Note = "Penyelesaian Cash Advance")
    drawFieldLine('Date', formatCardDate(data.request_date), col1X, col1ColonX, col1ValX, col1EndX, offsetY + 36);
    drawFieldLine('Note', 'Penyelesaian Cash Advance', col2X, col2ColonX, col2ValX, col2EndX, offsetY + 36);

    // Full-width description row (6mm gap after date row)
    const rawDesc = (data.items_description || data.project_name || '')
      .replace(/:\s*$/, '').trim();
    if (rawDesc) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const labelDesc = 'Pembelian';
      const labelDescW = doc.getTextWidth(labelDesc + ' : ');
      doc.text(labelDesc + ' : ', col1X, offsetY + 43);
      // Description lines: italic
      doc.setFont('helvetica', 'italic');
      const descAvailW = (offsetX + 100) - col1X - labelDescW;
      const descLines = doc.splitTextToSize(rawDesc, descAvailW);
      doc.text(descLines[0] || '', col1X + labelDescW, offsetY + 43);
      if (descLines[1]) {
        doc.text(descLines[1], col1X, offsetY + 47);
      }
    }


    // 5. Signature Box (Left half, starts at +55)
    const boxX = offsetX + 5;
    const boxY = offsetY + 55;
    const boxW = 46;
    const boxH = 28;

    doc.setLineWidth(0.3);
    doc.rect(boxX, boxY, boxW, boxH);
    doc.line(boxX + boxW / 2, boxY, boxX + boxW / 2, boxY + boxH);
    doc.line(boxX, boxY + 6, boxX + boxW, boxY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('Prepared by', boxX + boxW / 4, boxY + 4.5, { align: 'center' });
    doc.text('Approved by', boxX + (boxW * 3) / 4, boxY + 4.5, { align: 'center' });

    // 6. Cash Advance Settlement (Right half, same Y as box)
    const rX  = offsetX + 54;
    const rEX = offsetX + 100;
    const rY  = offsetY + 55;

    const actual = data.actual_expense !== undefined ? data.actual_expense : (data.total_amount || 0);
    const ca     = data.cash_advance_amount !== undefined ? data.cash_advance_amount : (data.total_amount || actual);
    const refund = data.refund_amount !== undefined ? data.refund_amount : (ca - actual);

    // CA amount (large)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(formatRupiahWithDot(ca), rEX, rY + 9, { align: 'right' });
    doc.setLineWidth(0.3);
    doc.line(rX, rY + 11, rEX, rY + 11);

    // CA formula
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const formula = `CA  :  ${formatRupiahWithDot(ca)}  -  ${formatRupiahWithDot(actual)}`;
    doc.text(formula, rEX, rY + 18, { align: 'right' });
    doc.setLineWidth(0.2);
    doc.line(rX, rY + 19.5, rEX, rY + 19.5);

    // Kembali / Kurang Bayar
    const refundLabel = refund >= 0 ? 'Kembali' : 'Kurang Bayar';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    const boxBottomY = boxY + boxH;
    doc.text(`${refundLabel} : ${formatRupiahWithDot(Math.abs(refund))}`, rEX, boxBottomY - 1.5, { align: 'right' });
    doc.setLineWidth(0.5);
    doc.line(rX, boxBottomY, rEX, boxBottomY);
  };

  for (let i = 0; i < dataList.length; i++) {
    const slotIdx = i % 6;
    if (i > 0 && slotIdx === 0) {
      doc.addPage();
    }
    const col = slotIdx % 2;
    const row = Math.floor(slotIdx / 2);
    const offsetX = col * cellW;
    const offsetY = row * cellH;
    drawCard(dataList[i], i, offsetX, offsetY);
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawPageCutGuides(doc);
  }

  const fileName =
    dataList.length === 1
      ? `${dataList[0].expense_number || '000'}_Expenses_Approval.pdf`
      : `Batch_${dataList.length}_Expenses_Approval.pdf`;
  doc.save(fileName);
};

export async function exportExpenseApprovalPDF(
  req: PurchaseRequisition,
  formData: ExpenseApprovalFormData
) {
  const cleanId = String(req.id || '000').padStart(4, '0');
  const actual = formData.actualExpense !== undefined ? formData.actualExpense : (req.grandTotal || 0);
  const ca = formData.cashAdvanceAmount !== undefined ? formData.cashAdvanceAmount : (req.grandTotal || 0);
  const refund = ca - actual;

  const requestedItemsDesc = (req.requestedItems || []).map((i) => i.description).filter(Boolean).join(', ');
  const itRecommendationsDesc = (req.itRecommendations || []).map((i) => i.description).filter(Boolean).join(', ');

  const dataItem: ExpenseApprovalData = {
    expense_number: `EA-${cleanId}`,
    company: formData.companyName || 'PT Gesit Perkasa',
    department: formData.costCenter || req.department || 'IT',
    project_name: formData.projectName || requestedItemsDesc || itRecommendationsDesc || '',
    request_date: formData.requestDate || req.requestDate || '',
    paid_to: formData.paidTo || 'Finance & Accounting',
    note: ' ',
    total_amount: actual,
    actual_expense: actual,
    cash_advance_amount: ca,
    refund_amount: refund,
    items_description: itRecommendationsDesc || requestedItemsDesc || formData.projectName || '',
    prepared_by_name: '',
    prepared_by_id: '',
    approved_by_name: '',
    approved_by_id: '',
    status: req.status || 'Approved',
  };

  await generateExpenseApprovalPdf([dataItem]);
}
