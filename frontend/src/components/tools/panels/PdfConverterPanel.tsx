import { FileText, Loader2, Settings2 } from 'lucide-react';
import type { Document } from '../../../types/index.js';

interface PdfConverterPanelProps {
    activeDocId: string | null;
    isActiveHtml: boolean;
    activeDoc: Document | undefined;
    convertingId: string | null;
    handleExecutePlugin: (docId: string, pluginId: string) => void;
}

export function PdfConverterPanel({
    activeDocId,
    isActiveHtml,
    activeDoc,
    convertingId,
    handleExecutePlugin
}: PdfConverterPanelProps) {
    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Convert HTML to PDF</h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Select an HTML document from the workspace and click the button below to generate a printable PDF natively.
                </p>
                
                <div className="mb-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Target File</label>
                    {activeDocId ? (
                        <div className={`px-3 py-2 border rounded-lg text-sm font-medium truncate flex items-center gap-2 ${isActiveHtml ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="truncate">{activeDoc?.title}</span>
                        </div>
                    ) : (
                        <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-400 italic">
                            Please select a file...
                        </div>
                    )}
                    {activeDocId && !isActiveHtml && (
                        <p className="text-xs text-red-500 mt-2">Only HTML files are supported by this tool.</p>
                    )}
                </div>

                <button 
                    onClick={() => activeDocId && handleExecutePlugin(activeDocId, 'pdf-converter')}
                    disabled={!activeDocId || !isActiveHtml || convertingId === activeDocId}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:bg-slate-300"
                >
                    {convertingId === activeDocId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
                    {convertingId === activeDocId ? 'Converting...' : 'Execute Plugin'}
                </button>
            </div>
        </div>
    );
}
