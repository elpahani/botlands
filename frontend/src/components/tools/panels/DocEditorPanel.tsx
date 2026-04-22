import { FileText, Loader2, Settings2 } from 'lucide-react';
import type { Document } from '../../../types/index.js';
import { DynamicInput } from '../../ui/inputs/index.js';
import type { InputConfig } from '../../ui/inputs/index.js';

interface DocEditorPanelProps {
    activeDocId: string | null;
    activeDocExt: string;
    activeDoc: Document | undefined;
    convertingId: string | null;
    isFetchingTags: boolean;
    templateTags: string[];
    templateValues: Record<string, any>;
    setTemplateValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    handleExecutePlugin: (docId: string, pluginId: string) => void;
}

export function DocEditorPanel({
    activeDocId,
    activeDocExt,
    activeDoc,
    convertingId,
    isFetchingTags,
    templateTags,
    templateValues,
    setTemplateValues,
    handleExecutePlugin
}: DocEditorPanelProps) {
    const handleInputChange = (name: string, value: any) => {
        setTemplateValues(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-bg-secondary rounded-xl border border-border-medium shadow-sm">
                <h3 className="text-sm font-bold text-text-primary mb-2">Doc Editor</h3>
                <p className="text-xs text-text-tertiary mb-4 leading-relaxed">
                    Автоматически анализирует шаблон .docx, находит параметры <code>{"{...}"}</code> и позволяет заполнить их в умной форме.
                </p>
                
                <div className="mb-4">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">Target DOCX File</label>
                    {activeDocId ? (
                        <div className={`px-3 py-2 border rounded-lg text-sm font-medium truncate flex items-center gap-2 ${activeDocExt === '.docx' ? 'bg-accent-primary/10 border-indigo-100 text-accent-primary' : 'bg-red-50 border-red-100 text-accent-danger'}`}>
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="truncate">{activeDoc?.title}</span>
                        </div>
                    ) : (
                        <div className="px-3 py-2 bg-bg-tertiary border border-border-medium rounded-lg text-sm text-text-secondary italic">
                            Please select a .docx file...
                        </div>
                    )}
                    {activeDocId && activeDocExt !== '.docx' && (
                        <p className="text-xs text-red-500 mt-2">Only .docx files are supported by this tool.</p>
                    )}
                </div>

                {activeDocId && activeDocExt === '.docx' && (
                    <div className="mb-4">
                        {isFetchingTags ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
                            </div>
                        ) : templateTags.length > 0 ? (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2 border-b border-border-light pb-2">Dynamic Parameters</h4>
                                {templateTags.map(tag => {
                                    // Простейший эвристический парсер типов тегов, чтобы показать библиотеку инпутов в деле
                                    // Например, если тег называется Count:number или IsActive:boolean
                                    let type: any = 'text';
                                    let cleanName = tag;
                                    let label = tag;
                                    let options = undefined;
                                    let max = undefined;

                                    if (tag.toLowerCase().includes('count') || tag.toLowerCase().includes('sum') || tag.toLowerCase().includes('price')) {
                                        type = 'number';
                                    }
                                    if (tag.toLowerCase().includes('is') || tag.toLowerCase().includes('has')) {
                                        type = 'boolean';
                                    }
                                    if (tag.toLowerCase().includes('percentage') || tag.toLowerCase().includes('progress')) {
                                        type = 'slider';
                                        max = 100;
                                    }
                                    if (tag.toLowerCase().includes('description') || tag.toLowerCase().includes('text')) {
                                        type = 'textarea';
                                    }
                                    if (tag.toLowerCase().includes('status')) {
                                        type = 'select';
                                        options = [
                                            { label: 'Draft', value: 'Draft' },
                                            { label: 'Active', value: 'Active' },
                                            { label: 'Closed', value: 'Closed' }
                                        ];
                                    }

                                    const config: InputConfig = {
                                        type,
                                        name: cleanName,
                                        label: label,
                                        placeholder: `Введите ${label}...`,
                                        options,
                                        max
                                    };

                                    return (
                                        <DynamicInput 
                                            key={tag}
                                            config={config}
                                            value={templateValues[tag]}
                                            onChange={handleInputChange}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-2 px-3 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-100">
                                В документе не найдено параметров. Используйте формат {'{Имя}'} в Word.
                            </div>
                        )}
                    </div>
                )}

                <button 
                    onClick={() => activeDocId && handleExecutePlugin(activeDocId, 'doc-editor')}
                    disabled={!activeDocId || activeDocExt !== '.docx' || convertingId === activeDocId || isFetchingTags}
                    className="w-full flex items-center justify-center gap-2 bg-accent-primary hover:bg-accent-secondary text-text-inverse px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:bg-bg-tertiary"
                >
                    {convertingId === activeDocId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
                    {convertingId === activeDocId ? 'Generating...' : 'Fill & Generate'}
                </button>
            </div>
        </div>
    );
}
