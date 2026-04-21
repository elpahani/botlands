import { useState } from 'react';
import { api } from '../api.js';

export function usePlugins({ fetchWorkspace, setActiveDocId }: { fetchWorkspace: () => void, setActiveDocId: (id: string) => void }) {
    const [convertingId, setConvertingId] = useState<string | null>(null);
    const [templateTags, setTemplateTags] = useState<string[]>([]);
    const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
    const [isFetchingTags, setIsFetchingTags] = useState(false);

    const handleExecutePlugin = async (docId: string, pluginId: string) => {
        let data = {};
        if (pluginId === 'doc-editor') {
            data = { action: 'fill_template', tags: templateValues };
        }
        
        setConvertingId(docId);
        try {
            const res = await api.executePlugin(docId, pluginId, data);
            await fetchWorkspace();
            if (pluginId === 'doc-editor' && res.result && res.result.id) {
                setActiveDocId(res.result.id);
            }
        } catch (err) {
            console.error(`Failed to execute plugin ${pluginId}:`, err);
            alert(`Ошибка: ${err}`);
        } finally {
            setConvertingId(null);
        }
    };

    return {
        convertingId,
        templateTags,
        setTemplateTags,
        templateValues,
        setTemplateValues,
        isFetchingTags,
        setIsFetchingTags,
        handleExecutePlugin
    };
}
