import React, { useState } from 'react';
import { UserConfig } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { CloseIcon } from '../icons';

interface DiaryPasswordGateProps {
    userConfig: UserConfig;
    onAuthenticated: () => void;
    onUserConfigChange: (config: UserConfig) => void;
    onClose: () => void;
}

const DiaryPasswordGate: React.FC<DiaryPasswordGateProps> = ({ userConfig, onAuthenticated, onUserConfigChange, onClose }) => {
    const [view, setView] = useState<'login' | 'recover' | 'reset'>('login');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [error, setError] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const { primaryColor } = useTheme();

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (btoa(password) === userConfig.passwordHash) {
            onAuthenticated();
        } else {
            setError('Incorrect password. Please try again.');
            setPassword('');
            triggerShake();
        }
    };

    const handleRecover = (e: React.FormEvent) => {
        e.preventDefault();
        if (btoa(securityAnswer.toLowerCase().trim()) === userConfig.securityAnswerHash) {
            setError('');
            setView('reset');
        } else {
            setError('Incorrect answer. Please try again.');
            setSecurityAnswer('');
            triggerShake();
        }
    };

    const handleReset = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match.');
            return;
        }
        onUserConfigChange({ ...userConfig, passwordHash: btoa(newPassword) });
        onAuthenticated(); // Auto-login after reset
    };

    const renderContent = () => {
        switch (view) {
            case 'recover':
                return (
                    <>
                        <h2 className="text-xl font-bold text-center mb-2">Password Recovery</h2>
                        <p className="text-center text-sm mb-4">{userConfig.securityQuestion}</p>
                        <form onSubmit={handleRecover}>
                            <input type="text" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} className="w-full input-style" placeholder="Your answer" autoFocus />
                            <button type="submit" className="w-full mt-4 btn-primary">Verify</button>
                             <button type="button" onClick={() => { setView('login'); setError('')}} className="w-full text-center text-xs mt-3">Back to Login</button>
                        </form>
                    </>
                );
            case 'reset':
                return (
                     <>
                        <h2 className="text-xl font-bold text-center mb-2">Set New Password</h2>
                        <p className="text-center text-sm mb-4">Create a new password for your diary.</p>
                        <form onSubmit={handleReset} className="space-y-3">
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full input-style" placeholder="New Password" autoFocus />
                            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full input-style" placeholder="Confirm New Password" />
                            <button type="submit" className="w-full btn-primary">Reset Password</button>
                        </form>
                    </>
                );
            case 'login':
            default:
                return (
                    <>
                        <h2 className="text-xl font-bold text-center mb-2">Diary Locked</h2>
                        <p className="text-center text-sm mb-4">Enter your password to continue.</p>
                        <form onSubmit={handleLogin}>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full input-style" placeholder="Password" autoFocus />
                            <button type="submit" className="w-full mt-4 btn-primary">Unlock</button>
                        </form>
                        <button onClick={() => { setView('recover'); setError(''); }} className="w-full text-center text-xs mt-4">Forgot Password?</button>
                    </>
                );
        }
    };


    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-4">
             <style>{`
                .input-style { background-color: rgba(0,0,0,0.2); border: 1px solid ${primaryColor}80; color: var(--color-text-primary); border-radius: 0.5rem; padding: 0.75rem 1rem; width: 100%; }
                .input-style:focus { outline: none; box-shadow: 0 0 0 2px ${primaryColor}; }
                .btn-primary { background-color: ${primaryColor}; color: var(--color-user-bubble-text); font-weight: bold; padding: 0.75rem; border-radius: 0.5rem; width: 100%; transition: transform 0.2s; }
                .btn-primary:hover { transform: scale(1.03); }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
            `}</style>
            <div className={`w-full max-w-xs p-6 bg-[var(--color-container)] rounded-2xl shadow-2xl backdrop-blur-sm border relative ${isShaking ? 'animate-shake' : ''}`} style={{borderColor: `${primaryColor}50`}}>
                <button onClick={onClose} className="absolute top-2 right-2 p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-container-light)] rounded-full">
                    <CloseIcon className="w-5 h-5" />
                </button>
                {renderContent()}
                {error && <p className="text-red-400 text-xs text-center mt-3">{error}</p>}
            </div>
        </div>
    );
};

export default DiaryPasswordGate;