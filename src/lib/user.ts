// User Profile, Rating (ELO), Geolocation, and Match History

export interface MatchRecord {
  id: string;
  timestamp: number;
  opponentName: string;
  opponentCountry: string;
  opponentRating: number;
  result: 'win' | 'loss' | 'draw';
  ratingChange: number;
  newRating: number;
  totalMoves: number;
  gameMode: string;
}

export interface UserProfile {
  id: string;
  isGuest: boolean;
  nickname: string;
  email?: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  rating: number;
  peakRating: number;
  wins: number;
  losses: number;
  draws: number;
  matchHistory: MatchRecord[];
}

// Country code to Flag emoji helper
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  const upper = code.toUpperCase();
  const first = upper.charCodeAt(0) - 65 + 0x1f1e6;
  const second = upper.charCodeAt(1) - 65 + 0x1f1e6;
  try {
    return String.fromCodePoint(first, second);
  } catch {
    return '🌐';
  }
}

// Country Korean Name Mapping
export const COUNTRY_NAMES_KO: Record<string, string> = {
  KR: '대한민국',
  US: '미국',
  JP: '일본',
  CN: '중국',
  TW: '대만',
  VN: '베트남',
  TH: '태국',
  PH: '필리핀',
  ID: '인도네시아',
  MY: '말레이시아',
  SG: '싱가포르',
  CA: '캐나다',
  GB: '영국',
  DE: '독일',
  FR: '프랑스',
  AU: '호주',
  NZ: '뉴질랜드',
  BR: '브라질',
  RU: '러시아',
  IN: '인도',
};

export function getCountryNameKo(code: string): string {
  return COUNTRY_NAMES_KO[code.toUpperCase()] || code.toUpperCase();
}

// Fetch IP-based Country (Client-side, zero cost)
export async function detectCountry(): Promise<{ code: string; name: string; flag: string }> {
  try {
    // Fast & free HTTPS IP country detector
    const res = await fetch('https://api.country.is/', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const code = data.country || 'KR';
      return {
        code,
        name: getCountryNameKo(code),
        flag: countryCodeToFlag(code),
      };
    }
  } catch {
    // Fallback to secondary if primary fails
    try {
      const res2 = await fetch('https://ipapi.co/json/');
      if (res2.ok) {
        const data2 = await res2.json();
        const code = data2.country_code || 'KR';
        return {
          code,
          name: getCountryNameKo(code),
          flag: countryCodeToFlag(code),
        };
      }
    } catch {
      // offline/blocked fallback
    }
  }

  // Default fallback for South Korea
  return {
    code: 'KR',
    name: '대한민국',
    flag: '🇰🇷',
  };
}

// Tier information based on ELO rating
export interface TierInfo {
  name: string;
  icon: string;
  color: string;
  bgBadge: string;
}

export function getTierInfo(rating: number): TierInfo {
  if (rating >= 1800) {
    return { name: '마스터', icon: '👑', color: 'text-rose-400', bgBadge: 'bg-rose-500/20 border-rose-500/50 text-rose-300' };
  }
  if (rating >= 1600) {
    return { name: '플래티넘', icon: '💎', color: 'text-cyan-400', bgBadge: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' };
  }
  if (rating >= 1400) {
    return { name: '골드', icon: '🥇', color: 'text-amber-400', bgBadge: 'bg-amber-500/20 border-amber-500/50 text-amber-300' };
  }
  if (rating >= 1200) {
    return { name: '실버', icon: '🥈', color: 'text-slate-300', bgBadge: 'bg-slate-500/20 border-slate-400/50 text-slate-200' };
  }
  return { name: '브론즈', icon: '🥉', color: 'text-amber-700', bgBadge: 'bg-amber-900/30 border-amber-700/50 text-amber-500' };
}

// Calculate standard Elo Rating Change
export function calculateEloChange(
  playerRating: number,
  opponentRating: number,
  result: 'win' | 'loss' | 'draw'
): number {
  const K = 32; // Standard rapid chess/omok K-factor
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  let actual = 0.5;
  if (result === 'win') actual = 1.0;
  if (result === 'loss') actual = 0.0;

  const change = Math.round(K * (actual - expected));
  // Guarantee at least +1 on win and -1 on loss unless ratings are extreme
  if (result === 'win' && change <= 0) return 1;
  if (result === 'loss' && change >= 0) return -1;
  return change;
}

// Local Storage Key
const STORAGE_KEY = 'webomok_user_profile_v1';

// Initial default guest profile
export function createDefaultGuest(country = { code: 'KR', name: '대한민국', flag: '🇰🇷' }): UserProfile {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return {
    id: `guest_${Date.now()}_${randomNum}`,
    isGuest: true,
    nickname: `게스트#${randomNum}`,
    countryCode: country.code,
    countryName: country.name,
    countryFlag: country.flag,
    rating: 1200,
    peakRating: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    matchHistory: [],
  };
}

// Load Profile from Local Storage
export function loadUserProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return createDefaultGuest();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.nickname && typeof parsed.rating === 'number') {
        return parsed;
      }
    }
  } catch {
    // JSON parse error
  }

  const guest = createDefaultGuest();
  saveUserProfile(guest);
  return guest;
}

// Save Profile to Local Storage
export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage quota / error
  }
}

// Record match result and update ELO
export function recordMatchResult(
  currentProfile: UserProfile,
  opponent: { nickname: string; countryCode: string; rating: number },
  result: 'win' | 'loss' | 'draw',
  totalMoves: number,
  gameMode: string
): { updatedProfile: UserProfile; ratingChange: number } {
  const ratingChange = calculateEloChange(currentProfile.rating, opponent.rating, result);
  const newRating = Math.max(100, currentProfile.rating + ratingChange);
  const newPeak = Math.max(currentProfile.peakRating, newRating);

  const match: MatchRecord = {
    id: `match_${Date.now()}`,
    timestamp: Date.now(),
    opponentName: opponent.nickname,
    opponentCountry: opponent.countryCode,
    opponentRating: opponent.rating,
    result,
    ratingChange,
    newRating,
    totalMoves,
    gameMode,
  };

  const updatedProfile: UserProfile = {
    ...currentProfile,
    rating: newRating,
    peakRating: newPeak,
    wins: currentProfile.wins + (result === 'win' ? 1 : 0),
    losses: currentProfile.losses + (result === 'loss' ? 1 : 0),
    draws: currentProfile.draws + (result === 'draw' ? 1 : 0),
    matchHistory: [match, ...(currentProfile.matchHistory || [])].slice(0, 30), // keep last 30
  };

  saveUserProfile(updatedProfile);
  return { updatedProfile, ratingChange };
}
