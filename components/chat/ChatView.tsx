import React, { useState, useEffect, useRef } from 'react';
import { Message, Role, UserConfig, WellnessTool, Widget } from '../../types';
import { getChatResponseStream } from '../../services/geminiService';
import MessageBubble from './MessageBubble';
import { SendIcon, EmojiIcon, MenuIcon, MoonIcon, SunIcon, PomodoroIcon, CloseIcon } from '../icons';
import { useTheme } from '../../context/ThemeContext';
import WellnessHub from '../wellness/WellnessHub';
import { POSITIVE_EMOJIS, ACCENT_COLORS } from '../../constants';

interface ChatViewProps {
    userConfig: UserConfig;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setUserFacts: React.Dispatch<React.SetStateAction<string[]>>;
    onOpenModal: (tool: WellnessTool) => void;
    onToggleWidget: (widget: Widget) => void;
}

const EMOJI_LIST = ['😊', '😂', '❤️', '👍', '😢', '🙏', '🔥', '🎉', '🤔', '👋', '😎', '😮', '😇', '🥳', '🤯', '😭'];

const ChatView: React.FC<ChatViewProps> = ({ userConfig, messages, setMessages, setUserFacts, onOpenModal, onToggleWidget }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showWellnessHub, setShowWellnessHub] = useState(false);
    const [headerEmoji, setHeaderEmoji] = useState('❤️');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    const { themeMode, toggleThemeMode, primaryColor, setThemeFromColor } = useTheme();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setHeaderEmoji(POSITIVE_EMOJIS[Math.floor(Math.random() * POSITIVE_EMOJIS.length)]);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleReply = (message: Message) => {
        setReplyingTo(message);
        textareaRef.current?.focus();
    };

    const processCommands = (text: string): string => {
        let processedText = text;

        const commandMap: Record<string, () => void> = {
            '<open_diary/>': () => onOpenModal('diary'),
            '<open_mood_tracker/>': () => onOpenModal('mood-tracker'),
            '<open_mood_analytics/>': () => onOpenModal('mood-analytics'),
            '<open_settings/>': () => onOpenModal('settings'),
            '<open_pomodoro/>': () => onToggleWidget('pomodoro'),
            '<open_soundscape/>': () => onToggleWidget('soundscape'),
            '<open_breathing/>': () => onToggleWidget('breathing'),
            '<open_jam-with-aastha/>': () => onToggleWidget('jam-with-aastha'),
        };

        for (const [tag, action] of Object.entries(commandMap)) {
            if (processedText.includes(tag)) {
                action();
                processedText = processedText.replace(tag, '').trim();
            }
        }

        const colorMatch = processedText.match(/<color>(.*?)<\/color>/i);
        if (colorMatch && colorMatch[1]) {
            const colorName = colorMatch[1].trim().toLowerCase();
            const foundColor = Object.entries(ACCENT_COLORS).find(([name]) => name.toLowerCase().includes(colorName));
            
            if (foundColor) {
                setThemeFromColor(foundColor[1]);
            }
            
            processedText = processedText.replace(colorMatch[0], '').trim();
        }

        const factRegex = /<save_fact>(.*?)<\/save_fact>/gi;
        const factsToSave: string[] = [];
        for (const match of processedText.matchAll(factRegex)) {
            const fact = match[1].trim();
            if (fact) {
                factsToSave.push(fact);
            }
        }

        if (factsToSave.length > 0) {
            setUserFacts(prevFacts => {
                const newFacts = factsToSave.filter(f => !prevFacts.includes(f));
                return newFacts.length > 0 ? [...prevFacts, ...newFacts] : prevFacts;
            });
            processedText = processedText.replace(factRegex, '').trim();
        }
        
        return processedText;
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = async () => {
        let messageToSend = input.trim();
        if (!messageToSend || isLoading) return;
        
        if (replyingTo && typeof replyingTo.text === 'string') {
             messageToSend = `In reply to "${replyingTo.text.substring(0, 50)}...":\n${messageToSend}`;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input, // We show the original input in the bubble
            role: Role.USER,
            timestamp: Date.now(),
        };

        const typingId = `${Date.now()}-typing`;
        const typingMessage: Message = {
            id: typingId,
            role: Role.MODEL,
            text: '',
            isTyping: true,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage, typingMessage]);
        
        setInput('');
        setReplyingTo(null); // Clear reply after sending
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        setIsLoading(true);

        try {
            const stream = await getChatResponseStream(messageToSend); // Send the message with context
            let responseText = '';
            
            for await (const chunk of stream) {
                responseText += chunk.text;
                setMessages(prev => prev.map(m => m.id === typingId ? {
                    ...m,
                    text: responseText,
                } : m));
            }

            const cleanedText = processCommands(responseText);

            setMessages(prev => prev.map(m => m.id === typingId ? {
                ...m,
                isTyping: false,
                text: cleanedText,
            } : m));

        } catch (error) {
            console.error('Error getting chat response:', error);
            const errorMessage: Message = {
                id: `${Date.now()}-error`,
                text: "Sorry, I'm having trouble connecting. Please try again later.",
                role: Role.MODEL,
                timestamp: Date.now(),
            };
            setMessages(prev => prev.filter(m => m.id !== typingId).concat(errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)]">
            <WellnessHub 
                isOpen={showWellnessHub} 
                onClose={() => setShowWellnessHub(false)}
                onOpenModal={onOpenModal}
                onToggleWidget={onToggleWidget}
                userConfig={userConfig}
            />

            <header className="flex items-center justify-between p-4 border-b shrink-0" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)'}}>
                <div className="w-1/3">
                     <button onClick={() => setShowWellnessHub(true)} className="p-2 rounded-full hover:bg-[var(--color-container-light)]">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                </div>
                <h1 className="w-1/3 text-center text-lg font-bold whitespace-nowrap">Aastha - Your Wellness Buddy {headerEmoji}</h1>
                <div className="w-1/3 flex items-center justify-end gap-2">
                    <button onClick={toggleThemeMode} className="p-2 rounded-full hover:bg-[var(--color-container-light)]">
                        {themeMode === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                    </button>
                    <button onClick={() => onToggleWidget('pomodoro')} className="p-2 rounded-full hover:bg-[var(--color-container-light)]">
                        <PomodoroIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} userName={userConfig.userName} onReply={handleReply} />
                ))}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 border-t" style={{backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)'}}>
                 {replyingTo && (
                    <div className="px-3 py-2 text-sm bg-[var(--color-container-light)] rounded-t-lg flex justify-between items-center text-[var(--color-text-secondary)]">
                        <p className="truncate">Replying to: "{typeof replyingTo.text === 'string' ? replyingTo.text : '...'}"</p>
                        <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full hover:bg-[var(--color-border)]">
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <div className={`flex items-end bg-[var(--color-bg-secondary)] p-2 gap-2 ${replyingTo ? 'rounded-b-2xl' : 'rounded-2xl'}`}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0" style={{backgroundColor: primaryColor, color: 'var(--color-user-bubble-text)'}}>
                        {userConfig.userName[0].toUpperCase()}
                    </div>
                    <div className="relative">
                         <button onClick={() => setShowEmojiPicker(p => !p)} className="p-2 rounded-full hover:bg-[var(--color-container-light)] self-end">
                            <EmojiIcon className="w-6 h-6" />
                        </button>
                        {showEmojiPicker && (
                            <div className="absolute bottom-full mb-2 w-60 bg-[var(--color-container)] p-2 rounded-lg shadow-lg border border-[var(--color-border)] grid grid-cols-6 gap-2">
                                {EMOJI_LIST.map(emoji => (
                                    <button 
                                        key={emoji} 
                                        onClick={() => {
                                            setInput(prev => prev + emoji);
                                            setShowEmojiPicker(false);
                                            textareaRef.current?.focus();
                                        }}
                                        className="text-2xl rounded-md hover:bg-[var(--color-container-light)]"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKeyPress}
                        placeholder="Chat with Aastha..."
                        className="flex-1 bg-transparent px-2 py-2 focus:outline-none resize-none max-h-40"
                        style={{color: 'var(--color-text-primary)'}}
                        disabled={isLoading}
                        rows={1}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-3 rounded-full self-end disabled:opacity-50" style={{ backgroundColor: 'var(--color-primary)'}}>
                        <SendIcon className="w-5 h-5" style={{ color: 'var(--color-user-bubble-text)' }} />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default ChatView;