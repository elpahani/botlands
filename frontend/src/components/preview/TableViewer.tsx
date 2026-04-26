import { useState, useEffect } from 'react';
import { Loader2, FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { api } from '../../api.js';

interface TableViewerProps {
    docId: string;
    revId: string;
    fileType: 'csv' | 'xlsx' | 'xls';
}

export function TableViewer({ docId, revId, fileType }: TableViewerProps) {
    const [data, setData] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortColumn, setSortColumn] = useState<number | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        const loadData = async () => {
            try {
                const url = api.getOriginalUrl(docId, revId);
                const response = await fetch(url);
                const blob = await response.blob();

                if (fileType === 'csv') {
                    const text = await blob.text();
                    Papa.parse(text, {
                        complete: (results: any) => {
                            const rows = results.data as string[][];
                            if (rows.length > 0) {
                                setHeaders(rows[0]);
                                setData(rows.slice(1).filter(row => row.some(cell => cell.trim() !== '')));
                            }
                            setLoading(false);
                        },
                        header: false,
                        skipEmptyLines: true
                    });
                } else {
                    const arrayBuffer = await blob.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
                    
                    if (jsonData.length > 0) {
                        setHeaders(jsonData[0]);
                        setData(jsonData.slice(1).filter(row => row.some(cell => cell?.toString().trim() !== '')));
                    }
                    setLoading(false);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load table');
                setLoading(false);
            }
        };

        loadData();
    }, [docId, revId, fileType]);

    const handleSort = (columnIndex: number) => {
        if (sortColumn === columnIndex) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnIndex);
            setSortDirection('asc');
        }
    };

    const sortedData = [...data].sort((a, b) => {
        if (sortColumn === null) return 0;
        const aVal = a[sortColumn] || '';
        const bVal = b[sortColumn] || '';
        const comparison = aVal.toString().localeCompare(bVal.toString());
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-bg-secondary">
                <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-bg-secondary p-8 text-text-secondary">
                <FileSpreadsheet className="w-16 h-16 mb-4 text-text-tertiary" />
                <p className="text-lg font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-bg-secondary overflow-auto">
            <div className="p-4 border-b border-border-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-accent-primary" />
                    <span className="text-sm font-medium text-text-secondary">
                        {data.length} rows × {headers.length} columns
                    </span>
                </div>
                <a 
                    href={api.getOriginalUrl(docId, revId)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-accent-primary hover:text-accent-secondary transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Download
                </a>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-bg-elevated sticky top-0 z-10">
                        <tr>
                            {headers.map((header, index) => (
                                <th 
                                    key={index}
                                    onClick={() => handleSort(index)}
                                    className="px-4 py-3 text-xs font-semibold text-text-primary uppercase tracking-wider border-b border-border-medium cursor-pointer hover:bg-bg-tertiary transition-colors select-none"
                                >
                                    <div className="flex items-center gap-1">
                                        {header || `Column ${index + 1}`}
                                        {sortColumn === index && (
                                            <span className="text-accent-primary">
                                                {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row, rowIndex) => (
                            <tr 
                                key={rowIndex}
                                className="border-b border-border-light hover:bg-bg-elevated/50 transition-colors"
                            >
                                {headers.map((_, colIndex) => (
                                    <td 
                                        key={colIndex}
                                        className="px-4 py-2.5 text-sm text-text-secondary whitespace-nowrap"
                                    >
                                        {row[colIndex] || ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
