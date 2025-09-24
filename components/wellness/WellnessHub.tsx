import React from 'react';
import { UserConfig, WellnessTool, Widget } from '../../types';
import { 
    CloseIcon, DiaryIcon, MoodIcon, AnalyticsIcon, BreathingIcon, MusicIcon, SoundscapeIcon, SettingsIcon, LogoutIcon 
} from '../icons';
import { useTheme } from '../../context/ThemeContext';

interface WellnessHubProps {
    isOpen: boolean;
    onClose: () => void;
    userConfig: UserConfig;
    onOpenModal: (tool: WellnessTool) => void;
    onToggleWidget: (widget: Widget) => void;
}

const WellnessHub: React.FC<WellnessHubProps> = ({ isOpen, onClose, userConfig, onOpenModal, onToggleWidget }) => {
    const { primaryColor, themeMode } = useTheme();
    const [activeItem, setActiveItem] = React.useState<string>('chat');

    const handleModalOpen = (tool: WellnessTool) => {
        setActiveItem(tool);
        onOpenModal(tool);
        onClose();
    }

    const handleWidgetToggle = (widget: Widget) => {
        setActiveItem(widget);
        onToggleWidget(widget);
        onClose();
    }
    
    const handleLogout = () => {
        if(window.confirm('Are you sure you want to log out?')) {
            window.localStorage.clear();
            window.location.reload();
        }
    }

    const NavItem = ({ name, label, icon, action }: { name: string, label: string, icon: React.ReactNode, action: () => void }) => (
        <button
            onClick={action}
            className={`flex items-center w-full p-3 rounded-lg text-left transition-colors duration-200 ${
                activeItem === name 
                ? 'font-semibold' 
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-container-light)] hover:text-[var(--color-text-primary)]'
            }`}
            style={activeItem === name ? { 
                backgroundColor: primaryColor, 
                color: 'var(--color-user-bubble-text)' 
            } : {}}
        >
            <span style={activeItem === name ? { color: 'var(--color-user-bubble-text)' } : {}} className="w-6 h-6">{icon}</span>
            <span className="ml-4">{label}</span>
        </button>
    );

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            <div
                className={`fixed top-0 left-0 h-full w-72 bg-[var(--color-bg-secondary)] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-[var(--color-border)] ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <header className="flex items-center justify-between p-4 border-b border-[var(--color-border)] shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Wellness Hub</h2>
                        <p className="text-sm text-[var(--color-text-secondary)]">Your space for a better You</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--color-container-light)]">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    <NavItem name="diary" label="Digital Diary" icon={<DiaryIcon/>} action={() => handleModalOpen('diary')}/>
                    <NavItem name="mood-tracker" label="Mood Tracker" icon={<MoodIcon/>} action={() => handleModalOpen('mood-tracker')}/>
                    <NavItem name="mood-analytics" label="Mood Analytics" icon={<AnalyticsIcon/>} action={() => handleModalOpen('mood-analytics')}/>
                    <NavItem name="breathing" label="Guided Breathing" icon={<BreathingIcon/>} action={() => handleWidgetToggle('breathing')}/>
                    <NavItem name="jam-with-aastha" label="Jam with Aastha" icon={<MusicIcon/>} action={() => handleWidgetToggle('jam-with-aastha')}/>
                    <NavItem name="soundscape" label="Soundscape" icon={<SoundscapeIcon/>} action={() => handleWidgetToggle('soundscape')}/>
                </nav>
                <footer className="p-3 border-t border-[var(--color-border)] shrink-0">
                    <div className="space-y-1">
                        <NavItem name="settings" label="Settings" icon={<SettingsIcon />} action={() => handleModalOpen('settings')}/>
                         <button
                            onClick={handleLogout}
                            className="flex items-center w-full p-3 rounded-lg text-left text-[var(--color-text-secondary)] hover:bg-[var(--color-container-light)] hover:text-[var(--color-text-primary)]"
                        >
                            <LogoutIcon className="w-6 h-6"/>
                            <span className="ml-4 font-medium">Logout</span>
                         </button>
                    </div>
                     <div className="flex items-center gap-3 mt-3 p-3 rounded-lg">
                         <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg" style={{backgroundColor: primaryColor, color: 'var(--color-user-bubble-text)'}}>
                            {userConfig.userName[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-[var(--color-text-primary)]">{userConfig.userName}</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">Wellness Journey</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default WellnessHub;