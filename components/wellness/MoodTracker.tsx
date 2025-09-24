import React, { useState, useMemo } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { Mood, MoodEntry, UserConfig } from '../../types';
import { MOOD_DATA } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { CloseIcon } from '../icons';

const MoodTracker: React.FC<{ userConfig: UserConfig, onClose: () => void }> = ({ onClose }) => {
    const [moodLog, setMoodLog] = useLocalStorage<MoodEntry[]>('mood-log', []);
    const [note, setNote] = useState('');
    const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
    const { primaryColor } = useTheme();

    const toggleMood = (mood: Mood) => {
        setSelectedMoods(prev => 
            prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
        );
    };

    const logMood = () => {
        if (selectedMoods.length === 0) return;
        const timestamp = Date.now();
        const newEntries: MoodEntry[] = selectedMoods.map(mood => ({
            id: `${timestamp}-${mood}`,
            mood,
            note, // Note is shared across all moods logged at the same time
            timestamp,
        }));

        setMoodLog(prev => [...newEntries, ...prev].slice(0, 200)); // Keep last 200 entries
        setSelectedMoods([]);
        setNote('');
    };

    const chartData = useMemo(() => {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 6);
        last7Days.setHours(0,0,0,0);

        const recentEntries = moodLog.filter(entry => entry.timestamp >= last7Days.getTime());
        
        const data = Array.from({length: 7}).map((_, i) => {
            const date = new Date(last7Days);
            date.setDate(last7Days.getDate() + i);
            const dayStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            
            const dayData: {[key: string]: any} = { name: dayStr };
            Object.keys(MOOD_DATA).forEach(mood => dayData[mood] = 0);

            const entriesForDay = recentEntries.filter(e => new Date(e.timestamp).toDateString() === date.toDateString());
            const uniqueMoodsForDay = [...new Set(entriesForDay.map(e => e.mood))];

            if (uniqueMoodsForDay.length > 0) {
                const valuePerMood = 1 / uniqueMoodsForDay.length;
                uniqueMoodsForDay.forEach(mood => {
                    dayData[mood] = valuePerMood;
                });
            }
            return dayData;
        });
        
        return data;

    }, [moodLog]);


    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
             <style>{`.animate-fade-in { animation: fade-in 0.3s ease-out forwards; @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } }`}</style>
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl w-full max-w-3xl text-[var(--color-text-primary)] flex flex-col shadow-2xl border border-[var(--color-border)]">
                <header className="flex items-center justify-between p-4 border-b" style={{borderColor: 'var(--color-border)'}}>
                    <h2 className="text-xl font-bold">Mood Tracker</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--color-container-light)]">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                <main className="grid md:grid-cols-2 gap-x-8 gap-y-6 p-6">
                    {/* Left: Logging */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-1">Log Your Mood</h3>
                            <p className="text-sm text-[var(--color-text-secondary)]">How are you feeling right now?</p>
                        </div>
                         <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {Object.values(MOOD_DATA).map(({label, emoji}) => (
                                <button 
                                    key={label} 
                                    onClick={() => toggleMood(label)} 
                                    className={`p-3 bg-[var(--color-container)] rounded-lg text-center transition-all duration-200 border-2 ${selectedMoods.includes(label) ? 'border-[var(--color-primary)]' : 'border-transparent hover:border-[var(--color-border)]'}`}
                                    style={{'--tw-ring-color': primaryColor, borderColor: selectedMoods.includes(label) ? primaryColor : 'var(--color-container)'} as React.CSSProperties}
                                >
                                    <span className="text-3xl">{emoji}</span>
                                    <p className="mt-1 text-sm font-semibold truncate">{label}</p>
                                </button>
                            ))}
                        </div>
                        <div>
                            <label htmlFor="thoughts" className="text-sm font-medium text-[var(--color-text-secondary)]">Any specific thoughts? (Optional)</label>
                             <textarea 
                                id="thoughts"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                                className="w-full mt-2 p-2 bg-[var(--color-container)] rounded-md border border-[var(--color-border)] focus:ring-2 focus:outline-none"
                                style={{'--tw-ring-color': primaryColor} as React.CSSProperties}
                            />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={logMood} disabled={selectedMoods.length === 0} className="w-full font-bold py-3 px-4 rounded-lg text-white disabled:opacity-50 transition-transform hover:scale-105" style={{backgroundColor: primaryColor, color: 'var(--color-user-bubble-text)'}}>Log Mood</button>
                            <button className="w-full font-bold py-3 px-4 rounded-lg bg-[var(--color-container-light)] text-[var(--color-text-secondary)] opacity-60 cursor-not-allowed">Analyze Diary</button>
                        </div>
                    </div>
                    {/* Right: Chart */}
                     <div className="space-y-4">
                        <h3 className="font-semibold">Your Week in Moods</h3>
                        <div className="h-80 w-full bg-[var(--color-container)] rounded-lg p-2">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis hide={true} domain={[0, 1]}/>
                                    {Object.entries(MOOD_DATA).map(([mood, { color }]) => (
                                        <Bar key={mood} dataKey={mood} stackId="a" fill={color} radius={[4, 4, 0, 0]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MoodTracker;