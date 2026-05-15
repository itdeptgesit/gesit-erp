import jsPDF from 'jspdf';
import { PhoneExtension } from '../types';

export function exportDirectoryPDF(extensions: PhoneExtension[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 8;
  const usableW = pageW - M * 2;
  const colGap = 3;
  const colW = (usableW - colGap * 2) / 3;
  const colXs = [M, M + colW + colGap, M + (colW + colGap) * 2];

  const titleCase = (s: string) =>
    s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const getDeptLike = (floor: number, partial: string): PhoneExtension[] =>
    extensions
      .filter((e) => Number(e.floor) === floor && e.dept.toLowerCase().includes(partial.toLowerCase()))
      .sort((a, b) => a.id - b.id);

  const getDept = (floor: number, dept: string): PhoneExtension[] =>
    extensions
      .filter((e) => Number(e.floor) === floor && e.dept.toLowerCase() === dept.toLowerCase())
      .sort((a, b) => a.id - b.id);

  const ROW_H = 3.5;
  const HDR_H = 4;

  // ── Draw a single bordered row ──
  const drawRow = (name: string, ext: string, x: number, y: number, w: number, dashed = false) => {
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.15);
    if (dashed) {
      const dl = 1.2, gl = 0.8;
      for (let dx = x; dx < x + w; dx += dl + gl) doc.line(dx, y, Math.min(dx + dl, x + w), y);
      for (let dx = x; dx < x + w; dx += dl + gl) doc.line(dx, y + ROW_H, Math.min(dx + dl, x + w), y + ROW_H);
      for (let dy = y; dy < y + ROW_H; dy += dl + gl) doc.line(x, dy, x, Math.min(dy + dl, y + ROW_H));
      for (let dy = y; dy < y + ROW_H; dy += dl + gl) doc.line(x + w, dy, x + w, Math.min(dy + dl, y + ROW_H));
    } else {
      doc.rect(x, y, w, ROW_H);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(30, 30, 30);
    doc.text(name, x + 1.2, y + 2.5, { maxWidth: w - 12 });
    doc.setFont('helvetica', 'bold');
    doc.text(ext, x + w - 1.2, y + 2.5, { align: 'right' });
  };

  // ── Draw department block ──
  const drawDeptBlock = (
    label: string, items: PhoneExtension[], x: number, y: number, w: number
  ): number => {
    if (items.length === 0) return 0;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(20, 20, 20);
    const tw = doc.getTextWidth(label);
    const tx = x + (w - tw) / 2;
    doc.text(label, tx, y + 2.8);
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.25);
    doc.line(tx, y + 3.4, tx + tw, y + 3.4);

    items.forEach((item, idx) => {
      const ry = y + HDR_H + idx * ROW_H;
      const name = titleCase(item.name);
      const roleStr = item.role ? ` (${item.role})` : '';
      drawRow(name + roleStr, item.ext, x, ry, w);
    });

    return HDR_H + items.length * ROW_H;
  };

  // ══════════════════════════════════════
  //  TITLE
  // ══════════════════════════════════════
  doc.setFontSize(13);
  doc.setFont('times', 'bolditalic');
  doc.setTextColor(20, 20, 20);
  doc.text('TGC Internal Directory', pageW / 2, 10, { align: 'center' });

  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text('The City Tower 27th Floor', M, 14.5);
  doc.text('Jl. M.H. Thamrin no. 81, Jakarta - 10310', M, 17);
  doc.text('021 3101601 (Hunting)', M, 19.5);

  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  doc.setTextColor(180, 0, 0);
  doc.setFont('helvetica', 'italic');
  doc.text(`Last update: ${months[now.getMonth()]} ${now.getFullYear()}`, pageW - M, 14.5, { align: 'right' });

  // ══════════════════════════════════════
  //  BOARD OF COMMISSIONERS — Top center hierarchy
  // ══════════════════════════════════════
  const boardX = colXs[1];
  const boardW = colW;
  const paX = colXs[2];
  const paW = colW;
  let boardY = 22;

  // Board header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(20, 20, 20);
  const bhText = 'Board of Commisioners';
  doc.text(bhText, boardX + boardW / 2, boardY, { align: 'center' });
  boardY += 1.5;

  const boardItems = getDeptLike(27, 'Board of Com');
  const paItems = getDeptLike(27, 'PA').concat(getDeptLike(27, 'Secretary'));

  const findItem = (list: PhoneExtension[], name: string) =>
    list.find((e) => e.name.toLowerCase().startsWith(name.toLowerCase()));

  let bRow = boardY;

  // MSA, MSA Bed Room | Ety
  const msa = findItem(boardItems, 'MSA');
  const msaBed = findItem(boardItems, 'MSA Bed');
  const ety = findItem(paItems, 'Ety');
  if (msa) { drawRow(msa.name, msa.ext, boardX, bRow, boardW); bRow += ROW_H; }
  if (msaBed) { drawRow(msaBed.name, msaBed.ext, boardX, bRow, boardW); bRow += ROW_H; }
  if (ety) drawRow(titleCase(ety.name), ety.ext, paX, boardY, paW, true);

  // Connector
  bRow += 0.8;
  doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.2);
  doc.line(boardX + boardW / 2, bRow - 0.8, boardX + boardW / 2, bRow + 0.8);
  bRow += 1;

  // JSB | Kiki
  const jsb = findItem(boardItems, 'JSB');
  const kiki = findItem(paItems, 'Kiki') || findItem(paItems, 'Intan');
  if (jsb) drawRow(jsb.name, jsb.ext, boardX, bRow, boardW);
  if (kiki) drawRow(titleCase(kiki.name), kiki.ext, paX, bRow, paW, true);
  bRow += ROW_H + 1;
  doc.line(boardX + boardW / 2, bRow - 1, boardX + boardW / 2, bRow);

  // JSC | Dinny
  const jsc = findItem(boardItems, 'JSC');
  const dinny = findItem(paItems, 'Dinny');
  if (jsc) drawRow(jsc.name, jsc.ext, boardX, bRow, boardW);
  if (dinny) drawRow(titleCase(dinny.name), dinny.ext, paX, bRow, paW, true);
  bRow += ROW_H + 1;
  doc.line(boardX + boardW / 2, bRow - 1, boardX + boardW / 2, bRow);

  // MSB, MSC, MSD | Asma
  const msb = findItem(boardItems, 'MSB');
  const msc = findItem(boardItems, 'MSC');
  const msd = findItem(boardItems, 'MSD');
  const asma = findItem(paItems, 'Asma');
  const msbY = bRow;
  if (msb) { drawRow(msb.name, msb.ext, boardX, bRow, boardW); bRow += ROW_H; }
  if (msc) { drawRow(msc.name, msc.ext, boardX, bRow, boardW); bRow += ROW_H; }
  if (msd) { drawRow(msd.name, msd.ext, boardX, bRow, boardW); bRow += ROW_H; }
  if (asma) drawRow(titleCase(asma.name), asma.ext, paX, msbY, paW, true);

  // Deputy CEO & President
  bRow += 0.3;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(5); doc.setTextColor(20, 20, 20);
  const depText = 'Deputy CEO & President';
  doc.text(depText, boardX + boardW / 2, bRow + 2.2, { align: 'center' });
  const dtw = doc.getTextWidth(depText);
  doc.setLineWidth(0.25);
  doc.line(boardX + (boardW - dtw) / 2, bRow + 2.8, boardX + (boardW + dtw) / 2, bRow + 2.8);
  bRow += HDR_H;

  const jones = findItem(getDeptLike(27, 'Deputy CEO'), 'Jones');
  const dwi = findItem(paItems, 'Dwi');
  if (jones) drawRow(titleCase(jones.name), jones.ext, boardX, bRow, boardW);
  if (dwi) drawRow(titleCase(dwi.name), dwi.ext, paX, bRow, paW, true);
  bRow += ROW_H;

  // ══════════════════════════════════════
  //  DIALING INSTRUCTIONS (left side, alongside board)
  // ══════════════════════════════════════
  let iy = 24;
  doc.setFontSize(4);

  const drawInstr = (label: string, code: string) => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
    doc.text(label, M, iy);
    if (code) { doc.setFont('helvetica', 'normal'); doc.text(code, M, iy + 2.2); }
    iy += code ? 5 : 3;
  };

  drawInstr('Pick up Incoming Call: #70', '');
  drawInstr('How to make an ext call Lt.26', '## + Ext lt. 26');
  drawInstr('How to make an outgoing call', '* + PIN + 9 + Phone No.');
  drawInstr('How to make an international call', '* + PIN + 9 + 01017 + Country + Phone No.');

  // ══════════════════════════════════════
  //  FLOOR 27 — 3-column departments
  // ══════════════════════════════════════
  const deptStartY = bRow + 2;
  let leftY = deptStartY;
  let centerY = deptStartY;
  let rightY = deptStartY;
  const gap = 1.5;
  let h: number;

  // LEFT
  h = drawDeptBlock('Corporate Affair', getDeptLike(27, 'Corporate Affair'), colXs[0], leftY, colW);
  leftY += h + gap;
  h = drawDeptBlock('Finance & Accounting', getDept(27, 'Finance & Accounting'), colXs[0], leftY, colW);
  leftY += h + gap;
  const propFin = getDeptLike(27, 'Business Development').concat(getDeptLike(27, 'Financial Investment'));
  if (propFin.length > 0) {
    h = drawDeptBlock('Property & Financial Investment', propFin, colXs[0], leftY, colW);
    leftY += h + gap;
  }

  // CENTER
  const recep = getDeptLike(27, 'Receptionist');
  if (recep.length > 0) { h = drawDeptBlock('Receptionist', recep, colXs[1], centerY, colW); centerY += h + gap; }
  h = drawDeptBlock('Common Areas', getDeptLike(27, 'Common Area'), colXs[1], centerY, colW);
  centerY += h + gap;

  // RIGHT
  h = drawDeptBlock('Corporate Secretary', getDeptLike(27, 'Corporate Secretary'), colXs[2], rightY, colW);
  rightY += h + gap;
  h = drawDeptBlock('HR & Logistic', getDeptLike(27, 'HR & Logistic'), colXs[2], rightY, colW);
  rightY += h + gap;
  h = drawDeptBlock('Trading', getDept(27, 'Trading'), colXs[2], rightY, colW);
  rightY += h + gap;
  h = drawDeptBlock('Gesit Foundation', getDeptLike(27, 'Gesit Foundation'), colXs[2], rightY, colW);
  rightY += h + gap;

  // ══════════════════════════════════════
  //  FLOOR 26 BANNER
  // ══════════════════════════════════════
  const floor26Y = Math.max(leftY, centerY, rightY) + 1.5;
  doc.setFillColor(25, 50, 35);
  doc.rect(M, floor26Y, usableW, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('Gesit Natural Resources the 26th Floor', pageW / 2, floor26Y + 3.4, { align: 'center' });

  // ══════════════════════════════════════
  //  FLOOR 26 — Columns start right after banner
  // ══════════════════════════════════════
  const y26Start = floor26Y + 7;
  let l26 = y26Start, c26 = y26Start, r26 = y26Start;

  // CENTER
  h = drawDeptBlock('Deputy Head', getDeptLike(26, 'Deputy Head'), colXs[1], c26, colW);
  c26 += h + gap;
  h = drawDeptBlock('Vice President', getDeptLike(26, 'Vice President'), colXs[1], c26, colW);
  c26 += h + gap;
  h = drawDeptBlock('Office Management', getDeptLike(26, 'Office Management'), colXs[1], c26, colW);
  c26 += h + gap;
  h = drawDeptBlock('Information Technology', getDeptLike(26, 'Information Technology'), colXs[1], c26, colW);
  c26 += h + gap;
  h = drawDeptBlock('Engineering', getDeptLike(26, 'Engineering'), colXs[1], c26, colW);
  c26 += h + gap;
  const fd = getDeptLike(26, 'Front Desk');
  if (fd.length > 0) { h = drawDeptBlock('Front Desk', fd, colXs[1], c26, colW); c26 += h + gap; }

  // LEFT — departments first
  h = drawDeptBlock('Legal & Compliance', getDeptLike(26, 'Legal'), colXs[0], l26, colW);
  l26 += h + gap;
  h = drawDeptBlock('HRGA', getDeptLike(26, 'HRGA'), colXs[0], l26, colW);
  l26 += h + gap;
  const bu = getDeptLike(26, 'Bussines').concat(getDeptLike(26, 'Business Unit'));
  if (bu.length > 0) { h = drawDeptBlock('Bussines Unit', bu, colXs[0], l26, colW); l26 += h + gap; }
  h = drawDeptBlock('Government Relation', getDeptLike(26, 'Government'), colXs[0], l26, colW);
  l26 += h + gap;

  // 26th dialing instructions — at the bottom of left column
  l26 += 1;
  doc.setFontSize(3.8); doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('How to make an outgoing call', colXs[0], l26);
  doc.setFont('helvetica', 'normal');
  doc.text('81** + PIN + Phone No.', colXs[0], l26 + 2.5);
  doc.setFont('helvetica', 'bold');
  doc.text('How to make an ext call Lt.27', colXs[0], l26 + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text('88** + PIN + Ext lt. 27', colXs[0], l26 + 8);

  // RIGHT
  h = drawDeptBlock('Permit & License', getDeptLike(26, 'Permit'), colXs[2], r26, colW);
  r26 += h + gap;
  h = drawDeptBlock('Finance & Accounting', getDept(26, 'Finance & Accounting'), colXs[2], r26, colW);
  r26 += h + gap;
  h = drawDeptBlock('Procurement', getDeptLike(26, 'Procurement'), colXs[2], r26, colW);
  r26 += h + gap;
  h = drawDeptBlock('Sales / Marketing', getDeptLike(26, 'Sales'), colXs[2], r26, colW);
  r26 += h + gap;

  // FOOTER
  doc.setFontSize(3.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('GESIT Internal Directory - Confidential', M, pageH - 4);
  doc.text(`Generated: ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageW - M, pageH - 4, { align: 'right' });

  doc.save(`GESIT-Directory-${now.toISOString().split('T')[0]}.pdf`);
}
