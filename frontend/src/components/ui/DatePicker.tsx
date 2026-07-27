import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, isBefore, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disablePastDates?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date...',
  className,
  disablePastDates = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'calendar' | 'months' | 'years'>('calendar');
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, right: 0 });
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    if (!isOpen) {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const isTop = spaceBelow < 350 && rect.top > 350;
        setPlacement(isTop ? 'top' : 'bottom');
        
        setCoords({
          left: rect.left,
          right: rect.right,
          top: isTop ? rect.top - 8 : rect.bottom + 8,
          width: rect.width
        });
      }
      setView('calendar'); // Reset to calendar view when opening
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    // Close on any scroll event (using capture phase)
    const handleScroll = (event: Event) => {
      // Ignore scroll inside the dropdown itself
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // Ensure scroll into view when switching to years view
  useEffect(() => {
    if (view === 'years') {
      setTimeout(() => {
        const activeYearBtn = dropdownRef.current?.querySelector('.active-year');
        if (activeYearBtn) {
          activeYearBtn.scrollIntoView({ block: 'center' });
        }
      }, 50);
    }
  }, [view]);

  const selectedDate = value ? new Date(value) : null;

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const onDateClick = (day: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(format(day, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Generate 120 years (-100 to +20)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - 100 + i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <>
      <div className={cn("relative w-full text-sm", className)} ref={wrapperRef}>
        <div
          className={cn(
            "flex items-center justify-between w-full px-3 py-2.5 bg-white border rounded-lg cursor-pointer transition-colors",
            isOpen ? "border-saffron ring-2 ring-saffron/20" : "border-gray-200 hover:border-gray-300"
          )}
          onClick={toggleOpen}
        >
          <span className={cn("truncate", !selectedDate && "text-gray-400")}>
            {selectedDate ? format(selectedDate, 'PPP') : placeholder}
          </span>
          <CalendarIcon className={cn("w-4 h-4 transition-colors", isOpen ? "text-saffron" : "text-gray-400")} />
        </div>
      </div>

      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: placement === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: placement === 'top' ? 10 : -10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[9999] w-[270px] bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={{ 
              right: window.innerWidth - coords.right, // Align right edge of dropdown with right edge of input!
              ...(placement === 'top' ? { bottom: window.innerHeight - coords.top } : { top: coords.top }) 
            }}
          >
            <div className="bg-saffron/10 px-3 py-2.5 border-b border-saffron/20 flex justify-between items-center shrink-0">
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (view === 'calendar') prevMonth(e);
                  else if (view === 'years') setCurrentMonth(subMonths(currentMonth, 120));
                  else if (view === 'months') setCurrentMonth(subMonths(currentMonth, 12));
                }} 
                className="p-1 hover:bg-white rounded-full text-saffron transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setView(view === 'months' ? 'calendar' : 'months'); }}
                  className="text-sm font-bold text-gray-900 hover:bg-white/60 px-2 py-0.5 rounded transition-colors text-center"
                >
                  {format(currentMonth, 'MMM')}
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setView(view === 'years' ? 'calendar' : 'years'); }}
                  className="text-sm font-bold text-gray-900 hover:bg-white/60 px-2 py-0.5 rounded transition-colors text-center"
                >
                  {format(currentMonth, 'yyyy')}
                </button>
              </div>

              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (view === 'calendar') nextMonth(e);
                  else if (view === 'years') setCurrentMonth(addMonths(currentMonth, 120));
                  else if (view === 'months') setCurrentMonth(addMonths(currentMonth, 12));
                }} 
                className="p-1 hover:bg-white rounded-full text-saffron transition-colors shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-3 h-[240px] overflow-y-auto">
              {view === 'calendar' && (
                <div className="grid grid-cols-7 gap-y-1">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-400 mb-1">
                      {day}
                    </div>
                  ))}
                  
                  {days.map((day) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isDayToday = isToday(day);
                    const isPast = disablePastDates && isBefore(day, startOfDay(new Date()));
                    
                    return (
                      <div key={day.toString()} className="p-0.5 flex justify-center items-center h-7">
                        <button
                          type="button"
                          disabled={isPast}
                          onClick={(e) => onDateClick(day, e)}
                          className={cn(
                            "w-7 h-7 flex items-center justify-center rounded-full text-xs transition-all",
                            isPast ? "text-gray-300 opacity-50 cursor-not-allowed" :
                            !isCurrentMonth ? "text-gray-300 hover:text-gray-500" : "text-gray-700 hover:bg-gray-100",
                            !isPast && isDayToday && !isSelected && "bg-gray-100 font-bold text-saffron ring-1 ring-saffron/30",
                            !isPast && isSelected && "bg-saffron text-white font-bold shadow-md hover:bg-saffron/90 transform scale-110"
                          )}
                        >
                          {format(day, 'd')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {view === 'months' && (
                <div className="grid grid-cols-3 gap-2">
                  {months.map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentMonth(new Date(currentMonth.getFullYear(), i, 1));
                        setView('calendar');
                      }}
                      className={cn(
                        "py-2 px-1 text-sm rounded-lg transition-all",
                        currentMonth.getMonth() === i ? "bg-saffron text-white font-bold shadow-md" : "text-gray-700 hover:bg-gray-100 font-medium border border-gray-100"
                      )}
                    >
                      {m.substring(0, 3)}
                    </button>
                  ))}
                </div>
              )}

              {view === 'years' && (
                <div className="grid grid-cols-4 gap-1.5">
                  {years.map((y) => {
                    const isActive = currentMonth.getFullYear() === y;
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMonth(new Date(y, currentMonth.getMonth(), 1));
                          setView('calendar');
                        }}
                        className={cn(
                          "py-1.5 px-1 text-xs rounded-lg transition-all",
                          isActive ? "bg-saffron text-white font-bold shadow-md active-year" : "text-gray-700 hover:bg-gray-100 font-medium"
                        )}
                      >
                        {y}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(false); }}
                className="text-[11px] uppercase font-bold tracking-wider text-gray-500 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); setView('calendar'); setCurrentMonth(new Date()); onChange(format(new Date(), 'yyyy-MM-dd')); setIsOpen(false); }}
                className="text-[11px] uppercase font-bold tracking-wider text-saffron hover:text-saffron/80 transition-colors"
              >
                Today
              </button>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
