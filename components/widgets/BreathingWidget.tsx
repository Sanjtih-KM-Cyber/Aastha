import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, DraggableIcon, PlayIcon, ResetIcon, PauseIcon } from '../icons';
import { useTheme } from '../../context/ThemeContext';

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'hold-release';

const BREATHING_PATTERNS = {
    'Box Breathing': [
        { phase: 'inhale', duration: 4 },
        { phase: 'hold', duration: 4 },
        { phase: 'exhale', duration: 4 },
        { phase: 'hold-release', duration: 4 },
    ],
    '4-7-8 Breathing': [
        { phase: 'inhale', duration: 4 },
        { phase: 'hold', duration: 7 },
        { phase: 'exhale', duration: 8 },
    ],
};

const BreathingWidget: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { primaryColor } = useTheme();
    const [duration, setDuration] = useState(1);
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const [isActive, setIsActive] = useState(false);
    
    const [style, setStyle] = useState<keyof typeof BREATHING_PATTERNS>('Box Breathing');
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [phaseTime, setPhaseTime] = useState(0);

    const pattern = useMemo(() => BREATHING_PATTERNS[style], [style]);
    const currentPhase = pattern[phaseIndex];

    // Main session timer
    useEffect(() => {
        if (!isActive) return;
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else {
            reset();
        }
    }, [isActive, timeLeft]);

    // Breathing phase timer
    useEffect(() => {
        if (!isActive) return;
        const phaseTimer = setInterval(() => {
            setPhaseTime(prev => {
                if (prev >= currentPhase.duration - 1) {
                    setPhaseIndex(p => (p + 1) % pattern.length);
                    return 0;
                }
                return prev + 1;
            });
        }, 1000);
        return () => clearInterval(phaseTimer);
    }, [isActive, phaseIndex, pattern, currentPhase]);
    
    const reset = () => {
        setIsActive(false);
        setTimeLeft(duration * 60);
        setPhaseIndex(0);
        setPhaseTime(0);
    }
    
    useEffect(() => {
        reset();
    }, [duration, style]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    const phaseText = {
        inhale: "Inhale...",
        hold: "Hold",
        exhale: "Exhale...",
        'hold-release': "Hold",
    }[currentPhase.phase];
    
    const bubbleScale = ['inhale', 'hold'].includes(currentPhase.phase) ? 1.2 : 1;

    return (
        <div className="w-80 bg-[var(--color-container)] rounded-lg shadow-2xl text-[var(--color-text-primary)] border border-[var(--color-border)]">
             <header className="flex items-center justify-between p-3 border-b border-[var(--color-border)] cursor-grab">
                <div className="flex items-center gap-2">
                    <DraggableIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    <h4 className="font-bold">Guided Breathing</h4>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-container-light)]"><CloseIcon className="w-5 h-5"/></button>
            </header>
             <main className="p-4 flex flex-col items-center gap-4">
                 <div className="relative w-40 h-40 flex items-center justify-center">
                    <div 
                        className="w-full h-full rounded-full transition-transform duration-3000 ease-in-out" 
                        style={{
                            border: `4px solid ${primaryColor}`,
                            transform: `scale(${isActive ? bubbleScale : 1})`,
                            transition: `transform ${isActive ? currentPhase.duration : 1}s ease-in-out`
                        }}
                    ></div>
                    <div className="absolute flex flex-col items-center justify-center">
                        {isActive ? (
                            <span className="text-xl font-semibold">{phaseText}</span>
                        ) : null}
                        <span className="text-4xl font-mono">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
                    </div>
                </div>
                 <div className="w-full space-y-3">
                     <div>
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Breathing Style</label>
                        <select value={style} onChange={e => setStyle(e.target.value as keyof typeof BREATHING_PATTERNS)} className="w-full mt-1 p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md focus:ring-2 focus:outline-none" style={{'--tw-ring-color': primaryColor} as React.CSSProperties}>
                            {Object.keys(BREATHING_PATTERNS).map(name => <option key={name}>{name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Duration (minutes)</label>
                        <input 
                            type="number" 
                            value={duration} 
                            onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full mt-1 p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md focus:ring-2 focus:outline-none" 
                            style={{'--tw-ring-color': primaryColor} as React.CSSProperties}
                        />
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <button onClick={() => setIsActive(!isActive)} className="w-14 h-14 flex items-center justify-center rounded-full bg-[var(--color-container-light)] hover:bg-[var(--color-border)]">
                        {isActive ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                    </button>
                    <button onClick={reset} className="w-14 h-14 flex items-center justify-center rounded-full bg-[var(--color-container-light)] hover:bg-[var(--color-border)]">
                        <ResetIcon className="w-6 h-6"/>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default BreathingWidget;