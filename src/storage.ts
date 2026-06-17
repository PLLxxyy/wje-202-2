import { FishingRecord, SpotInfo } from './types';

const RECORDS_KEY = 'fishing-log-records';
const SPOTS_KEY = 'fishing-log-spots';

const PLACEHOLDER_COLORS: Record<number, string> = {
  1: '#74c69d',
  2: '#6fb0e0',
  3: '#f4a261',
  4: '#80ed99',
  5: '#f48fb1',
};

function createPlaceholderSVG(color: string, emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.7"/>
      <stop offset="100%" style="stop-color:${color};stop-opacity:1"/>
    </linearGradient></defs>
    <rect width="200" height="200" fill="url(#g)"/>
    <text x="100" y="120" font-size="80" text-anchor="middle">${emoji}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function migrateRecord(record: any): FishingRecord {
  if ('photoData' in record && typeof record.photoData === 'string') {
    return record as FishingRecord;
  }
  const photoIndex = record.photoIndex || 1;
  const color = PLACEHOLDER_COLORS[photoIndex] || PLACEHOLDER_COLORS[1];
  const emoji = getFishEmoji(record.fishSpecies);
  return {
    ...record,
    photoData: createPlaceholderSVG(color, emoji),
  };
}

export function loadRecords(): FishingRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const migrated = parsed.map(migrateRecord);
    const hasChanged = parsed.some((r: any) => !('photoData' in r));
    if (hasChanged) {
      saveRecords(migrated);
    }
    return migrated;
  } catch {
    return [];
  }
}

export function saveRecords(records: FishingRecord[]) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function loadSpots(): SpotInfo[] {
  try {
    const raw = localStorage.getItem(SPOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSpots(spots: SpotInfo[]) {
  localStorage.setItem(SPOTS_KEY, JSON.stringify(spots));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`;
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return (grams / 1000).toFixed(1) + 'kg';
  }
  return grams + 'g';
}

export function getMonthLabel(year: number, month: number): string {
  return `${year}年${month}月`;
}

export function getFishEmoji(species: string): string {
  const emojis: Record<string, string> = {
    '鲫鱼': '🐟', '鲤鱼': '🐠', '草鱼': '🐟', '鲢鱼': '🐟',
    '鳙鱼': '🐟', '鲈鱼': '🐟', '黑鱼': '🐍', '鲶鱼': '🐟',
    '翘嘴': '🐟', '鳊鱼': '🐟', '黄颡鱼': '🐟', '罗非鱼': '🐟',
  };
  return emojis[species] || '🐟';
}

export async function compressImage(file: File, maxWidth: number = 1280, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

export function getPlaceholderPhoto(fishSpecies: string): string {
  const colorIndex = Math.ceil(Math.random() * 5);
  const color = PLACEHOLDER_COLORS[colorIndex] || PLACEHOLDER_COLORS[1];
  return createPlaceholderSVG(color, getFishEmoji(fishSpecies));
}
