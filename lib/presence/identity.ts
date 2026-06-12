/** Per-tab (sessionStorage) — localStorage would reuse one peerId across tabs and break presence. */
const IDENTITY_KEY = 'trellis-playground-presence-identity';

const ADJECTIVES = [
  'Agile',
  'Bold',
  'Calm',
  'Clever',
  'Daring',
  'Eager',
  'Feisty',
  'Gentle',
  'Happy',
  'Jolly',
  'Keen',
  'Lively',
  'Merry',
  'Noble',
  'Quick',
  'Sharp',
  'Sunny',
  'Swift',
  'Wise',
  'Zesty',
];

const ANIMALS = [
  'Badger',
  'Bear',
  'Crane',
  'Dolphin',
  'Eagle',
  'Falcon',
  'Fox',
  'Hawk',
  'Koala',
  'Lynx',
  'Otter',
  'Panda',
  'Raven',
  'Tiger',
  'Wolf',
  'Zebra',
];

const COLORS = ['#0f62fe', '#ee5396', '#42be65', '#ff832b', '#a56eff', '#08bdba'];

export interface PresenceIdentity {
  peerId: string;
  name: string;
  color: string;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function mintIdentity(): PresenceIdentity {
  const peerId = crypto.randomUUID();
  const seed = hashString(peerId);
  const name = `${ADJECTIVES[seed % ADJECTIVES.length]} ${ANIMALS[(seed >> 8) % ANIMALS.length]}`;
  return {
    peerId,
    name,
    color: COLORS[seed % COLORS.length],
  };
}

/**
 * Anonymous identity per tab (Google Docs–style names).
 * sessionStorage keeps peerId unique per tab while surviving soft reloads in that tab.
 */
export function getOrCreatePresenceIdentity(): PresenceIdentity {
  const stored = sessionStorage.getItem(IDENTITY_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as PresenceIdentity;
      if (parsed.peerId && parsed.name && parsed.color) return parsed;
    } catch {
      /* mint fresh */
    }
  }
  const identity = mintIdentity();
  sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  return identity;
}

export function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}
