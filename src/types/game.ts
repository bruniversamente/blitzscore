export type Player = {
    id: string;
    name: string;
    color: string;
    personaId: string | null;
};

export type Round = {
    id: string;
    label: string;
    scores: Record<string, number | "">;
    blitzPlayerId?: string; // ID do jogador que fez blitz nesta rodada
};

export type MatchEntry = {
    id: string;
    dateISO: string;
    label: string;
    players: { id: string; name: string }[];
    totals: Record<string, number>;
    roundsCount: number;
    leaderIds: string[];
};

export type PersonaOption = {
    id: string;
    name: string;
    color: string;
    image: string;
};
