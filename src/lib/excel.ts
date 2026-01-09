import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const exportToExcel = (data: any[], fileName: string) => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: fileType });
    saveAs(dataBlob, fileName + fileExtension);
};

// Helper to get value from row case-insensitively
export const getValue = (row: any, keys: string[]): any => {
    const rowKeys = Object.keys(row);
    for (const key of keys) {
        // Direct match
        if (row[key] !== undefined) return row[key];

        // Case insensitive match
        const foundKey = rowKeys.find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
        if (foundKey && row[foundKey] !== undefined) return row[foundKey];
    }
    return undefined;
};

export const importFromExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const bstr = e.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true, cellNF: false, cellText: false });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: 'yyyy-mm-dd' }); // raw: false tries to format values
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsBinaryString(file);
    });
};

export const exportToCSV = (data: any[], fileName: string) => {
    const replacer = (_key: string, value: any) => value === null ? '' : value;
    const header = Object.keys(data[0]);
    const csv = [
        header.join(','), // header row first
        ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');

    const csvData = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(csvData, fileName + '.csv');
};
