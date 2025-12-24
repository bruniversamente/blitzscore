export interface Player {
    id: string;
    name: string;
    color: string;
    personaId: string;
}

export interface Round {
    id: string;
    label: string;
    scores: Record<string, number | "">;
    blitzPlayerId?: string; // ID do jogador que fez blitz nesta rodada
}

export interface MatchEntry {
    id: string;
    dateISO: string;
    label: string;
    players: { id: string; name: string }[];
    totals: Record<string, number>;
    roundsCount: number;
    leaderIds: string[];
}

export interface PersonaOption {
    id: string;
    name: string;
    color: string;
}
