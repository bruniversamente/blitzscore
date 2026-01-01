import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    Alert,
    Modal,
    Dimensions,
    StatusBar,
    SafeAreaView,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player, Round, MatchEntry } from './constants/types';
import { personaOptions, personaImages } from './constants/personas';

const STORAGE_KEY = 'blitzScoreState_v2';
const HISTORY_KEY = 'blitzScoreHistory_v1';
const AUTH_KEY = 'blitzScoreAuth_v1';
const SETUP_KEY = 'blitzScoreSetup_v1';
const TARGET_OPTIONS = [75, 100, 125, 150, 175, 200];
const ROUND_OPTIONS = [5, 10, 15, 20, 25, 30];

const logo = require('./assets/logo.jpg');

function computeTotals(players: Player[], rounds: Round[]) {
    const totals: Record<string, number> = {};
    players.forEach((p) => {
        let sum = 0;
        rounds.forEach((r) => {
            const v = r.scores[p.id];
            if (typeof v === 'number' && !Number.isNaN(v)) sum += v;
        });
        totals[p.id] = sum;
    });
    const max = players.length ? Math.max(...players.map((p) => totals[p.id] ?? 0)) : 0;
    return { totals, max };
}

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);
    const [rounds, setRounds] = useState<Round[]>([]);
    const [history, setHistory] = useState<MatchEntry[]>([]);
    const [targetScore, setTargetScore] = useState(75);
    const [gameMode, setGameMode] = useState<'score' | 'rounds'>('score');
    const [targetRounds, setTargetRounds] = useState(10);
    const [showChart, setShowChart] = useState(false);
    const [scoringModal, setScoringModal] = useState<{ roundId: string; playerId: string } | null>(null);
    const [personaModalFor, setPersonaModalFor] = useState<string | null>(null);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerPersonaId, setNewPlayerPersonaId] = useState<string | null>(null);

    // Setup screen states
    const [setupPlayers, setSetupPlayers] = useState<Partial<Player>[]>([
        { id: 'p1', name: '', personaId: 'mailman', color: '#c53030' },
        { id: 'p2', name: '', personaId: 'florist', color: '#2f855a' },
    ]);

    // Scoring states
    const [centerCards, setCenterCards] = useState('');
    const [blitzCards, setBlitzCards] = useState('');
    const [isBlitzPlayer, setIsBlitzPlayer] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (players.length > 0) {
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ players, rounds, gameMode, targetScore, targetRounds }));
        }
    }, [players, rounds, gameMode, targetScore, targetRounds]);

    useEffect(() => {
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }, [history]);

    const loadData = async () => {
        try {
            const auth = await AsyncStorage.getItem(AUTH_KEY);
            if (auth === 'true') setIsAuthenticated(true);

            const setup = await AsyncStorage.getItem(SETUP_KEY);
            if (setup === 'true') setIsSetupComplete(true);

            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            const rawHist = await AsyncStorage.getItem(HISTORY_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed.players) && Array.isArray(parsed.rounds)) {
                    setPlayers(parsed.players);
                    setRounds(parsed.rounds);
                    if (parsed.gameMode) setGameMode(parsed.gameMode);
                    if (parsed.targetScore) setTargetScore(parsed.targetScore);
                    if (parsed.targetRounds) setTargetRounds(parsed.targetRounds);
                }
            }
            if (rawHist) setHistory(JSON.parse(rawHist));
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogin = async () => {
        setIsAuthenticated(true);
        await AsyncStorage.setItem(AUTH_KEY, 'true');
    };

    const handleLogout = async () => {
        setIsAuthenticated(false);
        setIsSetupComplete(false);
        setPlayers([]);
        setRounds([]);
        await AsyncStorage.removeItem(AUTH_KEY);
        await AsyncStorage.removeItem(SETUP_KEY);
        await AsyncStorage.removeItem(STORAGE_KEY);
    };

    const handleSetupComplete = async () => {
        const validPlayers = setupPlayers.map((p, i) => ({
            ...p,
            name: p.name?.trim() || `Jogador ${i + 1}`,
            id: p.id || `p_${Date.now()}_${i}`,
            personaId: p.personaId || personaOptions[0].id,
            color: p.color || personaOptions[0].color,
        })) as Player[];

        let initialRounds: Round[] = [];
        if (gameMode === 'score') {
            initialRounds = [{ id: 'r1', label: '1', scores: Object.fromEntries(validPlayers.map((p) => [p.id, ''])) }];
        } else {
            initialRounds = Array.from({ length: targetRounds }, (_, i) => ({
                id: `r${i + 1}`,
                label: String(i + 1),
                scores: Object.fromEntries(validPlayers.map((p) => [p.id, '']))
            }));
        }

        setPlayers(validPlayers);
        setRounds(initialRounds);
        setIsSetupComplete(true);
        await AsyncStorage.setItem(SETUP_KEY, 'true');
    };

    const addPlayer = () => {
        const name = newPlayerName.trim();
        if (!name) return;
        const assignedPersonaId = newPlayerPersonaId || personaOptions[players.length % personaOptions.length].id;
        const persona = personaOptions.find((p) => p.id === assignedPersonaId) || personaOptions[0];
        const id = `p_${Date.now()}`;
        setPlayers((prev) => [...prev, { id, name, color: persona.color, personaId: persona.id }]);
        setRounds((prev) => prev.map((r) => ({ ...r, scores: { ...r.scores, [id]: '' } })));
        setNewPlayerName('');
        setNewPlayerPersonaId(null);
    };

    const removePlayer = (id: string) => {
        Alert.alert('Remover Jogador', 'Tem certeza?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Remover',
                style: 'destructive',
                onPress: () => {
                    setPlayers((prev) => prev.filter((p) => p.id !== id));
                    setRounds((prev) =>
                        prev.map((r) => {
                            const s = { ...r.scores };
                            delete s[id];
                            return { ...r, scores: s };
                        })
                    );
                },
            },
        ]);
    };

    const addRound = () => {
        if (gameMode === 'rounds' && rounds.length >= targetRounds) {
            Alert.alert(
                'Limite atingido',
                `A meta era ${targetRounds} rodadas. Deseja continuar mesmo assim?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Continuar', onPress: () => {
                            setRounds((p) => [
                                ...p,
                                { id: `r_${Date.now()}`, label: String(p.length + 1), scores: Object.fromEntries(players.map((pl) => [pl.id, ''])) },
                            ]);
                        }
                    }
                ]
            );
            return;
        }
        setRounds((p) => [
            ...p,
            { id: `r_${Date.now()}`, label: String(p.length + 1), scores: Object.fromEntries(players.map((pl) => [pl.id, ''])) },
        ]);
    };

    const resetMatch = () => {
        Alert.alert('Resetar Partida', 'Todos os pontos serão perdidos. Confirma?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Resetar',
                style: 'destructive',
                onPress: () => {
                    setRounds([{ id: 'r1', label: '1', scores: Object.fromEntries(players.map((p) => [p.id, ''])) }]);
                },
            },
        ]);
    };

    const saveMatch = () => {
        Alert.alert('Salvar Partida', 'Salvar no histórico e iniciar nova?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Salvar',
                onPress: () => {
                    const { totals, max } = computeTotals(players, rounds);
                    const entry: MatchEntry = {
                        id: `m_${Date.now()}`,
                        dateISO: new Date().toISOString(),
                        label: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
                        players: players.map((p) => ({ id: p.id, name: p.name })),
                        totals,
                        roundsCount: rounds.length,
                        leaderIds: players.filter((p) => totals[p.id] === max).map((p) => p.id),
                    };
                    setHistory((prev) => [entry, ...prev]);
                    setRounds([{ id: 'r1', label: '1', scores: Object.fromEntries(players.map((p) => [p.id, ''])) }]);
                },
            },
        ]);
    };

    const confirmScore = () => {
        if (!scoringModal) return;
        // Se fez Blitz, não tem penalidade (resto = 0). Senão, calcula a penalidade.
        const mesa = parseInt(centerCards || '0');
        const resto = isBlitzPlayer ? 0 : parseInt(blitzCards || '0');
        const total = mesa - (resto * 2);

        setRounds((prev) =>
            prev.map((r) => {
                if (r.id === scoringModal.roundId) {
                    const updatedRound = { ...r, scores: { ...r.scores, [scoringModal.playerId]: total } };
                    if (isBlitzPlayer) {
                        updatedRound.blitzPlayerId = scoringModal.playerId;
                    }
                    return updatedRound;
                }
                return r;
            })
        );
        setScoringModal(null);
        setCenterCards('');
        setBlitzCards('');
        setIsBlitzPlayer(false);
    };

    const { totals, max } = computeTotals(players, rounds);

    // ======================== AUTH SCREEN ========================
    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.authContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
                <Image source={logo} style={styles.authLogo} />
                <Text style={styles.authTitle}>Dutch Blitz Score</Text>
                <Text style={styles.authSubtitle}>Sua companhia oficial para Dutch Blitz</Text>
                <TouchableOpacity style={styles.authButton} onPress={handleLogin}>
                    <Text style={styles.authButtonText}>Entrar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.authSkipButton} onPress={handleLogin}>
                    <Text style={styles.authSkipText}>[DEV] Pular Login</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // ======================== SETUP SCREEN ========================
    if (!isSetupComplete || players.length === 0) {
        return (
            <SafeAreaView style={styles.setupContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
                <Text style={styles.setupTitle}>Quem vai jogar?</Text>
                <Text style={styles.setupSubtitle}>Configure os jogadores para iniciar a partida.</Text>
                <ScrollView style={{ flex: 1, width: '100%' }}>
                    {setupPlayers.map((p, index) => {
                        const currentPersona = personaOptions.find((opt) => opt.id === p.personaId) || personaOptions[0];
                        return (
                            <View key={index} style={styles.setupPlayerRow}>
                                <TouchableOpacity
                                    onPress={() => setPersonaModalFor(`SETUP_${index}`)}
                                    style={[styles.setupPlayerAvatar, { borderColor: p.color }]}
                                >
                                    <Image source={personaImages[p.personaId || 'mailman']} style={styles.setupPlayerImage} />
                                </TouchableOpacity>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.setupPlayerLabel}>NOME DO JOGADOR {index + 1}</Text>
                                    <TextInput
                                        style={styles.setupPlayerInput}
                                        placeholder={`Jogador ${index + 1}`}
                                        placeholderTextColor="#666"
                                        value={p.name}
                                        onChangeText={(text) => {
                                            const updated = [...setupPlayers];
                                            updated[index] = { ...updated[index], name: text };
                                            setSetupPlayers(updated);
                                        }}
                                    />
                                </View>
                                {setupPlayers.length > 2 && (
                                    <TouchableOpacity
                                        onPress={() => setSetupPlayers(setupPlayers.filter((_, i) => i !== index))}
                                        style={styles.setupRemoveBtn}
                                    >
                                        <Text style={styles.setupRemoveText}>×</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
                {setupPlayers.length < 4 && (
                    <TouchableOpacity
                        onPress={() => {
                            const nextPersona = personaOptions[setupPlayers.length % personaOptions.length];
                            setSetupPlayers([
                                ...setupPlayers,
                                { id: `p_${Date.now()}`, name: '', personaId: nextPersona.id, color: nextPersona.color },
                            ]);
                        }}
                        style={styles.setupAddBtn}
                    >
                        <Text style={styles.setupAddText}>+ Adicionar Jogador</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.setupModeSection}>
                    <Text style={styles.setupPlayerLabel}>MODO DE JOGO</Text>
                    <View style={styles.setupModeToggles}>
                        <TouchableOpacity
                            style={[styles.setupModeToggle, gameMode === 'score' && styles.setupModeToggleActive]}
                            onPress={() => setGameMode('score')}
                        >
                            <Text style={[styles.setupModeToggleText, gameMode === 'score' && styles.setupModeToggleTextActive]}>Por Pontos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.setupModeToggle, gameMode === 'rounds' && styles.setupModeToggleActive]}
                            onPress={() => setGameMode('rounds')}
                        >
                            <Text style={[styles.setupModeToggleText, gameMode === 'rounds' && styles.setupModeToggleTextActive]}>Por Rodadas</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.setupOptionsScroll}>
                        {(gameMode === 'score' ? TARGET_OPTIONS : ROUND_OPTIONS).map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.setupOptionItem, (gameMode === 'score' ? targetScore : targetRounds) === opt && styles.setupOptionItemActive]}
                                onPress={() => gameMode === 'score' ? setTargetScore(opt) : setTargetRounds(opt)}
                            >
                                <Text style={[styles.setupOptionItemText, (gameMode === 'score' ? targetScore : targetRounds) === opt && styles.setupOptionItemTextActive]}>
                                    {opt}{gameMode === 'score' ? ' pts' : ' rds'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <TouchableOpacity style={styles.setupStartBtn} onPress={handleSetupComplete}>
                    <Text style={styles.setupStartText}>Iniciar Partida</Text>
                </TouchableOpacity>

                {/* Persona Modal for Setup */}
                <Modal visible={personaModalFor?.startsWith('SETUP_') || false} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Selecionar personagem</Text>
                            <ScrollView contentContainerStyle={styles.personaGrid}>
                                {personaOptions.map((opt) => {
                                    const isSelected = selectedPersonaId === opt.id;
                                    return (
                                        <TouchableOpacity
                                            key={opt.id}
                                            style={[
                                                styles.personaItem,
                                                { borderColor: opt.color, borderWidth: 2 },
                                                isSelected && styles.personaItemSelected
                                            ]}
                                            onPress={() => setSelectedPersonaId(opt.id)}
                                        >
                                            <Image source={personaImages[opt.id]} style={styles.personaImage} />
                                            <Text style={styles.personaName}>{opt.name}</Text>
                                            {isSelected && <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>✓</Text></View>}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                            <TouchableOpacity
                                style={selectedPersonaId ? styles.modalConfirmBtn : styles.modalCloseBtn}
                                onPress={() => {
                                    if (selectedPersonaId) {
                                        const persona = personaOptions.find(p => p.id === selectedPersonaId);
                                        if (persona) {
                                            const index = parseInt(personaModalFor?.replace('SETUP_', '') || '0');
                                            const updated = [...setupPlayers];
                                            updated[index] = { ...updated[index], personaId: persona.id, color: persona.color };
                                            setSetupPlayers(updated);
                                        }
                                    }
                                    setSelectedPersonaId(null);
                                    setPersonaModalFor(null);
                                }}
                            >
                                <Text style={selectedPersonaId ? styles.modalConfirmText : styles.modalCloseText}>
                                    {selectedPersonaId ? 'Selecionar' : 'Fechar'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        );
    }

    // ======================== MAIN APP ========================
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Image source={logo} style={styles.headerLogo} />
                    <View>
                        <Text style={styles.headerTitle}>Dutch Blitz Score</Text>
                        <Text style={styles.headerSubtitle}>DUTCH BLITZ OFFICIAL COUNTER</Text>
                    </View>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => setShowChart(!showChart)}>
                        <Text style={styles.headerBtnText}>{showChart ? 'Tabela' : 'Gráfico'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerBtn} onPress={resetMatch}>
                        <Text style={styles.headerBtnText}>Resetar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.headerBtn, styles.headerBtnPrimary]} onPress={saveMatch}>
                        <Text style={[styles.headerBtnText, { color: '#fff' }]}>Salvar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.headerBtn, styles.headerBtnDanger]} onPress={handleLogout}>
                        <Text style={[styles.headerBtnText, { color: '#ef4444' }]}>Sair</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Scoreboard */}
            <ScrollView style={styles.boardContainer}>
                <View style={styles.glassPanel}>
                    <View style={styles.panelHeader}>
                        <Text style={styles.panelTitle}>{showChart ? 'Estatísticas' : 'Partida Atual'}</Text>
                        {!showChart && (
                            <TouchableOpacity style={styles.addRoundBtn} onPress={addRound}>
                                <Text style={styles.addRoundText}>+ Rodada</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {showChart ? (
                        <View style={styles.chartPlaceholder}>
                            <Text style={styles.chartPlaceholderText}>Gráfico em desenvolvimento</Text>
                        </View>
                    ) : (
                        <ScrollView horizontal>
                            <View>
                                {/* Table Header */}
                                <View style={styles.tableRow}>
                                    <View style={styles.tableHeaderCell}>
                                        <Text style={styles.tableHeaderText}>RD</Text>
                                    </View>
                                    {players.map((p) => (
                                        <View key={p.id} style={styles.tableHeaderCell}>
                                            <Text style={[styles.tablePlayerName, { color: p.color }]}>{p.name}</Text>
                                            <View style={styles.progressBar}>
                                                <View style={[
                                                    styles.progressFill,
                                                    {
                                                        width: `${Math.min(
                                                            (gameMode === 'score'
                                                                ? (totals[p.id] || 0) / targetScore
                                                                : rounds.length / targetRounds
                                                            ) * 100, 100)}%`,
                                                        backgroundColor: p.color
                                                    }
                                                ]} />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                                {/* Table Body */}
                                {rounds.map((r) => (
                                    <View key={r.id} style={styles.tableRow}>
                                        <View style={styles.tableCell}>
                                            <Text style={styles.roundLabel}>{r.label}</Text>
                                        </View>
                                        {players.map((p) => (
                                            <TouchableOpacity
                                                key={p.id}
                                                style={styles.scoreCell}
                                                onPress={() => setScoringModal({ roundId: r.id, playerId: p.id })}
                                            >
                                                <Text style={styles.scoreText}>{r.scores[p.id] === '' ? '-' : r.scores[p.id]}</Text>
                                                {r.blitzPlayerId === p.id && <Text style={styles.blitzCellBadge}>B</Text>}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    )}
                </View>

                {/* Leaderboard */}
                <View style={styles.glassPanel}>
                    <View style={styles.panelHeader}>
                        <Text style={styles.panelTitle}>Liderança</Text>
                        <TouchableOpacity onPress={() => {
                            if (gameMode === 'score') {
                                const currentIndex = TARGET_OPTIONS.indexOf(targetScore);
                                if (currentIndex === TARGET_OPTIONS.length - 1) {
                                    setGameMode('rounds');
                                } else {
                                    setTargetScore(TARGET_OPTIONS[currentIndex + 1]);
                                }
                            } else {
                                const currentIndex = ROUND_OPTIONS.indexOf(targetRounds);
                                if (currentIndex === ROUND_OPTIONS.length - 1) {
                                    setGameMode('score');
                                } else {
                                    setTargetRounds(ROUND_OPTIONS[currentIndex + 1]);
                                }
                            }
                        }}>
                            <Text style={styles.metaText}>
                                {gameMode === 'score' ? `META ${targetScore} PTS` : `META ${targetRounds} RDS`} ▼
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {players.map((p) => {
                        const total = totals[p.id] || 0;
                        const isLeader = total === max && max !== 0;
                        return (
                            <View key={p.id} style={[styles.leaderRow, isLeader && styles.leaderRowActive]}>
                                <View style={[styles.leaderAvatar, { backgroundColor: p.color }]}>
                                    <Text style={styles.leaderAvatarText}>{p.name[0]}</Text>
                                </View>
                                <Text style={styles.leaderName}>{p.name}</Text>
                                <Text style={styles.leaderScore}>{total}</Text>
                                {gameMode === 'score' ? (
                                    total >= targetScore && <Text style={styles.blitzBadge}>VENCEU!</Text>
                                ) : (
                                    rounds.length >= targetRounds && isLeader && <Text style={styles.blitzBadge}>VENCEU!</Text>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Add Player */}
                <View style={styles.glassPanel}>
                    <View style={styles.panelHeader}>
                        <Text style={styles.panelTitle}>Jogadores</Text>
                    </View>
                    {players.map((p) => {
                        const persona = personaOptions.find((o) => o.id === p.personaId);
                        return (
                            <View key={p.id} style={styles.playerRow}>
                                <TouchableOpacity onPress={() => setPersonaModalFor(p.id)} style={styles.playerAvatar}>
                                    <Image source={personaImages[p.personaId]} style={styles.playerImage} />
                                </TouchableOpacity>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.playerName}>{p.name}</Text>
                                    <Text style={[styles.playerPersona, { color: p.color }]}>{persona?.name}</Text>
                                </View>
                                <TouchableOpacity onPress={() => removePlayer(p.id)}>
                                    <Text style={styles.removeBtn}>×</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                    <View style={styles.addPlayerRow}>
                        <TouchableOpacity
                            onPress={() => setPersonaModalFor('NEW_PLAYER')}
                            style={styles.addPlayerAvatarBtn}
                        >
                            {newPlayerPersonaId ? (
                                <Image source={personaImages[newPlayerPersonaId]} style={styles.addPlayerImage} />
                            ) : (
                                <Text style={styles.addPlayerQuestion}>?</Text>
                            )}
                        </TouchableOpacity>
                        <TextInput
                            style={styles.addPlayerInput}
                            placeholder="Nome do jogador"
                            placeholderTextColor="#666"
                            value={newPlayerName}
                            onChangeText={setNewPlayerName}
                        />
                        <TouchableOpacity style={styles.addBtn} onPress={addPlayer}>
                            <Text style={styles.addBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Scoring Modal */}
            <Modal visible={!!scoringModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Pontuação {players.find((p) => p.id === scoringModal?.playerId)?.name}
                        </Text>

                        <TouchableOpacity
                            style={[styles.blitzCheckbox, isBlitzPlayer && styles.blitzCheckboxActive]}
                            onPress={() => setIsBlitzPlayer(!isBlitzPlayer)}
                        >
                            <Text style={[styles.blitzCheckboxText, isBlitzPlayer && styles.blitzCheckboxTextActive]}>
                                {isBlitzPlayer ? '✓ ' : '○ '}Fez Blitz nesta rodada
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.scoringInputsRow}>
                            <View style={styles.scoringInputCol}>
                                <Text style={styles.scoringLabel}>Cartas na Mesa</Text>
                                <TextInput
                                    style={styles.scoringInput}
                                    keyboardType="numeric"
                                    value={centerCards}
                                    onChangeText={setCenterCards}
                                    placeholder="0"
                                    placeholderTextColor="#444"
                                />
                            </View>
                            {!isBlitzPlayer && (
                                <View style={styles.scoringInputCol}>
                                    <Text style={styles.scoringLabel}>Resto no Blitz</Text>
                                    <TextInput
                                        style={styles.scoringInput}
                                        keyboardType="numeric"
                                        value={blitzCards}
                                        onChangeText={setBlitzCards}
                                        placeholder="0"
                                        placeholderTextColor="#444"
                                    />
                                </View>
                            )}
                        </View>

                        <View style={styles.scoringTotal}>
                            <Text style={styles.scoringTotalLabel}>TOTAL</Text>
                            <Text style={styles.scoringTotalValue}>
                                {isBlitzPlayer
                                    ? parseInt(centerCards || '0')
                                    : parseInt(centerCards || '0') - parseInt(blitzCards || '0') * 2
                                }
                            </Text>
                            <Text style={styles.scoringFormula}>
                                {isBlitzPlayer
                                    ? `${centerCards || 0} cartas = ${centerCards || 0} pts`
                                    : `${centerCards || 0} - (${blitzCards || 0} × 2) = ${parseInt(centerCards || '0') - parseInt(blitzCards || '0') * 2} pts`
                                }
                            </Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setScoringModal(null); setIsBlitzPlayer(false); setCenterCards(''); setBlitzCards(''); }}>
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmScore}>
                                <Text style={styles.modalConfirmText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Persona Modal */}
            <Modal visible={!!personaModalFor && !personaModalFor.startsWith('SETUP_')} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Selecionar personagem</Text>
                        <ScrollView contentContainerStyle={styles.personaGrid}>
                            {personaOptions.map((opt) => {
                                const isSelected = selectedPersonaId === opt.id;
                                return (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[
                                            styles.personaItem,
                                            { borderColor: opt.color, borderWidth: 2 },
                                            isSelected && styles.personaItemSelected
                                        ]}
                                        onPress={() => setSelectedPersonaId(opt.id)}
                                    >
                                        <Image source={personaImages[opt.id]} style={styles.personaImage} />
                                        <Text style={styles.personaName}>{opt.name}</Text>
                                        {isSelected && <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>✓</Text></View>}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity
                            style={selectedPersonaId ? styles.modalConfirmBtn : styles.modalCloseBtn}
                            onPress={() => {
                                if (selectedPersonaId) {
                                    const persona = personaOptions.find(p => p.id === selectedPersonaId);
                                    if (persona) {
                                        if (personaModalFor === 'NEW_PLAYER') {
                                            setNewPlayerPersonaId(persona.id);
                                        } else {
                                            setPlayers((prev) =>
                                                prev.map((p) => (p.id === personaModalFor ? { ...p, personaId: persona.id, color: persona.color } : p))
                                            );
                                        }
                                    }
                                }
                                setSelectedPersonaId(null);
                                setPersonaModalFor(null);
                            }}
                        >
                            <Text style={selectedPersonaId ? styles.modalConfirmText : styles.modalCloseText}>
                                {selectedPersonaId ? 'Selecionar' : 'Fechar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    // Auth Screen
    authContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 30,
    },
    authLogo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 20,
    },
    authTitle: {
        fontSize: 36,
        fontWeight: '400',
        color: '#fff',
        marginBottom: 8,
    },
    authSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 40,
    },
    authButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 60,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    authButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    authSkipButton: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#666',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        opacity: 0.5,
    },
    authSkipText: {
        color: '#666',
        fontSize: 12,
    },

    // Setup Screen
    setupContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        padding: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 30,
    },
    setupTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
        marginTop: 20,
    },
    setupSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    setupPlayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    setupPlayerAvatar: {
        width: 56,
        height: 56,
        borderRadius: 14,
        borderWidth: 2,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: '#000',
    },
    setupPlayerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    setupPlayerLabel: {
        fontSize: 11,
        color: '#666',
        fontWeight: '700',
        marginBottom: 4,
    },
    setupPlayerInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 10,
        color: '#fff',
        fontSize: 14,
    },
    setupRemoveBtn: {
        padding: 10,
    },
    setupRemoveText: {
        color: '#666',
        fontSize: 24,
    },
    setupAddBtn: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.2)',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    setupAddText: {
        color: '#666',
        fontSize: 14,
    },
    setupStartBtn: {
        backgroundColor: '#22c55e',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    setupStartText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    setupModeSection: {
        marginBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    setupModeToggles: {
        flexDirection: 'row',
        gap: 10,
        marginVertical: 10,
    },
    setupModeToggle: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    setupModeToggleActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3b82f6',
    },
    setupModeToggleText: {
        color: '#666',
        fontSize: 13,
        fontWeight: '600',
    },
    setupModeToggleTextActive: {
        color: '#3b82f6',
    },
    setupOptionsScroll: {
        marginTop: 5,
    },
    setupOptionItem: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    setupOptionItemActive: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    setupOptionItemText: {
        color: '#666',
        fontSize: 12,
    },
    setupOptionItemTextActive: {
        color: '#000',
        fontWeight: '700',
    },

    // Main Container
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLogo: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '400',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
    },
    headerButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    headerBtn: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerBtnPrimary: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    headerBtnDanger: {
        borderColor: 'rgba(239,68,68,0.3)',
    },
    headerBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },

    // Board
    boardContainer: {
        flex: 1,
        padding: 16,
        paddingBottom: 30,
    },
    glassPanel: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    panelTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
        textTransform: 'uppercase',
    },
    metaText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#22c55e',
    },
    addRoundBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    addRoundText: {
        color: '#fff',
        fontSize: 12,
    },

    // Table
    tableRow: {
        flexDirection: 'row',
    },
    tableHeaderCell: {
        width: 80,
        padding: 10,
        alignItems: 'center',
    },
    tableHeaderText: {
        color: '#666',
        fontWeight: '700',
        fontSize: 12,
    },
    tablePlayerName: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    progressBar: {
        width: 40,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    tableCell: {
        width: 80,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roundLabel: {
        color: '#666',
        fontWeight: '700',
        fontSize: 14,
    },
    scoreCell: {
        width: 80,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
        margin: 2,
    },
    scoreText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    // Chart Placeholder
    chartPlaceholder: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
    },
    chartPlaceholderText: {
        color: '#666',
    },

    // Leaderboard
    leaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        marginBottom: 8,
    },
    leaderRowActive: {
        borderWidth: 1,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
    },
    leaderAvatar: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    leaderAvatarText: {
        color: '#000',
        fontWeight: '800',
    },
    leaderName: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    leaderScore: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
        marginRight: 8,
    },
    blitzBadge: {
        backgroundColor: '#22c55e',
        color: '#000',
        fontSize: 10,
        fontWeight: '800',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },

    // Player List
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    playerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: '#000',
    },
    playerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    playerName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    playerPersona: {
        fontSize: 11,
        fontWeight: '700',
    },
    removeBtn: {
        color: '#666',
        fontSize: 24,
        paddingHorizontal: 10,
    },

    // Add Player
    addPlayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    addPlayerAvatarBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        overflow: 'hidden',
    },
    addPlayerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    addPlayerQuestion: {
        color: '#fff',
        fontSize: 20,
    },
    addPlayerInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        marginRight: 8,
    },
    addBtn: {
        backgroundColor: '#3b82f6',
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalCancelBtn: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#fff',
    },
    modalConfirmBtn: {
        flex: 1,
        backgroundColor: '#3b82f6',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalConfirmText: {
        color: '#fff',
        fontWeight: '700',
    },
    modalCloseBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    modalCloseText: {
        color: '#fff',
    },

    // Scoring Modal
    scoringInputRow: {
        marginBottom: 16,
    },
    scoringInputsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    scoringInputCol: {
        flex: 1,
    },
    scoringLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
    },
    scoringInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 20,
        textAlign: 'center',
        fontWeight: '700',
    },
    scoringTotal: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
    },
    scoringTotalLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
    },
    scoringTotalValue: {
        color: '#22c55e',
        fontSize: 48,
        fontWeight: '900',
    },
    scoringFormula: {
        color: '#666',
        fontSize: 12,
        marginTop: 8,
    },

    // Persona Grid
    personaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    personaItem: {
        width: '46%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
    },
    personaImage: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
        marginBottom: 8,
    },
    personaName: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 4,
    },
    personaColorDot: {
        width: 12,
        height: 12,
        borderRadius: 4,
    },
    personaItemSelected: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        transform: [{ scale: 1.02 }],
    },
    selectedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#22c55e',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedBadgeText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '800',
    },

    // Blitz Checkbox
    blitzCheckbox: {
        marginBottom: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'center',
    },
    blitzCheckboxActive: {
        backgroundColor: 'rgba(34,197,94,0.2)',
        borderColor: '#22c55e',
    },
    blitzCheckboxText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    blitzCheckboxTextActive: {
        color: '#22c55e',
    },
    blitzCellBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#22c55e',
        color: '#000',
        fontSize: 8,
        fontWeight: '800',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
});
