// Online Matchmaking Engine (Hybrid P2P WebRTC + Global Ladder Simulation)
// Client-side only with dynamic PeerJS loading to prevent Next.js SSR errors.

import { countryCodeToFlag, getCountryNameKo } from './user';
import { OnlineOpponent } from './types';

// Preset pool of international Gomoku players for instant ladder matching
const GLOBAL_OPPONENTS_SEED: Array<{ nickname: string; countryCode: string; baseRating: number }> = [
  { nickname: '강남_오목신', countryCode: 'KR', baseRating: 1380 },
  { nickname: '한돌_Renju', countryCode: 'KR', baseRating: 1250 },
  { nickname: '돌바람_선수', countryCode: 'KR', baseRating: 1190 },
  { nickname: '서초_백돌마스터', countryCode: 'KR', baseRating: 1420 },
  { nickname: '알파오목9단', countryCode: 'KR', baseRating: 1530 },
  { nickname: '부산갈매기_5목', countryCode: 'KR', baseRating: 1160 },
  { nickname: 'Takumi_Omok', countryCode: 'JP', baseRating: 1310 },
  { nickname: 'RenjuMaster_Tokyo', countryCode: 'JP', baseRating: 1460 },
  { nickname: 'SakuraStone', countryCode: 'JP', baseRating: 1220 },
  { nickname: 'Kenji_92', countryCode: 'JP', baseRating: 1180 },
  { nickname: 'Alex_Gomoku', countryCode: 'US', baseRating: 1270 },
  { nickname: 'SiliconOmok', countryCode: 'US', baseRating: 1390 },
  { nickname: 'SeattleStone', countryCode: 'US', baseRating: 1210 },
  { nickname: 'Chen_Taipei', countryCode: 'TW', baseRating: 1330 },
  { nickname: 'FormosaRenju', countryCode: 'TW', baseRating: 1240 },
  { nickname: 'Nguyen_Hanoi', countryCode: 'VN', baseRating: 1260 },
  { nickname: 'SaigonPlayer', countryCode: 'VN', baseRating: 1190 },
  { nickname: 'Markus_Berlin', countryCode: 'DE', baseRating: 1340 },
  { nickname: 'Pierre_Paris', countryCode: 'FR', baseRating: 1290 },
  { nickname: 'Oliver_London', countryCode: 'GB', baseRating: 1360 },
  { nickname: 'SydneyGomoku', countryCode: 'AU', baseRating: 1280 },
  { nickname: 'TorontoMaster', countryCode: 'CA', baseRating: 1320 },
  { nickname: 'Ivan_Moscow', countryCode: 'RU', baseRating: 1410 },
  { nickname: 'Silva_Rio', countryCode: 'BR', baseRating: 1170 },
  { nickname: 'Aarav_Bangalore', countryCode: 'IN', baseRating: 1230 },
];

/**
 * Generate a realistic opponent closely matched to player's current rating (+-80 RP)
 */
export function generateMatchedOpponent(playerRating: number): OnlineOpponent {
  const seed = GLOBAL_OPPONENTS_SEED[Math.floor(Math.random() * GLOBAL_OPPONENTS_SEED.length)];
  const variance = Math.floor(Math.random() * 90) - 45; // -45 to +45
  const rating = Math.max(900, Math.min(2200, playerRating + variance));

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
