import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db, cleanupExpiredRows } from "./db";
import type { LocalUser } from "@/lib/local-types";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "alc_session";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function parseCookies(request: Request) {
  const header = request.headers.get("cookie") || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index < 0) return [part, ""];
        return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function isHttps(request: Request) {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded) return forwarded === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

function cookieValue(token: string, maxAge: number, secure: boolean) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(maxAge))}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function toPublicUser(row: Record<string, unknown>): LocalUser {
  return {
    id: String(row.id),
    email: String(row.email),
    role: row.role === "admin" ? "admin" : "user",
    status: row.status === "inactive" ? "inactive" : "active",
    created_at: String(row.created_at),
  };
}

export function getSessionUser(request: Request): LocalUser | null {
  cleanupExpiredRows();
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;

  const row = db.prepare(`
    SELECT u.id, u.email, u.role, u.status, u.created_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
    LIMIT 1
  `).get(sha256(token), Date.now()) as Record<string, unknown> | undefined;

  if (!row || row.status !== "active") return null;
  return toPublicUser(row);
}

export function requireAdmin(request: Request) {
  const user = getSessionUser(request);
  return user?.role === "admin" ? user : null;
}

export function createSession(request: Request, userId: string) {
  const token = randomBytes(32).toString("base64url");
  const days = Math.max(1, Number(process.env.SESSION_DAYS || 30));
  const maxAge = days * 24 * 60 * 60;
  const expiresAt = Date.now() + maxAge * 1000;

  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(sha256(token), userId, expiresAt);

  return cookieValue(token, maxAge, isHttps(request));
}

export function destroySession(request: Request) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  return cookieValue("", 0, isHttps(request));
}

export function createResetToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = sha256(token);
  const expiresAt = Date.now() + 30 * 60 * 1000;
  db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(userId);
  db.prepare("INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(tokenHash, userId, expiresAt);
  return token;
}

export function consumeResetToken(token: string) {
  cleanupExpiredRows();
  const tokenHash = sha256(token);
  const row = db.prepare(`
    SELECT user_id FROM password_reset_tokens
    WHERE token_hash = ? AND expires_at > ? AND used_at IS NULL
    LIMIT 1
  `).get(tokenHash, Date.now()) as { user_id: string } | undefined;

  if (!row) return null;
  db.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?")
    .run(Date.now(), tokenHash);
  return row.user_id;
}
