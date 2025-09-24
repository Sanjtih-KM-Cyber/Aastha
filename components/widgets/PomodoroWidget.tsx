import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, DraggableIcon, PlayIcon, ResetIcon, PauseIcon } from '../icons';
import { useTheme } from '../../context/ThemeContext';

const ENCOURAGEMENTS = {
    25: "Great start! Keep up the momentum.",
    50: "Halfway there! You're doing great.",
    75: "Almost there! Finish strong.",
};

const PomodoroWidget: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { primaryColor } = useTheme();
    const [workMinutes, setWorkMinutes] = useState(25);
    const [breakMinutes, setBreakMinutes] = useState(5);
    const [isWorkSession, setIsWorkSession] = useState(true);
    const [time, setTime] = useState(workMinutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [encouragement, setEncouragement] = useState('');
    const [progressMilestones, setProgressMilestones] = useState<Record<number, boolean>>({});


    const totalDuration = useMemo(() => (isWorkSession ? workMinutes : breakMinutes) * 60, [isWorkSession, workMinutes, breakMinutes]);
    const progress = useMemo(() => totalDuration > 0 ? (totalDuration - time) / totalDuration * 100 : 0, [time, totalDuration]);

    useEffect(() => {
        if (!isWorkSession) {
             setEncouragement('Enjoy your break!');
             setProgressMilestones({});
             return;
        }

        let newEncouragement = '';
        if (progress > 25 && !progressMilestones[25]) {
            newEncouragement = ENCOURAGEMENTS[25];
            setProgressMilestones(p => ({...p, 25: true}));
        }
        if (progress > 50 && !progressMilestones[50]) {
            newEncouragement = ENCOURAGEMENTS[50];
            setProgressMilestones(p => ({...p, 50: true}));
        }
        if (progress > 75 && !progressMilestones[75]) {
            newEncouragement = ENCOURAGEMENTS[75];
            setProgressMilestones(p => ({...p, 75: true}));
        }
        
        if (newEncouragement) {
            setEncouragement(newEncouragement);
        }

    }, [progress, isWorkSession, progressMilestones]);
    
    
    useEffect(() => {
        resetTimer(true); // Reset to work session
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workMinutes]);
    
    useEffect(() => {
        if (!isWorkSession) {
            setTime(breakMinutes * 60);
            setIsActive(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [breakMinutes]);

    useEffect(() => {
        let interval: ReturnType<typeof setTimeout> | null = null;
        if (isActive && time > 0) {
            interval = setInterval(() => setTime(t => t - 1), 1000);
        } else if (time === 0 && isActive) {
            const nextIsWork = !isWorkSession;
            setIsWorkSession(nextIsWork);
            setTime((nextIsWork ? workMinutes : breakMinutes) * 60);
            setEncouragement('');
            setProgressMilestones({});
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, time, workMinutes, breakMinutes, isWorkSession]);

    const resetTimer = (resetToWork = false) => {
        setIsActive(false);
        setEncouragement('');
        setProgressMilestones({});
        if (resetToWork) {
            setIsWorkSession(true);
            setTime(workMinutes * 60);
        } else {
             setTime((isWorkSession ? workMinutes : breakMinutes) * 60);
        }
    };

    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return (
        <div className="w-80 bg-[var(--color-container)] rounded-lg shadow-2xl text-[var(--color-text-primary)] border border-[var(--color-border)]">
            <header className="flex items-center justify-between p-3 border-b border-[var(--color-border)] cursor-grab">
                <div className="flex items-center gap-2">
                    <DraggableIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    <h4 className="font-bold">Pomodoro Timer</h4>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-container-light)]"><CloseIcon className="w-5 h-5"/></button>
            </header>
            <main className="p-4 flex flex-col items-center gap-4">
                <div className="text-center h-12">
                    <h3 className="text-xl font-semibold">{isWorkSession ? 'Focus Session' : 'Break Time'}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] h-5 transition-opacity duration-300">
                        {encouragement}
                    </p>
                </div>
                <p className="text-6xl font-mono my-2">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</p>
                <div className="w-full bg-[var(--color-container-light)] rounded-full h-2.5">
                    <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: primaryColor }}></div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsActive(!isActive)} className="w-14 h-14 flex items-center justify-center rounded-full text-white" style={{backgroundColor: primaryColor, color: 'var(--color-user-bubble-text)'}}>
                        {isActive ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                    </button>
                    <button onClick={() => resetTimer()} className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--color-container-light)] hover:bg-[var(--color-border)]">
                        <ResetIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="flex w-full gap-4">
                    <div className="w-1/2">
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Work (min)</label>
                        <input type="number" value={workMinutes} onChange={(e) => setWorkMinutes(Number(e.target.value))} className="w-full mt-1 p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md focus:ring-2 focus:outline-none" style={{'--tw-ring-color': primaryColor} as React.CSSProperties} />
                    </div>
                     <div className="w-1/2">
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Break (min)</label>
                        <input type="number" value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value))} className="w-full mt-1 p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md focus:ring-2 focus:outline-none" style={{'--tw-ring-color': primaryColor} as React.CSSProperties} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PomodoroWidget;