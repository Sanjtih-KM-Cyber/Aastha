import { Mood } from "./types";

export const SECURITY_QUESTIONS = [
    "What was the name of your first pet?",
    "What is your mother's maiden name?",
    "What was the name of your elementary school?",
    "In what city were you born?",
    "What is your favorite book?",
    "What was the model of your first car?",
    "What is the name of your favorite childhood friend?",
    "In what city did your parents meet?",
];

export const MOOD_DATA: Record<Mood, { emoji: string; color: string; label: Mood }> = {
    Happy: { emoji: '😄', color: '#34D399', label: 'Happy' },
    Calm: { emoji: '😌', color: '#60A5FA', label: 'Calm' },
    Energetic: { emoji: '⚡️', color: '#FBBF24', label: 'Energetic' },
    Sad: { emoji: '😢', color: '#818CF8', label: 'Sad' },
    Anxious: { emoji: '😟', color: '#F87171', label: 'Anxious' },
    Stressed: { emoji: '😫', color: '#F97316', label: 'Stressed' },
    Anger: { emoji: '😠', color: '#EF4444', label: 'Anger' },
};

export const ACCENT_COLORS: Record<string, string> = {
    'Aastha': '#7C3AED',
    'Sky Blue': '#38BDF8',
    'Mint Green': '#34D399',
    'Sunset Orange': '#FB923C',
    'Rose Pink': '#F472B6',
    'Sunny Yellow': '#FBBF24',
};

export const POSITIVE_EMOJIS = ['😊', '✨', '💖', '🌟', '🌸', '🌈', '☀️', '❤️'];

export const LANGUAGES = [
    "Any", "English", "Bengali", "Bhojpuri", "Gujarati", "Hindi", 
    "Kannada", "Malayalam", "Marathi", "Punjabi", "Tamil", "Telugu"
];