import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock, Check, History, Bot, ListTodo, AlertCircle, Loader2 } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace.js';
import type { Task } from '../../hooks/useWorkspace.js';

export const TimelandTab: React.FC = () => {
    const { tasks } = useWorkspace();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    
    // Group tasks by date
    const tasksByDate = React.useMemo(() => {
        const grouped: Record<string, Task[]> = {};
        if (tasks) {
            tasks.forEach(task => {
                if (!grouped[task.date]) grouped[task.date] = [];
                grouped[task.date].push(task);
            });
        }
        return grouped;
    }, [tasks]);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between py-4 px-6 border-b border-[#2d2d2d] bg-[#252526]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#2d2d2d] text-[#cccccc] rounded-xl flex items-center justify-center">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#cccccc]">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                </div>
                <div className="flex items-center gap-3 bg-[#1e1e1e] p-1 rounded-lg border border-[#2d2d2d]">
                    <button 
                        onClick={prevMonth}
                        className="p-2 hover:bg-[#2d2d2d] rounded-md transition-colors text-[#cccccc]"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={goToToday}
                        className="px-4 py-1.5 bg-[#007fd4] text-sm font-bold text-white rounded-md shadow-sm hover:bg-[#006bb3]"
                    >
                        Today
                    </button>
                    <button 
                        onClick={nextMonth}
                        className="p-2 hover:bg-[#2d2d2d] rounded-md transition-colors text-[#cccccc]"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const dateFormat = "EEEE";
        const days = [];
        let startDate = startOfWeek(currentDate);
        for (let i = 0; i < 7; i++) {
            days.push(
                <div className="text-center font-bold text-xs text-[#8b9298] py-3 uppercase tracking-wider" key={i}>
                    {format(addDays(startDate, i), dateFormat)}
                </div>
            );
        }
        return <div className="grid grid-cols-7 border-b border-[#2d2d2d] bg-[#252526]">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day;
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayTasks = tasksByDate[dateKey] || [];
                const completedCount = dayTasks.filter(t => t.status === 'completed').length;
                const pendingCount = dayTasks.filter(t => t.status === 'pending').length;
                const inProgressCount = dayTasks.filter(t => t.status === 'in_progress').length;
                const failedCount = dayTasks.filter(t => t.status === 'failed').length;

                days.push(
                    <div
                        className={`min-h-[120px] p-2 border-r border-b border-[#2d2d2d] transition-colors cursor-pointer flex flex-col relative group ${
                            !isSameMonth(day, monthStart)
                                ? "bg-[#1e1e1e] text-[#6b6b6b]"
                                : isSelected ? "bg-[#264f78] text-[#cccccc]" : "bg-[#1e1e1e] text-[#cccccc] hover:bg-[#2a2d2e]"
                        }`}
                        key={day.toString()}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        <div className="flex justify-between items-start">
                            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                                isSameDay(day, new Date()) 
                                    ? "bg-[#007fd4] text-white shadow-md shadow-black/20" 
                                    : isSelected ? "bg-transparent text-white" : "text-[#cccccc] group-hover:text-white"
                            }`}>
                                {formattedDate}
                            </span>
                            
                            {dayTasks.length > 0 && (
                                <div className="flex gap-1">
                                    {completedCount > 0 && <span className="w-2 h-2 rounded-full bg-[#89d185]" title={`${completedCount} completed`} />}
                                    {inProgressCount > 0 && <span className="w-2 h-2 rounded-full bg-[#4fc1ff]" title={`${inProgressCount} in progress`} />}
                                    {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-[#d7ba7d]" title={`${pendingCount} pending`} />}
                                    {failedCount > 0 && <span className="w-2 h-2 rounded-full bg-[#f48771]" title={`${failedCount} failed`} />}
                                </div>
                            )}
                        </div>

                        <div className="mt-2 flex-1 flex flex-col gap-1 overflow-hidden">
                            {dayTasks.slice(0, 3).map(task => (
                                <div 
                                    key={task.id} 
                                    className={`text-[10px] px-1.5 py-1 rounded truncate border flex items-center gap-1 ${
                                        task.status === 'completed' ? 'bg-[#0f2e14] text-[#89d185] border-[#1f4a24]' :
                                        task.status === 'in_progress' ? 'bg-[#0d2a46] text-[#4fc1ff] border-[#1e4a78]' :
                                        task.status === 'pending' ? 'bg-[#3b2e15] text-[#d7ba7d] border-[#5e4b25]' :
                                        'bg-[#3c1414] text-[#f48771] border-[#6b2525]'
                                    }`}
                                >
                                    {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                                    {task.status === 'in_progress' && <Loader2 className="w-3 h-3 shrink-0 animate-spin" />}
                                    {task.status === 'pending' && <Clock className="w-3 h-3 shrink-0" />}
                                    {task.status === 'failed' && <AlertCircle className="w-3 h-3 shrink-0" />}
                                    <span className="truncate">{task.time} - {task.title}</span>
                                </div>
                            ))}
                            {dayTasks.length > 3 && (
                                <div className="text-[10px] text-[#8b9298] font-medium pl-1">
                                    +{dayTasks.length - 3} more tasks
                                </div>
                            )}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 flex-1" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="flex flex-col flex-1 bg-[#1e1e1e] border-l border-t border-[#2d2d2d]">{rows}</div>;
    };

    const renderSidebar = () => {
        const dateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
        const dayTasks = tasksByDate[dateKey] || [];
        const isToday = selectedDate && isSameDay(selectedDate, new Date());

        return (
            <div className="w-96 bg-[#1e1e1e] border-l border-[#2d2d2d] flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.3)] z-10 h-full overflow-hidden">
                <div className="p-6 border-b border-[#2d2d2d] bg-[#252526]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#007fd4] rounded-xl flex items-center justify-center shadow-md">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#cccccc] leading-tight">Bot Operations</h3>
                                <p className="text-xs text-[#4fc1ff] font-medium">System Status</p>
                            </div>
                        </div>
                    </div>
                    
                    <h4 className="text-xl font-bold text-[#cccccc]">
                        {selectedDate ? format(selectedDate, 'EEEE, MMM d, yyyy') : 'Select a date'}
                    </h4>
                    {isToday && <span className="inline-block mt-2 px-2.5 py-0.5 bg-[#264f78] text-[#4fc1ff] text-xs font-bold rounded-full uppercase tracking-wider">Today</span>}
                </div>

                <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-bold text-[#cccccc] flex items-center gap-2">
                            <ListTodo className="w-4 h-4 text-[#8b9298]" />
                            Task Preview & History
                        </h4>
                        <span className="bg-[#2d2d2d] text-[#8b9298] text-xs font-bold px-2 py-1 rounded-md">
                            {dayTasks.length} tasks
                        </span>
                    </div>

                    {dayTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center pt-10 pb-6 px-4">
                            <div className="w-16 h-16 bg-[#2d2d2d] rounded-full flex items-center justify-center mb-4">
                                <History className="w-8 h-8 text-[#8b9298]" />
                            </div>
                            <p className="text-[#8b9298] font-medium">No tasks scheduled for this day.</p>
                            <p className="text-sm text-[#8b9298] mt-1 opacity-70">Bot operations are idle.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {dayTasks.map(task => (
                                <div key={task.id} className="bg-[#252526] border border-[#2d2d2d] rounded-xl p-4 shadow-sm relative overflow-hidden group">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${
                                        task.status === 'completed' ? 'bg-[#89d185]' :
                                        task.status === 'in_progress' ? 'bg-[#4fc1ff]' :
                                        task.status === 'pending' ? 'bg-[#d7ba7d]' : 'bg-[#f48771]'
                                    }`} />
                                    
                                    <div className="flex items-start justify-between mb-2">
                                        <h5 className="font-bold text-[#cccccc] text-sm leading-tight">{task.title}</h5>
                                        <span className="text-xs font-bold text-[#8b9298] shrink-0 ml-2">{task.time}</span>
                                    </div>
                                    
                                    <p className="text-xs text-[#8b9298] mb-3 line-clamp-2 leading-relaxed">
                                        {task.description}
                                    </p>
                                    
                                    <div className="flex items-center gap-1.5">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                            task.status === 'completed' ? 'bg-[#0f2e14] text-[#89d185]' :
                                            task.status === 'in_progress' ? 'bg-[#0d2a46] text-[#4fc1ff]' :
                                            task.status === 'pending' ? 'bg-[#3b2e15] text-[#d7ba7d]' : 'bg-[#3c1414] text-[#f48771]'
                                        }`}>
                                            {task.status === 'completed' && <Check className="w-3 h-3" />}
                                            {task.status === 'in_progress' && <Loader2 className="w-3 h-3 animate-spin" />}
                                            {task.status === 'pending' && <Clock className="w-3 h-3" />}
                                            {task.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex overflow-hidden bg-[#1e1e1e]">
            <div className="flex-1 flex flex-col min-w-0">
                {renderHeader()}
                <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar">
                    <div className="bg-[#1e1e1e] rounded-xl shadow-sm border border-[#2d2d2d] overflow-hidden flex flex-col min-h-[600px] h-full flex-1">
                        {renderDays()}
                        {renderCells()}
                    </div>
                </div>
            </div>
            {renderSidebar()}
        </div>
    );
};
