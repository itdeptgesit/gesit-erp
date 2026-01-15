import XLSX from 'xlsx';
import path from 'path';

const headers = [
    {
        "Item": "Contoh: Laptop Thinkpad X1",
        "Category": "Contoh: Laptop",
        "Company": "Contoh: PT Gesit Alumas",
        "Brand": "Lenovo",
        "Serial Number": "SN123456",
        "Status": "Active",
        "Custodian": "Nama User",
        "Location": "Jakarta",
        "Department": "IT",
        "Purchase Date": "2024-01-20",
        "Remarks": "Catatan tambahan di sini",
        "Asset ID": "(Kosongkan jika ingin auto-generate)"
    }
];

const worksheet = XLSX.utils.json_to_sheet(headers);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Template Asset");

// Add a column width for readability
const wscols = [
    { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 },
    { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 30 }, { wch: 25 }
];
worksheet['!cols'] = wscols;

const fileName = "TEMPLATE_IMPORT_ASSET_GESIT.xlsx";
XLSX.writeFile(workbook, fileName);

console.log(`Template created successfully: ${fileName}`);
