"use client";

import React, { useState } from "react";
import { Player } from "@/types/game";

interface RoundScorerProps {
    player: Player;
    onConfirm: (total: number, isBlitz: boolean) => void;
    onCancel: () => void;
}

export const RoundScorer: React.FC<RoundScorerProps> = ({
    player,
    onConfirm,
    onCancel,
}) => {
    const [centerCards, setCenterCards] = useState<string>("");
    const [blitzCards, setBlitzCards] = useState<string>("");
    const [isBlitzPlayer, setIsBlitzPlayer] = useState(false);

    const handleConfirm = () => {
        const mesa = parseInt(centerCards || '0');
        const resto = isBlitzPlayer ? 0 : parseInt(blitzCards || '0');
        const total = mesa - (resto * 2);
        onConfirm(total, isBlitzPlayer);
    };

    return (
        <div className="persona-dialog" style={{ zIndex: 100 }}>
            <div className="persona-card" style={{ maxWidth: 420 }}>
                <h3 style={{ margin: "0 0 20px 0", fontSize: 20, color: "#fff" }}>
                    Pontuação {player.name}
                </h3>

                <div
                    onClick={() => setIsBlitzPlayer(!isBlitzPlayer)}
                    style={{
                        display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
                        backgroundColor: "rgba(255,255,255,0.05)", padding: "10px 20px", borderRadius: 50,
                        border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                        width: "fit-content", margin: "0 auto 20px auto"
                    }}
                >
                    <div style={{
                        width: 20, height: 20, borderRadius: 10, border: isBlitzPlayer ? "none" : "2px solid #666",
                        backgroundColor: isBlitzPlayer ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#000", fontWeight: "bold", fontSize: 12
                    }}>
                        {isBlitzPlayer && "✓"}
                    </div>
                    <span style={{ color: isBlitzPlayer ? "#22c55e" : "#666", fontWeight: 600 }}>Fez Blitz nesta rodada</span>
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: "block", color: "#666", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                            Mesa (+1)
                        </label>
                        <input
                            type="number"
                            value={centerCards}
                            onChange={(e) => setCenterCards(e.target.value)}
                            placeholder="0"
                            style={{
                                width: "100%", background: "rgba(255,255,255,0.05)", border: "none",
                                borderRadius: 12, padding: 16, color: "#fff", fontSize: 20, textAlign: "center", fontWeight: 700
                            }}
                        />
                    </div>
                    {!isBlitzPlayer && (
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", color: "#666", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                                Resto (-2)
                            </label>
                            <input
                                type="number"
                                value={blitzCards}
                                onChange={(e) => setBlitzCards(e.target.value)}
                                placeholder="0"
                                style={{
                                    width: "100%", background: "rgba(255,255,255,0.05)", border: "none",
                                    borderRadius: 12, padding: 16, color: "#fff", fontSize: 20, textAlign: "center", fontWeight: 700
                                }}
                            />
                        </div>
                    )}
                </div>

                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", padding: 20,
                    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, marginBottom: 20
                }}>
                    <span style={{ color: "#666", fontSize: 12, fontWeight: 700 }}>TOTAL</span>
                    <span style={{ color: "#22c55e", fontSize: 48, fontWeight: 900 }}>
                        {isBlitzPlayer
                            ? parseInt(centerCards || '0')
                            : parseInt(centerCards || '0') - parseInt(blitzCards || '0') * 2
                        }
                    </span>
                    <span style={{ color: "#666", fontSize: 12, marginTop: 8 }}>
                        {isBlitzPlayer
                            ? `${centerCards || 0} cartas = ${centerCards || 0} pts`
                            : `${centerCards || 0} - (${blitzCards || 0} × 2) = ${parseInt(centerCards || '0') - parseInt(blitzCards || '0') * 2} pts`
                        }
                    </span>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        className="btn alt"
                        style={{ flex: 1, justifyContent: "center" }}
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>
                    <button
                        className="btn"
                        style={{ flex: 1, justifyContent: "center", background: "#3b82f6", color: "#fff" }}
                        onClick={handleConfirm}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};
