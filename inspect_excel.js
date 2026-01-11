
const XLSX = require('xlsx');

const filePath = 'Performans-Data (1).xlsx';
try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Array of arrays

    const headers = data[0];
    console.log(JSON.stringify(headers));
} catch (e) {
    console.error("Error reading file:", e);
}
