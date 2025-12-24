"use client";

import React from "react";
import { Player, Round } from "@/types/game";

interface ScoreTableProps {
    players: Player[];
    rounds: Round[];
    updateScore: (roundId: string, playerId: string, value: string) => void;
    addRound: () => void;
}

export const ScoreTable: React.FC<ScoreTableProps> = ({
    players,
    rounds,
    updateScore,
    addRound,
}) => {
    return (
        <section className="board">
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                }}
            >
                <h2
                    style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "#cbd5e1",
                        margin: 0,
                    }}
                >
                    Placar
                </h2>
                <button className="btn alt" onClick={addRound}>
                    + rodada
                </button>
            </div>
            <div
                style={{
                    overflow: "auto",
                    border: "1px solid #334155",
                    borderRadius: 18,
                    background: "#020617",
                }}
            >
                <table>
                    <thead>
                        <tr>
                            <th>R</th>
                            {players.map((p) => (
                                <th key={p.id}>{p.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rounds.map((r) => (
                            <tr key={r.id}>
                                <td>{r.label}</td>
                                {players.map((p) => (
                                    <td key={p.id}>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                className="score"
                                                type="number"
                                                value={r.scores[p.id] ?? ""}
                                                onChange={(e) =>
                                                    updateScore(r.id, p.id, e.target.value)
                                                }
                                            />
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    right: 6,
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    fontSize: 10,
                                                    opacity: 0.6,
                                                }}
                                            >
                                                pts
                                            </span>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};
