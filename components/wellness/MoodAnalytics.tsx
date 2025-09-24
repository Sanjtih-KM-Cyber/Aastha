

import React, {useState} from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import { MoodEntry, Mood, UserConfig, DiaryEntry, DiaryMoodAnalysis } from '../../types';
import { MOOD_DATA } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { CloseIcon } from '../icons';
import { analyzeDiaryEntries } from '../../services/geminiService';

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const moods = payload.filter(p => p.value > 0);
    return (
      <div className="bg-[var(--color-container)] p-2 border border-[var(--color-border)] rounded-lg shadow-lg">
        <p className="label text-sm font-bold text-[var(--color-text-primary)]">{`${label}`}</p>
        {moods.map(pld => (
             <p key={pld.dataKey} style={{ color: pld.color }} className="text-xs">{`${pld.dataKey}`}</p>
        ))}
      </div>
    );
  }
  return null;
};


const MoodAnalytics: React.FC<{ userConfig: UserConfig, onClose: () => void }> = ({ onClose }) => {
    const [moodLog] = useLocalStorage<MoodEntry[]>('mood-log', []);
    const [diaryEntries] = useLocalStorage<Record<string, DiaryEntry>>('diary-entries-v3', {});
    const { themeMode, primaryColor } = useTheme();
    const tickColor = themeMode === 'dark' ? '#9CA3AF' : '#4B5563';

    const [aiAnalyticsData, setAiAnalyticsData] = useState<DiaryMoodAnalysis[] | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState('');

    const handleGenerateInsights = async () => {
        setIsAnalyzing(true);
        setAnalysisError('');
        setAiAnalyticsData(null);
        const entries = Object.values(diaryEntries);

        if (entries.length === 0) {
            setAnalysisError("You don't have any diary entries to analyze yet.");
            setIsAnalyzing(false);
            return;
        }

        const result = await analyzeDiaryEntries(entries);

        if (result) {
            setAiAnalyticsData(result);
        } else {
            setAnalysisError("Sorry, I couldn't analyze your diary right now. Please try again later.");
        }
        setIsAnalyzing(false);
    };

    const weeklyChartData = React.useMemo(() => {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 6);
        last7Days.setHours(0, 0, 0, 0);

        const recentEntries = moodLog.filter(entry => entry.timestamp >= last7Days.getTime());
        
        const data = Array.from({length: 7}).map((_, i) => {
            const date = new Date(last7Days);
            date.setDate(last7Days.getDate() + i);
            const dayStr = date.toLocaleDateString(undefined, { weekday: 'short' });

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

    const aiChartData = React.useMemo(() => {
        if (!aiAnalyticsData) return [];

        const today = new Date();
        // Use UTC to avoid timezone shifts at midnight
        const last7DaysStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6));

        const recentAnalysis = aiAnalyticsData.filter(entry => {
            // Parse the 'YYYY-MM-DD' string as a UTC date
            const entryDate = new Date(entry.date + 'T00:00:00Z');
            return entryDate.getTime() >= last7DaysStart.getTime();
        });

        // Helper to format a Date object to a 'YYYY-MM-DD' string in UTC
        const toUTC_YYYY_MM_DD = (d: Date) => {
            const y = d.getUTCFullYear();
            const m = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const data = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(last7DaysStart);
            date.setUTCDate(last7DaysStart.getUTCDate() + i);

            const dayStr = date.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' });
            const dateStr = toUTC_YYYY_MM_DD(date);

            const dayData: { [key: string]: any } = { name: dayStr };
            Object.keys(MOOD_DATA).forEach(mood => dayData[mood] = 0);

            const analysisForDay = recentAnalysis.find(a => a.date === dateStr);
            if (analysisForDay && analysisForDay.mood) {
                const moodKey = Object.keys(MOOD_DATA).find(key => key.toLowerCase() === analysisForDay.mood.toLowerCase()) as Mood | undefined;
                if (moodKey) {
                    dayData[moodKey] = 1;
                }
            }
            return dayData;
        });

        return data;
    }, [aiAnalyticsData]);
    
    const overallVibe = React.useMemo(() => {
        if (moodLog.length === 0) return null;
        const moodCounts = moodLog.reduce((acc, entry) => {
            acc[entry.mood] = (acc[entry.mood] || 0) + 1;
            return acc;
        }, {} as Record<Mood, number>);
        
        const mostFrequentMood = Object.entries(moodCounts).sort((a,b) => b[1] - a[1])[0][0] as Mood;
        return MOOD_DATA[mostFrequentMood];
    }, [moodLog]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
             <style>{`.animate-fade-in { animation: fade-in 0.3s ease-out forwards; @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } }`}</style>
            <div className="bg-[var(--color-bg-secondary)] rounded-lg w-full max-w-4xl text-[var(--color-text-primary)] flex flex-col shadow-2xl border border-[var(--color-border)]">
                 <header className="flex items-center justify-between p-4 border-b" style={{borderColor: 'var(--color-border)'}}>
                    <h2 className="text-xl font-bold">Mood Analytics</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--color-container-light)]">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="grid md:grid-cols-3 gap-6 p-6">
                    {/* Left: Main Charts */}
                    <div className="md:col-span-2 space-y-6">
                         <div className="bg-[var(--color-container)] rounded-lg p-4">
                            <h3 className="font-semibold mb-4">Your Mood Trends (Manual Log)</h3>
                             <div className="h-80 w-full">
                                {moodLog.length > 0 ? (
                                     <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={weeklyChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                            <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis hide={true} domain={[0, 1]}/>
                                             <Tooltip
                                                cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                                                content={<CustomTooltip />}
                                            />
                                            {Object.entries(MOOD_DATA).map(([mood, { color }]) => (
                                                <Bar key={mood} dataKey={mood} stackId="a" fill={color} radius={[4, 4, 0, 0]} />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-center text-[var(--color-text-secondary)]">
                                        <p>Log your mood to see your trends here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-[var(--color-container)] rounded-lg p-4">
                            <h3 className="font-semibold mb-4">AI-Powered Diary Analysis</h3>
                            <div className="h-80 w-full">
                                {aiChartData && aiChartData.some(d => Object.values(d).some(v => typeof v === 'number' && v > 0)) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={aiChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                            <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis hide={true} domain={[0, 1]}/>
                                            <Tooltip
                                                cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                                                content={<CustomTooltip />}
                                            />
                                            {Object.entries(MOOD_DATA).map(([mood, { color }]) => (
                                                <Bar key={mood} dataKey={mood} stackId="a" fill={color} radius={[4, 4, 0, 0]} />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-center text-[var(--color-text-secondary)]">
                                        {isAnalyzing ? <p>Analyzing your diary entries...</p> : 
                                        analysisError ? <p className="text-red-400">{analysisError}</p> :
                                        <p>Click "Generate Insights" to see your AI-powered mood analysis.</p>
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Right: Cards */}
                    <div className="space-y-6">
                        <div className="bg-[var(--color-container)] rounded-lg p-4 flex flex-col items-center text-center">
                            <h3 className="font-semibold mb-2">Overall Vibe</h3>
                            {overallVibe ? (
                                <>
                                    <span className="text-6xl">{overallVibe.emoji}</span>
                                    <p className="text-xl font-bold mt-2">{overallVibe.label}</p>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Your average mood recently.</p>
                                </>
                            ) : (
                                <p className="text-sm text-[var(--color-text-secondary)] py-8">Not enough data yet.</p>
                            )}
                        </div>
                        <div className="bg-[var(--color-container)] rounded-lg p-4 text-center">
                            <h3 className="font-semibold mb-2">AI Insights from Diary</h3>
                             <p className="text-sm text-[var(--color-text-secondary)] mb-4">Click the button to get AI-powered mood analysis based on your diary entries.</p>
                             <button 
                                onClick={handleGenerateInsights}
                                disabled={isAnalyzing}
                                className="w-full font-bold py-2 px-4 rounded-lg bg-[var(--color-container-light)] hover:bg-[var(--color-border)] disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isAnalyzing ? 'Analyzing...' : 'Generate Insights'}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MoodAnalytics;