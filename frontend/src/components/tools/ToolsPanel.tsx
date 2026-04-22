import { Wrench, ChevronDown, FileDown, FileText } from 'lucide-react';
import type { Document } from '../../types/index.js';
import { PdfConverterPanel } from './panels/PdfConverterPanel.js';
import { DocEditorPanel } from './panels/DocEditorPanel.js';

interface ToolsPanelProps {
    isToolMenuOpen: boolean;
    setIsToolMenuOpen: (v: boolean) => void;
    selectedTool: string;
    setSelectedTool: (t: string) => void;
    activeDocId: string | null;
    activeDocExt: string;
    activeDoc: Document | undefined;
    isActiveHtml: boolean;
    convertingId: string | null;
    handleExecutePlugin: (docId: string, pluginId: string) => void;
    isFetchingTags: boolean;
    templateTags: string[];
    templateValues: Record<string, string>;
    setTemplateValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function ToolsPanel(props: ToolsPanelProps) {
    const { isToolMenuOpen, setIsToolMenuOpen, selectedTool, setSelectedTool } = props;

    return (
        <div className="w-80 bg-bg-secondary border-l border-border-medium flex flex-col shrink-0 z-10 shadow-sm">
            <div className="p-4 border-b border-border-medium bg-bg-secondary shrink-0">
                <h2 className="font-bold text-text-primary flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-accent-primary" />
                    Tools & Plugins
                </h2>
                <div className="relative">
                    <button 
                        onClick={() => setIsToolMenuOpen(!isToolMenuOpen)}
                        className="w-full flex items-center justify-between py-2 px-3 bg-bg-secondary border border-border-medium rounded-lg shadow-sm text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            {selectedTool === 'pdf-converter' && <FileDown className="w-4 h-4 text-red-500" />}
                            {selectedTool === 'doc-editor' && <FileText className="w-4 h-4 text-blue-500" />}
                            {selectedTool === 'pdf-converter' ? 'PDF Converter' : selectedTool === 'doc-editor' ? 'Doc Editor' : 'Select Tool'}
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isToolMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isToolMenuOpen && (
                        <div className="absolute top-full mt-1 left-0 w-full bg-bg-secondary border border-border-medium rounded-lg shadow-xl overflow-hidden z-50">
                            <button 
                                onClick={() => { setSelectedTool('pdf-converter'); setIsToolMenuOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-accent-primary/10 hover:text-accent-primary transition-colors flex items-center gap-2"
                            >
                                <FileDown className="w-4 h-4 text-red-500" /> PDF Converter
                            </button>
                            <button 
                                onClick={() => { setSelectedTool('doc-editor'); setIsToolMenuOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-accent-primary/10 hover:text-accent-primary transition-colors flex items-center gap-2 border-t border-border-light"
                            >
                                <FileText className="w-4 h-4 text-blue-500" /> Doc Editor
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
                {selectedTool === 'pdf-converter' && <PdfConverterPanel {...props} />}
                {selectedTool === 'doc-editor' && <DocEditorPanel {...props} />}
            </div>
        </div>
    );
}
