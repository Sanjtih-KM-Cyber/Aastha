import React, { useState } from 'react';
import { CloseIcon, DraggableIcon, MusicNoteIcon } from '../icons';
import { useTheme } from '../../context/ThemeContext';
import { MOOD_DATA, LANGUAGES } from '../../constants';
import { getMusicRecommendation } from '../../services/geminiService';
import { Recommendation, Mood, MoodEntry } from '../../types';
import useLocalStorage from '../../hooks/useLocalStorage';

const JamWithAasthaWidget: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { primaryColor } = useTheme();
    const [songRequest, setSongRequest] = useState('');
    const [selectedMood, setSelectedMood] = useState<Mood | ''>('');
    const [selectedLanguage, setSelectedLanguage] = useState('Any');
    const [isLoading, setIsLoading] = useState(false);
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [error, setError] = useState('');
    const [moodLog] = useLocalStorage<MoodEntry[]>('mood-log', []);
    const [recommendationHistory, setRecommendationHistory] = useState<string[]>([]);
    const [lastRequestPrompt, setLastRequestPrompt] = useState<string | null>(null);

    const makeRequest = async (prompt: string, isNewRequest: boolean) => {
        setIsLoading(true);
        setError('');
        setRecommendation(null);
        
        const history = isNewRequest ? [] : recommendationHistory;

        const result = await getMusicRecommendation(prompt, history);

        if (result) {
            setRecommendation(result);
            if (isNewRequest) {
                setRecommendationHistory([result.name]);
            } else {
                setRecommendationHistory(prev => [...prev, result.name]);
            }
        } else {
            setError(isNewRequest ? 'Could not find that song. Try being more specific!' : 'Couldn\'t find another suggestion. Try a new request!');
        }
        setIsLoading(false);
    };

    const handleRequest = async () => {
        if (!songRequest.trim()) return;
        const prompt = `Find the song "${songRequest}" in ${selectedLanguage === 'Any' ? 'any language' : selectedLanguage}`;
        setLastRequestPrompt(prompt);
        await makeRequest(prompt, true);
    };

    const handleFromMood = async () => {
        let moodToUse: Mood | null = null;
        
        if (selectedMood) {
            moodToUse = selectedMood;
        } else if (moodLog.length > 0) {
            const moodCounts = moodLog.reduce((acc, entry) => {
                acc[entry.mood] = (acc[entry.mood] || 0) + 1;
                return acc;
            }, {} as Record<Mood, number>);
            moodToUse = Object.entries(moodCounts).sort((a,b) => b[1] - a[1])[0][0] as Mood;
        }
        
        if (!moodToUse) {
            setError('Select a mood or log your mood first!');
            return;
        }

        const prompt = `Suggest a ${selectedLanguage === 'Any' ? '' : selectedLanguage} song for someone feeling ${moodToUse}`;
        setLastRequestPrompt(prompt);
        await makeRequest(prompt, true);
    }
    
    const handleSuggestAnother = () => {
        if (lastRequestPrompt) {
            makeRequest(lastRequestPrompt, false);
        }
    };


    return (
        <div className="w-80 bg-[var(--color-container)] rounded-lg shadow-2xl text-[var(--color-text-primary)] border border-[var(--color-border)]">
             <header className="flex items-center justify-between p-3 border-b border-[var(--color-border)] cursor-grab">
                <div className="flex items-center gap-2">
                    <DraggableIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    <h4 className="font-bold">Jam with Aastha</h4>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-container-light)]"><CloseIcon className="w-5 h-5"/></button>
            </header>
             <main className="p-4 space-y-4">
                 <div className="p-3 text-center bg-[var(--color-bg-secondary)] rounded-md text-sm text-[var(--color-text-secondary)] min-h-[5rem] flex flex-col items-center justify-center gap-2">
                    {isLoading ? <div className="animate-pulse">Searching...</div> : 
                     error ? <span className="text-red-500">{error}</span> :
                     recommendation ? (
                         <>
                            <a href={recommendation.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{color: primaryColor}}>
                                Search for: {recommendation.name}
                            </a>
                             <button onClick={handleSuggestAnother} className="text-xs py-1 px-2 rounded bg-[var(--color-container-light)] hover:bg-[var(--color-border)]">Suggest Another</button>
                         </>
                     ) :
                    "Select a mood or request a song to get a suggestion!"}
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-medium">Request a song...</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Song name..." 
                            value={songRequest}
                            onChange={(e) => setSongRequest(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRequest()}
                            className="w-full p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md focus:ring-2 focus:outline-none" style={{'--tw-ring-color': primaryColor} as React.CSSProperties} />
                         <button onClick={handleRequest} disabled={isLoading || !songRequest.trim()} className="px-4 font-semibold rounded-md text-white disabled:opacity-60" style={{backgroundColor: primaryColor, color: 'var(--color-user-bubble-text)'}}>Request</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                     <select value={selectedMood} onChange={(e) => setSelectedMood(e.target.value as Mood | '')} className="w-full p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md focus:ring-2 focus:outline-none" style={{'--tw-ring-color': primaryColor} as React.CSSProperties}>
                        <option value="">Use Overall Vibe or Select...</option>
                        {Object.values(MOOD_DATA).map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
                    </select>
                    <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="w-full p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md focus:ring-2 focus:outline-none" style={{'--tw-ring-color': primaryColor} as React.CSSProperties}>
                        {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
                </div>

                <button onClick={handleFromMood} disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-2 font-semibold rounded-md text-white disabled:opacity-60" style={{backgroundColor: primaryColor, color: 'var(--color-user-bubble-text)'}}>
                    <MusicNoteIcon className="w-5 h-5"/> Suggest from Mood
                </button>
                <p className="text-xs text-center text-[var(--color-text-secondary)] -mt-2">
                    Uses your overall mood from your log if none is selected above.
                </p>
            </main>
        </div>
    );
};

export default JamWithAasthaWidget;