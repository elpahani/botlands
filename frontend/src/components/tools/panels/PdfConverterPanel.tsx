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
            <div className="p-4 bg-bg-secondary rounded-xl border border-border-medium shadow-sm">
                <h3 className="text-sm font-bold text-text-primary mb-2">Convert HTML to PDF</h3>
                <p className="text-xs text-text-tertiary mb-4 leading-relaxed">
                    Select an HTML document from the workspace and click the button below to generate a printable PDF natively.
                </p>
                
                <div className="mb-4">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">Target File</label>
                    {activeDocId ? (
                        <div className={`px-3 py-2 border rounded-lg text-sm font-medium truncate flex items-center gap-2 ${isActiveHtml ? 'bg-accent-primary/10 border-indigo-100 text-accent-primary' : 'bg-red-50 border-red-100 text-red-600'}`}>
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="truncate">{activeDoc?.title}</span>
                        </div>
                    ) : (
                        <div className="px-3 py-2 bg-bg-tertiary border border-border-medium rounded-lg text-sm text-text-secondary italic">
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
                    className="w-full flex items-center justify-center gap-2 bg-accent-primary hover:bg-accent-secondary text-text-inverse px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:bg-bg-tertiary"
                >
                    {convertingId === activeDocId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
                    {convertingId === activeDocId ? 'Converting...' : 'Execute Plugin'}
                </button>
            </div>
        </div>
    );
}
