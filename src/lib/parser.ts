
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
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

const PERFORMANCE_MAPPING = {
    'navn': 'Player',
    'øvelse': 'Exercise',
    '1.pr': 'PR1',
    '2.pr': 'PR2',
    '3.pr': 'PR3',
    '4. pr': 'PR4'
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

                // Heuristic: choose the one with more matches
                if (matchHeader.index !== -1 && matchHeader.matchCount >= perfHeader.matchCount) {
                    type = 'match';
                    headerIndex = matchHeader.index;
                    mapping = MATCH_MAPPING;
                } else if (perfHeader.index !== -1) {
                    type = 'performance';
                    headerIndex = perfHeader.index;
                    mapping = PERFORMANCE_MAPPING;
                } else {
                    reject(new Error("Could not identify file type (Match or Performance)"));
                    return;
                }

                // Get raw data with correct header
                const rawData = XLSX.utils.sheet_to_json(worksheet, { range: headerIndex });

                const mappedData = rawData.map((row: any) => {
                    const newRow: any = { _type: type }; // Add internal type flag
                    const keys = Object.keys(row);

                    for (const [expectedKey, mappedKey] of Object.entries(mapping)) {
                        // Find matching key in row
                        const foundKey = keys.find(k => cleanText(k) === expectedKey);
                        if (foundKey) {
                            newRow[mappedKey] = row[foundKey];
                        }
                    }
                    return newRow;
                }).filter(r => r.Player); // Basic validation (Player name required)

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

    rows.slice(0, 20).forEach((row, index) => {
        if (!Array.isArray(row)) return;
        const cleanedRow = row.map(cell => cleanText(String(cell))); // ensure string
        let matchCount = 0;

        expectedCols.forEach(expected => {
            if (cleanedRow.includes(expected)) matchCount++;
        });

        // Threshold: Must match at least 2 columns to be considered
        if (matchCount > bestMatchCount && matchCount >= 2) {
            bestMatchCount = matchCount;
            bestIndex = index;
        }
    });

    return { index: bestIndex, matchCount: bestMatchCount };
}
