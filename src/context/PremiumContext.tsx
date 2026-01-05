import { createContext, useContext, useState, type ReactNode } from 'react';
import PremiumModal from '../components/PremiumModal';

interface PremiumContextType {
    openPremiumModal: () => void;
    isPremium: boolean; // For future use (currently always false)
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    // Hardcoded for now. In a real app, this would come from User/Auth
    const isPremium = false;

    const openPremiumModal = () => setIsOpen(true);

    return (
        <PremiumContext.Provider value={{ openPremiumModal, isPremium }}>
            {children}
            <PremiumModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </PremiumContext.Provider>
    );
}

export function usePremium() {
    const context = useContext(PremiumContext);
    if (!context) {
        throw new Error('usePremium must be used within a PremiumProvider');
    }
    return context;
}
