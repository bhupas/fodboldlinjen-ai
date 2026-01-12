import * as XLSX from 'xlsx';
import { cleanText } from './utils';

const MATCH_MAPPING = {
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

// Expanded mapping with variations
const PERFORMANCE_MAPPING = {
    'navn': 'Player',
    'name': 'Player',

    'øvelse': 'Exercise',
    'ovelse': 'Exercise',
    'exercise': 'Exercise',

    '1.pr': 'PR1',
    '1. pr': 'PR1',
    '1 pr': 'PR1',
    'pr1': 'PR1',

    '2.pr': 'PR2',
    '2. pr': 'PR2',
    '2 pr': 'PR2',
    'pr2': 'PR2',

    '3.pr': 'PR3',
    '3. pr': 'PR3',
    '3 pr': 'PR3',
    'pr3': 'PR3',

    '4. pr': 'PR4',
    '4.pr': 'PR4',
    '4 pr': 'PR4',
    'pr4': 'PR4'
};

const normalizeKey = (key: string) => {
    return cleanText(key).replace(/[^a-z0-9]/g, ''); // Remove all special chars/spaces for comparison
};

export const parseFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

                // Determine type
                const matchHeader = findBestHeaderRow(aoa, Object.keys(MATCH_MAPPING));
                const perfHeader = findBestHeaderRow(aoa, Object.keys(PERFORMANCE_MAPPING));

                let type: 'match' | 'performance' | null = null;
                let headerIndex = -1;
                let mapping: any = {};

                // Use strict logic - must define clear winner
                if (matchHeader.index !== -1 && matchHeader.matchCount > perfHeader.matchCount) {
                    type = 'match';
                    headerIndex = matchHeader.index;
                    mapping = MATCH_MAPPING;
                } else if (perfHeader.index !== -1) {
                    type = 'performance';
                    headerIndex = perfHeader.index;
                    mapping = PERFORMANCE_MAPPING;
                } else {
                    // Fallback to match if equal? No, better to fail than misclassify
                    if (matchHeader.index !== -1) {
                        type = 'match';
                        headerIndex = matchHeader.index;
                        mapping = MATCH_MAPPING;
                    } else {
                        reject(new Error("Could not identify file type. Please check column headers."));
                        return;
                    }
                }

                // Get raw data with correct header
                const rawData = XLSX.utils.sheet_to_json(worksheet, { range: headerIndex });

                const mappedData = rawData.map((row: any) => {
                    const newRow: any = { _type: type }; // Add internal type flag
                    const keys = Object.keys(row);

                    for (const [expectedKey, mappedKey] of Object.entries(mapping)) {
                        // Find matching key in row with normalized comparison
                        const foundKey = keys.find(k => normalizeKey(k) === normalizeKey(expectedKey));
                        if (foundKey) {
                            newRow[mappedKey] = row[foundKey];
                        }
                    }
                    return newRow;
                }).filter(r => r.Player);

                if (mappedData.length === 0) {
                    reject(new Error("No valid data rows found after parsing."));
                    return;
                }

                resolve(mappedData);

            } catch (err) {
                reject(err);
            }
        };
        reader.readAsArrayBuffer(file);
    });
};

function findBestHeaderRow(rows: string[][], expectedCols: string[]): { index: number, matchCount: number } {
    let bestMatchCount = 0;
    let bestIndex = -1;

    // Normalize expected columns for comparison
    const normalizedExpected = expectedCols.map(normalizeKey);

    rows.slice(0, 20).forEach((row, index) => {
        if (!Array.isArray(row)) return;
        const normalizedRow = row.map(cell => normalizeKey(String(cell)));
        let matchCount = 0;

        normalizedExpected.forEach(expected => {
            if (normalizedRow.includes(expected)) matchCount++;
        });

        if (matchCount > bestMatchCount && matchCount >= 2) {
            bestMatchCount = matchCount;
            bestIndex = index;
        }
    });

    return { index: bestIndex, matchCount: bestMatchCount };
}
