// Online Matchmaking Engine (Real Player P2P/API Match + Realistic Global Ladder Simulation)
// Client & Server friendly

import { countryCodeToFlag, getCountryNameKo } from './user';
import { OnlineOpponent } from './types';

// Realistic pool of actual user-like nicknames from Korea and around the world
const REALISTIC_OPPONENTS_SEED: Array<{ nickname: string; countryCode: string }> = [
  // Korean everyday & casual nicknames
  { nickname: '민우98', countryCode: 'KR' },
  { nickname: '퇴근하고한판', countryCode: 'KR' },
  { nickname: '지호_02', countryCode: 'KR' },
  { nickname: '초코칩쿠키', countryCode: 'KR' },
  { nickname: '서연이', countryCode: 'KR' },
  { nickname: '졸린강아지', countryCode: 'KR' },
  { nickname: '예준_kr', countryCode: 'KR' },
  { nickname: '귤까먹는중', countryCode: 'KR' },
  { nickname: '도현22', countryCode: 'KR' },
  { nickname: '산책가자', countryCode: 'KR' },
  { nickname: '오목초보에용', countryCode: 'KR' },
  { nickname: '커피마시는곰', countryCode: 'KR' },
  { nickname: '하은02', countryCode: 'KR' },
  { nickname: '새벽두시', countryCode: 'KR' },
  { nickname: '치킨먹고싶다', countryCode: 'KR' },
  { nickname: '성민_', countryCode: 'KR' },
  { nickname: '유찬_97', countryCode: 'KR' },
  { nickname: '소금빵러버', countryCode: 'KR' },
  { nickname: '수현입니다', countryCode: 'KR' },
  { nickname: '오늘도연승각', countryCode: 'KR' },
  { nickname: '행복한쿼카', countryCode: 'KR' },
  { nickname: '퇴근길오목', countryCode: 'KR' },
  { nickname: '준서99', countryCode: 'KR' },
  { nickname: '잠실사는곰', countryCode: 'KR' },
  { nickname: '아아메수혈', countryCode: 'KR' },
  { nickname: '다은이', countryCode: 'KR' },
  { nickname: '돌하나', countryCode: 'KR' },
  { nickname: '착수완료', countryCode: 'KR' },
  { nickname: '삼삼금수조심', countryCode: 'KR' },
  { nickname: '한판만더', countryCode: 'KR' },
  { nickname: '오목조아', countryCode: 'KR' },
  { nickname: '흑백요리사', countryCode: 'KR' },
  { nickname: '시우04', countryCode: 'KR' },
  { nickname: '수읽기장인', countryCode: 'KR' },

  // Global & English realistic player handles
  { nickname: 'jordan_92', countryCode: 'US' },
  { nickname: 'alex_c', countryCode: 'US' },
  { nickname: 'sarah_m', countryCode: 'US' },
  { nickname: 'david_w', countryCode: 'US' },
  { nickname: 'sammy_k', countryCode: 'US' },
  { nickname: 'ryan_b', countryCode: 'CA' },
  { nickname: 'mike_gomoku', countryCode: 'CA' },
  { nickname: 'oliver_95', countryCode: 'GB' },
  { nickname: 'charlie_ldn', countryCode: 'GB' },
  { nickname: 'kenji_to', countryCode: 'JP' },
  { nickname: 'sakura_yuki', countryCode: 'JP' },
  { nickname: 'daiki_99', countryCode: 'JP' },
  { nickname: 'yuto_omok', countryCode: 'JP' },
  { nickname: 'chen_tw', countryCode: 'TW' },
  { nickname: 'lin_taipei', countryCode: 'TW' },
  { nickname: 'minh_hanoi', countryCode: 'VN' },
  { nickname: 'nguyen_v', countryCode: 'VN' },
  { nickname: 'm_schmidt', countryCode: 'DE' },
  { nickname: 'lucas_paris', countryCode: 'FR' },
  { nickname: 'matheus_br', countryCode: 'BR' },
  { nickname: 'felix99', countryCode: 'AU' },
];

/**
 * Generate a realistic user-like opponent closely matched to player's current rating (within +-18 RP)
 */
export function generateMatchedOpponent(playerRating: number): OnlineOpponent {
  const seed = REALISTIC_OPPONENTS_SEED[Math.floor(Math.random() * REALISTIC_OPPONENTS_SEED.length)];
  // Tightly matched to current rating (narrow spread of -18 to +18 RP)
  const variance = Math.floor(Math.random() * 37) - 18;
  const rating = Math.max(900, Math.min(2400, playerRating + variance));

  return {
    id: `opp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    nickname: seed.nickname,
    countryCode: seed.countryCode,
    countryName: getCountryNameKo(seed.countryCode),
    countryFlag: countryCodeToFlag(seed.countryCode),
    rating,
    isBot: true,
  };
}

export type MatchState = 'idle' | 'searching' | 'matched' | 'playing' | 'disconnected';

export interface MatchSession {
  peerId: string;
  opponent: OnlineOpponent | null;
  isHost: boolean;
  conn: any | null;
}
