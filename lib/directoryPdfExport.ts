import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PhoneExtension } from '../types';
import cabinFonts from './cabinFonts.json';

export type DirectoryPdfFormat = 'desk_card' | 'table_report';

/**
 * Helper to register modern Cabin font
 */
function registerFonts(doc: jsPDF) {
  doc.addFileToVFS('Cabin-Regular.ttf', cabinFonts.regular);
  doc.addFont('Cabin-Regular.ttf', 'Cabin', 'normal');

  doc.addFileToVFS('Cabin-Bold.ttf', cabinFonts.bold);
  doc.addFont('Cabin-Bold.ttf', 'Cabin', 'bold');

  doc.addFileToVFS('Cabin-Italic.ttf', cabinFonts.italic);
  doc.addFont('Cabin-Italic.ttf', 'Cabin', 'italic');
}

/**
 * 1. Format: Kartu Meja (A4 Landscape 2-Up Desk Card)
 * Official TGC Internal Directory desk layout designed to be printed & cut down the middle.
 */
export function generateDirectoryDeskCardDoc(extensions: PhoneExtension[]): jsPDF {
  // A4 Landscape is 297mm x 210mm
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  registerFonts(doc);

  const pageW = 297;
  const pageH = 210;
  const midX = 148.5;

  const titleCase = (s?: string) =>
    (s || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const floor27Extensions = extensions.filter((e) => Number(e.floor) === 27);
  const floor26Extensions = extensions.filter((e) => Number(e.floor) === 26);

  const hasFloor27 = floor27Extensions.length > 0;
  const hasFloor26 = floor26Extensions.length > 0;

  const isSingleFloor = (hasFloor27 && !hasFloor26) || (!hasFloor27 && hasFloor26);
  const ROW_H = isSingleFloor ? 2.6 : 2.2;
  const HDR_H = isSingleFloor ? 3.0 : 2.5;
  const GAP = isSingleFloor ? 1.4 : 0.9;
  const FONT_SIZE_ROW = isSingleFloor ? 5.2 : 4.8;
  const FONT_SIZE_HDR = isSingleFloor ? 5.8 : 5.2;

  // ── Draw cutting guide line down the middle ──
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.25);
  const dashLength = 1.5;
  const gapLength = 1.5;
  for (let y = 4; y < pageH - 4; y += dashLength + gapLength) {
    doc.line(midX, y, midX, Math.min(y + dashLength, pageH - 4));
  }

  // ── Draw a single bordered row ──
  const drawRow = (name: string, ext: string, x: number, y: number, w: number, dashed = false) => {
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.15);
    if (dashed) {
      const dl = 1.0, gl = 0.6;
      for (let dx = x; dx < x + w; dx += dl + gl) doc.line(dx, y, Math.min(dx + dl, x + w), y);
      for (let dx = x; dx < x + w; dx += dl + gl) doc.line(dx, y + ROW_H, Math.min(dx + dl, x + w), y + ROW_H);
      for (let dy = y; dy < y + ROW_H; dy += dl + gl) doc.line(x, dy, x, Math.min(dy + dl, y + ROW_H));
      for (let dy = y; dy < y + ROW_H; dy += dl + gl) doc.line(x + w, dy, x + w, Math.min(dy + dl, y + ROW_H));
    } else {
      doc.rect(x, y, w, ROW_H);
    }
    doc.setFont('Cabin', 'bold');
    doc.setFontSize(FONT_SIZE_ROW);
    doc.setTextColor(30, 30, 30);
    doc.text(name, x + 1.1, y + (ROW_H * 0.7), { maxWidth: w - 8 });
    doc.text(ext, x + w - 1.1, y + (ROW_H * 0.7), { align: 'right' });
  };

  // ── Draw department block ──
  const drawDeptBlock = (
    label: string, items: PhoneExtension[], x: number, y: number, w: number, dashed = false
  ): { totalH: number; boxCenterY: number; endY: number } => {
    if (!items || items.length === 0) return { totalH: 0, boxCenterY: 0, endY: y };

    const hasLabel = label !== "";

    if (hasLabel) {
      doc.setFont('Cabin', 'bold');
      doc.setFontSize(FONT_SIZE_HDR);
      doc.setTextColor(20, 20, 20);
      const tw = doc.getTextWidth(label);
      const tx = x + (w - tw) / 2;
      doc.text(label, tx, y + (HDR_H * 0.68));
      doc.setDrawColor(20, 20, 20);
      doc.setLineWidth(0.18);
      doc.line(tx, y + (HDR_H * 0.8), tx + tw, y + (HDR_H * 0.8));
    }

    const boxY = hasLabel ? (y + HDR_H) : y;
    const boxH = items.length * ROW_H + 0.6;

    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.15);
    
    if (dashed) {
      const dl = 1.0, gl = 0.6;
      for (let dx = x; dx < x + w; dx += dl + gl) {
        doc.line(dx, boxY, Math.min(dx + dl, x + w), boxY);
        doc.line(dx, boxY + boxH, Math.min(dx + dl, x + w), boxY + boxH);
      }
      for (let dy = boxY; dy < boxY + boxH; dy += dl + gl) {
        doc.line(x, dy, x, Math.min(dy + dl, boxY + boxH));
        doc.line(x + w, dy, x + w, Math.min(dy + dl, boxY + boxH));
      }
    } else {
      doc.rect(x, boxY, w, boxH);
    }

    items.forEach((item, idx) => {
      const ry = boxY + 0.3 + idx * ROW_H;
      const name = titleCase(item.name);
      let roleStr = item.role && item.role.trim() !== '-' ? ` (${item.role})` : '';
      if (name.toLowerCase() === 'widya' && !roleStr) {
        roleStr = ' (receptionist)';
      }
      
      doc.setFont('Cabin', 'bold');
      doc.setFontSize(FONT_SIZE_ROW);
      doc.setTextColor(30, 30, 30);
      doc.text(name + roleStr, x + 1.0, ry + (ROW_H * 0.68), { maxWidth: w - 8 });
      doc.text(item.ext || '', x + w - 1.0, ry + (ROW_H * 0.68), { align: 'right' });
    });

    return {
      totalH: (hasLabel ? HDR_H : 0) + boxH,
      boxCenterY: boxY + boxH / 2,
      endY: boxY + boxH
    };
  };

  const drawCopy = (startX: number) => {
    const M = 15;
    const usableW = midX - M * 2;
    const colGap = 2.5;
    const colW = (usableW - colGap * 2) / 3;
    const colXs = [startX + M, startX + M + colW + colGap, startX + M + (colW + colGap) * 2];

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Title Block
    doc.setFontSize(12);
    doc.setFont('Cabin', 'bold');
    doc.setTextColor(20, 20, 20);
    const mainTitle = hasFloor27 && !hasFloor26
      ? 'TGC Internal Directory - 27th Floor'
      : !hasFloor27 && hasFloor26
        ? 'Gesit Natural Resources Directory - 26th Floor'
        : 'TGC Internal Directory';
    doc.text(mainTitle, startX + midX / 2, 8, { align: 'center' });

    doc.setFontSize(4.8);
    doc.setFont('Cabin', 'normal');
    doc.setTextColor(40, 40, 40);
    const subtitleFloor = hasFloor27
      ? 'The City Tower 27th Floor'
      : 'The City Tower 26th Floor';
    doc.text(subtitleFloor, startX + M, 11.5);
    doc.text('Jl. M.H. Thamrin no. 81, Jakarta - 10310', startX + M, 13.5);
    doc.text('021 3101601 (Hunting)', startX + M, 15.5);

    doc.setFont('Cabin', 'italic');
    doc.text(`Last update: ${months[now.getMonth()]} ${now.getFullYear()}`, startX + midX - M, 11.5, { align: 'right' });

    // Track assigned extensions to guarantee 100% of data is included with 0 omissions
    const assignedIds = new Set<string | number>();

    const get27 = (predicate: (e: PhoneExtension) => boolean): PhoneExtension[] => {
      const res = floor27Extensions
        .filter((e) => !assignedIds.has(e.id) && predicate(e))
        .sort((a, b) => a.id - b.id);
      res.forEach((e) => assignedIds.add(e.id));
      return res;
    };

    const get26 = (predicate: (e: PhoneExtension) => boolean): PhoneExtension[] => {
      const res = floor26Extensions
        .filter((e) => !assignedIds.has(e.id) && predicate(e))
        .sort((a, b) => a.id - b.id);
      res.forEach((e) => assignedIds.add(e.id));
      return res;
    };

    const findItem = (list: PhoneExtension[], name: string) =>
      list.find((e) => e.name.toLowerCase().startsWith(name.toLowerCase()));

    let currentY = 17.0;

    // ==========================================
    //  FLOOR 27 SECTION (Board + Departments)
    // ==========================================
    if (hasFloor27) {
      const boardX = colXs[1];
      const boardW = colW;
      const paX = colXs[2];
      const paW = colW;

      doc.setFont('Cabin', 'normal');
      doc.setFontSize(5.6);
      doc.setTextColor(20, 20, 20);
      doc.text('Board of Commissioners', boardX + boardW / 2, currentY, { align: 'center' });
      currentY += 1.0;

      const boardItems = get27(
        (e) => e.dept.toLowerCase().includes('board of com') || e.dept.toLowerCase().includes('commissioner')
      );
      const paItems = get27(
        (e) => (e.dept.toLowerCase().includes('pa') || e.dept.toLowerCase().includes('secretary')) &&
               !e.name.toLowerCase().includes('artika')
      );

      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.15);

      let bRow = currentY;

      // MSA & MSA Bed
      const msa = findItem(boardItems, 'MSA');
      const msaBed = findItem(boardItems, 'MSA Bed');
      const ety = findItem(paItems, 'Ety');
      if (msa) { drawRow(msa.name, msa.ext, boardX, bRow, boardW); bRow += ROW_H; }
      if (msaBed) { drawRow(msaBed.name, msaBed.ext, boardX, bRow, boardW); bRow += ROW_H; }
      if (ety) drawRow(titleCase(ety.name), ety.ext, paX, currentY, paW, true);

      // Connector line
      doc.line(boardX + boardW / 2, bRow, boardX + boardW / 2, bRow + 0.5);
      bRow += 0.5;

      // JSB
      const jsb = findItem(boardItems, 'JSB');
      const kiki = findItem(paItems, 'Kiki') || findItem(paItems, 'Intan');
      if (jsb) drawRow(jsb.name, jsb.ext, boardX, bRow, boardW);
      if (kiki) drawRow(titleCase(kiki.name), kiki.ext, paX, bRow, paW, true);
      doc.line(boardX + boardW / 2, bRow + ROW_H, boardX + boardW / 2, bRow + ROW_H + 0.5);
      bRow += ROW_H + 0.5;

      // JSC
      const jsc = findItem(boardItems, 'JSC');
      const dinny = findItem(paItems, 'Dinny');
      if (jsc) drawRow(jsc.name, jsc.ext, boardX, bRow, boardW);
      if (dinny) drawRow(titleCase(dinny.name), dinny.ext, paX, bRow, paW, true);
      doc.line(boardX + boardW / 2, bRow + ROW_H, boardX + boardW / 2, bRow + ROW_H + 0.5);
      bRow += ROW_H + 0.5;

      // MSB, MSC, MSD
      const msb = findItem(boardItems, 'MSB');
      const msc = findItem(boardItems, 'MSC');
      const msd = findItem(boardItems, 'MSD');
      const asma = findItem(paItems, 'Asma');
      const msbY = bRow;

      const groupMembers = [msb, msc, msd].filter(Boolean) as PhoneExtension[];
      const boxCount = groupMembers.length > 0 ? groupMembers.length : 3;
      doc.rect(boardX, bRow, boardW, ROW_H * boxCount);
      groupMembers.forEach((m) => {
        doc.setFont('Cabin', 'bold');
        doc.setFontSize(FONT_SIZE_ROW);
        doc.setTextColor(30, 30, 30);
        doc.text(m.name, boardX + 1.0, bRow + (ROW_H * 0.68));
        doc.text(m.ext, boardX + boardW - 1.0, bRow + (ROW_H * 0.68), { align: 'right' });
        bRow += ROW_H;
      });
      if (asma) drawRow(titleCase(asma.name), asma.ext, paX, msbY + (groupMembers.length > 1 ? ROW_H : 0), paW, true);

      // Render any additional Commissioners or PAs
      const renderedBocIds = new Set([msa, msaBed, jsb, jsc, msb, msc, msd].filter(Boolean).map(e => e!.id));
      const extraBoc = boardItems.filter(e => !renderedBocIds.has(e.id));
      extraBoc.forEach((eb) => {
        drawRow(eb.name, eb.ext, boardX, bRow, boardW);
        bRow += ROW_H;
      });

      doc.line(boardX + boardW / 2, bRow, boardX + boardW / 2, bRow + 0.4);
      bRow += 0.4;

      // Deputy CEO & President
      doc.setFont('Cabin', 'normal');
      doc.setFontSize(5.2);
      doc.setTextColor(20, 20, 20);
      const depText = 'Deputy CEO & President';
      doc.text(depText, boardX + boardW / 2, bRow + 1.4, { align: 'center' });
      const dtw = doc.getTextWidth(depText);
      doc.setLineWidth(0.18);
      doc.line(boardX + (boardW - dtw) / 2, bRow + 1.8, boardX + (boardW + dtw) / 2, bRow + 1.8);

      doc.setLineWidth(0.15);
      doc.line(boardX + boardW / 2, bRow + 1.8, boardX + boardW / 2, bRow + 2.2);
      bRow += 2.2;

      const depCeoItems = get27((e) =>
        e.dept.toLowerCase().includes('deputy ceo') || e.dept.toLowerCase().includes('president')
      );
      const dwi = findItem(paItems, 'Dwi') || paItems.find(e => !assignedIds.has(e.id));
      if (dwi) assignedIds.add(dwi.id);

      if (depCeoItems.length === 0) {
        bRow += ROW_H;
      } else {
        depCeoItems.forEach((ceo, idx) => {
          drawRow(titleCase(ceo.name), ceo.ext, boardX, bRow, boardW);
          if (idx === 0 && dwi) drawRow(titleCase(dwi.name), dwi.ext, paX, bRow, paW, true);
          bRow += ROW_H;
        });
      }

      // Dialing Instructions (Left column alongside Board)
      let iy = 17.5;
      const drawInstr = (label: string, code: string) => {
        doc.setFont('Cabin', 'bold');
        doc.setFontSize(4.0);
        doc.setTextColor(40, 40, 40);
        doc.text(label, startX + M, iy);
        if (code) {
          doc.setFont('Cabin', 'normal');
          doc.text(code, startX + M, iy + 1.7);
        }
        iy += code ? 3.6 : 2.0;
      };
      drawInstr('Pick up Incoming Call: #70', '');
      drawInstr('How to make ext call Lt.26', '## + Ext lt. 26');
      drawInstr('How to make outgoing call', '* + PIN + 9 + Phone No.');
      drawInstr('How to make international call', '* + PIN + 9 + 01017 + Country + Phone No.');

      // Floor 27 Columns
      const deptStartY = bRow + 0.4;
      let leftY = deptStartY;
      let rightY = deptStartY;

      // ── Left Column Floor 27 ──
      const resCA = drawDeptBlock(
        'Corporate Affair',
        get27((e) => e.dept.toLowerCase().includes('corporate affair')),
        colXs[0],
        leftY,
        colW
      );
      leftY += resCA.totalH > 0 ? resCA.totalH + GAP : 0;

      const faList = get27((e) =>
        e.dept.toLowerCase().includes('finance') && !e.name.toLowerCase().includes('lisi')
      );
      const resFA = drawDeptBlock('Finance & Accounting', faList, colXs[0], leftY, colW);
      leftY += resFA.totalH > 0 ? resFA.totalH + GAP : 0;

      const propFin = get27((e) =>
        e.dept.toLowerCase().includes('property') ||
        e.dept.toLowerCase().includes('business development') ||
        e.dept.toLowerCase().includes('financial investment')
      );
      const artika = floor27Extensions.find((e) => e.name.toLowerCase().includes('artika'));
      if (artika && !propFin.some((e) => e.id === artika.id)) {
        assignedIds.add(artika.id);
        propFin.unshift(artika);
      }
      const resProp = drawDeptBlock('Property & Financial Investment', propFin, colXs[0], leftY, colW);
      leftY += resProp.totalH > 0 ? resProp.totalH + GAP : 0;

      // Lisi under Property block without label
      const lisiList = get27((e) => e.name.toLowerCase().includes('lisi'));
      const resLisi = drawDeptBlock('', lisiList, colXs[0], leftY, colW);
      leftY += resLisi.totalH > 0 ? resLisi.totalH + GAP : 0;

      // ── Right Column Floor 27 ──
      const resCS = drawDeptBlock(
        'Corporate Secretary',
        get27((e) => e.dept.toLowerCase().includes('corporate secretary') && !e.dept.toLowerCase().includes('pa')),
        colXs[2],
        rightY,
        colW
      );
      rightY += resCS.totalH > 0 ? resCS.totalH + GAP : 0;

      const resHR = drawDeptBlock(
        'HR & Logistic',
        get27((e) => e.dept.toLowerCase().includes('hr') || e.dept.toLowerCase().includes('logistic')),
        colXs[2],
        rightY,
        colW
      );
      rightY += resHR.totalH > 0 ? resHR.totalH + GAP : 0;

      const resTrading = drawDeptBlock(
        'Trading',
        get27((e) => e.dept.toLowerCase().includes('trading')),
        colXs[2],
        rightY,
        colW
      );
      rightY += resTrading.totalH > 0 ? resTrading.totalH + GAP : 0;

      const resFound = drawDeptBlock(
        'Gesit Foundation',
        get27((e) => e.dept.toLowerCase().includes('foundation')),
        colXs[2],
        rightY,
        colW
      );
      rightY += resFound.totalH > 0 ? resFound.totalH + GAP : 0;

      // ── Floor 27 Tree Lines ──
      const trunkCenter = startX + midX / 2;
      const bottomBranchY = Math.max(resProp.boxCenterY || leftY, resTrading.boxCenterY || rightY);
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.15);
      doc.line(trunkCenter, bRow, trunkCenter, bottomBranchY);

      if (resCA.boxCenterY && resCS.boxCenterY) {
        doc.line(trunkCenter, resCA.boxCenterY, colXs[0] + colW, resCA.boxCenterY);
        doc.line(trunkCenter, resCS.boxCenterY, colXs[2], resCS.boxCenterY);
      }
      if (resFA.boxCenterY && resHR.boxCenterY) {
        doc.line(trunkCenter, resFA.boxCenterY, colXs[0] + colW, resFA.boxCenterY);
        doc.line(trunkCenter, resHR.boxCenterY, colXs[2], resHR.boxCenterY);
      }
      if (resProp.boxCenterY && resTrading.boxCenterY) {
        doc.line(trunkCenter, resProp.boxCenterY, colXs[0] + colW, resProp.boxCenterY);
        doc.line(trunkCenter, resTrading.boxCenterY, colXs[2], resTrading.boxCenterY);
      }

      // ── Unified Receptionist & Common Areas + Unassigned Floor 27 ──
      const common27 = get27((e) =>
        e.dept.toLowerCase().includes('receptionist') ||
        e.dept.toLowerCase().includes('common') ||
        e.dept.toLowerCase().includes('pantry') ||
        e.dept.toLowerCase().includes('room')
      );
      const unassignedF27 = floor27Extensions.filter((e) => !assignedIds.has(e.id));
      unassignedF27.forEach((e) => {
        assignedIds.add(e.id);
        common27.push(e);
      });

      const recepY = bottomBranchY + 2.6;
      const resRecepCommon = drawDeptBlock('', common27, colXs[1], recepY, colW, true);

      currentY = Math.max(leftY, rightY, recepY + resRecepCommon.totalH);
    }

    // ==========================================
    //  FLOOR 26 SECTION
    // ==========================================
    if (hasFloor26) {
      const floor26Y = hasFloor27 ? (currentY + 1.2) : 18.0;

      // Floor 26 Banner
      doc.setFillColor(30, 30, 30);
      doc.rect(startX + M, floor26Y, usableW, 3.2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.2);
      doc.setFont('Cabin', 'bold');
      doc.text('Gesit Natural Resources the 26th Floor', startX + midX / 2, floor26Y + 2.2, { align: 'center' });

      const y26Start = floor26Y + 4.2;
      let l26 = y26Start, c26 = y26Start, r26 = y26Start;

      // ── Pre-fetch categorized items for Floor 26 ──
      const legal26 = get26((e) => e.dept.toLowerCase().includes('legal'));
      
      const hrgaRaw = get26((e) => e.dept.toLowerCase().includes('hrga'));
      const adityaItem = hrgaRaw.find((e) => e.name.toLowerCase().includes('adit'));
      const hrgaOthers = hrgaRaw.filter((e) => e.id !== (adityaItem ? adityaItem.id : -1));
      const hrga26 = adityaItem ? [adityaItem, ...hrgaOthers] : hrgaOthers;

      const bu26 = get26((e) => e.dept.toLowerCase().includes('bussines') || e.dept.toLowerCase().includes('business unit'));
      const gov26 = get26((e) => e.dept.toLowerCase().includes('government'));
      const proc26 = get26((e) => e.dept.toLowerCase().includes('procurement'));
      const projOps26 = get26((e) =>
        e.dept.toLowerCase().includes('project') ||
        e.dept.toLowerCase().includes('operation') ||
        e.dept.toLowerCase().includes('qhse')
      );

      const dep26 = get26((e) => e.dept.toLowerCase().includes('deputy head'));
      const vp26 = get26((e) => e.dept.toLowerCase().includes('vice president') || e.dept.toLowerCase().includes('vp'));
      const om26 = get26((e) => e.dept.toLowerCase().includes('office management'));
      const it26 = get26((e) => e.dept.toLowerCase().includes('information technology') || /\bit\b/i.test(e.dept));
      const eng26 = get26((e) => e.dept.toLowerCase().includes('engineering'));
      const fd26 = get26((e) =>
        e.dept.toLowerCase().includes('front desk') ||
        e.dept.toLowerCase().includes('common') ||
        e.dept.toLowerCase().includes('pantry') ||
        e.dept.toLowerCase().includes('receptionist')
      );

      const permitRaw = get26((e) => e.dept.toLowerCase().includes('permit') || e.dept.toLowerCase().includes('license'));
      const rahmatItem = permitRaw.find((e) => e.name.toLowerCase().includes('rahmat'));
      const permitOthers = permitRaw.filter((e) => e.id !== (rahmatItem ? rahmatItem.id : -1));
      const permit26 = rahmatItem ? [rahmatItem, ...permitOthers] : permitOthers;

      const fa26 = get26((e) => e.dept.toLowerCase().includes('finance') || e.dept.toLowerCase().includes('accounting'));
      const sales26 = get26((e) => e.dept.toLowerCase().includes('sales') || e.dept.toLowerCase().includes('marketing'));

      // Any remaining unassigned extensions from Floor 26 or other floors go into fd26
      const unassignedF26 = extensions.filter((e) => !assignedIds.has(e.id));
      unassignedF26.forEach((e) => {
        assignedIds.add(e.id);
        fd26.push(e);
      });

      // ── Left Column Floor 26 ──
      const resLegal26 = drawDeptBlock('Legal & Compliance', legal26, colXs[0], l26, colW);
      l26 += resLegal26.totalH > 0 ? resLegal26.totalH + GAP : 0;

      const resHRGA26 = drawDeptBlock('HRGA', hrga26, colXs[0], l26, colW);
      l26 += resHRGA26.totalH > 0 ? resHRGA26.totalH + GAP : 0;

      if (bu26.length > 0) {
        const resBU26 = drawDeptBlock('Business Unit', bu26, colXs[0], l26, colW);
        l26 += resBU26.totalH > 0 ? resBU26.totalH + GAP : 0;
      }

      const resGov26 = drawDeptBlock('Government Relation', gov26, colXs[0], l26, colW);
      l26 += resGov26.totalH > 0 ? resGov26.totalH + GAP : 0;

      const resProc26 = drawDeptBlock('Procurement', proc26, colXs[0], l26, colW);
      l26 += resProc26.totalH > 0 ? resProc26.totalH + GAP : 0;

      if (projOps26.length > 0) {
        const resProjOps = drawDeptBlock('Project, Operation & QHSE', projOps26, colXs[0], l26, colW);
        l26 += resProjOps.totalH > 0 ? resProjOps.totalH + GAP : 0;
      }

      // ── Center Column Floor 26 ──
      if (dep26.length > 0) {
        const resDep26 = drawDeptBlock('Deputy Head', dep26, colXs[1], c26, colW);
        c26 += resDep26.totalH > 0 ? resDep26.totalH + GAP : 0;
      }

      const resVP26 = drawDeptBlock('Vice President', vp26, colXs[1], c26, colW);
      c26 += resVP26.totalH > 0 ? resVP26.totalH + GAP : 0;

      const resOM26 = drawDeptBlock('Office Management', om26, colXs[1], c26, colW);
      c26 += resOM26.totalH > 0 ? resOM26.totalH + GAP : 0;

      const resIT26 = drawDeptBlock('Information Technology', it26, colXs[1], c26, colW);
      c26 += resIT26.totalH > 0 ? resIT26.totalH + GAP : 0;

      const resEng26 = drawDeptBlock('Engineering', eng26, colXs[1], c26, colW);
      c26 += resEng26.totalH > 0 ? resEng26.totalH + GAP : 0;

      const fdY = c26 + 0.8;
      const resFD26 = drawDeptBlock('', fd26, colXs[1], fdY, colW, true);
      if (fd26.length > 0) c26 = fdY + resFD26.totalH + GAP;

      // ── Right Column Floor 26 ──
      const resPermit26 = drawDeptBlock('Permit & License', permit26, colXs[2], r26, colW);
      r26 += resPermit26.totalH > 0 ? resPermit26.totalH + GAP : 0;

      const resFA26 = drawDeptBlock('Finance & Accounting', fa26, colXs[2], r26, colW);
      r26 += resFA26.totalH > 0 ? resFA26.totalH + GAP : 0;

      if (sales26.length > 0) {
        const resSales26 = drawDeptBlock('Sales / Marketing', sales26, colXs[2], r26, colW);
        r26 += resSales26.totalH > 0 ? resSales26.totalH + GAP : 0;
      }

      // 26th Dialing Instructions
      r26 += 1.0;
      doc.setFontSize(4.0);
      doc.setTextColor(40, 40, 40);
      doc.setFont('Cabin', 'bold');
      doc.text('How to make outgoing call', colXs[2], r26);
      doc.setFont('Cabin', 'normal');
      doc.text('81** + PIN + Phone No.', colXs[2], r26 + 1.7);
      doc.setFont('Cabin', 'bold');
      doc.text('How to make ext call Lt.27', colXs[2], r26 + 3.6);
      doc.setFont('Cabin', 'normal');
      doc.text('88** + PIN + Ext lt. 27', colXs[2], r26 + 5.3);
    }

    // Page Footer
    doc.setFontSize(4.0);
    doc.setFont('Cabin', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('GESIT Internal Directory - Confidential', startX + M, pageH - 4);
    doc.text(`Generated: ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, startX + midX - M, pageH - 4, { align: 'right' });
  };

  // Draw two identical copies side-by-side (print & cut down middle)
  drawCopy(0);
  drawCopy(midX);

  return doc;
}

/**
 * 2. Format: Laporan Lengkap (A4 Portrait Multi-Page Table Report)
 * Clean tabular document with auto-paging, headers, and footer counts.
 */
export function generateDirectoryTableReportDoc(
  extensions: PhoneExtension[],
  isAdmin: boolean = false
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  registerFonts(doc);

  const pageW = 210;
  const pageH = 297;
  const M = 12;

  const titleCase = (s?: string) =>
    (s || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  // Header Title
  doc.setFont('Cabin', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(24, 24, 27);
  doc.text('GESIT GROUP — PHONE EXTENSION DIRECTORY', M, 15);

  doc.setFont('Cabin', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('The City Tower Office Registry (Floor 26 & Floor 27)', M, 20);

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.setFont('Cabin', 'italic');
  doc.text(`Total Kontak: ${extensions.length} | Generated: ${dateStr}`, pageW - M, 20, { align: 'right' });

  // Horizontal separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(M, 23, pageW - M, 23);

  // Table Columns
  const head = isAdmin
    ? [['#', 'Nama Pegawai / Kontak', 'Ext', 'Lantai', 'Departemen / Divisi', 'Jabatan / Catatan', 'PIN']]
    : [['#', 'Nama Pegawai / Kontak', 'Ext', 'Lantai', 'Departemen / Divisi', 'Jabatan / Catatan']];

  // Sort extensions: Floor desc (27 first, then 26), Dept asc, Name asc
  const sorted = [...extensions].sort((a, b) => {
    const floorA = Number(a.floor) || 0;
    const floorB = Number(b.floor) || 0;
    if (floorA !== floorB) return floorB - floorA;
    const deptA = (a.dept || '').toLowerCase();
    const deptB = (b.dept || '').toLowerCase();
    if (deptA !== deptB) return deptA.localeCompare(deptB);
    return (a.name || '').localeCompare(b.name || '');
  });

  const body = sorted.map((ext, idx) => {
    const floorStr = ext.floor ? `Lt. ${ext.floor}` : '-';
    const row = [
      (idx + 1).toString(),
      titleCase(ext.name),
      ext.ext || '-',
      floorStr,
      ext.dept || '-',
      ext.role && ext.role.trim() !== '-' ? ext.role : '-'
    ];
    if (isAdmin) {
      row.push(ext.pin || '-');
    }
    return row;
  });

  autoTable(doc, {
    startY: 26,
    margin: { left: M, right: M, top: 26, bottom: 16 },
    head,
    body,
    theme: 'grid',
    styles: {
      font: 'Cabin',
      fontSize: 8,
      cellPadding: 2.0,
      textColor: [39, 39, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    headStyles: {
      font: 'Cabin',
      fontStyle: 'bold',
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: isAdmin ? {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 46 },
      2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 46 },
      5: { cellWidth: 30 },
      6: { cellWidth: 16, halign: 'center' }
    } : {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 54 },
      2: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 48 },
      5: { cellWidth: 30 }
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;
      doc.setFont('Cabin', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('GESIT Internal Phone Directory — Confidential Registry', M, pageH - 7);
      doc.text(`Page ${currentPage} of ${pageCount}`, pageW - M, pageH - 7, { align: 'right' });
    }
  });

  return doc;
}

/**
 * Generate a Blob URL for instant iframe preview
 */
export function generateDirectoryPdfBlobUrl(
  extensions: PhoneExtension[],
  format: DirectoryPdfFormat = 'desk_card',
  isAdmin: boolean = false
): string {
  const doc = format === 'table_report'
    ? generateDirectoryTableReportDoc(extensions, isAdmin)
    : generateDirectoryDeskCardDoc(extensions);

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

/**
 * Direct file download
 */
export function exportDirectoryPDF(
  extensions: PhoneExtension[],
  format: DirectoryPdfFormat = 'desk_card',
  isAdmin: boolean = false
) {
  if (!extensions || extensions.length === 0) return;

  const doc = format === 'table_report'
    ? generateDirectoryTableReportDoc(extensions, isAdmin)
    : generateDirectoryDeskCardDoc(extensions);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const prefix = format === 'table_report' ? 'GESIT-Directory-Report' : 'GESIT-Directory-DeskCard';
  doc.save(`${prefix}-${dateStr}.pdf`);
}
