const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomHex(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateRecoveryCode(): { display: string; normalized: string } {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  const chars = Array.from(arr, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length] ?? "A");
  const part1 = chars.slice(0, 4).join("");
  const part2 = chars.slice(4, 8).join("");
  const display = `TL-${part1}-${part2}`;
  return { display, normalized: `TL${part1}${part2}` };
}

function getChallengeSecret(): string {
  return process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "tellio-challenge";
}

export interface HumanChallenge {
  prompt: string;
  token: string;
}

export async function createHumanChallenge(): Promise<HumanChallenge> {
  const nums = new Uint8Array(2);
  crypto.getRandomValues(nums);
  const a = 2 + ((nums[0] ?? 3) % 8);
  const b = 1 + ((nums[1] ?? 4) % 8);
  const exp = Date.now() + 15 * 60 * 1000;
  const answer = String(a + b);
  const sig = await sha256Hex(`${exp}:${answer}:${getChallengeSecret()}`);
  return {
    prompt: `Quick check: what is ${a} + ${b}?`,
    token: `${exp}.${sig.slice(0, 32)}`,
  };
}

export async function verifyHumanChallenge(token: string, answer: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const exp = Number(parts[0]);
  const sig = parts[1];
  if (!Number.isFinite(exp) || !sig || Date.now() > exp) return false;
  const cleaned = answer.trim();
  if (!/^\d{1,3}$/.test(cleaned)) return false;
  const expected = await sha256Hex(`${exp}:${cleaned}:${getChallengeSecret()}`);
  return expected.slice(0, 32) === sig;
}

export function parseCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function buildDeviceCookieHeader(token: string): string {
  return `tellio_device=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;
}