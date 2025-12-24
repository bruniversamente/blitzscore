"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Player } from "@/types/game";
import { personaOptions } from "@/constants/personas";

interface PlayerSetupScreenProps {
    onComplete: (players: Player[]) => void;
}

export const PlayerSetupScreen: React.FC<PlayerSetupScreenProps> = ({ onComplete }) => {
    const [setupPlayers, setSetupPlayers] = useState<Partial<Player>[]>([
        { id: "p1", name: "", personaId: "mailman", color: "#c53030" },
        { id: "p2", name: "", personaId: "florist", color: "#2f855a" },
    ]);

    const addPlayer = () => {
        if (setupPlayers.length >= 4) return;
        const nextPersona = personaOptions[setupPlayers.length % personaOptions.length];
        setSetupPlayers([...setupPlayers, {
            id: `p_${Date.now()}`,
            name: "",
            personaId: nextPersona.id,
            color: nextPersona.color
        }]);
    };

    const removePlayer = (index: number) => {
        if (setupPlayers.length <= 2) return;
        setSetupPlayers(setupPlayers.filter((_, i) => i !== index));
    };

    const updatePlayer = (index: number, field: keyof Player, value: string) => {
        const updated = [...setupPlayers];
        updated[index] = { ...updated[index], [field]: value };
        // Se mudar persona, atualiza a cor automaticamente
        if (field === "personaId") {
            const persona = personaOptions.find(p => p.id === value);
            if (persona) updated[index].color = persona.color;
        }
        setSetupPlayers(updated);
    };

    const handleStart = () => {
        // Validação básica
        const validPlayers = setupPlayers.map((p, i) => ({
            ...p,
            name: p.name?.trim() || `Jogador ${i + 1}`,
            // Garante que id, personaId e color existam (mecanismo de fallback)
            id: p.id || `p_${Date.now()}_${i}`,
            personaId: p.personaId || personaOptions[0].id,
            color: p.color || personaOptions[0].color
        })) as Player[];

        onComplete(validPlayers);
    };

    // Estado para modal de seleção de persona
    const [selectingPersonaIndex, setSelectingPersonaIndex] = useState<number | null>(null);

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 20
        }}>
            <div className="glass-panel" style={{ width: "100%", maxWidth: 500, padding: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>Quem vai jogar?</h1>
                <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 32, fontSize: 14 }}>
                    Configure os jogadores para iniciar a partida.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {setupPlayers.map((p, index) => {
                        const currentPersona = personaOptions.find(opt => opt.id === p.personaId) || personaOptions[0];
                        return (
                            <div key={index} style={{
                                display: "flex", alignItems: "center", gap: 12,
                                background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 16,
                                border: "1px solid var(--glass-border)"
                            }}>
                                <div
                                    onClick={() => setSelectingPersonaIndex(index)}
                                    style={{
                                        width: 56, height: 56, position: "relative", borderRadius: 14, overflow: "hidden",
                                        cursor: "pointer", border: `2px solid ${p.color}`, background: "#000"
                                    }}
                                >
                                    <Image src={currentPersona.image} alt={currentPersona.name} fill style={{ objectFit: "contain" }} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: 4 }}>
                                        NOME DO JOGADOR {index + 1}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={`Ex: Jogador ${index + 1}`}
                                        value={p.name}
                                        onChange={(e) => updatePlayer(index, "name", e.target.value)}
                                        style={{ width: "100%", padding: "8px 12px", fontSize: 14 }}
                                    />
                                </div>

                                {setupPlayers.length > 2 && (
                                    <button
                                        onClick={() => removePlayer(index)}
                                        style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20 }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {setupPlayers.length < 4 && (
                    <button
                        onClick={addPlayer}
                        style={{
                            width: "100%", marginTop: 16, padding: 12, borderRadius: 12, border: "1px dashed var(--glass-border)",
                            background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 13
                        }}
                    >
                        + Adicionar Jogador
                    </button>
                )}

                <button
                    className="btn"
                    onClick={handleStart}
                    style={{ width: "100%", marginTop: 32, background: "var(--blitz-green)", color: "#000", justifyContent: "center" }}
                >
                    Iniciar Partida
                </button>
            </div>

            {selectingPersonaIndex !== null && (
                <div className="persona-dialog" onClick={() => setSelectingPersonaIndex(null)}>
                    <div className="persona-card" onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 20 }}>Escolher Persona</h3>
                        <div className="persona-grid">
                            {personaOptions.map(opt => (
                                <div key={opt.id} className="persona-item" onClick={() => {
                                    updatePlayer(selectingPersonaIndex, "personaId", opt.id);
                                    setSelectingPersonaIndex(null);
                                }}>
                                    <div style={{ position: "relative", width: 50, height: 50 }}>
                                        <Image src={opt.image} alt={opt.name} fill style={{ objectFit: "contain" }} />
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700 }}>{opt.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
