import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CloseIcon, DraggableIcon, RainIcon, ForestIcon, WavesIcon, FireIcon, CoffeeIcon, MuteIcon, VolumeIcon } from '../icons';

const SOUNDS = [
    { name: 'Rain', icon: RainIcon, src: 'https://cdn.pixabay.com/audio/2022/11/11/audio_18c722621d.mp3' },
    { name: 'Forest', icon: ForestIcon, src: 'https://cdn.pixabay.com/audio/2022/02/04/audio_c3413997d2.mp3' },
    { name: 'Waves', icon: WavesIcon, src: 'https://cdn.pixabay.com/audio/2023/10/12/audio_11e7424a6e.mp3' },
    { name: 'Fire', icon: FireIcon, src: 'https://cdn.pixabay.com/audio/2022/04/13/audio_175215a3c9.mp3' },
    { name: 'Coffee Shop', icon: CoffeeIcon, src: 'https://cdn.pixabay.com/audio/2022/06/19/audio_d50a9d8213.mp3' },
];


const Soundscape: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { primaryColor } = useTheme();
    const [activeSound, setActiveSound] = useState<string | null>(null);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        
        const audio = audioRef.current;
        return () => {
            audio.pause();
            audio.src = '';
        }
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);


    const handleSoundClick = (name: string) => {
        const soundData = SOUNDS.find(s => s.name === name);
        if (!soundData || !audioRef.current) return;

        const audio = audioRef.current;
        
        if (activeSound === name) {
            audio.pause();
            setActiveSound(null);
        } else {
            audio.src = soundData.src;
            audio.play().catch(e => console.error("Audio play failed:", e));
            setActiveSound(name);
        }
    };

    return (
        <div className="w-80 bg-[var(--color-container)] rounded-lg shadow-2xl text-[var(--color-text-primary)] border border-[var(--color-border)]">
            <header className="flex items-center justify-between p-3 border-b border-[var(--color-border)] cursor-grab">
                <div className="flex items-center gap-2">
                    <DraggableIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    <h4 className="font-bold">Soundscapes</h4>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-container-light)]"><CloseIcon className="w-5 h-5"/></button>
            </header>
            <main className="p-4 space-y-4">
                <div className="grid grid-cols-5 gap-2">
                    {SOUNDS.map(sound => (
                        <div key={sound.name} className="relative flex justify-center group">
                            <button 
                                onClick={() => handleSoundClick(sound.name)}
                                className={`p-3 w-full rounded-lg flex justify-center items-center transition-colors border-2 ${activeSound === sound.name ? '' : 'bg-[var(--color-container-light)] hover:bg-[var(--color-border)] border-transparent'}`}
                                style={activeSound === sound.name ? {backgroundColor: primaryColor, color: 'var(--color-user-bubble-text)', borderColor: primaryColor} : {}}
                                aria-label={`Play ${sound.name} sound`}
                            >
                                <sound.icon className="w-6 h-6" />
                            </button>
                             <div className="absolute bottom-full mb-2 px-2 py-1 bg-[var(--color-bg)] text-[var(--color-text-primary)] text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg border border-[var(--color-border)]">
                                {sound.name}
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="flex items-center gap-3">
                    <button onClick={() => setIsMuted(m => !m)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                        {isMuted || volume === 0 ? <MuteIcon className="w-5 h-5" /> : <VolumeIcon className="w-5 h-5" />}
                    </button>
                    <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={e => {
                            setVolume(parseFloat(e.target.value));
                            if (parseFloat(e.target.value) > 0 && isMuted) {
                                setIsMuted(false);
                            }
                        }}
                        className="w-full h-2 bg-[var(--color-container-light)] rounded-lg appearance-none cursor-pointer"
                        style={{'--thumb-color': primaryColor} as React.CSSProperties}
                    />
                    <style>{`
                        input[type=range]::-webkit-slider-thumb {
                          -webkit-appearance: none; appearance: none;
                          width: 16px; height: 16px; border-radius: 50%;
                          background: var(--thumb-color); cursor: pointer;
                        }
                        input[type=range]::-moz-range-thumb {
                           width: 16px; height: 16px; border-radius: 50%;
                          background: var(--thumb-color); cursor: pointer;
                        }
                    `}</style>
                </div>
            </main>
        </div>
    );
};

export default Soundscape;
