import { useState, useEffect } from 'react';
import type { RefObject } from 'react';

export function useSelection(containerRef: RefObject<HTMLElement | null>) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectionBox, setSelectionBox] = useState<{startX: number, startY: number, currentX: number, currentY: number} | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!selectionBox) return;
            
            setSelectionBox(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);

            if (!containerRef.current) return;
            
            const boxRect = {
                left: Math.min(selectionBox.startX, e.clientX),
                right: Math.max(selectionBox.startX, e.clientX),
                top: Math.min(selectionBox.startY, e.clientY),
                bottom: Math.max(selectionBox.startY, e.clientY)
            };

            const elements = containerRef.current.querySelectorAll('.selectable-item');
            const newSelected: string[] = [];

            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const intersect = !(
                    rect.right < boxRect.left || 
                    rect.left > boxRect.right || 
                    rect.bottom < boxRect.top || 
                    rect.top > boxRect.bottom
                );
                
                const id = el.getAttribute('data-id');
                if (intersect && id) {
                    newSelected.push(id);
                }
            });

            setSelectedIds(newSelected);
        };

        const handleMouseUp = () => {
            setSelectionBox(null);
        };

        if (selectionBox) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.userSelect = '';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
        };
    }, [selectionBox, containerRef]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        if ((e.target as HTMLElement).closest('.selectable-item')) return;
        
        setSelectionBox({
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY
        });
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            setSelectedIds([]);
        }
    };

    const toggleSelection = (id: string, multi: boolean) => {
        if (multi) {
            setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
        } else {
            setSelectedIds([id]);
        }
    };

    return {
        selectedIds,
        setSelectedIds,
        selectionBox,
        handleMouseDown,
        toggleSelection
    };
}
