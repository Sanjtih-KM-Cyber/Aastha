import React, { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CloseIcon, AppearanceIcon, SecurityIcon, DataIcon, CheckIcon } from '../icons';
import useLocalStorage from '../../hooks/useLocalStorage';
import { UserConfig } from '../../types';
import DiarySecurityModal from './DiarySecurityModal';
import { ACCENT_COLORS } from '../../constants';

interface SettingsPanelProps {
    onClose: () => void;
    onLogout: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, onLogout }) => {
    const { setThemeFromColor, primaryColor, setThemeFromImage, clearDynamicTheme, backgroundImage } = useTheme();
    const [userConfig, setUserConfig] = useLocalStorage<UserConfig | null>('user-config', null);
    const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);


    const handleResetData = () => {
        if (window.confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
            window.localStorage.clear();
            window.location.reload();
        }
    };
    
    const handleUserConfigChange = (newConfig: UserConfig) => {
        setUserConfig(newConfig);
    }
    
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate the file type before proceeding
        if (!file.type || !file.type.startsWith('image/')) {
            setUploadError('Invalid file type. Please upload a valid image (e.g., PNG, JPEG).');
            return;
        }

        setUploadError('');
        setIsUploading(true);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Image = (e.target?.result as string).split(',')[1];
            if (base64Image) {
               const success = await setThemeFromImage(base64Image, file.type);
               if(!success) {
                   setUploadError('Could not generate a theme from this image.');
               }
            } else {
                 setUploadError('Failed to read the image file.');
            }
            setIsUploading(false);
        };
        reader.onerror = () => {
            setUploadError('Failed to read the image file.');
            setIsUploading(false);
        }
        reader.readAsDataURL(file);
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl w-full max-w-md text-[var(--color-text-primary)] flex flex-col shadow-2xl border border-[var(--color-border)] m-4" onClick={e => e.stopPropagation()}>
                    <header className="flex items-center justify-between p-4 border-b shrink-0" style={{borderColor: 'var(--color-border)'}}>
                        <h2 className="text-xl font-bold">Settings</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--color-container-light)]">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </header>
                    <main className="p-6 space-y-8 overflow-y-auto max-h-[calc(100vh-140px)]">
                        
                        {/* Appearance Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <AppearanceIcon className="w-6 h-6 text-[var(--color-text-secondary)]"/>
                                <h3 className="text-lg font-semibold">Appearance</h3>
                            </div>
                            <div className="p-4 bg-[var(--color-container)] rounded-lg space-y-4 border border-[var(--color-border)]">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">Accent Color</label>
                                    <div className="flex flex-wrap gap-x-4 gap-y-3">
                                        {Object.entries(ACCENT_COLORS).map(([name, color]) => (
                                            <div key={name} className="flex flex-col items-center gap-1.5">
                                                <button 
                                                    onClick={() => setThemeFromColor(color)}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform transform hover:scale-110 relative"
                                                    style={{ backgroundColor: color }}
                                                    aria-label={`Set theme to ${name}`}
                                                >
                                                {primaryColor === color && !backgroundImage && (
                                                    <div className="w-10 h-10 rounded-full border-2 border-[var(--color-text-primary)] absolute"></div>
                                                )}
                                                </button>
                                                <span className="text-xs text-[var(--color-text-secondary)]">{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                 <div className="border-t border-[var(--color-border)] !mt-6 pt-4">
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">Dynamic Theme</label>
                                    <p className="text-xs text-[var(--color-text-secondary)] mb-3">Upload a photo to use as your background and automatically generate a new color theme.</p>
                                    <div className="flex gap-2">
                                        <input type="file" accept="image/jpeg, image/png" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                                        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full font-bold py-2 px-4 rounded-lg bg-[var(--color-container-light)] hover:bg-[var(--color-border)] disabled:opacity-50">
                                            {isUploading ? 'Analyzing...' : 'Upload Photo'}
                                        </button>
                                        {backgroundImage && (
                                             <button onClick={clearDynamicTheme} className="w-full font-bold py-2 px-4 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20">
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                     {uploadError && <p className="text-red-400 text-xs mt-2">{uploadError}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Diary Security Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <SecurityIcon className="w-6 h-6 text-[var(--color-text-secondary)]"/>
                                <h3 className="text-lg font-semibold">Diary Security</h3>
                            </div>
                            <div className="p-4 bg-[var(--color-container)] rounded-lg space-y-4 border border-[var(--color-border)]">
                                <p className="text-sm text-[var(--color-text-secondary)]">Manage your diary's password and security question.</p>
                                <button onClick={() => setIsSecurityModalOpen(true)} className="w-full font-bold py-2 px-4 rounded-lg bg-[var(--color-container-light)] hover:bg-[var(--color-border)]">
                                    Manage Security
                                </button>
                            </div>
                        </div>

                        {/* Data Management Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <DataIcon className="w-6 h-6 text-[var(--color-text-secondary)]"/>
                                <h3 className="text-lg font-semibold">Data Management</h3>
                            </div>
                            <div className="p-4 bg-[var(--color-container)] rounded-lg space-y-4 border border-[var(--color-border)]">
                                <p className="text-sm text-[var(--color-text-secondary)]">Reset all application data stored in this browser, including chats, settings, and diary entries.</p>
                                <button 
                                    onClick={handleResetData} 
                                    className="w-full font-bold py-2 px-4 rounded bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20"
                                >
                                    Reset All Data
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            {isSecurityModalOpen && userConfig && (
                <DiarySecurityModal 
                    userConfig={userConfig}
                    onClose={() => setIsSecurityModalOpen(false)}
                    onConfigChange={handleUserConfigChange}
                />
            )}
        </>
    );
};

export default SettingsPanel;