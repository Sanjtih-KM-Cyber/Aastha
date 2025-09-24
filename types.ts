import React from 'react';

export enum Role {
    USER = 'user',
    MODEL = 'model',
    SYSTEM = 'system',
}

export interface Message {
    id: string;
    text: string | React.ReactNode;
    role: Role;
    timestamp: number;
    image?: string; // for image uploads
    recommendations?: Recommendation[];
    isTyping?: boolean;
}

export interface UserConfig {
    userName: string;
    passwordHash: string;
    securityQuestion: string;
    securityAnswerHash: string;
    onboardingComplete: boolean;
}

export interface Recommendation {
    name: string;
    url: string;
}

export type Mood = 'Happy' | 'Calm' | 'Sad' | 'Anxious' | 'Energetic' | 'Stressed' | 'Anger';

export interface MoodEntry {
    id: string;
    mood: Mood;
    note?: string;
    timestamp: number;
}

export interface DiaryEntry {
    id: string;
    content: string;
    timestamp: number;
    mood?: Mood;
}

export interface DiaryMoodAnalysis {
    date: string; // YYYY-MM-DD
    mood: Mood;
}

export type ThemeMode = 'light' | 'dark';

export type WellnessTool = 'diary' | 'mood-tracker' | 'mood-analytics' | 'settings';
export type Widget = 'pomodoro' | 'soundscape' | 'breathing' | 'jam-with-aastha';