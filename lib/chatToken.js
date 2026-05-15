import { createHash, randomBytes } from "crypto";

/**
 * Derives a pepper from NEXTAUTH_SECRET for HMAC-like token hashing.
 * If secret absent, logs warning and uses static pepper (weak, dev-only).
 * Production deployments must have NEXTAUTH_SECRET set in docker-compose or .env.
 */
function getPepper() {
  if (!process.env.NEXTAUTH_SECRET) {
    if (process.env.NODE_ENV === "production") {
      console.error("[chatToken] CRITICAL: NEXTAUTH_SECRET is not set in production. Token hashing is insecure.");
    } else {
      console.warn("[chatToken] NEXTAUTH_SECRET not set — token hashing uses a static pepper. Set the env var for production.");
    }
    return "dms-chat:static-pepper-v1";
  }
  return `dms-chat:${process.env.NEXTAUTH_SECRET}`;
}

/**
 * Hash a conversation token using SHA-256 with pepper.
 * Only the hash is stored in DB — never the raw token.
 * @param {string} token
 * @returns {string} hex digest
 */
export function hashToken(token) {
  const pepper = getPepper();
  return createHash("sha256").update(`${pepper}:${token}`).digest("hex");
}

/**
 * Verify a raw token against a stored hash.
 * Constant-time safe via hash comparison (both same-length hex strings).
 * @param {string} token
 * @param {string} storedHash
 * @returns {boolean}
 */
export function verifyToken(token, storedHash) {
  const candidate = hashToken(token);
  // Compare fixed-length hex strings to avoid timing side-channels.
  if (candidate.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Generate a cryptographically random URL-safe token.
 * @returns {string}
 */
export function generateToken() {
  return randomBytes(32).toString("base64url");
}
