import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple dictionary for UI translations
const translations: Record<string, Record<Language, string>> = {
    'profile.title': { en: 'Profile', fr: 'Profil' },
    'profile.settings': { en: 'Settings', fr: 'Réglages' },
    'profile.language': { en: 'Language', fr: 'Langue' },
    'profile.notifications': { en: 'Notifications', fr: 'Notifications' },
    'profile.go_premium': { en: 'Go Premium', fr: 'Devenir Premium' },
    'profile.admin_dashboard': { en: 'Admin Dashboard', fr: 'Tableau de Bord Admin' },

    'map.filter': { en: 'Filters', fr: 'Filtres' },
    'map.add': { en: 'Add Spot', fr: 'Ajouter' },

    'spot.type': { en: 'Type', fr: 'Type' },
    'spot.difficulty': { en: 'Difficulty', fr: 'Difficulté' },
    'spot.desc': { en: 'Description', fr: 'Description' },
    'spot.navigate': { en: 'Start Navigation', fr: 'Y Aller' },

    'add.title': { en: 'Add a Spot', fr: 'Ajouter un Spot' },
    'add.name': { en: 'Spot Name', fr: 'Nom du Spot' },
    'add.type': { en: 'Sport Type', fr: 'Type de Sport' },
    'add.desc': { en: 'Description', fr: 'Description' },
    'add.location': { en: 'Location', fr: 'Position' },
    'add.select_map': { en: 'Select on map', fr: 'Sélectionnez sur la carte' },
    'add.placeholder_name': { en: 'e.g. Le Ponton du Lac', fr: 'ex: Le Ponton du Lac' },
    'add.placeholder_desc': { en: 'Access details, hazards...', fr: 'Accès, dangers, conditions...' },
    'add.btn_photos': { en: 'Add Photos (Attach in Email)', fr: 'Ajouter des Photos (via Email)' },
    'add.submit': { en: 'Submit Spot', fr: 'Proposer le Spot' },
    'add.sending': { en: 'Sending...', fr: 'Envoi...' },

    'nav.map': { en: 'Map', fr: 'Carte' },
    'nav.favorites': { en: 'Favorites', fr: 'Favoris' },
    'nav.list': { en: 'List', fr: 'Liste' },
    'nav.profile': { en: 'Profile', fr: 'Profil' },

    'nearby.title': { en: 'Nearest Spots', fr: 'Spots Proches' },

    'filters.title': { en: 'Filters', fr: 'Filtres' },
    'filters.start_type': { en: 'Start Type', fr: 'Type de Départ' },
    'filters.difficulty': { en: 'Difficulty', fr: 'Difficulté' },
    'filters.all': { en: 'All Starts', fr: 'Tous les Départs' },
    'filters.show_results': { en: 'Show Results', fr: 'Voir les Résultats' },

    'fav.title': { en: 'Favorites', fr: 'Favoris' },
    'fav.empty': { en: 'No favorite spots yet.', fr: 'Aucun favori pour le moment.' },
    'fav.explore': { en: 'Explore Map', fr: 'Explorer la Carte' },
    'fav.view': { en: 'View', fr: 'Voir' },

    'premium.title': { en: 'Coming Soon', fr: 'Bientôt Disponible' },
    'premium.desc': { en: 'We are working hard to bring you exclusive features like offline maps and spot videos. Stay tuned!', fr: 'Nous travaillons dur pour vous apporter des fonctionnalités exclusives comme les cartes hors-ligne et les vidéos de spots. Restez connectés !' },
    'premium.btn': { en: 'Notify Me', fr: 'Me prévenir' },

    'landing.title': { en: 'Updock', fr: 'Updock' },
    'landing.subtitle': { en: 'Discover the best dockstart spots around the world. Join the community.', fr: 'Découvrez les meilleurs spots de dockstart dans le monde. Rejoignez la communauté.' },
    'landing.get_started': { en: 'Get Started', fr: 'C\'est parti' },
    'landing.riders_only': { en: 'Strictly for Riders', fr: 'Réservé aux Riders' },

    'auth.title_login': { en: 'Welcome Back', fr: 'Bon retour' },
    'auth.title_signup': { en: 'Join Updock', fr: 'Rejoindre Updock' },
    'auth.email': { en: 'Email address', fr: 'Adresse Email' },
    'auth.password': { en: 'Password', fr: 'Mot de passe' },
    'auth.first_name': { en: 'First Name', fr: 'Prénom' },
    'auth.last_name': { en: 'Last Name', fr: 'Nom' },
    'auth.username': { en: 'Username (Pseudo)', fr: 'Pseudo' },
    'auth.btn_login': { en: 'Sign In', fr: 'Se Connecter' },
    'auth.btn_signup': { en: 'Create Account', fr: 'Créer un compte' },
    'auth.have_account': { en: 'Already have an account?', fr: 'Déjà un compte ?' },
    'auth.no_account': { en: "Don't have an account?", fr: 'Pas de compte ?' },
    'auth.link_login': { en: 'Sign In', fr: 'Connexion' },
    'auth.link_signup': { en: 'Sign Up', fr: 'Inscription' },

    'admin.title': { en: 'Admin Dashboard', fr: 'Tableau de Bord Admin' },
    'admin.subtitle': { en: 'Review pending spots', fr: 'Validation des spots' },
    'admin.empty_title': { en: 'All caught up!', fr: 'Tout est à jour !' },
    'admin.empty_desc': { en: 'No pending spots to review.', fr: 'Aucun spot en attente.' },
    'admin.approve': { en: 'Approve', fr: 'Valider' },
    'admin.delete': { en: 'Delete', fr: 'Supprimer' },

    'limit.spots': { en: 'Free Limit Reached (3 Spots)', fr: 'Limite Gratuite Atteinte (3 Spots)' },
    'limit.favs': { en: 'Favorites are Locked', fr: 'Favoris Verrouillés' },

    'add.instruction.title': { en: 'Tap on the map', fr: 'Touchez la carte' },
    'add.instruction.desc': { en: 'Place the marker at the exact spot location', fr: 'Placez le marqueur à l\'endroit exact du spot' },
    'spot.height': { en: 'Height (m)', fr: 'Hauteur (m)' },
    'add.photo_change': { en: 'Change Photo', fr: 'Changer la photo' },
    'modal.close': { en: 'Close', fr: 'Fermer' }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('updock_language');
        return (saved as Language) || 'fr'; // Default to French
    });

    useEffect(() => {
        localStorage.setItem('updock_language', language);
    }, [language]);

    const t = (key: string): string => {
        return translations[key]?.[language] || key;
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
