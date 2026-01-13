/**
 * File Parser
 * Parses Excel (.xlsx) and CSV files for match and performance data
 */

import * as XLSX from 'xlsx';
import { cleanText } from './utils';
import { MATCH_COLUMN_MAPPING, PERFORMANCE_COLUMN_MAPPING } from './constants';
import type { UploadedMatchRow, UploadedPerformanceRow } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

type ParsedRow = UploadedMatchRow | UploadedPerformanceRow;

interface HeaderSearchResult {
    index: number;
    matchCount: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Normalize a key for comparison by removing special characters and spaces
 */
function normalizeKey(key: string): string {
    return cleanText(key).replace(/[^a-z0-9]/g, '');
}

/**
 * Find the best header row in the file by matching expected column names
 */
function findBestHeaderRow(
    rows: string[][],
    expectedCols: string[]
): HeaderSearchResult {
    let bestMatchCount = 0;
    let bestIndex = -1;

    // Normalize expected columns for comparison
    const normalizedExpected = expectedCols.map(normalizeKey);

    // Only check first 20 rows for header
    rows.slice(0, 20).forEach((row, index) => {
        if (!Array.isArray(row)) return;

        const normalizedRow = row.map((cell) => normalizeKey(String(cell)));
        let matchCount = 0;

        normalizedExpected.forEach((expected) => {
            if (normalizedRow.includes(expected)) matchCount++;
        });

        // Require at least 2 matches to be considered a valid header
        if (matchCount > bestMatchCount && matchCount >= 2) {
            bestMatchCount = matchCount;
            bestIndex = index;
        }
    });

    return { index: bestIndex, matchCount: bestMatchCount };
}

/**
 * Determine the file type (match or performance) based on column headers
 */
function determineFileType(
    aoa: string[][]
): { type: 'match' | 'performance'; headerIndex: number; mapping: Record<string, string> } {
    const matchHeader = findBestHeaderRow(aoa, Object.keys(MATCH_COLUMN_MAPPING));
    const perfHeader = findBestHeaderRow(aoa, Object.keys(PERFORMANCE_COLUMN_MAPPING));

    // Use strict logic - must define clear winner
    if (matchHeader.index !== -1 && matchHeader.matchCount > perfHeader.matchCount) {
        return {
            type: 'match',
            headerIndex: matchHeader.index,
            mapping: MATCH_COLUMN_MAPPING,
        };
    }

    if (perfHeader.index !== -1) {
        return {
            type: 'performance',
            headerIndex: perfHeader.index,
            mapping: PERFORMANCE_COLUMN_MAPPING,
        };
    }

    // Fallback to match if equal
    if (matchHeader.index !== -1) {
        return {
            type: 'match',
            headerIndex: matchHeader.index,
            mapping: MATCH_COLUMN_MAPPING,
        };
    }

    throw new Error('Could not identify file type. Please check column headers.');
}

/**
 * Map raw row data to standard column names using the mapping
 */
function mapRowToStandardFormat(
    row: Record<string, unknown>,
    mapping: Record<string, string>,
    type: 'match' | 'performance'
): ParsedRow | null {
    const newRow: Record<string, unknown> = { _type: type };
    const keys = Object.keys(row);

    for (const [expectedKey, mappedKey] of Object.entries(mapping)) {
        // Find matching key in row with normalized comparison
        const foundKey = keys.find((k) => normalizeKey(k) === normalizeKey(expectedKey));
        if (foundKey) {
            newRow[mappedKey] = row[foundKey];
        }
    }

    // Require Player field to be present
    if (!newRow.Player) {
        return null;
    }

    return newRow as ParsedRow;
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Parse an Excel or CSV file and return standardized row data
 * 
 * @param file - The file to parse (xlsx or csv)
 * @returns Promise resolving to array of parsed rows
 * @throws Error if file cannot be parsed or no valid data found
 */
export async function parseFile(file: File): Promise<ParsedRow[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) {
                    reject(new Error('Failed to read file data.'));
                    return;
                }

                // Read workbook
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to array of arrays for header detection
                const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

                // Determine file type and get mapping
                const { type, headerIndex, mapping } = determineFileType(aoa);

                // Parse raw data starting from the header row
                const rawData = XLSX.utils.sheet_to_json(worksheet, { range: headerIndex });

                // Map rows to standard format
                const mappedData = rawData
                    .map((row) => mapRowToStandardFormat(row as Record<string, unknown>, mapping, type))
                    .filter((row): row is ParsedRow => row !== null);

                if (mappedData.length === 0) {
                    reject(new Error('No valid data rows found after parsing.'));
                    return;
                }

                resolve(mappedData);

            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file.'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Validate a file before parsing
 * 
 * @param file - The file to validate
 * @returns true if file is valid, throws error otherwise
 */
export function validateFile(file: File): boolean {
    const validExtensions = ['.xlsx', '.csv', '.xls'];
    const fileName = file.name.toLowerCase();

    if (!validExtensions.some((ext) => fileName.endsWith(ext))) {
        throw new Error('Invalid file type. Please upload a .xlsx or .csv file.');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 10MB.');
    }

    return true;
}
