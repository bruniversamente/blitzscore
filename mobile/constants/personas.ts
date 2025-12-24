import { PersonaOption } from './types';

// Mapeia as imagens para require estático (necessário no React Native)
export const personaImages: Record<string, any> = {
    mailman: require('../assets/personas/mailman.png'),
    florist: require('../assets/personas/florist.png'),
    farmer: require('../assets/personas/farmer.png'),
    lantern: require('../assets/personas/lantern.png'),
    sailor: require('../assets/personas/sailor.png'),
    lumberjack: require('../assets/personas/lumberjack.png'),
    apprentice: require('../assets/personas/apprentice.png'),
    shepherd: require('../assets/personas/shepherd.png'),
    messenger: require('../assets/personas/messenger.png'),
    market: require('../assets/personas/market.png'),
    seamstress: require('../assets/personas/seamstress.png'),
    shepherdess: require('../assets/personas/shepherdess.png'),
};

export const personaOptions: PersonaOption[] = [
    { id: "mailman", name: "Carteiro", color: "#c53030" },
    { id: "florist", name: "Florista", color: "#2f855a" },
    { id: "farmer", name: "Fazendeiro", color: "#ecc94b" },
    { id: "lantern", name: "Menina", color: "#805ad5" },
    { id: "sailor", name: "Marinheiro", color: "#2b6cb0" },
    { id: "lumberjack", name: "Lenhador", color: "#744210" },
    { id: "apprentice", name: "Aprendiz", color: "#4fd1c5" },
    { id: "shepherd", name: "Pastor", color: "#38a169" },
    { id: "messenger", name: "Mensageiro", color: "#d69e2e" },
    { id: "market", name: "Vendedora", color: "#f56565" },
    { id: "seamstress", name: "Costureira", color: "#48bb78" },
    { id: "shepherdess", name: "Pastora", color: "#4299e1" }
];
