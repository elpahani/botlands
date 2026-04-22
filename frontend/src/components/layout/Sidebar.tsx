import { useState } from 'react';
import { Folder as FolderIcon, Inbox, Database, Plus, ChevronRight, ChevronDown, MoreVertical, Settings } from 'lucide-react';
import type { Folder } from '../../types/index.js';
import { SettingsPanel } from '../../settings/SettingsPanel.js';

interface SidebarProps {
    folders: Folder[];
    currentFolderId: string;
    setCurrentFolderId: (id: string) => void;
    expandedFolders: Record<string, boolean>;
    setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    isCreatingFolder: boolean;
    setIsCreatingFolder: (v: boolean) => void;
    newFolderName: string;
    setNewFolderName: (v: string) => void;
    handleCreateFolder: () => void;
    handleContextMenu: (e: React.MouseEvent, type: 'document'|'folder'|'empty', id: string) => void;
}

export function Sidebar({
    folders,
    currentFolderId,
    setCurrentFolderId,
    expandedFolders,
    setExpandedFolders,
    isCreatingFolder,
    setIsCreatingFolder,
    newFolderName,
    setNewFolderName,
    handleCreateFolder,
    handleContextMenu
}: SidebarProps) {
    const [showSettings, setShowSettings] = useState(false);

    const toggleFolder = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderFolderTree = (parentId: string | null = 'storage', depth = 0) => {
        const children = folders.filter(f => f.parentId === parentId);
        if (children.length === 0) return null;

        return (
            <div className={`space-y-0.5 ${depth > 0 ? 'ml-4 border-l border-slate-200/60 pl-2 mt-0.5' : ''}`}>
                {children.map(folder => (
                    <div key={folder.id}>
                        <div 
                            className={`flex items-center group cursor-pointer rounded-lg px-2 py-1.5 transition-colors ${currentFolderId === folder.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                            onClick={() => setCurrentFolderId(folder.id)}
                            onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id)}
                        >
                            <button 
                                onClick={(e) => toggleFolder(folder.id, e)}
                                className={`p-0.5 rounded-md hover:bg-slate-200/50 text-slate-400 mr-1 ${folders.some(f => f.parentId === folder.id) ? 'opacity-100' : 'opacity-0'}`}
                            >
                                {expandedFolders[folder.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                            <FolderIcon className={`w-4 h-4 mr-2 ${currentFolderId === folder.id ? 'text-indigo-500 fill-indigo-100' : 'text-slate-400 fill-slate-100/50'}`} />
                            <span className="text-sm font-medium flex-1 truncate">{folder.name}</span>
                            <button 
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded transition-all"
                                onClick={(e) => { e.stopPropagation(); handleContextMenu(e, 'folder', folder.id); }}
                            >
                                <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        {expandedFolders[folder.id] && renderFolderTree(folder.id, depth + 1)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-200 bg-white">
                <h1 className="text-xl font-black bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">DocLand</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-6">
                <div className="space-y-1">
                    <button 
                        className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-colors ${currentFolderId === 'inbox' ? 'bg-indigo-100/50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                        onClick={() => setCurrentFolderId('inbox')}
                    >
                        <div className={`p-1.5 rounded-lg mr-3 ${currentFolderId === 'inbox' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            <Inbox className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold">Inbox</span>
                    </button>

                    <button 
                        className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-colors ${currentFolderId === 'storage' ? 'bg-indigo-100/50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                        onClick={() => setCurrentFolderId('storage')}
                    >
                        <div className={`p-1.5 rounded-lg mr-3 ${currentFolderId === 'storage' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            <Database className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold flex-1 text-left">Storage</span>
                    </button>
                </div>

                <div>
                    <div className="px-3 mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Folders</span>
                        <button 
                            onClick={() => setIsCreatingFolder(true)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {isCreatingFolder && (
                        <div className="px-3 mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <input 
                                autoFocus
                                type="text"
                                value={newFolderName}
                                onChange={e => setNewFolderName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleCreateFolder();
                                    if (e.key === 'Escape') { setIsCreatingFolder(false); setNewFolderName(''); }
                                }}
                                onBlur={() => {
                                    if (newFolderName.trim()) handleCreateFolder();
                                    else setIsCreatingFolder(false);
                                }}
                                placeholder="Folder name..."
                                className="w-full px-3 py-1.5 text-sm bg-white border border-indigo-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    )}
                    
                    <div className="px-1">
                        {renderFolderTree('storage')}
                    </div>
                </div>
            </div>

            {/* Settings Button - Bottom of Sidebar */}
            <div className="px-3 py-2 border-t border-slate-200 bg-white">
                <button 
                    onClick={() => setShowSettings(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">Settings</span>
                </button>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSettings(false)}>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                        <SettingsPanel />
                        <button 
                            onClick={() => setShowSettings(false)}
                            className="absolute top-4 right-4 text-white/50 hover:text-white text-xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}