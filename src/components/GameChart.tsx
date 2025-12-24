"use client";

import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { Player, Round } from "@/types/game";

interface GameChartProps {
    players: Player[];
    rounds: Round[];
}

export const GameChart: React.FC<GameChartProps> = ({ players, rounds }) => {
    // Transformar dados para o Recharts
    // Cada ponto no gráfico é o acumulado até aquela rodada
    const data = rounds.map((r, idx) => {
        const point: any = { name: `R${idx + 1}` };
        players.forEach((p) => {
            let accumulated = 0;
            for (let i = 0; i <= idx; i++) {
                const score = rounds[i].scores[p.id];
                if (typeof score === "number") accumulated += score;
            }
            point[p.name] = accumulated;
        });
        return point;
    });

    if (rounds.length === 0 || players.length === 0) return null;

    return (
        <div style={{ width: "100%", height: 300, marginTop: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#111",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            color: "#fff"
                        }}
                        itemStyle={{ fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                    {players.map((p) => (
                        <Line
                            key={p.id}
                            type="monotone"
                            dataKey={p.name}
                            stroke={p.color}
                            strokeWidth={3}
                            dot={{ r: 4, fill: p.color }}
                            activeDot={{ r: 6 }}
                            animationDuration={800}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
