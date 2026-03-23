"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "../../components/DashboardHeader";
import { useWallet } from "../../lib/wallet";

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={copy} title={`Copy ${label || ""}`} style={{ background: "none", border: "1px solid #444", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", color: copied ? "var(--accent)" : "var(--text-tertiary)", cursor: "pointer", fontFamily: "monospace", whiteSpace: "nowrap", marginTop: "6px" }}>
      {copied ? "Copied" : "copy"}
    </button>
  );
}

type AgentType = "openclaw" | "custom";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface FormData {
  name: string;
  hederaAccountId: string;
  splitDev: number;
  splitOps: number;
  splitReinvest: number;
}

const DEFAULT_FORM: FormData = {
  name: "",
  hederaAccountId: "",
  splitDev: 70,
  splitOps: 20,
  splitReinvest: 10,
};

const INPUT_STYLE = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "14px",
  color: "var(--text-primary)",
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box" as const,
};

export default function AddAgentPage() {
  const { address } = useWallet();
  const [step, setStep] = useState(1);
  const [agentType, setAgentType] = useState<AgentType>("openclaw");
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ agentId: string; hcsTopicId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const agentId = slugify(form.name);
  const splitTotal = form.splitDev + form.splitOps + form.splitReinvest;

  async function handleRegister() {
    if (!address) { setError("Connect your wallet first."); return; }
    if (!form.name.trim()) { setError("Agent nickname is required."); return; }
    if (!agentId) { setError("Nickname must contain at least one letter or number."); return; }
    if (splitTotal !== 100) { setError("Earnings split must total 100%."); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/proxy/api/agent/register-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          agentName: form.name.trim(),
          ownerWallet: address,
          splitDev: form.splitDev,
          splitOps: form.splitOps,
          splitReinvest: form.splitReinvest,
          hederaAccountId: form.hederaAccountId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); setLoading(false); return; }
      setResult({ agentId: data.agentId || agentId, hcsTopicId: data.hcsTopicId || "" });
      setStep(3);
    } catch (e: any) {
      setError(e.message || "Network error.");
    }
    setLoading(false);
  }

  function copySnippet(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const skillUrl = result ? `https://veridex.sbs/skill.md` : "";

  const openClawSnippet = result
    ? `// In your OpenClaw config.json\n{\n  "skills": [\n    "${skillUrl}"\n  ]\n}`
    : "";

  const customSnippet = result
    ? `// Before every tool call in your agent\nawait fetch("https://veridex.sbs/api/proxy/api/log", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({\n    agentId: "${result.agentId}",\n    phase: "before",\n    action: "your_action_name",\n    tool: "tool_name",\n    params: { /* sanitized params */ },\n  }),\n});`
    : "";

  const snippet = agentType === "openclaw" ? openClawSnippet : customSnippet;

  return (
    <>
      <DashboardHeader />
      <div style={{ maxWidth: "680px", margin: "72px auto 48px", padding: "0 24px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "13px", color: "var(--text-tertiary)", marginBottom: "24px" }}>
          <Link href="/dashboard" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>Dashboard</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <span style={{ color: "var(--text-primary)" }}>Connect Agent</span>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "36px" }}>
          {[
            { n: 1, label: "Agent Type" },
            { n: 2, label: "Configure" },
            { n: 3, label: "Done" },
          ].map(({ n, label }) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700,
                background: step >= n ? "var(--accent)" : "var(--bg-tertiary)",
                color: step >= n ? "#000" : "var(--text-tertiary)",
                border: `1px solid ${step >= n ? "var(--accent)" : "var(--border)"}`,
              }}>
                {n}
              </div>
              <span style={{ fontSize: "13px", color: step === n ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                {label}
              </span>
              {n < 3 && <div style={{ width: "32px", height: "1px", background: "var(--border)" }} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Agent Type */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Connect your agent</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "28px" }}>
              Veridex will monitor every action your agent takes and log it to Hedera HCS — tamper-proof, forever.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
              <div
                onClick={() => setAgentType("openclaw")}
                style={{
                  border: `1px solid ${agentType === "openclaw" ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "10px", padding: "20px", cursor: "pointer",
                  background: agentType === "openclaw" ? "var(--accent-dim)" : "var(--bg-secondary)",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "50%",
                    border: `2px solid ${agentType === "openclaw" ? "var(--accent)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {agentType === "openclaw" && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)" }} />}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "15px" }}>OpenClaw agent</span>
                  <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "var(--accent)" }}>
                    Recommended
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: 1.6 }}>
                  You have an OpenClaw agent running. Connect it in 30 seconds — Veridex generates a personalized skill URL you paste into your config. No code changes needed.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {["30-second setup", "Auto-logs every tool call", "Personalized skill URL"].map(p => (
                    <li key={p} style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>✓ {p}</li>
                  ))}
                </ul>
              </div>

              <div style={{
                border: "1px solid var(--border)", borderRadius: "10px", padding: "20px",
                background: "var(--bg-secondary)", opacity: 0.55, cursor: "not-allowed",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid var(--border)", flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: "15px" }}>Custom agent</span>
                  <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.35)", color: "#a78bfa" }}>
                    Coming soon
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Using LangChain, CrewAI, AutoGen, or your own framework. Add a single HTTP POST before each action.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              style={{ background: "var(--accent)", border: "none", borderRadius: "6px", padding: "10px 24px", fontSize: "14px", fontWeight: 600, color: "#000", cursor: "pointer", width: "100%" }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Configure */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Name your agent</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "28px" }}>
              Give it a nickname for the dashboard. You&apos;ll get a skill URL to paste into your OpenClaw config.
            </p>

            {!address && (
              <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "6px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#f59e0b" }}>
                Connect your wallet first — your wallet address identifies who owns this agent.
              </div>
            )}

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#ef4444" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "28px" }}>
              {/* Nickname */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Agent nickname <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ResearchBot, MyTradingAgent"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={INPUT_STYLE}
                />
                {form.name && (
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "6px" }}>
                    Agent ID: <span style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>{agentId}</span>
                  </div>
                )}
              </div>

              {/* Hedera Account ID — with proper guidance */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Agent&apos;s Hedera account ID{" "}
                  <span style={{ color: "var(--text-tertiary)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(recommended)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0.0.8228708"
                  value={form.hederaAccountId}
                  onChange={e => setForm(f => ({ ...f, hederaAccountId: e.target.value }))}
                  style={{ ...INPUT_STYLE, fontFamily: "monospace" }}
                />
                <div style={{ marginTop: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "6px", padding: "12px 14px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>What is this and how do I get it?</div>
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", lineHeight: 1.7 }}>
                    Your agent needs a Hedera account to pay for HCS messages (~$0.0001 each) and receive HBAR earnings from jobs.
                    This is the account ID in format <span style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>0.0.XXXXXXX</span>.
                  </div>
                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {[
                      { step: "1", text: "Go to portal.hedera.com and create a testnet account (free, instant)" },
                      { step: "2", text: "Copy the Account ID shown after creation — it looks like 0.0.XXXXXXX" },
                      { step: "3", text: "Paste it here. Veridex links your agent's HCS writes to this account." },
                    ].map(({ step, text }) => (
                      <div key={step} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>{step}</span>
                        <span style={{ fontSize: "12px", color: "var(--text-tertiary)", lineHeight: 1.6 }}>{text}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-tertiary)" }}>
                    Or use{" "}
                    <a href="https://www.hashpack.app" target="_blank" rel="noopener" style={{ color: "var(--accent)", textDecoration: "none" }}>HashPack wallet</a>
                    {" "}— create a wallet and your account ID appears on the home screen.
                    You can skip this field and add it later in Settings.
                  </div>
                </div>
              </div>

              {/* Advanced: Earnings Split */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(v => !v)}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-tertiary)", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span style={{ display: "inline-block", transform: showAdvanced ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
                  Advanced — earnings split
                </button>

                {showAdvanced && (
                  <div style={{ marginTop: "16px", padding: "16px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                      How HBAR earnings get distributed when this agent completes jobs. Must total 100%.
                      <span style={{
                        marginLeft: "8px", fontSize: "11px", padding: "2px 6px", borderRadius: "4px",
                        background: splitTotal === 100 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: splitTotal === 100 ? "var(--accent)" : "#ef4444",
                        border: `1px solid ${splitTotal === 100 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                      }}>
                        {splitTotal}/100
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                      {[
                        { key: "splitDev" as keyof FormData, label: "Developer", color: "#10b981" },
                        { key: "splitOps" as keyof FormData, label: "Operations", color: "#3b82f6" },
                        { key: "splitReinvest" as keyof FormData, label: "Reinvest", color: "#f59e0b" },
                      ].map(({ key, label, color }) => (
                        <div key={key}>
                          <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px" }}>{label}</div>
                          <div style={{ position: "relative" }}>
                            <input
                              type="number" min={0} max={100}
                              value={form[key] as number}
                              onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                              style={{ width: "100%", padding: "8px 28px 8px 10px", fontSize: "15px", fontWeight: 700, color, background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: "6px", outline: "none", fontFamily: "monospace", boxSizing: "border-box" }}
                            />
                            <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "var(--text-tertiary)" }}>%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setStep(1)}
                style={{ flex: 1, background: "none", border: "1px solid var(--border)", borderRadius: "6px", padding: "10px", fontSize: "14px", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                ← Back
              </button>
              <button
                onClick={handleRegister}
                disabled={loading || !address || splitTotal !== 100}
                style={{ flex: 2, background: "var(--accent)", border: "none", borderRadius: "6px", padding: "10px 24px", fontSize: "14px", fontWeight: 600, color: "#000", cursor: "pointer", opacity: (loading || !address || splitTotal !== 100) ? 0.6 : 1 }}
              >
                {loading ? "Connecting..." : "Connect agent"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && result && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "22px", color: "var(--accent)" }}>✓</div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px", color: "var(--accent)" }}>Agent connected</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                A Hedera HCS topic was created for this agent. Every action it takes will be logged there permanently.
              </p>
            </div>

            {/* IDs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Agent ID</div>
                <div style={{ fontSize: "14px", fontFamily: "monospace", color: "var(--text-primary)" }}>{result.agentId}</div>
                <CopyButton text={result.agentId} label="agent ID" />
              </div>
              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>HCS Audit Topic</div>
                {result.hcsTopicId ? (
                  <>
                    <a href={`https://hashscan.io/testnet/topic/${result.hcsTopicId}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "14px", fontFamily: "monospace", color: "var(--accent)", textDecoration: "none" }}>
                      {result.hcsTopicId} ↗
                    </a>
                    <div><CopyButton text={result.hcsTopicId} label="HCS topic" /></div>
                  </>
                ) : (
                  <div style={{ fontSize: "14px", fontFamily: "monospace", color: "var(--text-tertiary)" }}>Creating...</div>
                )}
              </div>
            </div>

            {/* Snippet */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Add to OpenClaw config
                </div>
                <button onClick={() => copySnippet(snippet)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: "4px", padding: "3px 10px", fontSize: "12px", color: copied ? "var(--accent)" : "var(--text-tertiary)", cursor: "pointer" }}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "16px", fontSize: "12px", fontFamily: "monospace", color: "var(--text-secondary)", overflowX: "auto", whiteSpace: "pre-wrap", margin: 0 }}>
                {snippet}
              </pre>
              <div style={{ marginTop: "10px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Paste this into your OpenClaw <span style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>config.json</span> and restart. The first action your agent takes will appear in your dashboard within seconds.
              </div>
            </div>

            {/* Recommended next steps */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", marginBottom: "24px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "14px", color: "var(--text-primary)" }}>Recommended next steps</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  {
                    n: "1",
                    title: "Add your Hedera account ID",
                    desc: "Go to Settings in your agent dashboard. Add your agent's Hedera account ID (format 0.0.XXXXXXX) so Veridex can link on-chain payments and HCS writes to your agent. Get one free at portal.hedera.com.",
                    done: !!form.hederaAccountId,
                  },
                  {
                    n: "2",
                    title: "Connect Telegram for real-time alerts",
                    desc: "Go to Settings and enter your Telegram chat ID. You'll get an instant message the moment this agent tries anything dangerous. Message @veridex_manager_bot in Telegram and send /start to get your chat ID.",
                    done: false,
                  },
                  {
                    n: "3",
                    title: "Set operator policies",
                    desc: "Go to the Policies tab. Add rules for what your agent is and isn't allowed to do — blacklist domains, cap HBAR spend, block specific commands. Rules take effect immediately with no code deploy.",
                    done: false,
                  },
                  {
                    n: "4",
                    title: "Start your agent",
                    desc: "Run OpenClaw with the config above. Your first action will appear in the Activity tab within seconds, with an HCS sequence number confirming it was written to Hedera.",
                    done: false,
                  },
                ].map(({ n, title, desc, done }) => (
                  <div key={n} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: done ? "#10b981" : "var(--accent)", background: done ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)", border: `1px solid ${done ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.15)"}`, borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                      {done ? "✓" : n}
                    </span>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "3px", color: done ? "var(--text-tertiary)" : "var(--text-primary)", textDecoration: done ? "line-through" : "none" }}>{title}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-tertiary)", lineHeight: 1.6 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <Link
                href={`/dashboard/${encodeURIComponent(result.agentId)}`}
                style={{ flex: 1, background: "var(--accent)", border: "none", borderRadius: "6px", padding: "10px 24px", fontSize: "14px", fontWeight: 600, color: "#000", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                Open agent dashboard →
              </Link>
              <Link
                href="/dashboard"
                style={{ flex: 1, background: "none", border: "1px solid var(--border)", borderRadius: "6px", padding: "10px 24px", fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                All agents
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
