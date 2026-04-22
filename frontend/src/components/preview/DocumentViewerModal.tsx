import { Download, FileDown, Loader2, X, FileAudio } from 'lucide-react';
import * as docx from 'docx-preview';
import { useRef, useState, useEffect } from 'react';
import { api } from '../../api.js';
import type { Document, Revision } from '../../types/index.js';
import { format } from 'date-fns';

export function DocxPreview({ url }: { url: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);

        fetch(url)
            .then(res => res.blob())
            .then(blob => {
                if (!active || !containerRef.current) return;
                docx.renderAsync(blob, containerRef.current, containerRef.current, {
                    inWrapper: true,
                    ignoreWidth: false,
                    ignoreHeight: false,
                }).then(() => {
                    if (active) setLoading(false);
                });
            })
            .catch(err => {
                console.error('docx preview failed', err);
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [url]);

    return (
        <div className="w-full h-full relative overflow-y-auto bg-bg-elevated/50 flex flex-col items-center">
            {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-secondary/50 backdrop-blur-sm"><Loader2 className="w-8 h-8 animate-spin text-accent-primary" /></div>}
            <div ref={containerRef} className="w-full max-w-5xl shadow-2xl bg-bg-secondary" />
        </div>
    );
}

export function DocumentViewerModal({
    selectedDoc,
    selectedRevision,
    closeDocModal,
    handleExecutePlugin,
    convertingId,
    getFileIcon
}: {
    selectedDoc: Document;
    selectedRevision: Revision;
    closeDocModal: () => void;
    handleExecutePlugin: (docId: string, pluginId: string) => void;
    convertingId: string | null;
    getFileIcon: (ext: string, classes: string) => React.ReactNode;
}) {
    const renderPreview = () => {
        const ext = (selectedRevision.extension || selectedDoc.title.slice(selectedDoc.title.lastIndexOf('.')).toLowerCase() || '.html');
        const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'].includes(ext);
        const isVideo = ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
        const isAudio = ['.mp3', '.wav', '.flac', '.m4a'].includes(ext);
        const isCode = ['.js', '.ts', '.jsx', '.tsx', '.json', '.css', '.xml', '.yaml'].includes(ext);
        const isText = ['.txt', '.md', '.rtf', '.html', '.htm'].includes(ext);
        const isDocx = ext === '.docx';
        const isPdf = ext === '.pdf' || selectedRevision.hasPdf;

        if (isPdf) {
            const url = selectedRevision.hasPdf ? api.getPdfUrl(selectedDoc.id, selectedRevision.id) : api.getOriginalUrl(selectedDoc.id, selectedRevision.id);
            return (
                <iframe 
                    src={url} 
                    className="w-full h-full max-w-5xl bg-bg-secondary shadow-xl rounded-lg border-none"
                    title="PDF Preview"
                />
            );
        }
        
        if (isDocx) {
            return (
                <div className="w-full h-full max-w-5xl bg-bg-secondary shadow-xl rounded-lg border border-border-medium overflow-hidden">
                    <DocxPreview url={api.getOriginalUrl(selectedDoc.id, selectedRevision.id)} />
                </div>
            );
        }
        
        if (isImage) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-bg-tertiary p-8">
                    <img 
                        src={api.getOriginalUrl(selectedDoc.id, selectedRevision.id)} 
                        alt={selectedDoc.title}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-border-medium/50"
                    />
                </div>
            );
        }

        if (isVideo) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-black/90 p-8">
                    <video 
                        src={api.getOriginalUrl(selectedDoc.id, selectedRevision.id)} 
                        controls 
                        className="max-w-full max-h-full shadow-2xl rounded"
                    />
                </div>
            );
        }

        if (isAudio) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-bg-tertiary p-8">
                    <div className="w-32 h-32 bg-bg-secondary rounded-full shadow-lg flex items-center justify-center mb-8">
                        <FileAudio className="w-12 h-12 text-accent-primary" />
                    </div>
                    <audio 
                        src={api.getOriginalUrl(selectedDoc.id, selectedRevision.id)} 
                        controls 
                        className="w-full max-w-md shadow-md rounded-full"
                    />
                </div>
            );
        }

        if (isText || isCode) {
            return (
                <div className="w-full h-full max-w-5xl bg-bg-secondary shadow-xl rounded-lg border border-border-medium overflow-hidden">
                    <iframe 
                        src={api.getPreviewUrl(selectedDoc.id, selectedRevision.id)} 
                        className="w-full h-full border-none block bg-bg-secondary"
                        title="Code/Text Preview"
                    />
                </div>
            );
        }

        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-bg-tertiary p-8 text-text-secondary">
                {getFileIcon(ext, "w-24 h-24 mb-4 opacity-50")}
                <p className="text-lg font-medium text-text-tertiary">Preview not available</p>
                <p className="text-sm mt-2 text-text-secondary">Please download the file to view its contents.</p>
                <a href={api.getOriginalUrl(selectedDoc.id, selectedRevision.id)} target="_blank" rel="noreferrer" className="mt-6 px-6 py-2.5 bg-bg-secondary border border-border-medium text-text-primary font-semibold rounded-lg hover:bg-bg-secondary transition-colors shadow-sm">
                    Download File
                </a>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-bg-secondary/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-12" onClick={closeDocModal}>
            <div className="bg-bg-secondary w-full h-full max-w-7xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border-medium/50 relative animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <header className="h-16 bg-bg-secondary border-b border-border-medium px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-border-medium flex items-center justify-center shrink-0 shadow-sm">
                            {getFileIcon(selectedRevision.extension || selectedDoc.title.slice(selectedDoc.title.lastIndexOf('.')).toLowerCase() || '.html', "w-6 h-6 text-accent-primary")}
                        </div>
                        <div className="flex flex-col pt-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold text-text-primary truncate" title={selectedDoc.title}>{selectedDoc.title}</h2>
                                {selectedRevision.id === selectedDoc.currentRevisionId && (
                                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">Latest</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-text-tertiary font-medium">{format(new Date(selectedRevision.timestamp), 'PPp')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {selectedRevision.hasPdf ? (
                            <a href={api.getPdfUrl(selectedDoc.id, selectedRevision.id)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                                <FileDown className="w-4 h-4" /> Download PDF
                            </a>
                        ) : (
                            selectedRevision.id === selectedDoc.currentRevisionId && ['.html', '.htm'].includes(selectedRevision.extension || '.html') && (
                                <button 
                                    onClick={() => handleExecutePlugin(selectedDoc.id, 'pdf-converter')}
                                    disabled={convertingId === selectedDoc.id}
                                    className="w-full bg-bg-secondary hover:bg-bg-tertiary disabled:bg-bg-tertiary text-text-inverse font-bold py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {convertingId === selectedDoc.id ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Converting...</>
                                    ) : (
                                        <><FileDown className="w-4 h-4" /> Convert to PDF</>
                                    )}
                                </button>)
                        )}
                        <a href={api.getOriginalUrl(selectedDoc.id, selectedRevision.id)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary px-3 py-2 rounded-lg transition-colors">
                            <Download className="w-4 h-4" /> Download Original
                        </a>
                        
                        <div className="w-px h-6 bg-bg-elevated mx-1"></div>
                        
                        <button 
                            onClick={closeDocModal}
                            className="p-2 hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 bg-bg-secondary/50 relative overflow-hidden flex flex-col items-center">
                    {renderPreview()}
                </main>
            </div>
        </div>
    );
}
