import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

import fr from '../translations/fr.json';
import en from '../translations/en.json';

type Language = 'fr' | 'en';

const dictionaries: Record<Language, Record<string, string>> = { fr, en };

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('updock_language');
        return (saved as Language) || 'fr'; // Default to French
    });

    useEffect(() => {
        localStorage.setItem('updock_language', language);
    }, [language]);

    const t = (key: string): string => {
        return dictionaries[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
