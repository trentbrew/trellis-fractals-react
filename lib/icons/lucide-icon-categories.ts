import {
  LUCIDE_ICON_NAMES,
  type IconName,
} from '@/lib/icons/lucide-icons';

export type LucideIconCategoryRule = {
  /** Display name shown in category headers. */
  label: string;
  /** Searchable synonyms and keywords for this category. */
  tags: readonly string[];
  /** Prefix rules for assigning icons — first match wins. */
  prefixes: readonly string[];
};

/** Ordered rules — first match wins. */
export const CATEGORY_RULES: readonly LucideIconCategoryRule[] = [
  {
    label: 'Arrows & navigation',
    tags: ['arrow', 'arrows', 'navigation', 'nav', 'direction', 'chevron', 'pointer', 'move', 'compass', 'route', 'undo', 'redo'],
    prefixes: ['arrow', 'chevron', 'chevrons', 'move', 'corner', 'navigation', 'compass', 'route', 'signpost', 'milestone', 'locate', 'locate-fixed', 'locate-off', 'undo', 'redo', 'reply', 'forward', 'import', 'export'],
  },
  {
    label: 'Shapes & layout',
    tags: ['shapes', 'shape', 'layout', 'grid', 'align', 'geometry', 'square', 'circle', 'frame', 'panel', 'columns'],
    prefixes: ['square', 'circle', 'triangle', 'hexagon', 'pentagon', 'diamond', 'star', 'align', 'grid', 'layout', 'panel', 'columns', 'rows', 'separator', 'split', 'stretch', 'shrink', 'maximize', 'minimize', 'expand', 'collapse', 'frame', 'ratio', 'crop', 'scan', 'flip', 'rotate', 'layers', 'group', 'ungroup', 'combine', 'component', 'blocks', 'box', 'boxes', 'container', 'cuboid', 'cylinder', 'cone', 'pyramid', 'torus', 'radius', 'radius'],
  },
  {
    label: 'Files & documents',
    tags: ['file', 'files', 'document', 'documents', 'folder', 'archive', 'book', 'paper', 'clipboard', 'notebook'],
    prefixes: ['file', 'folder', 'archive', 'notebook', 'clipboard', 'paperclip', 'sticky', 'notepad', 'scroll', 'receipt', 'newspaper', 'book', 'library', 'bookmark', 'sheet', 'table', 'tab', 'tabs', 'package', 'inbox', 'tray', 'briefcase', 'backpack', 'suitcase'],
  },
  {
    label: 'Text & typography',
    tags: ['text', 'typography', 'font', 'type', 'writing', 'list', 'bold', 'italic', 'heading', 'paragraph'],
    prefixes: ['text', 'type', 'heading', 'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', 'list', 'quote', 'spell', 'case', 'languages', 'letter', 'whole-word', 'wrap', 'pilcrow', 'hash', 'at-sign', 'ampersand', 'a-large-small', 'a-arrow'],
  },
  {
    label: 'Media & audio',
    tags: ['media', 'audio', 'video', 'music', 'image', 'camera', 'play', 'film', 'photo', 'picture', 'sound'],
    prefixes: ['image', 'video', 'music', 'camera', 'mic', 'volume', 'play', 'pause', 'film', 'radio', 'tv', 'cast', 'airplay', 'clapperboard', 'disc', 'album', 'headphones', 'speaker', 'podcast', 'webcam', 'gallery', 'aperture', 'focus', 'shutter', 'captions', 'subtitles', 'fullscreen', 'picture'],
  },
  {
    label: 'Communication',
    tags: ['communication', 'mail', 'email', 'message', 'phone', 'chat', 'contact', 'notify', 'bell', 'share', 'social'],
    prefixes: ['mail', 'message', 'phone', 'send', 'bell', 'chat', 'voicemail', 'rss', 'share', 'megaphone', 'radio-tower', 'satellite', 'antenna', 'contact', 'at-sign', 'speech', 'quote', 'megaphone'],
  },
  {
    label: 'People & accessibility',
    tags: ['people', 'person', 'user', 'users', 'human', 'accessibility', 'a11y', 'wheelchair', 'hand', 'face', 'smile', 'identity'],
    prefixes: ['user', 'users', 'person', 'baby', 'accessibility', 'wheelchair', 'hand', 'fingerprint', 'eye', 'glasses', 'smile', 'frown', 'meh', 'laugh', 'angry', 'heart-hand', 'handshake', 'footprints'],
  },
  {
    label: 'Maps & location',
    tags: ['map', 'maps', 'location', 'pin', 'globe', 'place', 'landmark', 'outdoor', 'travel', 'terrain'],
    prefixes: ['map', 'pin', 'globe', 'earth', 'landmark', 'mountain', 'trees', 'tree', 'palmtree', 'tent', 'campfire', 'fence', 'shovel', 'pickaxe'],
  },
  {
    label: 'Devices & hardware',
    tags: ['device', 'devices', 'hardware', 'computer', 'laptop', 'phone', 'server', 'cloud', 'battery', 'chip', 'tech'],
    prefixes: ['laptop', 'monitor', 'smartphone', 'tablet', 'keyboard', 'mouse', 'printer', 'server', 'cpu', 'hard-drive', 'usb', 'bluetooth', 'wifi', 'router', 'bot', 'battery', 'plug', 'power', 'cable', 'chip', 'circuit', 'memory', 'database', 'cloud', 'cloudy', 'upload', 'download', 'save', 'hard-hat', 'watch', 'nfc', 'sim', 'sd-card', 'disc', 'joystick', 'gamepad', 'controller', 'touchpad', 'webcam', 'projector', 'tv', 'radio', 'speaker', 'headset', 'microscope', 'telescope', 'flashlight', 'lightbulb', 'lamp', 'fan', 'air-vent', 'thermometer', 'heater', 'refrigerator', 'washing', 'dryer', 'microwave', 'oven', 'cooking', 'utensils', 'scale', 'weight'],
  },
  {
    label: 'Weather & nature',
    tags: ['weather', 'nature', 'sun', 'rain', 'snow', 'wind', 'storm', 'animal', 'plant', 'food', 'outdoors'],
    prefixes: ['sun', 'moon', 'cloud', 'rain', 'snow', 'wind', 'storm', 'tornado', 'hurricane', 'rainbow', 'droplet', 'droplets', 'waves', 'leaf', 'flower', 'clover', 'sprout', 'bug', 'fish', 'bird', 'squirrel', 'rabbit', 'cat', 'dog', 'paw', 'bone', 'shell', 'snail', 'worm', 'bee', 'butterfly', 'spider', 'turtle', 'whale', 'dolphin', 'shrub', 'cactus', 'cherry', 'apple', 'banana', 'grape', 'citrus', 'carrot', 'salad', 'egg', 'beef', 'ham', 'pizza', 'sandwich', 'cookie', 'cake', 'candy', 'ice-cream', 'coffee', 'tea', 'beer', 'wine', 'martini', 'milk', 'popcorn', 'nut', 'wheat', 'drumstick'],
  },
  {
    label: 'Time & calendar',
    tags: ['time', 'calendar', 'clock', 'schedule', 'date', 'timer', 'alarm', 'history'],
    prefixes: ['clock', 'calendar', 'timer', 'hourglass', 'alarm', 'watch', 'history', 'calendar-days', 'calendar-range'],
  },
  {
    label: 'Finance & charts',
    tags: ['finance', 'money', 'chart', 'charts', 'bank', 'shopping', 'payment', 'dollar', 'wallet', 'store', 'commerce'],
    prefixes: ['dollar', 'euro', 'pound', 'yen', 'rupee', 'cent', 'percent', 'credit', 'wallet', 'bank', 'chart', 'trending', 'piggy', 'badge', 'coins', 'circle-dollar', 'landmark', 'receipt', 'calculator', 'scale', 'barcode', 'scan-barcode', 'shopping', 'store', 'cart', 'tag', 'tags', 'ticket', 'gift', 'gem', 'crown', 'award', 'medal', 'trophy'],
  },
  {
    label: 'Security & privacy',
    tags: ['security', 'privacy', 'lock', 'key', 'shield', 'password', 'scan', 'protect', 'safe'],
    prefixes: ['lock', 'key', 'shield', 'scan-eye', 'scan-face', 'scan-line', 'scan-search', 'scan-text', 'scan-qr', 'qr-code', 'shield-check', 'shield-alert', 'shield-off', 'shield-ban', 'shield-x', 'shield-plus', 'shield-minus', 'shield-question', 'vault', 'safe', 'siren', 'cctv'],
  },
  {
    label: 'Tools & settings',
    tags: ['tools', 'tool', 'settings', 'config', 'wrench', 'edit', 'pen', 'brush', 'paint', 'gear', 'preferences'],
    prefixes: ['settings', 'wrench', 'hammer', 'tool', 'cog', 'sliders', 'sliders-horizontal', 'gauge', 'construction', 'drill', 'axe', 'scissors', 'ruler', 'pen', 'pencil', 'brush', 'paint', 'palette', 'pipette', 'eraser', 'highlighter', 'marker', 'spray', 'bucket', 'magnet', 'anvil', 'nut', 'bolt', 'link', 'unlink', 'chain', 'anchor', 'hook', 'magnet', 'flashlight', 'flash', 'zap', 'sparkle', 'sparkles', 'wand', 'magic', 'test-tube', 'beaker', 'flask', 'atom', 'dna', 'microscope'],
  },
  {
    label: 'Health & medical',
    tags: ['health', 'medical', 'medicine', 'heart', 'hospital', 'doctor', 'pill', 'pulse', 'care'],
    prefixes: ['heart', 'pulse', 'stethoscope', 'pill', 'syringe', 'cross', 'hospital', 'bandage', 'ambulance', 'activity', 'brain', 'bone', 'ear', 'ear-off', 'nose', 'tooth', 'lungs', 'kidney', 'liver', 'dna', 'thermometer', 'bed', 'bed-double', 'bed-single'],
  },
  {
    label: 'Transport',
    tags: ['transport', 'vehicle', 'car', 'plane', 'train', 'bus', 'bike', 'travel', 'ship', 'traffic'],
    prefixes: ['car', 'bus', 'train', 'plane', 'ship', 'bike', 'truck', 'taxi', 'rocket', 'fuel', 'parking', 'traffic', 'sailboat', 'ferry', 'tram', 'subway', 'motorbike', 'scooter', 'skateboard', 'roller-coaster', 'anchor', 'ship-wheel', 'plane-takeoff', 'plane-landing'],
  },
  {
    label: 'Home & buildings',
    tags: ['home', 'house', 'building', 'furniture', 'interior', 'door', 'room', 'architecture'],
    prefixes: ['home', 'house', 'building', 'hotel', 'school', 'church', 'castle', 'factory', 'warehouse', 'store', 'door', 'door-open', 'door-closed', 'bed', 'bath', 'sofa', 'armchair', 'lamp', 'blinds', 'curtain', 'fence', 'brick', 'fence', 'shovel', 'paint-roller', 'paint-bucket', 'shower', 'toilet', 'sink', 'heater', 'air-conditioner'],
  },
  {
    label: 'Development & git',
    tags: ['development', 'dev', 'code', 'git', 'programming', 'terminal', 'github', 'software', 'engineer'],
    prefixes: ['git', 'github', 'gitlab', 'terminal', 'code', 'code-xml', 'bracket', 'braces', 'binary', 'webhook', 'variable', 'function', 'regex', 'bug', 'cpu', 'database', 'hard-drive', 'server', 'cloud-cog', 'blocks', 'workflow', 'network', 'waypoints', 'route', 'forklift', 'container', 'docker', 'figma', 'framer', 'sketch', 'vscode', 'npm', 'node', 'react', 'vue', 'angular', 'svelte', 'tailwind', 'typescript', 'javascript', 'python', 'java', 'ruby', 'php', 'html', 'css', 'json', 'xml', 'yaml', 'markdown', 'commit', 'merge', 'branch', 'pull-request'],
  },
  {
    label: 'Sports & games',
    tags: ['sports', 'sport', 'games', 'game', 'trophy', 'dice', 'play', 'fitness', 'target'],
    prefixes: ['trophy', 'medal', 'dice', 'gamepad', 'volleyball', 'football', 'basketball', 'baseball', 'tennis', 'golf', 'bowling', 'dumbbell', 'swords', 'target', 'flag', 'flag-triangle', 'puzzle', 'ghost', 'skull', 'bomb', 'flame', 'fire', 'sparkles'],
  },
  {
    label: 'Zodiac',
    tags: ['zodiac', 'astrology', 'horoscope', 'signs', 'stars'],
    prefixes: ['zodiac'],
  },
  {
    label: 'Brands',
    tags: ['brands', 'brand', 'social', 'logo', 'company', 'platform', 'app'],
    prefixes: ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'twitch', 'discord', 'slack', 'spotify', 'apple', 'google', 'microsoft', 'amazon', 'paypal', 'stripe', 'vercel', 'netlify', 'heroku', 'digitalocean', 'cloudflare', 'docker', 'npm', 'chrome', 'firefox', 'safari', 'edge', 'android', 'linux', 'ubuntu', 'windows', 'reddit', 'tiktok', 'pinterest', 'snapchat', 'whatsapp', 'telegram', 'skype', 'zoom', 'dropbox', 'notion', 'figma', 'dribbble', 'behance', 'medium', 'hashnode', 'dev', 'producthunt', 'stack', 'stackoverflow', 'gitlab', 'bitbucket', 'jira', 'confluence', 'trello', 'asana', 'linear', 'monday', 'airbnb', 'uber', 'lyft', 'doordash', 'shopify', 'ebay', 'etsy', 'wordpress', 'webflow', 'squarespace', 'wix', 'ghost', 'supabase', 'firebase', 'mongodb', 'postgresql', 'mysql', 'redis', 'kafka', 'graphql', 'openapi', 'swagger'],
  },
];

const FALLBACK_CATEGORY = 'Other';

const PREFIX_INDEX = new Map<string, string>();
const CATEGORY_TAGS = new Map<string, readonly string[]>();

for (const { label, tags, prefixes } of CATEGORY_RULES) {
  CATEGORY_TAGS.set(label, tags);
  for (const prefix of prefixes) {
    if (!PREFIX_INDEX.has(prefix)) {
      PREFIX_INDEX.set(prefix, label);
    }
  }
}

function categoryLabelMatchesQuery(label: string, q: string): boolean {
  if (label.toLowerCase().includes(q)) return true;
  const tags = CATEGORY_TAGS.get(label);
  return tags?.some((tag) => tag.includes(q)) ?? false;
}

/** Derive a display category from a Lucide icon kebab-case name. */
export function categorizeLucideIcon(name: string): string {
  const segments = name.split('-');
  for (let len = Math.min(segments.length, 3); len >= 1; len--) {
    const prefix = segments.slice(0, len).join('-');
    const category = PREFIX_INDEX.get(prefix);
    if (category) return category;
  }
  return FALLBACK_CATEGORY;
}

export type LucideIconCategoryGroup = {
  category: string;
  icons: IconName[];
};

const CATEGORY_ORDER = [
  ...CATEGORY_RULES.map((rule) => rule.label),
  FALLBACK_CATEGORY,
];

/** Group icon names by semantic category, preserving category order. */
export function groupLucideIconsByCategory(names: readonly IconName[]): LucideIconCategoryGroup[] {
  const buckets = new Map<string, IconName[]>();

  for (const name of names) {
    const category = categorizeLucideIcon(name);
    const list = buckets.get(category);
    if (list) list.push(name);
    else buckets.set(category, [name]);
  }

  return CATEGORY_ORDER.filter((category) => buckets.has(category)).map((category) => ({
    category,
    icons: buckets.get(category)!,
  }));
}

/**
 * Filter icons for picker search.
 * Matches icon names, category labels, and category tags.
 * Full category match includes all icons in that category; partial matches show only matching icons.
 */
export function searchLucideIconsByCategory(query: string): LucideIconCategoryGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groupLucideIconsByCategory(LUCIDE_ICON_NAMES);

  const allGroups = groupLucideIconsByCategory(LUCIDE_ICON_NAMES);
  const fullCategoryMatches = new Set(
    allGroups
      .filter((group) => categoryLabelMatchesQuery(group.category, q))
      .map((group) => group.category),
  );

  const iconsToInclude = new Set<IconName>();

  for (const group of allGroups) {
    if (fullCategoryMatches.has(group.category)) {
      for (const icon of group.icons) iconsToInclude.add(icon);
      continue;
    }

    for (const icon of group.icons) {
      if (icon.includes(q)) iconsToInclude.add(icon);
    }
  }

  return groupLucideIconsByCategory([...iconsToInclude]);
}

/** Grid row height (size-9) + gap-1, in px. */
export const ICON_GRID_ROW_HEIGHT = 40;

/** Sticky category header height, in px. */
export const ICON_CATEGORY_HEADER_HEIGHT = 28;

/** Icons per row in the picker grid. */
export const ICON_GRID_COLUMNS = 8;

/** Estimate section height for scroll placeholders. */
export function estimateCategorySectionHeight(iconCount: number): number {
  const rows = Math.ceil(iconCount / ICON_GRID_COLUMNS);
  return ICON_CATEGORY_HEADER_HEIGHT + rows * ICON_GRID_ROW_HEIGHT + 4;
}
