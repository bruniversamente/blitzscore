"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Player, Round, MatchEntry } from "@/types/game";
import { personaOptions } from "@/constants/personas";
import { RoundScorer } from "@/components/RoundScorer";
import { GameChart } from "@/components/GameChart";
import { AuthScreen } from "@/components/AuthScreen";
import { PlayerSetupScreen } from "@/components/PlayerSetupScreen";

const STORAGE_KEY = "blitzScoreState_v2";
const HISTORY_KEY = "blitzScoreHistory_v1";
const AUTH_KEY = "blitzScoreAuth_v1";
const SETUP_KEY = "blitzScoreSetup_v1";
const TARGET_OPTIONS = [75, 100, 125, 150, 175, 200];

function computeTotals(players: Player[], rounds: Round[]) {
  const totals: Record<string, number> = {};
  players.forEach((p) => {
    let sum = 0;
    rounds.forEach((r) => {
      const v = r.scores[p.id];
      if (typeof v === "number" && !Number.isNaN(v)) sum += v;
    });
    totals[p.id] = sum;
  });
  const max = players.length
    ? Math.max(...players.map((p) => totals[p.id] ?? 0))
    : 0;
  return { totals, max };
}

export default function BlitzScoreApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [history, setHistory] = useState<MatchEntry[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPersonaId, setNewPlayerPersonaId] = useState<string | null>(null);
  const [personaModalFor, setPersonaModalFor] = useState<string | null>(null);
  const [scoringFor, setScoringFor] = useState<{ roundId: string, playerId: string } | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [targetScore, setTargetScore] = useState(75);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const auth = window.localStorage.getItem(AUTH_KEY);
      if (auth === "true") setIsAuthenticated(true);

      const setup = window.localStorage.getItem(SETUP_KEY);
      if (setup === "true") setIsSetupComplete(true);

      const raw = window.localStorage.getItem(STORAGE_KEY);
      const rawHist = window.localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.players) && Array.isArray(parsed.rounds)) {
          setPlayers(parsed.players);
          setRounds(parsed.rounds);
        }
      }

      if (rawHist) setHistory(JSON.parse(rawHist));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Só salva se tiver jogadores (evita salvar estado vazio inicial por cima de dados bons)
    if (players.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, rounds }));
    }
  }, [players, rounds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  function handleLogin() {
    setIsAuthenticated(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTH_KEY, "true");
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_KEY);
    }
  }

  function handleSetupComplete(initialPlayers: Player[]) {
    setPlayers(initialPlayers);
    setRounds([{ id: "r1", label: "1", scores: Object.fromEntries(initialPlayers.map(p => [p.id, ""])) }]);
    setIsSetupComplete(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SETUP_KEY, "true");
    }
  }

  function addPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;

    // Se selecionou persona manualmente usa ela, se não usa a próxima da fila
    const assignedPersonaId = newPlayerPersonaId || personaOptions[players.length % personaOptions.length].id;
    const persona = personaOptions.find(p => p.id === assignedPersonaId) || personaOptions[0];

    const id = `p_${Date.now()}`;
    setPlayers((prev) => [...prev, { id, name, color: persona.color, personaId: persona.id }]);
    setRounds((prev) => prev.map((r) => ({ ...r, scores: { ...r.scores, [id]: "" } })));
    setNewPlayerName("");
    setNewPlayerPersonaId(null);
  }

  function removePlayer(id: string) {
    if (!confirm("Remover este jogador?")) return;
    setPlayers((prev) => prev.filter(p => p.id !== id));
    setRounds((prev) => prev.map(r => {
      const s = { ...r.scores };
      delete s[id];
      return { ...r, scores: s };
    }));
  }

  function addRound() {
    setRounds((p) => [...p, { id: `r_${Date.now()}`, label: String(p.length + 1), scores: Object.fromEntries(players.map(pl => [pl.id, ""])) }]);
  }

  const { totals, max } = computeTotals(players, rounds);

  function resetMatch() {
    if (!confirm("Tem certeza que deseja ZERAR a partida atual? Todos os pontos serão perdidos.")) return;
    setRounds([{ id: "r1", label: "1", scores: Object.fromEntries(players.map(p => [p.id, ""])) }]);
    setScoringFor(null);
  }

  function saveMatch() {
    if (!confirm("Deseja salvar esta partida no Histórico e iniciar uma nova?")) return;

    // Calcular totais finais
    const { totals, max } = computeTotals(players, rounds);

    const entry: MatchEntry = {
      id: `m_${Date.now()}`,
      dateISO: new Date().toISOString(),
      label: new Date().toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      players: players.map(p => ({ id: p.id, name: p.name })),
      totals,
      roundsCount: rounds.length,
      leaderIds: players.filter(p => totals[p.id] === max).map(p => p.id)
    };

    setHistory(prev => [entry, ...prev]);

    // Resetar para nova partida
    setRounds([{ id: "r1", label: "1", scores: Object.fromEntries(players.map(p => [p.id, ""])) }]);
    setScoringFor(null);
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // Se não completou o setup OU não tem jogadores (caso tenha dado erro no cache), mostra setup
  if (!isSetupComplete || players.length === 0) {
    return <PlayerSetupScreen onComplete={handleSetupComplete} />;
  }

  return (
    <div className="app" suppressHydrationWarning>
      <header className="header" style={{ flexDirection: "column", gap: 20, padding: "24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 30, overflow: "hidden", position: "relative",
            filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))"
          }}>
            <Image src="/logo.jpg" alt="Logo" fill style={{ objectFit: "cover" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 42, fontWeight: 400, letterSpacing: "0.02em", fontFamily: "var(--font-gothic)", lineHeight: 1 }}>Dutch Blitz Score</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>DUTCH BLITZ OFFICIAL COUNTER</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
          <button className="btn alt" style={{ flex: 1, justifyContent: "center", minWidth: 100 }} onClick={() => setShowChart(!showChart)}>
            {showChart ? "Ver Tabela" : "Ver Gráfico"}
          </button>
          <button className="btn alt" style={{ flex: 1, justifyContent: "center", minWidth: 80 }} onClick={resetMatch}>Resetar</button>
          <button className="btn" style={{ flex: 1, justifyContent: "center", minWidth: 80, background: "var(--blitz-blue)", color: "#fff" }} onClick={saveMatch}>Salvar</button>
          <button className="btn alt" style={{ flex: 1, justifyContent: "center", minWidth: 60, color: "var(--blitz-red)", borderColor: "rgba(239,68,68,0.3)" }} onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <main className="layout">
        <section className="board">
          <div className="glass-panel" style={{ padding: "24px", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                {showChart ? "Estatísticas de Evolução" : "Partida Atual"}
              </h2>
              {!showChart && (
                <button className="btn alt" style={{ padding: "8px 16px", fontSize: 12 }} onClick={addRound}>+ Rodada</button>
              )}
            </div>

            {showChart ? (
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 20, padding: 20 }}>
                <GameChart players={players} rounds={rounds.filter(r => Object.values(r.scores).some(v => v !== ""))} />
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>RD</th>
                      {[...players].sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0)).map(p => (
                        <th key={p.id}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
                            <span style={{ color: p.color, fontSize: 14 }}>{p.name}</span>
                            <div style={{ width: 40, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                              <div style={{ width: `${Math.min((totals[p.id] || 0) / targetScore * 100, 100)}%`, height: "100%", background: p.color }} />
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rounds.map(r => (
                      <tr key={r.id}>
                        <td style={{ textAlign: "center", color: "var(--text-muted)", fontWeight: 700 }}>{r.label}</td>
                        {[...players].sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0)).map(p => (
                          <td key={p.id}>
                            <div className="score-cell" onClick={() => setScoringFor({ roundId: r.id, playerId: p.id })}>
                              <div style={{ padding: "12px", textAlign: "center", fontSize: 16, fontWeight: 700, minHeight: 44 }}>
                                {r.scores[p.id] === "" ? "-" : r.scores[p.id]}
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="side">
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Liderança</h3>
              <button
                onClick={() => {
                  const idx = TARGET_OPTIONS.indexOf(targetScore);
                  setTargetScore(TARGET_OPTIONS[(idx + 1) % TARGET_OPTIONS.length]);
                }}
                style={{ background: "none", border: "none", fontSize: 11, fontWeight: 700, color: "var(--blitz-green)", cursor: "pointer" }}
              >
                META {targetScore} ▼
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {players.map(p => {
                const total = totals[p.id] || 0;
                const isLeader = total === max && max !== 0;
                return (
                  <div key={p.id} className={`total-row ${isLeader ? 'leader' : ''}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{p.name[0]}</div>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22, fontWeight: 900 }}>{total}</span>
                        {total >= targetScore && <span className="blitz-badge">BLITZ!</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 16 }}>Deck & Personas</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {players.map(p => {
                const persona = personaOptions.find(o => o.id === p.personaId);
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid var(--glass-border)" }}>
                    <div onClick={() => setPersonaModalFor(p.id)} style={{ position: "relative", width: 44, height: 44, borderRadius: 12, overflow: "hidden", cursor: "pointer", background: "#000" }}>
                      {persona && <Image src={persona.image} alt="" fill style={{ objectFit: "contain" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: p.color, fontWeight: 700 }}>{persona?.name}</div>
                    </div>
                    <button onClick={() => removePlayer(p.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>×</button>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPersonaModalFor("NEW_PLAYER")}
                style={{
                  width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer",
                  position: "relative", overflow: "hidden", background: "#000", flexShrink: 0
                }}
              >
                {newPlayerPersonaId ? (
                  <Image src={personaOptions.find(p => p.id === newPlayerPersonaId)?.image || ""} alt="" fill style={{ objectFit: "contain" }} />
                ) : (
                  <span style={{ color: "#fff", fontSize: 20 }}>?</span>
                )}
              </button>
              <input type="text" placeholder="Nome do jogador" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} style={{ flex: 1 }} />
              <button className="btn" style={{ padding: "0 20px" }} onClick={addPlayer}>+</button>
            </div>
          </div>
        </section>
      </main>

      {scoringFor && (
        <RoundScorer
          player={players.find(p => p.id === scoringFor.playerId)!}
          onConfirm={(score, isBlitz) => {
            setRounds(prev => prev.map(r =>
              r.id === scoringFor.roundId
                ? {
                  ...r,
                  scores: { ...r.scores, [scoringFor.playerId]: score },
                  blitzPlayerId: isBlitz ? scoringFor.playerId : (r.blitzPlayerId === scoringFor.playerId ? undefined : r.blitzPlayerId)
                }
                : r
            ));
            setScoringFor(null);
          }}
          onCancel={() => setScoringFor(null)}
        />
      )}

      {personaModalFor && (
        <div className="persona-dialog" onClick={() => setPersonaModalFor(null)}>
          <div className="persona-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 24px" }}>Selecionar Deck</h2>
            <div className="persona-grid">
              {personaOptions.map(opt => (
                <div key={opt.id} className="persona-item" onClick={() => {
                  if (personaModalFor === "NEW_PLAYER") {
                    setNewPlayerPersonaId(opt.id);
                  } else {
                    setPlayers(prev => prev.map(p => p.id === personaModalFor ? { ...p, personaId: opt.id, color: opt.color } : p));
                  }
                  setPersonaModalFor(null);
                }}>
                  <div style={{ position: "relative", width: 60, height: 60 }}>
                    <Image src={opt.image} alt="" fill style={{ objectFit: "contain" }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{opt.name}</div>
                  <div style={{ width: 12, height: 12, borderRadius: 4, background: opt.color }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
