import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as htmlToImage from 'html-to-image';
import { PurchaseRecord } from '../types';

export interface PurchaseReportPdfOptions {
    records: PurchaseRecord[];
    chartsElement?: HTMLElement | null;
    periodLabel: string;
    filters: {
        company?: string;
        department?: string;
        category?: string;
        status?: string;
    };
    totals: {
        actual: number;
        budget: number;
        variance: number;
        totalCount: number;
    };
}

const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(num);
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
};

export const exportPurchaseReportToPdf = async (options: PurchaseReportPdfOptions) => {
    const { records, chartsElement, periodLabel, filters, totals } = options;

    // Create A4 Landscape PDF
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();   // 297 mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
    const margin = 14;

    /* ============================================================
       PAGE 1: Executive Dashboard & Analytics
       ============================================================ */

    // Top Header Banner
    doc.setFillColor(10, 37, 64); // Corporate Navy #0a2540
    doc.rect(0, 0, pageWidth, 24, 'F');

    // Accent line
    doc.setFillColor(37, 99, 235); // Blue #2563eb
    doc.rect(0, 24, pageWidth, 1.5, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('THE GESIT COMPANIES — PROCUREMENT & AUDIT REPORT', margin, 11);

    // Metadata subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225); // Slate 300
    const filterInfo = [
        `Periode: ${periodLabel}`,
        `Entitas: ${filters.company || 'Semua'}`,
        `Departemen: ${filters.department || 'Semua'}`,
        `Kategori: ${filters.category || 'Semua'}`,
        `Status: ${filters.status || 'Semua'}`
    ].join('  |  ');
    doc.text(filterInfo, margin, 18);

    // Date Stamp on top right
    const printDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.setFontSize(7.5);
    doc.text(`Dicetak: ${printDate}`, pageWidth - margin, 18, { align: 'right' });

    let currentY = 32;

    // KPI Summary Strip (4 Cards)
    const cardWidth = (pageWidth - (margin * 2) - 9) / 4;
    const cardHeight = 16;
    const kpiCards = [
        { label: 'REALISASI BELANJA', value: formatIDR(totals.actual), color: [15, 23, 42] },
        { label: 'TARGET BUDGET', value: formatIDR(totals.budget), color: [71, 85, 105] },
        { 
            label: totals.variance >= 0 ? 'SISA BUDGET (HEMAT)' : 'OVER BUDGET', 
            value: `${totals.variance >= 0 ? '+' : '-'}${formatIDR(Math.abs(totals.variance))}`, 
            color: totals.variance >= 0 ? [5, 150, 105] : [225, 29, 72] 
        },
        { label: 'TOTAL TRANSAKSI', value: `${totals.totalCount} Transaksi`, color: [37, 99, 235] }
    ];

    kpiCards.forEach((card, idx) => {
        const x = margin + (idx * (cardWidth + 3));
        
        // Background card
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'S');

        // Card Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(card.label, x + 4, currentY + 5.5);

        // Card Value
        doc.setFontSize(10);
        doc.setTextColor(card.color[0], card.color[1], card.color[2]);
        doc.text(card.value, x + 4, currentY + 12);
    });

    currentY += cardHeight + 6;

    // Section Title for Charts
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('ANALITIK PENGADAAN & DISTRIBUSI ALOKASI BIAYA', margin, currentY);
    currentY += 3;

    // Capture & Embed Charts Image
    if (chartsElement) {
        try {
            // Render DOM element to high-res PNG image
            const imgDataUrl = await htmlToImage.toPng(chartsElement, {
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                cacheBust: true
            });

            // Calculate dimensions to fit nicely on landscape A4
            const maxImgWidth = pageWidth - (margin * 2);
            const maxImgHeight = pageHeight - currentY - 14;

            // Get original aspect ratio from element
            const rect = chartsElement.getBoundingClientRect();
            const aspectRatio = rect.width / (rect.height || 1);

            let imgW = maxImgWidth;
            let imgH = imgW / aspectRatio;

            if (imgH > maxImgHeight) {
                imgH = maxImgHeight;
                imgW = imgH * aspectRatio;
            }

            const imgX = margin + ((maxImgWidth - imgW) / 2);
            doc.addImage(imgDataUrl, 'PNG', imgX, currentY, imgW, imgH, undefined, 'FAST');
        } catch (err) {
            console.error('Failed to capture charts image:', err);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text('(Grafik visual tidak dapat dimuat ke PDF - lanjutkan ke halaman rincian)', margin, currentY + 10);
        }
    }

    /* ============================================================
       PAGE 2+: Detail Transactions Table
       ============================================================ */
    doc.addPage('a4', 'landscape');

    // Header banner on Page 2
    doc.setFillColor(10, 37, 64);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 16, pageWidth, 1, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DAFTAR RINCIAN TRANSAKSI PENGADAAN', margin, 10);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Total ${records.length} Transaksi Terdata`, pageWidth - margin, 10, { align: 'right' });

    // Prepare table body
    const tableBody = records.map((rec, index) => {
        // Parse items inside record if available
        let items = rec.items;
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch { items = []; }
        }

        let itemSummary = rec.description || '-';
        if (Array.isArray(items) && items.length > 0) {
            const list = items.slice(0, 3).map((it: any) => 
                `• ${it.description || it.name || 'Item'} (${it.qty || 1}x @${formatIDR(Number(it.price || 0))})`
            ).join('\n');
            itemSummary = `${rec.description}\n${list}${items.length > 3 ? `\n(+${items.length - 3} item lainnya)` : ''}`;
        }

        return [
            (index + 1).toString(),
            rec.transactionId || `TR-${rec.id}`,
            formatDate(rec.purchaseDate),
            `${rec.user || '-'}\n(${rec.company || 'TGC'})`,
            rec.department || '-',
            rec.vendor || '-',
            rec.category || '-',
            itemSummary,
            rec.status || 'Paid',
            formatIDR(rec.subtotal || 0)
        ];
    });

    autoTable(doc, {
        startY: 22,
        margin: { left: margin, right: margin, bottom: 14 },
        head: [[
            'No.',
            'No. PR/TR',
            'Tanggal',
            'Pemohon',
            'Departemen',
            'Vendor / Supplier',
            'Kategori',
            'Deskripsi & Rincian Barang',
            'Status',
            'Subtotal'
        ]],
        body: tableBody,
        theme: 'striped',
        headStyles: {
            fillColor: [10, 37, 64],
            textColor: 255,
            fontSize: 7.5,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle'
        },
        bodyStyles: {
            fontSize: 7,
            cellPadding: 2,
            valign: 'top',
            textColor: [30, 41, 59]
        },
        columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 22, fontStyle: 'bold' },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 26 },
            4: { cellWidth: 22 },
            5: { cellWidth: 32 },
            6: { cellWidth: 24 },
            7: { cellWidth: 70 },
            8: { cellWidth: 16, halign: 'center' },
            9: { cellWidth: 31, halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        didDrawPage: (data) => {
            // Footer page number
            const str = `Halaman ${data.pageNumber} dari ${doc.getNumberOfPages()}`;
            doc.setFontSize(7.5);
            doc.setTextColor(148, 163, 184);
            doc.text(str, pageWidth / 2, pageHeight - 6, { align: 'center' });
            doc.text('The Gesit Companies — Internal Confidential', margin, pageHeight - 6);
        }
    });

    // Save File
    const fileName = `GESIT-PURCHASE-REPORT-${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
