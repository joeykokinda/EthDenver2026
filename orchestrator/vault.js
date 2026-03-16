/**
 * Veridex Secrets Vault — Layer 1
 * Encrypted credential store. Agents never hold raw secrets.
 * Capability tokens are scoped, short-lived (60s), single-use.
 */

const crypto = require("crypto");
const db = require("./veridex-db");

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

// Vault encryption key: 32 bytes from env or generated at startup (warn if not set)
const VAULT_KEY_HEX = process.env.VAULT_ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const VAULT_KEY = Buffer.from(VAULT_KEY_HEX.padEnd(64, "0").slice(0, 64), "hex");

if (!process.env.VAULT_ENCRYPTION_KEY) {
  console.warn("[Vault] VAULT_ENCRYPTION_KEY not set — secrets will be lost on restart. Add to .env.");
}

// Active capability tokens: token → { agentId, secretType, endpoint, expiresAt, secretId }
const _tokens = new Map();

// Cleanup expired tokens every 30s
setInterval(() => {
  const now = Date.now();
  for (const [t, cap] of _tokens) {
    if (cap.expiresAt < now) _tokens.delete(t);
  }
}, 30000);

function _encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", VAULT_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64"),
    iv:         iv.toString("base64"),
    tag:        tag.toString("base64"),
  };
}

function _decrypt({ ciphertext, iv, tag }) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", VAULT_KEY, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * Store a secret. Returns { secretId }.
 * The raw value is never persisted in plaintext.
 */
function storeSecret({ ownerAgentId, secretType, label, value, allowedAgentIds }) {
  const { ciphertext, iv, tag } = _encrypt(value);
  const secretId = db.insertVaultSecret({
    ownerAgentId,
    secretType,
    label: label || secretType,
    ciphertext, iv, tag,
    allowedAgentIds: allowedAgentIds || [ownerAgentId],
  });
  console.log(`[Vault] Stored secret ${secretType} for ${ownerAgentId} (id: ${secretId})`);
  return { secretId };
}

/**
 * List secrets for an agent (metadata only — never values).
 */
function listSecrets(agentId) {
  return db.getVaultSecrets(agentId).map(s => ({
    secretId:   s.id,
    secretType: s.secret_type,
    label:      s.label,
    ownerAgentId: s.owner_agent_id,
    createdAt:  s.created_at,
  }));
}

/**
 * Delete a secret. Only the owning agent can delete.
 */
function deleteSecret(secretId, requestingAgentId) {
  const s = db.getVaultSecret(secretId);
  if (!s) return { ok: false, reason: "Not found" };
  if (s.owner_agent_id !== requestingAgentId) return { ok: false, reason: "Forbidden" };
  db.deleteVaultSecret(secretId);
  return { ok: true };
}

/**
 * Request a capability token.
 * Returns a 60-second single-use scoped token. Raw secret never exposed.
 */
function requestCapability({ requestingAgentId, secretType, endpoint }) {
  const secret = db.findVaultSecret(requestingAgentId, secretType);
  if (!secret) {
    return { granted: false, reason: `No '${secretType}' secret found for agent ${requestingAgentId}` };
  }

  const token     = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 60000;

  _tokens.set(token, {
    token, agentId: requestingAgentId, secretType,
    endpoint: endpoint || "*", secretId: secret.id, expiresAt,
  });

  // Log the grant to DB (never log the raw secret value)
  db.insertVaultGrant({
    agentId: requestingAgentId,
    secretType,
    endpoint: endpoint || "*",
    granted: true,
    expiresAt,
  });

  return {
    granted:    true,
    token,
    secretType,
    endpoint:   endpoint || "*",
    expiresAt,
    expiresIn:  "60s",
    note:       "Token is single-use and expires in 60s. Include as Authorization: Bearer <token> in your proxied request.",
  };
}

/**
 * Resolve a token — used internally by the vault proxy.
 * Token is consumed (single-use) on success.
 */
function resolveToken(token) {
  const cap = _tokens.get(token);
  if (!cap) return { valid: false, reason: "Token not found or already used" };
  if (cap.expiresAt < Date.now()) {
    _tokens.delete(token);
    return { valid: false, reason: "Token expired" };
  }

  const secret = db.getVaultSecret(cap.secretId);
  if (!secret) {
    _tokens.delete(token);
    return { valid: false, reason: "Secret no longer exists" };
  }

  let value;
  try {
    value = _decrypt({ ciphertext: secret.ciphertext, iv: secret.iv, tag: secret.tag });
  } catch (e) {
    _tokens.delete(token);
    return { valid: false, reason: "Decryption failed" };
  }

  _tokens.delete(token); // single-use
  return { valid: true, value, secretType: cap.secretType, agentId: cap.agentId };
}

/**
 * Get grant history for an agent.
 */
function getGrants(agentId) {
  return db.getVaultGrants(agentId);
}

module.exports = { storeSecret, listSecrets, deleteSecret, requestCapability, resolveToken, getGrants };
