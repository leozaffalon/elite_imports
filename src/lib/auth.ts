import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "gdc_admin_session";
const SESSION_AGE_SECONDS = 60 * 60 * 12; // 12 horas

type SessionPayload = {
  username: string;
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET nao definido. Crie no arquivo .env.local");
  }

  return secret;
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

function decodePayload(payload: string): SessionPayload | null {
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as SessionPayload;
  } catch {
    return null;
  }
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function createSessionToken(username: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload = encodePayload({ username, exp: now + SESSION_AGE_SECONDS });
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [payloadB64, signature] = token.split(".");

  if (!payloadB64 || !signature) {
    return null;
  }

  const expectedSignature = sign(payloadB64);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  const payload = decodePayload(payloadB64);

  if (!payload) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    return null;
  }

  return payload;
}

export async function requireAdminSession() {
  const session = cookies().get(COOKIE_NAME)?.value;
  return verifySessionToken(session);
}

export function getCookieName() {
  return COOKIE_NAME;
}

export function getSessionAgeSeconds() {
  return SESSION_AGE_SECONDS;
}
