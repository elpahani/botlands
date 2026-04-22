import { useEffect, useState, useRef } from 'react';
import { FileText, Loader2, RefreshCcw, FileDown, Folder as FolderIcon, Inbox, FileImage, FileAudio, FileVideo, FileSpreadsheet, FileCode, FileArchive, File as FileGeneric, Upload, Calendar, X } from 'lucide-react';
import { api } from './api.js';
import { useWorkspace } from './hooks/useWorkspace.js';
import { useDragAndDrop } from './hooks/useDragAndDrop.js';
import { usePlugins } from './hooks/usePlugins.js';
import { useSelection } from './hooks/useSelection.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { ToolsPanel } from './components/tools/ToolsPanel.js';
import { DocumentViewerModal } from './components/preview/DocumentViewerModal.js';
import { TimelandTab } from './components/timeland/TimelandTab.js';
import { ThemeProvider } from './design-system/ThemeProvider.js';

const getFileCategory = (ext: string) => {
    const e = ext.toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'].includes(e)) return 'image';
    if (['.mp4', '.webm', '.ogg', '.mov'].includes(e)) return 'video';
    if (['.mp3', '.wav', '.flac', '.m4a'].includes(e)) return 'audio';
    if (['.pdf'].includes(e)) return 'pdf';
    if (['.csv', '.xls', '.xlsx'].includes(e)) return 'spreadsheet';
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(e)) return 'archive';
    if (['.js', '.ts', '.jsx', '.tsx', '.json', '.css', '.html', '.htm', '.xml', '.yaml'].includes(e)) return 'code';
    if (['.txt', '.md', '.rtf', '.doc', '.docx'].includes(e)) return 'document';
    return 'unknown';
};

const getFileIcon = (ext: string, className: string = "w-10 h-10 text-accent-primary mb-3 opacity-90") => {
    const category = getFileCategory(ext);
    switch (category) {
        case 'image': return <FileImage className={className} />;
        case 'video': return <FileVideo className={className} />;
        case 'audio': return <FileAudio className={className} />;
        case 'pdf': return <FileDown className={className} />;
        case 'spreadsheet': return <FileSpreadsheet className={className} />;
        case 'archive': return <FileArchive className={className} />;
        case 'code': return <FileCode className={className} />;
        case 'document': return <FileText className={className} />;
        default: return <FileGeneric className={className} />;
    }
};

function App() {
    const [activeTab, setActiveTab] = useState<'docland' | 'timeland'>('docland');
    const { documents, folders, currentFolderId, setCurrentFolderId, selectedDoc, setSelectedDoc, fetchWorkspace } = useWorkspace();
    const [activeDocId, setActiveDocId] = useState<string | null>(null);
    const { dragOverId, uploading, handleDragOver, handleDragLeave, handleDrop, handleDragStart, handleFileUpload } = useDragAndDrop({ fetchWorkspace, documents });
    const { convertingId, templateTags, setTemplateTags, templateValues, setTemplateValues, isFetchingTags, setIsFetchingTags, handleExecutePlugin } = usePlugins({ fetchWorkspace, setActiveDocId });
    
    const gridRef = useRef<HTMLDivElement>(null);
    const { selectedIds, setSelectedIds, selectionBox, handleMouseDown, toggleSelection } = useSelection(gridRef);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<string>('pdf-converter');
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ 'storage': true });
    const [contextMenu, setContextMenu] = useState<{x: number, y: number, type: 'document'|'folder'|'empty', id: string} | null>(null);

    const activeDoc = documents.find(d => d.id === activeDocId);
    const activeDocExt = activeDoc ? (activeDoc.revisions.find(r => r.id === activeDoc.currentRevisionId)?.extension || activeDoc.title.slice(activeDoc.title.lastIndexOf('.')).toLowerCase() || '.html') : '';
    const isActiveHtml = activeDocExt === '.html' || activeDocExt === '.htm';

    useEffect(() => {
        const handleGlobalClick = () => setContextMenu(null);
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);

    useEffect(() => {
        if (selectedTool === 'doc-editor' && activeDocId && activeDocExt === '.docx') {
            setIsFetchingTags(true);
            setTemplateTags([]);
            setTemplateValues({});
            api.executePlugin(activeDocId, 'doc-editor', { action: 'get_tags' })
                .then(res => {
                    if (res.result && res.result.tags) {
                        setTemplateTags(res.result.tags);
                        const initial: Record<string, string> = {};
                        res.result.tags.forEach((tag: string) => initial[tag] = '');
                        setTemplateValues(initial);
                    }
                })
                .catch(err => console.error("Failed to get tags", err))
                .finally(() => setIsFetchingTags(false));
        } else {
            setTemplateTags([]);
            setTemplateValues({});
        }
    }, [selectedTool, activeDocId, documents]);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await api.createFolder(newFolderName.trim(), currentFolderId === 'inbox' ? null : currentFolderId);
            setIsCreatingFolder(false);
            setNewFolderName('');
            fetchWorkspace();
        } catch (e) {
            alert('Failed to create folder');
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files, currentFolderId);
        }
    };

    const handleUploadButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleDeleteSelected = async () => {
        const idsToDelete = selectedIds.length > 0 ? selectedIds : [contextMenu?.id].filter(Boolean) as string[];
        if (idsToDelete.length === 0) return;
        
        if (!confirm(`Are you sure you want to delete ${idsToDelete.length} item(s)?`)) return;
        
        try {
            await Promise.all(idsToDelete.map(async id => {
                if (documents.some(d => d.id === id)) {
                    await api.deleteDocument(id);
                } else if (folders.some(f => f.id === id)) {
                    await api.deleteFolder(id);
                }
            }));
            setSelectedIds([]);
            setContextMenu(null);
            if (activeDocId && idsToDelete.includes(activeDocId)) setActiveDocId(null);
            await fetchWorkspace();
        } catch (err) {
            alert('Failed to delete some items');
        }
    };

    const handleContextMenu = (e: React.MouseEvent, type: 'document'|'folder'|'empty', id: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (type !== 'empty') {
            if (!selectedIds.includes(id)) {
                setSelectedIds([id]);
            }
        } else {
            setSelectedIds([]);
        }
        
        setContextMenu({ x: e.clientX, y: e.clientY, type, id });
    };

    const closeDocModal = () => setSelectedDoc(null);

    const folderDocs = documents.filter(d => d.folderId === currentFolderId);
    const subFolders = folders.filter(f => f.parentId === currentFolderId || (currentFolderId === 'storage' && f.parentId === null && f.id !== 'inbox' && f.id !== 'storage'));
    const selectedRevision = selectedDoc?.revisions.find(r => r.id === selectedDoc.currentRevisionId);

    return (
        <ThemeProvider>
        <div className="botlands-app flex flex-col h-screen bg-bg-primary font-sans text-text-primary overflow-hidden selection:bg-accent-secondary">
            {/* Top Navigation Tabs (IDE Style) */}
            <div className="h-9 flex items-end shrink-0 z-20 select-none overflow-x-auto no-scrollbar font-sans bg-bg-secondary border-b border-border-medium">
                <button 
                    onClick={() => setActiveTab('docland')}
                    className={`h-[35px] px-3 text-[13px] flex items-center gap-2 min-w-[150px] max-w-[200px] transition-none group cursor-pointer border-r border-border-medium ${
                        activeTab === 'docland' 
                            ? 'border-t border-t-accent-primary bg-bg-primary text-text-inverse border-b border-b-transparent translate-y-[1px]' 
                            : 'border-t border-t-transparent bg-bg-elevated text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border-b border-b-transparent'
                    }`}
                >
                    <FolderIcon className={`w-4 h-4 ${activeTab === 'docland' ? 'text-accent-secondary' : 'text-text-tertiary'}`} /> 
                    <span className="truncate flex-1 text-left">docland-workspace</span>
                    <X className={`w-4 h-4 rounded-md p-0.5 transition-opacity ${
                        activeTab === 'docland' ? 'opacity-100 text-text-secondary hover:bg-bg-elevated' : 'opacity-0 group-hover:opacity-100 text-text-secondary hover:bg-bg-elevated'
                    }`} onClick={(e) => e.stopPropagation()} />
                </button>
                <button 
                    onClick={() => setActiveTab('timeland')}
                    className={`h-[35px] px-3 text-[13px] flex items-center gap-2 min-w-[150px] max-w-[200px] transition-none group cursor-pointer border-r border-border-medium ${
                        activeTab === 'timeland' 
                            ? 'border-t border-t-accent-primary bg-bg-primary text-text-inverse border-b border-b-transparent translate-y-[1px]' 
                            : 'border-t border-t-transparent bg-bg-elevated text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border-b border-b-transparent'
                    }`}
                >
                    <Calendar className={`w-4 h-4 ${activeTab === 'timeland' ? 'text-accent-info' : 'text-text-tertiary'}`} /> 
                    <span className="truncate flex-1 text-left">Timeland.tsx</span>
                    <X className={`w-4 h-4 rounded-md p-0.5 transition-opacity ${
                        activeTab === 'timeland' ? 'opacity-100 text-text-secondary hover:bg-bg-elevated' : 'opacity-0 group-hover:opacity-100 text-text-secondary hover:bg-bg-elevated'
                    }`} onClick={(e) => e.stopPropagation()} />
                </button>
                <div className="flex-1 bg-bg-secondary h-full"></div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {activeTab === 'docland' ? (
                    <>
                        <Sidebar 
                            folders={folders}
                            currentFolderId={currentFolderId}
                            setCurrentFolderId={setCurrentFolderId}
                            expandedFolders={expandedFolders}
                            setExpandedFolders={setExpandedFolders}
                            isCreatingFolder={isCreatingFolder}
                            setIsCreatingFolder={setIsCreatingFolder}
                            newFolderName={newFolderName}
                            setNewFolderName={setNewFolderName}
                            handleCreateFolder={handleCreateFolder}
                            handleContextMenu={handleContextMenu}
                        />

                        <div className="flex-1 flex flex-col min-w-0 relative">
                {uploading && (
                    <div className="absolute inset-0 z-50 bg-bg-secondary/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-bg-secondary p-6 rounded-2xl shadow-xl border border-border-medium flex flex-col items-center">
                            <Loader2 className="w-10 h-10 animate-spin text-accent-primary mb-4" />
                            <p className="text-lg font-bold text-text-primary">Uploading files...</p>
                            <p className="text-sm text-text-tertiary mt-1">Please wait while your files are processed</p>
                        </div>
                    </div>
                )}

                <div className="h-16 border-b border-border-medium bg-bg-secondary flex items-center px-6 shrink-0 z-10 justify-between">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        {currentFolderId === 'inbox' ? 'Inbox' : currentFolderId === 'storage' ? 'Storage' : folders.find(f => f.id === currentFolderId)?.name || 'Unknown'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileInputChange}
                            className="hidden"
                        />
                        <button 
                            onClick={handleUploadButtonClick}
                            className="p-2 hover:bg-bg-elevated text-text-tertiary rounded-lg transition-colors"
                            title="Upload files"
                        >
                            <Upload className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={fetchWorkspace}
                            className="p-2 hover:bg-bg-elevated text-text-tertiary rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <RefreshCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                <div 
                    ref={gridRef}
                    className={`flex-1 overflow-y-auto p-6 transition-colors relative ${dragOverId === currentFolderId ? 'bg-accent-primary/10/50' : ''}`}
                    onMouseDown={handleMouseDown}
                    onDragOver={(e) => handleDragOver(e, currentFolderId)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, currentFolderId)}
                    onContextMenu={(e) => handleContextMenu(e, 'empty', currentFolderId)}
                >
                    {selectionBox && (
                        <div 
                            className="fixed bg-accent-primary/100/20 border border-accent-primary z-40 pointer-events-none"
                            style={{
                                left: Math.min(selectionBox.startX, selectionBox.currentX),
                                top: Math.min(selectionBox.startY, selectionBox.currentY),
                                width: Math.abs(selectionBox.currentX - selectionBox.startX),
                                height: Math.abs(selectionBox.currentY - selectionBox.startY)
                            }}
                        />
                    )}

                    {subFolders.length === 0 && folderDocs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                            <div className="w-24 h-24 bg-bg-tertiary rounded-full flex items-center justify-center mb-6">
                                <Inbox className="w-10 h-10 opacity-50" />
                            </div>
                            <p className="text-xl font-bold text-text-tertiary mb-2">This folder is empty</p>
                            <p className="text-sm">Drag and drop files here to upload</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {subFolders.map(folder => (
                                <div 
                                    key={folder.id}
                                    data-id={folder.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, folder.id, selectedIds)}
                                    onDragOver={(e) => handleDragOver(e, folder.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, folder.id)}
                                    onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id)}
                                    className={`selectable-item bg-bg-secondary rounded-xl shadow-sm border p-4 cursor-pointer hover:shadow-md transition-all group active:scale-95 duration-100 ${
                                        dragOverId === folder.id ? 'border-accent-primary ring-2 ring-indigo-200' : 
                                        selectedIds.includes(folder.id) ? 'border-accent-primary ring-2 ring-accent-primary/50 bg-accent-primary/10/50' : 
                                        'border-border-medium hover:border-indigo-300 hover:shadow-md'
                                    }`}
                                    onClick={(e) => toggleSelection(folder.id, e.ctrlKey || e.metaKey)}
                                    onDoubleClick={() => setCurrentFolderId(folder.id)}
                                >
                                    <div className="flex items-center justify-center h-20 mb-3">
                                        <FolderIcon className={`w-16 h-16 ${dragOverId === folder.id ? 'text-accent-primary fill-accent-primary/20' : 'text-text-primary fill-bg-tertiary group-hover:text-text-secondary'} transition-colors`} />
                                    </div>
                                    <p className="text-sm font-bold text-text-primary text-center truncate">{folder.name}</p>
                                </div>
                            ))}

                            {folderDocs.map(doc => {
                                const ext = doc.revisions.find(r => r.id === doc.currentRevisionId)?.extension || doc.title.slice(doc.title.lastIndexOf('.')).toLowerCase() || '.html';
                                
                                return (
                                    <div 
                                        key={doc.id}
                                        data-id={doc.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, doc.id, selectedIds)}
                                        onContextMenu={(e) => handleContextMenu(e, 'document', doc.id)}
                                        className={`selectable-item bg-bg-secondary rounded-xl shadow-sm border p-4 cursor-pointer transition-all relative overflow-hidden group active:scale-95 duration-100 ${
                                            selectedIds.includes(doc.id) ? 'ring-2 ring-accent-primary border-transparent shadow-md bg-accent-primary/10/50' : 
                                            activeDocId === doc.id ? 'ring-2 ring-indigo-300 border-transparent shadow-md' : 
                                            'border-border-medium hover:border-indigo-300 hover:shadow-md'
                                        }`}
                                        onClick={(e) => {
                                            toggleSelection(doc.id, e.ctrlKey || e.metaKey);
                                            setActiveDocId(doc.id);
                                        }}
                                        onDoubleClick={() => setSelectedDoc(doc)}
                                    >
                                        <div className="flex flex-col items-center justify-center h-24 mb-3">
                                            {getFileIcon(ext)}
                                        </div>
                                        <p className="text-sm font-bold text-text-primary text-center truncate leading-tight" title={doc.title}>{doc.title}</p>
                                        <p className="text-[10px] text-text-secondary text-center uppercase tracking-wider font-bold mt-1">{ext.replace('.', '')}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <ToolsPanel 
                isToolMenuOpen={isToolMenuOpen}
                setIsToolMenuOpen={setIsToolMenuOpen}
                selectedTool={selectedTool}
                setSelectedTool={setSelectedTool}
                activeDocId={activeDocId}
                activeDocExt={activeDocExt}
                activeDoc={activeDoc}
                isActiveHtml={isActiveHtml}
                convertingId={convertingId}
                handleExecutePlugin={handleExecutePlugin}
                isFetchingTags={isFetchingTags}
                templateTags={templateTags}
                templateValues={templateValues}
                setTemplateValues={setTemplateValues}
            />

            {selectedDoc && selectedRevision && (
                <DocumentViewerModal 
                    selectedDoc={selectedDoc}
                    selectedRevision={selectedRevision}
                    closeDocModal={closeDocModal}
                    handleExecutePlugin={handleExecutePlugin}
                    convertingId={convertingId}
                    getFileIcon={getFileIcon}
                />
            )}

            {contextMenu && (
                <div 
                    className="fixed bg-bg-secondary border border-border-medium shadow-2xl rounded-lg py-1 w-48 z-50"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {(contextMenu.type === 'document' || contextMenu.type === 'folder') && (
                        <>
                            {selectedIds.length === 1 && contextMenu.type === 'document' && (
                                <button 
                                    className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-bg-elevated hover:text-accent-primary font-medium"
                                    onClick={() => { setActiveDocId(contextMenu.id); setContextMenu(null); }}
                                >
                                    Select Document
                                </button>
                            )}
                            {selectedIds.length === 1 && contextMenu.type === 'folder' && (
                                <button 
                                    className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-bg-elevated hover:text-accent-primary font-medium"
                                    onClick={() => { setCurrentFolderId(contextMenu.id); setContextMenu(null); }}
                                >
                                    Open Folder
                                </button>
                            )}
                            <button 
                                className="w-full text-left px-4 py-2 text-sm text-accent-danger hover:bg-accent-danger/10 font-medium border-t border-border-light"
                                onClick={handleDeleteSelected}
                            >
                                Delete {selectedIds.length > 1 ? `${selectedIds.length} items` : ''}
                            </button>
                        </>
                    )}
                    {contextMenu.type === 'empty' && (
                        <div className="px-4 py-3 bg-bg-secondary border-b border-border-light mb-1">
                            <label className="flex items-center gap-2 cursor-pointer w-full">
                                <Upload className="w-4 h-4 text-accent-primary" />
                                <span className="text-sm font-bold text-text-primary">Upload Files</span>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    multiple 
                                    onChange={e => {
                                        if (e.target.files) handleFileUpload(e.target.files, contextMenu.id);
                                        setContextMenu(null);
                                    }}
                                />
                            </label>
                        </div>
                    )}
                </div>
            )}
                    </>
                ) : (
                    <TimelandTab />
                )}
            </div>
        </div>
        </ThemeProvider>
    );
}

export default App;
