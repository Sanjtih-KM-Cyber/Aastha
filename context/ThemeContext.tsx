import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { ThemeMode } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { extractColorsFromImage } from '../services/geminiService';
import { ACCENT_COLORS } from '../constants';

// Helper to convert hex to RGB
const hexToRgb = (hex: string): {r: number, g: number, b: number} | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};


// Helper to convert hex to RGB and lighten it
const lightenHexColor = (hex: string, percent: number): string => {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const getTextColorForBackground = (hex: string): string => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#111827' : '#F9FAFB'; // dark text on light bg, light text on dark bg
};

interface ThemeContextType {
    setThemeFromColor: (color: string) => void;
    setThemeFromImage: (base64Image: string, mimeType: string) => Promise<boolean>;
    clearDynamicTheme: () => void;
    toggleThemeMode: () => void;
    themeMode: ThemeMode;
    primaryColor: string;
    backgroundImage: string | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [primaryColor, setPrimaryColor] = useLocalStorage('primary-color', ACCENT_COLORS['Aastha']);
    // Replaced useLocalStorage with useState to prevent quota errors with large images.
    // The image will now only persist for the current session. The extracted theme color will persist.
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

    // One-time cleanup to remove potentially large image data from localStorage for existing users.
    useEffect(() => {
        if (window.localStorage.getItem('background-image')) {
            window.localStorage.removeItem('background-image');
        }
    }, []);

    const toggleThemeMode = useCallback(() => {
        setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    const themeStyles = useMemo(() => {
        const styles: { [key: string]: string } = {
            '--color-primary': primaryColor,
            '--color-primary-light': lightenHexColor(primaryColor, 80),
            '--color-primary-dark': primaryColor,
        };

        if (themeMode === 'dark') {
            styles['--color-bg'] = backgroundImage ? 'rgba(24, 24, 27, 0.85)' : '#18181b'; // Darker gray
            styles['--color-bg-secondary'] = '#27272a'; // Slightly lighter gray
            styles['--color-text-primary'] = '#E5E7EB';
            styles['--color-text-secondary'] = '#9CA3AF';
            styles['--color-container'] = '#27272a';
            styles['--color-container-light'] = '#3f3f46';
            styles['--color-border'] = '#3f3f46';
        } else {
            const lightBg = lightenHexColor(primaryColor, 96);
            const lightContainer = lightenHexColor(primaryColor, 98);
            
            if (backgroundImage) {
                 const rgb = hexToRgb(lightBg);
                 styles['--color-bg'] = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)` : 'rgba(250, 250, 250, 0.7)';
            } else {
                 styles['--color-bg'] = lightBg;
            }

            styles['--color-bg-secondary'] = lightenHexColor(primaryColor, 93);
            styles['--color-text-primary'] = '#1F2937'; // Keep dark text for readability
            styles['--color-text-secondary'] = '#4B5563';
            styles['--color-container'] = lightContainer; // Use tint instead of white
            styles['--color-container-light'] = lightenHexColor(primaryColor, 88);
            styles['--color-border'] = lightenHexColor(primaryColor, 85);
        }
        
        // Bubbles & Common Elements
        styles['--color-user-bubble-bg'] = primaryColor;
        styles['--color-user-bubble-text'] = getTextColorForBackground(primaryColor);
        styles['--color-model-bubble-bg'] = themeMode === 'dark' ? '#3f3f46' : 'var(--color-container)'; // Use container color
        styles['--color-model-bubble-text'] = styles['--color-text-primary'];

        return styles;
    }, [primaryColor, themeMode, backgroundImage]);

    useEffect(() => {
        const root = document.documentElement;
        Object.entries(themeStyles).forEach(([key, value]) => {
            root.style.setProperty(key, String(value));
        });
        document.body.className = themeMode;
    }, [themeStyles, themeMode]);
    
    const setThemeFromColor = useCallback((color: string) => {
        setPrimaryColor(color);
    }, [setPrimaryColor]);

    const setThemeFromImage = useCallback(async (base64Image: string, mimeType: string) => {
        const colors = await extractColorsFromImage(base64Image, mimeType);
        if (colors && colors.length > 0) {
            setPrimaryColor(colors[0]); // Use the vibrant primary color
            setBackgroundImage(`data:${mimeType};base64,${base64Image}`);
            return true;
        }
        return false;
    }, [setPrimaryColor, setBackgroundImage]);

    const clearDynamicTheme = useCallback(() => {
        setBackgroundImage(null);
        setPrimaryColor(ACCENT_COLORS['Aastha']); // Reset to default
    }, [setBackgroundImage, setPrimaryColor]);
    
    const value = { setThemeFromColor, themeMode, toggleThemeMode, primaryColor, backgroundImage, setThemeFromImage, clearDynamicTheme };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};