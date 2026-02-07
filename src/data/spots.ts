export type StartType = 'Dockstart' | 'Rockstart' | 'Dropstart' | 'Deadstart' | 'Rampstart';

export interface Spot {
    id: string;
    name: string;
    type: StartType[];
    position: [number, number];
    description: string;
    description_fr?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
    height?: number; // For Dropstart
    image_urls?: string[];
    is_approved?: boolean;
    distance?: number; // Distance in km from user
}

export const spots: Spot[] = [
    // --- FRANCE ---
    {
        id: 'fr-moisson',
        name: 'Moisson Lavacourt',
        type: ['Dockstart'],
        position: [49.0729, 1.6692],
        description: 'Popular spot in Ile-de-France. Large lake with good conditions for pumping. Often busy on weekends.',
        description_fr: 'Spot populaire en Ile-de-France. Grand lac avec de bonnes conditions pour le pumping. Souvent fréquenté le week-end.',
        difficulty: 'Medium'
    },
    {
        id: 'fr-jablines',
        name: 'Jablines-Annet',
        type: ['Dockstart'],
        position: [48.9108, 2.7306],
        description: 'Base de Loisirs near Paris. Clean water and nice pontoons. Check opening hours and entry fees.',
        difficulty: 'Easy'
    },
    {
        id: 'fr-talloires',
        name: 'Talloires - Petit Port',
        type: ['Dockstart'],
        position: [45.84, 6.21],
        description: 'Stunning spot on Lake Annecy. Crystal clear water. Launch from the small wooden dock near the harbor.',
        difficulty: 'Medium'
    },
    {
        id: 'fr-crau',
        name: 'Aqueduc St Martin',
        type: ['Dropstart'],
        position: [43.6333, 4.8167],
        description: 'Famous dropstart spot in Provence using the canal infrastructure. Requires good technique. High speed entry!',
        difficulty: 'Extreme',
        height: 1.5
    },

    // --- SWITZERLAND ---
    {
        id: 'ch-nidau',
        name: 'Plage de Nidau',
        type: ['Dockstart'],
        position: [47.128, 7.24],
        description: 'Located on Lake Bienne. Very popular community spot. Low docks ideal for learning.',
        difficulty: 'Easy'
    },
    {
        id: 'ch-coppet',
        name: 'Plage de Coppet',
        type: ['Dockstart'],
        position: [46.3172, 6.1939],
        description: 'Classic Lake Geneva spot. Nice grassy area to rigorous and a concrete dock. Good depth immediately.',
        difficulty: 'Medium'
    },
    {
        id: 'ch-laax',
        name: 'Laaxer See (Lag Grond)',
        type: ['Dockstart'],
        position: [46.8059, 9.2582],
        description: 'High altitude alpine lake (1000m+). Cold water but flat and scenic. Check local regulations.',
        difficulty: 'Hard'
    },

    // --- SPAIN ---
    {
        id: 'es-tarifa',
        name: 'Tarifa - Balneario',
        type: ['Dockstart', 'Rockstart'],
        position: [36.0139, -5.6070],
        description: 'The Mecca of wind. Can be used for dockstart on calm days or "Rockstart" from the causeway stones.',
        difficulty: 'Hard'
    },
    {
        id: 'es-barcelona',
        name: 'Forum Barcelona',
        type: ['Dockstart'],
        position: [41.4099, 2.2271],
        description: 'Artificial bathing area in the city. Protected water, very flat. Great for training sequences.',
        difficulty: 'Easy'
    },
    {
        id: 'es-estartit',
        name: 'L\'Estartit',
        type: ['Dockstart', 'Rockstart'],
        position: [42.05, 3.20],
        description: 'Costa Brava vibe. Launch from the harbor walls or nearby rocky outcrops. Watch out for boats.',
        difficulty: 'Medium'
    }
];
