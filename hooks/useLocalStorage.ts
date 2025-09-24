import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// Fix: Imported Dispatch and SetStateAction and updated the return type annotation.
function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue: Dispatch<SetStateAction<T>> = (value) => {
        try {
            // Use the functional update form of useState's setter to prevent race conditions
            // and ensure updates are always based on the latest state.
            setStoredValue(currentState => {
                const valueToStore = value instanceof Function ? value(currentState) : value;
                try {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                } catch (setItemError) {
                     console.error(`Failed to set item '${key}' in localStorage:`, setItemError);
                }
                return valueToStore;
            });
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key) {
                try {
                    setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
                } catch (error) {
                    console.error(error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, initialValue]);

    return [storedValue, setValue];
}

export default useLocalStorage;