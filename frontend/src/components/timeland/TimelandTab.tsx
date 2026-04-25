import React, { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Hash, Loader2, Bot, ListTodo, History } from 'lucide-react';
import { useTimeland } from '../../hooks/useTimeland.js';
import type { Task } from '../../types/index.js';

export const TimelandTab: React.FC = () => {
    const { tasks, categories, selectedCategory, setSelectedCategory, isLoading } = useTimeland();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Group tasks by date
    const tasksByDate = useMemo(() => {
        const grouped: Record<string, Task[]> = {};
        tasks.forEach(task => {
            if (!grouped[task.date]) grouped[task.date] = [];
            grouped[task.date].push(task);
        });
        return grouped;
    }, [tasks]);

    // Calendar cells
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarRows = [];
    let days: React.ReactNode[] = [];
    let day = startDate;

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const cloneDay = day;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDate[dateKey] || [];
            
            days.push(
                <div
                    key={day.toString()}
                    className={`min-h-[100px] p-2 border-r border-b border-border-medium transition-colors cursor-pointer flex flex-col ${
                        !isSameMonth(day, monthStart)
                            ? "bg-bg-primary/50 text-text-tertiary"
                            : isSelected ? "bg-accent-secondary/20" : "bg-bg-primary hover:bg-bg-tertiary"
                    }`}
                    onClick={() => setSelectedDate(isSelected ? null : cloneDay)}
                >
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        isSameDay(day, new Date()) 
                            ? "bg-accent-primary text-text-inverse" 
                            : "text-text-primary"
                    }`}>
                        {format(day, 'd')}
                    </span>
                    
                    <div className="mt-1 flex-1 flex flex-col gap-0.5 overflow-hidden">
                        {dayTasks.slice(0, 3).map(task => (
                            <div key={task.id} className="text-[9px] px-1 py-0.5 rounded truncate bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                                {task.time} {task.title}
                            </div>
                        ))}
                        {dayTasks.length > 3 && (
                            <span className="text-[9px] text-text-tertiary">+{dayTasks.length - 3}</span>
                        )}
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }
        calendarRows.push(
            <div className="grid grid-cols-7" key={day.toString()}>{days}</div>
        );
        days = [];
    }

    // Detail panel
    const renderDetailPanel = () => {
        const dateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
        const dayTasks = tasksByDate[dateKey] || [];

        return (
            <div className="w-80 bg-bg-primary border-l border-border-medium flex flex-col h-full overflow-hidden">
                <div className="p-6 border-b border-border-medium bg-bg-tertiary">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center shadow-md">
                                <Bot className="w-6 h-6 text-text-inverse" />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-primary leading-tight">Bot Operations</h3>
                                <p className="text-xs text-accent-info font-medium">System Status</p>
                            </div>
                        </div>
                    </div>
                    
                    <h4 className="text-xl font-bold text-text-primary">
                        {selectedDate ? format(selectedDate, 'EEEE, MMM d, yyyy') : 'Select a date'}
                    </h4>
                </div>

                <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-bold text-text-primary flex items-center gap-2">
                            <ListTodo className="w-4 h-4 text-text-tertiary" />
                            Task Preview & History
                        </h4>
                        <span className="bg-bg-elevated text-text-tertiary text-xs font-bold px-2 py-1 rounded-md">
                            {dayTasks.length} tasks
                        </span>
                    </div>

                    {dayTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center pt-10 pb-6 px-4">
                            <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center mb-4">
                                <History className="w-8 h-8 text-text-tertiary" />
                            </div>
                            <p className="text-text-tertiary font-medium">No tasks scheduled for this day.</p>
                            <p className="text-sm text-text-tertiary mt-1 opacity-70">Bot operations are idle.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {dayTasks.map(task => (
                                <div key={task.id} className="bg-bg-tertiary border border-border-medium rounded-xl p-4 shadow-sm relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${
                                        task.status === 'completed' ? 'bg-accent-success' :
                                        task.status === 'active' ? 'bg-accent-info' :
                                        task.status === 'waiting' ? 'bg-accent-warning' : 'bg-accent-danger'
                                    }`} />
                                    
                                    <div className="flex items-start justify-between mb-2">
                                        <h5 className="font-bold text-text-primary text-sm leading-tight">{task.title}</h5>
                                        <span className="text-xs font-bold text-text-tertiary shrink-0 ml-2">{task.time}</span>
                                    </div>
                                    
                                    <p className="text-xs text-text-tertiary mb-3 line-clamp-2 leading-relaxed">
                                        {task.description}
                                    </p>
                                    
                                    <div className="flex gap-1 flex-wrap">
                                        {(task.categories || []).map(cat => (
                                            <span key={cat} className="text-[10px] px-1.5 py-0.5 bg-bg-elevated rounded text-text-tertiary">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-bg-primary">
                <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex overflow-hidden bg-bg-primary">
            {/* LEFT SIDEBAR — Categories Explorer */}
            <div className="bg-bg-secondary border-r border-border-medium flex flex-col h-full overflow-hidden"
                 style={{ width: 'var(--theme-sidebar-width, 256px)' }}>
                <div className="h-9 flex items-center px-4 border-b border-border-medium bg-bg-secondary">
                    <span className="text-sm font-medium text-text-primary tracking-tight">Timeland</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-6">
                    <div className="space-y-1">
                        <div 
                            className={`w-full flex items-center px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                selectedCategory === null ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                            }`}
                            onClick={() => setSelectedCategory(null)}
                        >
                            <div className={`p-1.5 rounded-lg mr-3 ${selectedCategory === null ? 'bg-accent-primary text-text-inverse' : 'bg-bg-elevated text-text-tertiary'}`}>
                                <Hash className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold flex-1">All Tasks</span>
                            <span className="text-xs text-text-tertiary">{tasks.length}</span>
                        </div>
                    </div>
                    
                    <div>
                        <div className="px-3 mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Categories</span>
                        </div>
                        
                        <div className="space-y-1">
                            {categories.map(cat => (
                                <div 
                                    key={cat.id}
                                    className={`w-full flex items-center px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                        selectedCategory === cat.id ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                                    }`}
                                    onClick={() => setSelectedCategory(cat.id)}
                                >
                                    <div className={`p-1.5 rounded-lg mr-3 ${selectedCategory === cat.id ? 'text-text-inverse' : 'text-text-tertiary'}`}
                                         style={{ backgroundColor: selectedCategory === cat.id ? cat.color : undefined }}
                                    >
                                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color, display: 'inline-block' }} />
                                    </div>
                                    <span className="text-sm font-medium flex-1 truncate">{cat.name}</span>
                                    <span className="text-xs text-text-tertiary">{cat.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="h-9 flex items-center justify-between px-4 border-b border-border-medium bg-bg-secondary">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="w-4 h-4 text-text-primary" />
                        <span className="text-sm font-bold text-text-primary">
                            {format(currentDate, 'MMMM yyyy')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-bg-elevated rounded-md text-text-primary">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={goToToday} className="px-3 py-1 bg-accent-primary text-xs font-bold text-text-inverse rounded-md hover:bg-accent-primary/80">
                            Today
                        </button>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-bg-elevated rounded-md text-text-primary">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                    <div className="bg-bg-primary rounded-lg border border-border-medium overflow-hidden flex flex-col flex-1">
                        <div className="grid grid-cols-7 border-b border-border-medium bg-bg-secondary">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-center font-bold text-xs text-text-tertiary py-2 uppercase">
                                    {d}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col flex-1">
                            {calendarRows}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL — Bot Operations */}
            {renderDetailPanel()}
        </div>
    );
};
