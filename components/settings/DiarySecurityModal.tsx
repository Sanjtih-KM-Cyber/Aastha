import React, { useState } from 'react';
import { UserConfig } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { CloseIcon } from '../icons';
import { SECURITY_QUESTIONS } from '../../constants';

interface DiarySecurityModalProps {
    userConfig: UserConfig;
    onClose: () => void;
    onConfigChange: (newConfig: UserConfig) => void;
}

type View = 'verify' | 'manage';

const DiarySecurityModal: React.FC<DiarySecurityModalProps> = ({ userConfig, onClose, onConfigChange }) => {
    const { primaryColor } = useTheme();
    const [view, setView] = useState<View>('verify');
    const [error, setError] = useState('');

    // State for verification
    const [currentPassword, setCurrentPassword] = useState('');

    // State for management
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [newSecurityQuestion, setNewSecurityQuestion] = useState(userConfig.securityQuestion);
    const [newSecurityAnswer, setNewSecurityAnswer] = useState('');
    
    const [isShaking, setIsShaking] = useState(false);
    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (btoa(currentPassword) === userConfig.passwordHash) {
            setView('manage');
            setError('');
        } else {
            setError('Incorrect password.');
            triggerShake();
        }
    };

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        let updatedConfig = { ...userConfig };

        // Handle password change
        if (newPassword) {
            if (newPassword.length < 6) {
                setError('New password must be at least 6 characters long.');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                setError('New passwords do not match.');
                return;
            }
            updatedConfig.passwordHash = btoa(newPassword);
        }

        // Handle security question change
        if (newSecurityAnswer) {
             updatedConfig.securityQuestion = newSecurityQuestion;
             updatedConfig.securityAnswerHash = btoa(newSecurityAnswer.toLowerCase().trim());
        } else if (newSecurityQuestion !== userConfig.securityQuestion) {
             setError('Please provide an answer for the new security question.');
             return;
        }

        onConfigChange(updatedConfig);
        onClose();
    };

    const renderVerifyView = () => (
        <form onSubmit={handleVerify}>
            <h3 className="text-lg font-bold text-center mb-2">Verify Your Identity</h3>
            <p className="text-sm text-center text-[var(--color-text-secondary)] mb-4">Please enter your current password to proceed.</p>
            <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
                className="w-full p-2 bg-[var(--color-container-light)] border border-[var(--color-border)] rounded-md focus:ring-2 focus:outline-none"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                autoFocus
            />
            <button type="submit" className="w-full mt-4 font-bold py-2 rounded-lg text-white" style={{ backgroundColor: primaryColor, color: 'var(--color-user-bubble-text)' }}>
                Verify
            </button>
        </form>
    );

    const renderManageView = () => (
        <form onSubmit={handleSaveChanges} className="space-y-4">
            <div>
                <h3 className="text-lg font-bold mb-2">Change Password</h3>
                <div className="space-y-2">
                    <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="New Password (min. 6 characters)"
                        className="w-full p-2 bg-[var(--color-container-light)] border border-[var(--color-border)] rounded-md"
                    />
                    <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm New Password"
                        className="w-full p-2 bg-[var(--color-container-light)] border border-[var(--color-border)] rounded-md"
                    />
                </div>
            </div>
            <div className="border-t border-[var(--color-border)] my-4"></div>
            <div>
                <h3 className="text-lg font-bold mb-2">Change Security Question</h3>
                <div className="space-y-2">
                    <select
                        value={newSecurityQuestion}
                        onChange={e => setNewSecurityQuestion(e.target.value)}
                        className="w-full p-2 bg-[var(--color-container-light)] border border-[var(--color-border)] rounded-md"
                    >
                        {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                    <input
                        type="text"
                        value={newSecurityAnswer}
                        onChange={e => setNewSecurityAnswer(e.target.value)}
                        placeholder="New Answer"
                        className="w-full p-2 bg-[var(--color-container-light)] border border-[var(--color-border)] rounded-md"
                    />
                </div>
            </div>
            <button type="submit" className="w-full mt-4 font-bold py-2 rounded-lg text-white" style={{ backgroundColor: primaryColor, color: 'var(--color-user-bubble-text)' }}>
                Save Changes
            </button>
        </form>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div
                className={`bg-[var(--color-container)] rounded-xl w-full max-w-sm text-[var(--color-text-primary)] shadow-2xl border border-[var(--color-border)] ${isShaking ? 'animate-shake' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                    <h2 className="text-xl font-bold">Manage Diary Security</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--color-container-light)]">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                <main className="p-6">
                    {view === 'verify' ? renderVerifyView() : renderManageView()}
                    {error && <p className="text-red-500 text-sm text-center mt-3">{error}</p>}
                </main>
                 <style>{`
                    @keyframes shake {
                        10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); }
                    }
                    .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
                `}</style>
            </div>
        </div>
    );
};

export default DiarySecurityModal;
