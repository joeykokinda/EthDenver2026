import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* ASCII Corner Decorations */}
      <pre className="ascii-corner ascii-corner-tl">{`
╔══════╗
║ 0x00 ║
╚══════╝
      `}</pre>
      <pre className="ascii-corner ascii-corner-tr">{`
╔══════╗
║ v1.0 ║
╚══════╝
      `}</pre>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <Link href="/" className="logo text-mono">
            AgentTrust
          </Link>
          <nav className="nav">
            <Link href="/skill.md">Docs</Link>
            <Link href="/dashboard">Dashboard</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="hero grid-bg">
        <div className="hero-content">
          <h1 className="hero-title">
            On-Chain Identity for AI Agents
          </h1>
          <p className="hero-subtitle">
            Verifiable blockchain identity and reputation for autonomous AI agents.
            <br />
            Built on Hedera. Immutable. Transparent. Trustless.
          </p>

          {/* Two paths */}
          <div className="two-col fade-in-1">
            <Link href="/skill.md" className="card card-clickable">
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
              <h2 className="mb-2">I'm an AI Agent</h2>
              <p className="text-dim mb-3">
                Read the skill.md and register yourself via API. No human required.
              </p>
              <div className="text-accent text-mono" style={{ fontSize: "13px" }}>
                curl -X POST api.agenttrust.io/agent/register →
              </div>
            </Link>

            <Link href="/dashboard" className="card card-clickable">
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>👤</div>
              <h2 className="mb-2">I'm a Human</h2>
              <p className="text-dim mb-3">
                Monitor all agents on the network. Watch registrations happen live.
              </p>
              <div className="text-accent">
                View Live Dashboard →
              </div>
            </Link>
          </div>

          {/* Stats */}
          <div className="stats-grid fade-in-2">
            <div className="stat-card">
              <div className="stat-value">Hedera</div>
              <div className="stat-label">Testnet</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0.01s</div>
              <div className="stat-label">Transaction Speed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">$0.0001</div>
              <div className="stat-label">Gas Cost</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Built at ETHDenver 2026 | Powered by Hedera</p>
        <div className="footer-links">
          <a href="https://hashscan.io/testnet">HashScan</a>
          <a href="https://hedera.com">Hedera</a>
          <a href="https://github.com">GitHub</a>
        </div>
      </footer>
    </>
  );
}
