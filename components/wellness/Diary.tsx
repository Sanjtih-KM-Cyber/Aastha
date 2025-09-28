import React, { useState } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { DiaryEntry, UserConfig } from '../../types';
import DiaryPasswordGate from './DiaryPasswordGate';
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon, CloseIcon } from '../icons';

const getFormattedDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};
const getDisplayDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const Page: React.FC<{ content: string; onContentChange: (newContent: string) => void; date: Date | null; side: 'left' | 'right' }> = ({ content, onContentChange, date, side }) => {
    return (
        // Parent of the inner flexbox. This wrapper needs h-full to inherit height from the animation container.
        <div className={`w-full h-full shadow-inner relative ${side === 'left' ? 'rounded-l-lg' : 'rounded-r-lg'}`} style={{backgroundColor: '#FDFDF6'}}>
            {/* The inner container is set to full height and flex-col to enable vertical growth */}
             <div className="relative h-full flex flex-col">
                {/* Date header with adjusted padding */}
                {date && <h4 className="text-lg font-semibold text-gray-600 mb-2 shrink-0 pt-6 px-8">{getDisplayDate(date)}</h4>}
                
                 <textarea
                    key={date?.toString()} // Force re-render on date change
                    value={content}
                    onChange={e => onContentChange(e.target.value)}
                    // The textarea grows naturally and will only display a scrollbar when content exceeds its height.
                    className="w-full bg-transparent focus:outline-none resize-none z-10 notebook-textarea flex-grow pb-8 px-8"
                    placeholder={date ? "Dear Diary..." : ""}
                    disabled={!date}
                />
            </div>
        </div>
    );
};


const Diary: React.FC<{ userConfig: UserConfig, onClose: () => void }> = ({ userConfig, onClose }) => {
    const [entries, setEntries] = useLocalStorage<Record<string, DiaryEntry>>('diary-entries-v3', {});
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [userConf, setUserConf] = useLocalStorage<UserConfig | null>('user-config', userConfig);
    const [isFlipping, setIsFlipping] = useState<'next' | 'prev' | null>(null);


    const handleSave = (date: Date, content: string) => {
        const formattedDate = getFormattedDate(date);
        const newEntry: DiaryEntry = {
            id: formattedDate,
            content: content,
            timestamp: Date.now()
        };
        setEntries(prev => ({ ...prev, [formattedDate]: newEntry }));
    };

    const changeDate = (offset: number) => {
        if (isFlipping) return; // Prevent clicking during animation

        setIsFlipping(offset > 0 ? 'next' : 'prev');
        setTimeout(() => {
            setCurrentDate(current => {
                const newDate = new Date(current);
                newDate.setDate(current.getDate() + offset);
                return newDate;
            });
            setIsFlipping(null);
        }, 600); // Must match animation duration
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateParts = e.target.value.split('-').map(part => parseInt(part, 10));
        if(dateParts.length === 3 && !isNaN(dateParts[0]) && !isNaN(dateParts[1]) && !isNaN(dateParts[2])) {
            const newDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            if (!isNaN(newDate.getTime())) {
                setCurrentDate(newDate);
            }
        }
    };
    
    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                 <DiaryPasswordGate 
                    userConfig={userConfig} 
                    onAuthenticated={() => setIsAuthenticated(true)} 
                    onUserConfigChange={(newConfig) => setUserConf(newConfig)}
                    onClose={onClose}
                />
            </div>
        );
    }
    
    const leftPageDate = new Date(currentDate);
    leftPageDate.setDate(currentDate.getDate() - 1);
    
    const leftEntry = entries[getFormattedDate(leftPageDate)];
    const rightEntry = entries[getFormattedDate(currentDate)];

    return (
        // Outer container: Remove justify-center to allow full vertical fill
        <div className="fixed inset-0 bg-[var(--color-text-primary)]/30 backdrop-blur-sm z-50 flex flex-col items-center px-4 py-4 animate-fade-in overflow-y-auto">
             <style>{`
                .notebook-textarea {
                    color: #4a4a4a;
                    font-family: "Courier New", Courier, monospace;
                    font-size: 1rem;
                    line-height: 28px;
                    /* NOTE: These paddings are overwritten by Tailwind classes in the element, but are needed for the background lines */
                    padding-left: 52px; 
                    padding-right: 12px;
                    background-color: #FDFDF6;
                    background-image: 
                        /* Red Vertical Line */
                        linear-gradient(to right, #f7d9d9 2px, transparent 2px),
                        /* Blue Horizontal Lines */
                        repeating-linear-gradient(#FDFDF6, #FDFDF6 26px, #e6e0d4 27px, #e6e0d4 28px);
                    background-repeat: no-repeat, repeat;
                    /* Position the red line at 32px (matching the new px-8 class) */
                    background-position: 32px 0, 0 0;
                    background-size: 2px 100%, 100% 28px;
                }
                .page-flip-right { transform: rotateY(-180deg); }
                .page-flip-left { transform: rotateY(180deg); }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } }
                /* Hide ugly date picker icon */
                input[type="date"]::-webkit-calendar-picker-indicator {
                    display: none;
                }
             `}</style>
            
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center bg-[var(--color-bg-secondary)]/80 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
                aria-label="Close Diary"
            >
                <CloseIcon className="w-6 h-6"/>
            </button>

            {/* Main Content Wrapper: h-full allows it to stretch, flex-col stacks vertically */}
            <div className="w-full h-full max-w-7xl relative m-auto flex flex-col">
                {/* Book Element: flex-grow ensures it fills available height */}
                <div className="w-full flex-grow flex shadow-2xl rounded-lg" style={{ perspective: '2500px' }}>
                    
                    {/* *** FINAL CRITICAL FIX: Ensure h-full is on all child wrappers *** */}
                    <div 
                        className={`w-1/2 h-full transition-transform duration-600 ease-in-out ${isFlipping === 'prev' ? 'page-flip-left' : ''}`} 
                        style={{ transformOrigin: 'right center', transformStyle: 'preserve-3d' }}
                    >
                         <div style={{ backfaceVisibility: 'hidden' }} className="h-full">
                            <Page 
                                content={leftEntry?.content || ''} 
                                onContentChange={(c) => handleSave(leftPageDate, c)} 
                                date={leftPageDate} 
                                side="left" 
                            />
                        </div>
                    </div>
                    
                    <div className="w-6 h-full bg-gray-800 shadow-inner z-10" />

                    <div 
                        className={`w-1/2 h-full transition-transform duration-600 ease-in-out ${isFlipping === 'next' ? 'page-flip-right' : ''}`} 
                        style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
                    >
                         <div style={{ backfaceVisibility: 'hidden' }} className="h-full">
                            <Page 
                                content={rightEntry?.content || ''} 
                                onContentChange={(c) => handleSave(currentDate, c)} 
                                date={currentDate} 
                                side="right" 
                            />
                        </div>
                    </div>
                </div>

                 {/* Navigation Bar */}
                 <div className="flex justify-center mt-6">
                    <div className="flex items-center gap-4 p-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-lg">
                        <button onClick={() => changeDate(-2)} disabled={!!isFlipping} className="p-2 rounded hover:bg-[var(--color-container-light)] text-[var(--color-text-secondary)] flex items-center gap-2 disabled:opacity-50">
                            <ArrowLeftIcon className="w-5 h-5"/> Previous Day
                        </button>
                        <label htmlFor="diary-date-picker" className="relative flex items-center cursor-pointer">
                            <CalendarIcon className="w-5 h-5 absolute left-3 text-[var(--color-text-secondary)] pointer-events-none"/>
                            <input 
                                id="diary-date-picker"
                                type="date" 
                                value={getFormattedDate(currentDate)} 
                                onChange={handleDateChange} 
                                className="bg-transparent text-center font-semibold focus:outline-none w-40 pl-10 pr-2 py-1 text-[var(--color-text-primary)] cursor-pointer"
                            />
                        </label>
                        <button onClick={() => changeDate(2)} disabled={!!isFlipping} className="p-2 rounded hover:bg-[var(--color-container-light)] text-[var(--color-text-secondary)] flex items-center gap-2 disabled:opacity-50">
                            Next Day <ArrowRightIcon className="w-5 h-5"/>
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default Diary;
