import React, { useState, useEffect } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { UserConfig, WellnessTool, Widget, Message, Role } from './types';
import SetupScreen from './components/auth/SetupScreen';
import PasswordScreen from './components/auth/PasswordScreen';
import ChatView from './components/chat/ChatView';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { initializeChat } from './services/geminiService';
import Draggable from './components/widgets/Draggable';
import PomodoroWidget from './components/widgets/PomodoroWidget';
import Soundscape from './components/wellness/Soundscape';
import BreathingWidget from './components/widgets/BreathingWidget';
import JamWithAasthaWidget from './components/widgets/JamWithAasthaWidget';
import Diary from './components/wellness/Diary';
import MoodTracker from './components/wellness/MoodTracker';
import MoodAnalytics from './components/wellness/MoodAnalytics';
import SettingsPanel from './components/settings/SettingsPanel';


const AppContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { backgroundImage } = useTheme();
    return (
        <div 
            className="h-screen w-screen overflow-hidden transition-all duration-500" 
            style={{ 
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: 'var(--color-bg)', 
                color: 'var(--color-text-primary)'
            }}
        >
            {children}
        </div>
    );
};


const App: React.FC = () => {
    const [userConfig, setUserConfig] = useLocalStorage<UserConfig | null>('user-config', null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    const initialMessage: Message = { id: 'initial-1', role: Role.MODEL, text: `Hello! I'm Aastha, your wellness buddy. How are you feeling today? 😊`, timestamp: Date.now() };
    const [messages, setMessages] = useLocalStorage<Message[]>('chat-history-v2', [initialMessage]);
    const [userFacts, setUserFacts] = useLocalStorage<string[]>('user-facts-v1', []);

    const [activeModal, setActiveModal] = useState<WellnessTool | null>(null);
    const [openWidgets, setOpenWidgets] = useState<Partial<Record<Widget, boolean>>>({});

    useEffect(() => {
        if (isAuthenticated && userConfig) {
            initializeChat(messages, userConfig.userName, userFacts);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, userConfig]);

    const handleSetupComplete = (config: UserConfig) => {
        setUserConfig(config);
        setIsAuthenticated(true);
    };

    const handleAuthenticated = () => {
        setIsAuthenticated(true);
    };
    
    const handlePasswordReset = (newPasswordHash: string) => {
        if (userConfig) {
            setUserConfig({ ...userConfig, passwordHash: newPasswordHash });
            setIsAuthenticated(true);
        }
    };

    const handleLogout = () => {
        // A more robust solution might clear specific keys
        window.localStorage.clear();
        window.location.reload();
    }

    const toggleWidget = (widget: Widget) => {
        setOpenWidgets(prev => ({...prev, [widget]: !prev[widget]}));
    };
    
    const renderModal = () => {
        if (!activeModal || !userConfig) return null;

        const commonProps = {
            userConfig: userConfig,
            onClose: () => setActiveModal(null)
        };

        switch(activeModal) {
            case 'diary': return <Diary {...commonProps} />;
            case 'mood-tracker': return <MoodTracker {...commonProps} />;
            case 'mood-analytics': return <MoodAnalytics {...commonProps} />;
            case 'settings': return <SettingsPanel onClose={() => setActiveModal(null)} onLogout={handleLogout} />;
            default: return null;
        }
    }

    const renderApp = () => {
        if (!userConfig || !userConfig.onboardingComplete) {
            return <SetupScreen onSetupComplete={handleSetupComplete} />;
        }
    
        if (!isAuthenticated) {
            return <PasswordScreen userConfig={userConfig} onAuthenticated={handleAuthenticated} onPasswordReset={handlePasswordReset}/>;
        }
    
        return (
            <>
                <ChatView 
                    userConfig={userConfig}
                    messages={messages}
                    setMessages={setMessages}
                    setUserFacts={setUserFacts}
                    onOpenModal={setActiveModal}
                    onToggleWidget={toggleWidget}
                />
                
                {/* Draggable Widgets */}
                {openWidgets.pomodoro && <Draggable><PomodoroWidget onClose={() => toggleWidget('pomodoro')} /></Draggable>}
                {openWidgets.soundscape && <Draggable><Soundscape onClose={() => toggleWidget('soundscape')} /></Draggable>}
                {openWidgets.breathing && <Draggable><BreathingWidget onClose={() => toggleWidget('breathing')} /></Draggable>}
                {openWidgets['jam-with-aastha'] && <Draggable><JamWithAasthaWidget onClose={() => toggleWidget('jam-with-aastha')} /></Draggable>}
                
                {/* Full-screen Modals */}
                {renderModal()}
            </>
        );
    }

    return (
        <ThemeProvider>
            <AppContainer>
                 {renderApp()}
            </AppContainer>
        </ThemeProvider>
    );
};

export default App;