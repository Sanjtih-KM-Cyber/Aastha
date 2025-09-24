
import React, { useState } from 'react';
import { UserConfig } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface PasswordScreenProps {
    userConfig: UserConfig;
    onAuthenticated: () => void;
    onPasswordReset: (newPasswordHash: string) => void;
}

const PasswordScreen: React.FC<PasswordScreenProps> = ({ userConfig, onAuthenticated, onPasswordReset }) => {
    const { primaryColor } = useTheme();
    const [view, setView] = useState<'login' | 'recover'>('login');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [error, setError] = useState('');
    const [isShaking, setIsShaking] = useState(false);

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
        if (!securityAnswer.trim() || !newPassword.trim()) {
            setError('All fields are required.');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }
        if (btoa(securityAnswer.toLowerCase().trim()) === userConfig.securityAnswerHash) {
            onPasswordReset(btoa(newPassword));
        } else {
            setError('Incorrect answer to the security question.');
            setSecurityAnswer('');
            triggerShake();
        }
    };
    
    const renderLogin = () => (
        <>
            <h1 className="text-3xl font-bold text-center mb-2" style={{color: 'var(--color-text-primary)'}}>Welcome Back</h1>
            <p className="text-center text-[var(--color-text-secondary)] mb-8">Enter your password to unlock Aastha.</p>
            <form onSubmit={handleLogin}>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2"
                    style={{'--tw-ring-color': primaryColor} as React.CSSProperties}
                    placeholder="Password"
                    autoFocus
                />
                <button type="submit" className="w-full mt-4 text-white font-bold py-3 px-4 rounded-lg transition-transform duration-200 transform hover:scale-105" style={{backgroundColor: primaryColor}}>
                    Unlock
                </button>
            </form>
            <button onClick={() => { setView('recover'); setError(''); }} className="w-full text-center text-[var(--color-text-secondary)] mt-6 text-sm hover:underline" style={{color: primaryColor}}>
                Forgot Password?
            </button>
        </>
    );

    const renderRecover = () => (
        <>
            <div className="flex justify-end w-full mb-2">
                <button onClick={() => { setView('login'); setError('')}} className="text-2xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">&times;</button>
            </div>
            <h1 className="text-2xl font-bold text-center mb-2" style={{color: 'var(--color-text-primary)'}}>Password Recovery</h1>
            <p className="text-center text-[var(--color-text-secondary)] mb-6 text-sm">Answer your security question to reset your password.</p>
            <form onSubmit={handleRecover} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Your Question:</label>
                    <div className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)]">
                        {userConfig.securityQuestion}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Your Answer</label>
                    <input
                        type="text"
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2"
                        style={{'--tw-ring-color': primaryColor} as React.CSSProperties}
                        placeholder="Your secret answer"
                        autoFocus
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2"
                        style={{'--tw-ring-color': primaryColor} as React.CSSProperties}
                        placeholder="Enter a new password"
                    />
                </div>
                <button type="submit" className="w-full mt-4 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105" style={{backgroundColor: primaryColor}}>
                    Reset Password
                </button>
                 <button type="button" onClick={() => { setView('login'); setError('')}} className="w-full text-center text-sm mt-4 hover:underline" style={{color: primaryColor}}>
                    Back to Login
                </button>
            </form>
        </>
    );


    return (
        <div className="h-screen w-screen bg-[var(--color-bg)] text-white flex flex-col items-center justify-center p-4">
            <div className={`w-full max-w-sm p-8 bg-[var(--color-container)] rounded-2xl shadow-2xl border border-[var(--color-border)] ${isShaking ? 'animate-shake' : ''}`}>
                <style>{`
                    @keyframes shake {
                        10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); }
                    }
                    .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
                `}</style>
                {view === 'login' ? renderLogin() : renderRecover()}
                {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
            </div>
        </div>
    );
};

export default PasswordScreen;
