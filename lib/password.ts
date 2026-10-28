const ITERATIONS = 100_000;

export function passwordError(raw: unknown) {
  const password = String(raw ?? "");
  if (password.length < 8 || password.length > 64) return "密码用 8 到 64 位。";
  return null;
}

function bytesToB64(bytes: Uint8Array) {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
}

function b64ToBytes(value: string) {
  const text = atob(value);
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) bytes[index] = text.charCodeAt(index);
  return bytes;
}

function sameBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let index = 0; index < a.length; index += 1) out |= a[index] ^ b[index];
  return out === 0;
}

function bufferOf(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const material = new TextEncoder().encode(password);
  const key = await crypto.subtle.importKey("raw", bufferOf(material), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: bufferOf(salt), iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${bytesToB64(salt)}$${bytesToB64(bits)}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [scheme, rounds, saltB64, hashB64] = stored.split("$");
  const iterations = Number(rounds);
  if (scheme !== "pbkdf2" || !saltB64 || !hashB64 || !Number.isFinite(iterations) || iterations < 10_000) return false;
  try {
    const actual = await derive(password, b64ToBytes(saltB64), iterations);
    return sameBytes(actual, b64ToBytes(hashB64));
  } catch {
    return false;
  }
}
