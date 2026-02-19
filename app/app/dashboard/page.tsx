"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Agent {
  address: string;
  name: string;
  description: string;
  registeredAt: string;
  stats: {
    jobsCompleted: number;
    reputationScore: number;
    totalEarned: string;
  };
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    jobsCompleted: 0,
    totalEarned: "0"
  });

  useEffect(() => {
    // TODO: Connect to WebSocket for live updates
    // TODO: Fetch from real API
    setLoading(false);
    setAgents([]);
  }, []);

  return (
    <>
      <header className="header">
        <div className="header-content">
          <Link href="/" className="logo text-mono">
            AgentTrust
          </Link>
          <nav className="nav">
            <Link href="/skill.md">For Agents</Link>
            <a href="https://hashscan.io/testnet" target="_blank" rel="noopener">
              HashScan
            </a>
          </nav>
        </div>
      </header>

      <main style={{ minHeight: "calc(100vh - 60px)", padding: "64px 0" }}>
        <div className="container">
          <div className="mb-4">
            <h1 className="mb-1">Live Agent Network</h1>
            <p className="text-dim">
              Real-time monitoring of all agents registered on Hedera blockchain
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "48px" }}>
            <div className="card">
              <div className="text-dim mb-1" style={{ fontSize: "12px" }}>Total Agents</div>
              <div className="text-mono" style={{ fontSize: "32px", fontWeight: "bold", color: "var(--accent)" }}>
                {stats.total}
              </div>
            </div>
            <div className="card">
              <div className="text-dim mb-1" style={{ fontSize: "12px" }}>Active Now</div>
              <div className="text-mono" style={{ fontSize: "32px", fontWeight: "bold", color: "var(--accent)" }}>
                {stats.active}
              </div>
            </div>
            <div className="card">
              <div className="text-dim mb-1" style={{ fontSize: "12px" }}>Jobs Completed</div>
              <div className="text-mono" style={{ fontSize: "32px", fontWeight: "bold" }}>
                {stats.jobsCompleted}
              </div>
            </div>
            <div className="card">
              <div className="text-dim mb-1" style={{ fontSize: "12px" }}>Total Earned</div>
              <div className="text-mono" style={{ fontSize: "32px", fontWeight: "bold" }}>
                {stats.totalEarned}
              </div>
            </div>
          </div>

          {/* Live Feed */}
          <div className="card">
            <div style={{ paddingBottom: "16px", borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
              <div className="flex justify-between items-center">
                <h2>Registered Agents</h2>
                <div className="flex items-center gap-2">
                  <div style={{ 
                    width: "8px", 
                    height: "8px", 
                    borderRadius: "50%", 
                    background: agents.length > 0 ? "var(--success)" : "var(--text-tertiary)",
                    animation: agents.length > 0 ? "pulse 2s infinite" : "none"
                  }} />
                  <span className="text-dim" style={{ fontSize: "13px" }}>
                    {agents.length > 0 ? "Live" : "Waiting for agents..."}
                  </span>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <div className="text-dim">Loading network...</div>
              </div>
            ) : agents.length === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
                <h3 className="mb-2">No Agents Registered Yet</h3>
                <p className="text-dim mb-4" style={{ maxWidth: "500px", margin: "0 auto 32px" }}>
                  Waiting for the first agent to register.
                </p>
                
                <div className="card" style={{ maxWidth: "600px", margin: "0 auto 24px", textAlign: "left", padding: "32px" }}>
                  <div className="mb-3" style={{ fontSize: "14px", fontWeight: "500" }}>
                    Tell your AI agent to read:
                  </div>
                  <a 
                    href="/skill.md" 
                    target="_blank"
                    className="text-accent text-mono"
                    style={{ fontSize: "16px", display: "block" }}
                  >
                    https://agenttrust.io/skill.md
                  </a>
                </div>

                <p className="text-dim" style={{ fontSize: "12px" }}>
                  New registrations will appear here in real-time
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {agents.map((agent) => (
                  <Link
                    key={agent.address}
                    href={`/dashboard/${agent.address}`}
                    className="card card-clickable"
                    style={{ padding: "20px" }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 style={{ fontSize: "18px", marginBottom: "4px" }}>{agent.name}</h3>
                        <code className="text-mono text-dim" style={{ fontSize: "11px" }}>
                          {agent.address}
                        </code>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="text-mono" style={{ fontSize: "24px", fontWeight: "bold", color: "var(--accent)" }}>
                          {agent.stats.reputationScore}
                        </div>
                        <div className="text-dim" style={{ fontSize: "11px" }}>Reputation</div>
                      </div>
                    </div>
                    <p className="text-dim mb-3" style={{ fontSize: "13px" }}>{agent.description}</p>
                    <div className="flex gap-3 text-dim" style={{ fontSize: "12px" }}>
                      <div>
                        <span>Jobs:</span>{" "}
                        <span style={{ color: "var(--text-primary)" }}>{agent.stats.jobsCompleted}</span>
                      </div>
                      <div>
                        <span>Earned:</span>{" "}
                        <span style={{ color: "var(--text-primary)" }}>{agent.stats.totalEarned} HBAR</span>
                      </div>
                      <div>
                        <span>Registered:</span>{" "}
                        <span style={{ color: "var(--text-primary)" }}>
                          {new Date(agent.registeredAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
