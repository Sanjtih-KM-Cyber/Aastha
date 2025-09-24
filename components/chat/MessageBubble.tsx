import React, { useState } from 'react';
import { Message, Role } from '../../types';
import ReactMarkdown from 'react-markdown';
import { CopyIcon, ReplyIcon } from '../icons';
import { useTheme } from '../../context/ThemeContext';

interface MessageBubbleProps {
    message: Message;
    userName: string;
    onReply: (message: Message) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, userName, onReply }) => {
    const { primaryColor } = useTheme();
    const isUser = message.role === Role.USER;
    const [isHovered, setIsHovered] = useState(false);
    const avatarChar = isUser ? userName[0].toUpperCase() : 'A';

    const handleCopy = () => {
        if(typeof message.text === 'string') {
            navigator.clipboard.writeText(message.text);
        }
    };
    
    if (message.isTyping) {
        return (
             <div className="flex items-center self-start space-x-2 px-4 py-3 rounded-2xl" style={{ backgroundColor: 'var(--color-model-bubble-bg)'}}>
                <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
        );
    }
    
    const timestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div 
            className={`w-full flex items-end gap-2 my-2 group ${isUser ? 'justify-end' : 'justify-start'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {!isUser && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0" style={{backgroundColor: '#374151', color: '#E5E7EB'}}>
                    {avatarChar}
                </div>
            )}
             <div className={`flex items-center gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {isHovered && (
                     <div className="flex items-center gap-1 p-1 rounded-md bg-[var(--color-container-light)]">
                        <button onClick={() => onReply(message)} className="p-1 rounded hover:bg-[var(--color-border)]"><ReplyIcon className="w-4 h-4 text-[var(--color-text-secondary)]"/></button>
                        <button onClick={handleCopy} className="p-1 rounded hover:bg-[var(--color-border)]"><CopyIcon className="w-4 h-4 text-[var(--color-text-secondary)]"/></button>
                    </div>
                )}
                <div className="flex flex-col">
                    <div
                        className={`max-w-md lg:max-w-lg px-4 py-2 rounded-2xl w-fit`}
                        style={{
                            backgroundColor: isUser ? 'var(--color-user-bubble-bg)' : 'var(--color-model-bubble-bg)',
                            color: isUser ? 'var(--color-user-bubble-text)' : 'var(--color-model-bubble-text)'
                        }}
                    >
                        {typeof message.text === 'string' ? (
                             <ReactMarkdown className="prose prose-sm prose-p:my-0" components={{ a: props => <a {...props} style={{color: primaryColor}} target="_blank" rel="noopener noreferrer"/> }}>
                                {message.text}
                            </ReactMarkdown>
                        ) : (
                            message.text
                        )}
                    </div>
                    <span className={`text-xs mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`} style={{color: 'var(--color-text-secondary)'}}>
                        {timestamp}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
