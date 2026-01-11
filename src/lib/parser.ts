import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { cleanText } from './utils';
import { UploadedRow } from '@/types';

const COLUMN_MAPPING = {
    'tidsstempel': 'Timestamp',
    'kamp - hvilket hold spillede du for': 'Team',
    'modstanderen (hvem spillede du mod)': 'Opponent',
    'navn (fulde navn)': 'Player',
    '#succesfulde pasninger /indlæg': 'Successful_Passes',
    '#total pasninger/indlæg (succesfulde + ikke succesfulde)': 'Total_Passes',
    '#total afslutninger': 'Total_Shots',
    '#succesfulde erobringer på egen bane': 'Tackles_Own_Half',
    '#succesfulde erobringer på deres bane': 'Tackles_Opponent_Half',
    '#total succesfulde erobringer (egen + deres bane)': 'Total_Tackles',
    'mål': 'Goals',
    'assist': 'Assists',
    'spilleminutter': 'Minutes',
    'gule kort': 'Yellow_Cards',
    'røde kort': 'Red_Cards',
    'hvad vil du gøre bedre i næste kamp ?': 'Feedback'
};

const EXPECTED_COLS = Object.keys(COLUMN_MAPPING);

export const parseFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                let jsonData: any[] = [];
                let headerRowIndex = 0;

                if (file.name.endsWith('.csv')) {
                    // Handle CSV
                    const text = new TextDecoder("utf-8").decode(data as ArrayBuffer);
                    // Simple search for header row
                    const lines = text.split('\n');
                    headerRowIndex = findHeaderRowIndex(lines);

                    Papa.parse(text, {
                        header: true,
                        skipEmptyLines: true,
                        transformHeader: (h: string) => h.trim(), // simple trim first
                        complete: (_results: any) => {
                            // We might need to reparsing if header row wasn't 0, but let's try standard parse first
                            // Actually, if header is not at 0, PapaParse 'header: true' might fail to key correctly if we don't skip lines.
                            // Let's rely on finding header row first.
                            // Placeholder for CSV completion logic
                        }
                    });
                    // Re-implement robust logic below for both
                }

                // Universal workbook approach for XLSX (and CSV supported by XLSX utils)
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to array of arrays to find header
                const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
                const headerIndex = findHeaderRowIndexAOA(aoa);

                if (headerIndex === -1) {
                    reject(new Error("Could not find valid header row"));
                    return;
                }

                // Get raw data with correct header
                const rawData = XLSX.utils.sheet_to_json(worksheet, { range: headerIndex });

                // Map columns
                const mappedData = rawData.map((row: any) => {
                    const newRow: any = {};
                    // We need to match keys fuzzily
                    const keys = Object.keys(row);

                    for (const [expectedKey, mappedKey] of Object.entries(COLUMN_MAPPING)) {
                        // Find matching key in row
                        const foundKey = keys.find(k => cleanText(k) === expectedKey);
                        if (foundKey) {
                            newRow[mappedKey] = row[foundKey];
                        }
                    }
                    return newRow;
                }).filter(r => r.Player && r.Opponent); // Basic validation

                resolve(mappedData);

            } catch (err) {
                reject(err);
            }
        };

        reader.readAsArrayBuffer(file);
    });
};

function findHeaderRowIndexAOA(rows: string[][]): number {
    let bestMatchCount = 0;
    let bestIndex = -1;

    rows.slice(0, 20).forEach((row, index) => {
        if (!Array.isArray(row)) return;
        const cleanedRow = row.map(cell => cleanText(cell));
        let matchCount = 0;

        EXPECTED_COLS.forEach(expected => {
            if (cleanedRow.includes(expected)) matchCount++;
        });

        if (matchCount > bestMatchCount && matchCount > EXPECTED_COLS.length * 0.5) {
            bestMatchCount = matchCount;
            bestIndex = index;
        }
    });

    return bestIndex;
}

function findHeaderRowIndex(_lines: string[]): number {
    // For manual CSV check if needed, but XLSX library handles CSV well usually.
    return 0;
}
