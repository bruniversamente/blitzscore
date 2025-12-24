"use client";

import React, { useState } from "react";
import Image from "next/image";

interface AuthScreenProps {
    onLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulação de autenticação
        if (email && password) {
            onLogin();
        } else {
            alert("Por favor, preencha todos os campos.");
        }
    };

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: 20,
            background: "radial-gradient(circle at center, rgba(59, 130, 246, 0.1), transparent 70%)"
        }}>
            <div style={{ marginBottom: 40, textAlign: "center" }}>
                <div style={{
                    width: 100, height: 100, borderRadius: 50, overflow: "hidden",
                    margin: "0 auto 20px", position: "relative",
                    filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))"
                }}>
                    <Image src="/logo.jpg" alt="Dutch Blitz Score Logo" fill style={{ objectFit: "cover" }} />
                </div>
                <h1 style={{ fontSize: 48, fontWeight: 400, marginBottom: 8, fontFamily: "var(--font-gothic)" }}>Dutch Blitz Score</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Sua companhia oficial para Dutch Blitz</p>
            </div>

            <div className="glass-panel" style={{ width: "100%", maxWidth: 400, padding: 32 }}>
                <div style={{ display: "flex", marginBottom: 32, padding: 4, background: "rgba(0,0,0,0.2)", borderRadius: 12 }}>
                    <button
                        onClick={() => setIsLogin(true)}
                        style={{
                            flex: 1, padding: "10px", borderRadius: 10, border: "none",
                            background: isLogin ? "rgba(255,255,255,0.1)" : "transparent",
                            color: isLogin ? "#fff" : "var(--text-muted)",
                            fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                        }}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        style={{
                            flex: 1, padding: "10px", borderRadius: 10, border: "none",
                            background: !isLogin ? "rgba(255,255,255,0.1)" : "transparent",
                            color: !isLogin ? "#fff" : "var(--text-muted)",
                            fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                        }}
                    >
                        Criar Conta
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--text-muted)" }}>E-MAIL</label>
                        <input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={{ width: "100%" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--text-muted)" }}>SENHA</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={{ width: "100%" }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn"
                        style={{
                            marginTop: 16,
                            background: "linear-gradient(135deg, var(--blitz-blue), #2563eb)",
                            color: "white",
                            padding: 16,
                            fontSize: 16,
                            justifyContent: "center"
                        }}
                    >
                        {isLogin ? "Acessar App" : "Criar Conta"}
                    </button>
                </form>

                <div style={{ marginTop: 24, textAlign: "center" }}>
                    <button
                        onClick={onLogin}
                        style={{
                            background: "transparent",
                            border: "1px dashed var(--text-muted)",
                            color: "var(--text-muted)",
                            padding: "8px 16px",
                            borderRadius: 8,
                            cursor: "pointer",
                            opacity: 0.5,
                            fontSize: 12,
                            marginBottom: 16
                        }}
                    >
                        [DEV] Pular Login
                    </button>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Esqueceu sua senha? <span style={{ color: "var(--blitz-blue)", cursor: "pointer", textDecoration: "underline" }}>Recuperar</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
