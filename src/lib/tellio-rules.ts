export type IdentityMode = "anonymous" | "pseudonym" | "named";
export type LinkType = "private_threads" | "group_feed";
export type AccessMode = "open" | "approval_first" | "named_only";
export type FeedVisibility = "owner_only" | "curated";

const ADJECTIVES = [
  "Amber", "Azure", "Blue", "Bright", "Calm", "Cedar", "Clear", "Coral",
  "Crisp", "Dusk", "Echo", "Fern", "Gold", "Harbor", "Indigo", "Ivory",
  "Jade", "Kind", "Linen", "Maple", "Mint", "Misty", "Noble", "Olive",
  "Pearl", "Pine", "Quiet", "River", "Sage", "Silver", "Sunny", "Teal",
] as const;

const ANIMALS = [
  "Badger", "Crane", "Deer", "Dove", "Eagle", "Falcon", "Finch", "Fox",
  "Gecko", "Hawk", "Heron", "Ibex", "Jay", "Kestrel", "Koala", "Lark",
  "Lemur", "Lynx", "Marten", "Newt", "Oriole", "Osprey", "Otter", "Owl",
  "Panda", "Puffin", "Quail", "Robin", "Seal", "Swift", "Tern", "Wren",
] as const;

export const PROMPT_TEMPLATES = [
  "What is one thing I could do better this month?",
  "Ask me something you have been curious about.",
  "Share honest feedback you wish more people gave.",
  "What topic would you love to hear my take on?",
  "Tell me a win or lesson from your week.",
  "If you could give me one piece of candid advice, what would it be?",
  "What is working well right now, and what feels off?",
  "Leave a thoughtful question for the next conversation.",
] as const;

export function pickRandomPrompt(current?: string): string {
  const candidates = PROMPT_TEMPLATES.filter((p) => p !== current);
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx] ?? PROMPT_TEMPLATES[0];
}

export function generateAliasFromHex(seedHex: string): string {
  const clean = seedHex.replace(/[^a-f0-9]/gi, "").padEnd(8, "0");
  const a = parseInt(clean.slice(0, 4), 16) % ADJECTIVES.length;
  const b = parseInt(clean.slice(4, 8), 16) % ANIMALS.length;
  const adj = ADJECTIVES[a] ?? "Blue";
  const animal = ANIMALS[b] ?? "Fox";
  return `${adj} ${animal}`;
}

export function normalizeHandle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_-]/g, "");
}

export function isValidHandle(handle: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{2,29}$/.test(handle);
}

export function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,39}$/.test(slug);
}

export function normalizeRecoveryCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatIdentityLabel(
  mode: IdentityMode,
  alias: string,
  displayName?: string | null,
): string {
  const trimmed = displayName?.trim() ?? "";
  if (mode === "named" && trimmed) return `${trimmed} (self-declared)`;
  if (mode === "pseudonym" && trimmed) return `${trimmed} (chosen name)`;
  return alias;
}

export function validateIdentityChoice(params: {
  mode: IdentityMode;
  displayName?: string | undefined;
  allowedIdentities: string[];
  access: string;
}): { ok: true; cleanName: string | null } | { ok: false; error: string } {
  const { mode, displayName, allowedIdentities, access } = params;
  if (access === "named_only" && mode === "anonymous") {
    return { ok: false, error: "This link requires a chosen name or real name." };
  }
  if (!allowedIdentities.includes(mode)) {
    return { ok: false, error: "This identity option is not enabled on this link." };
  }
  const cleanName = displayName?.trim() ?? "";
  if ((mode === "pseudonym" || mode === "named") && cleanName.length < 2) {
    return {
      ok: false,
      error: mode === "named" ? "Please enter your name (at least 2 characters)." : "Please enter a chosen name (at least 2 characters).",
    };
  }
  if (cleanName.length > 60) {
    return { ok: false, error: "Name must be 60 characters or fewer." };
  }
  return { ok: true, cleanName: mode === "anonymous" ? null : cleanName };
}

const SELF_HARM_PATTERNS = [
  /\b(kill myself|end my life|suicide|want to die|self[- ]?harm|hurt myself)\b/i,
];

export function containsSelfHarmSignal(body: string): boolean {
  return SELF_HARM_PATTERNS.some((re) => re.test(body));
}

export function evaluateMessageModeration(
  body: string,
  keywordFilters: string[],
): { state: "visible" | "pending_review"; matchedKeyword: string | null } {
  const lower = body.toLowerCase();
  for (const rawWord of keywordFilters) {
    const word = rawWord.trim().toLowerCase();
    if (word.length >= 2 && lower.includes(word)) {
      return { state: "pending_review", matchedKeyword: word };
    }
  }
  return { state: "visible", matchedKeyword: null };
}

export function parseKeywordInput(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[,\n]+/)
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length >= 2 && w.length <= 40),
    ),
  ).slice(0, 50);
}