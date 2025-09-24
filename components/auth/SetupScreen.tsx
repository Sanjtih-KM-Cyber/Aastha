import React, { useState } from 'react';
import { SECURITY_QUESTIONS } from '../../constants';
import { UserConfig } from '../../types';

interface SetupScreenProps {
    onSetupComplete: (config: UserConfig) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete }) => {
    const [step, setStep] = useState(1);
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [error, setError] = useState('');

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (step === 2 && !userName.trim()) {
            setError('Please enter your name.');
            return;
        }
        if (step === 3) {
             if (password.length < 6) {
                setError('Password must be at least 6 characters long.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
        }
        setStep(prev => prev + 1);
    }
    
    const handleFinish = (e: React.FormEvent) => {
        e.preventDefault();
        if (!securityAnswer.trim()) {
            setError('Security answer cannot be empty.');
            return;
        }

        const config: UserConfig = {
            userName: userName.trim(),
            passwordHash: btoa(password),
            securityQuestion: securityQuestion,
            securityAnswerHash: btoa(securityAnswer.toLowerCase().trim()),
            onboardingComplete: true,
        };
        onSetupComplete(config);
    };

    const renderStep = () => {
        switch (step) {
            case 1: // Welcome
                return (
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4 text-violet-300 animate-fade-in-up">Welcome to Aastha</h1>
                        <p className="text-slate-400 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>Your personal AI companion for wellness.</p>
                        <button onClick={handleNextStep} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            Let's Get Started
                        </button>
                    </div>
                );
            case 2: // Name
                 return (
                    <form onSubmit={handleNextStep}>
                        <h1 className="text-3xl font-bold text-center mb-2 text-violet-300">What should I call you?</h1>
                        <p className="text-center text-slate-400 mb-8">This will help me personalize our conversations.</p>
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="Your name"
                            autoFocus
                        />
                        <button type="submit" className="w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105">
                            Next
                        </button>
                    </form>
                );
            case 3: // Password
                return (
                     <form onSubmit={handleNextStep}>
                        <h1 className="text-3xl font-bold text-center mb-2 text-violet-300">Secure Your Diary</h1>
                        <p className="text-center text-slate-400 mb-8">Create a password for your private space.</p>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full mb-4 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="Create a password"
                            autoFocus
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="Confirm your password"
                        />
                        <button type="submit" className="w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105">
                            Next
                        </button>
                    </form>
                );
            case 4: // Security Question
                 return (
                     <form onSubmit={handleFinish}>
                        <h1 className="text-2xl font-bold text-center mb-2 text-violet-300">Security Question</h1>
                        <p className="text-center text-slate-400 mb-8">This will be used for password recovery.</p>
                        <select
                            value={securityQuestion}
                            onChange={(e) => setSecurityQuestion(e.target.value)}
                            className="w-full mb-4 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                        </select>
                        <input
                            type="text"
                            value={securityAnswer}
                            onChange={(e) => setSecurityAnswer(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="Your answer"
                            autoFocus
                        />
                        <button type="submit" className="w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105">
                            Finish Setup
                        </button>
                    </form>
                );
            default: return null;
        }
    }

    return (
        <div className="h-screen w-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
             <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
            `}</style>
            <div className="w-full max-w-sm p-8 bg-slate-800/50 rounded-2xl shadow-2xl backdrop-blur-lg border border-slate-700">
                {renderStep()}
                {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
            </div>
             <div className="w-full max-w-sm mt-4 flex justify-center gap-2">
                {[1,2,3,4].map(i => (
                    <div key={i} className={`w-1/4 h-1.5 rounded-full transition-all duration-300 ${step >= i ? 'bg-violet-500' : 'bg-slate-700'}`}></div>
                ))}
             </div>
        </div>
    );
};

export default SetupScreen;
