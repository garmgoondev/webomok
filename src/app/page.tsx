'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  RotateCcw,
  Undo2,
  Flag,
  Volume2,
  VolumeX,
  Share2,
  Bot,
  Users,
  Link2,
  HelpCircle,
  Trophy,
  Check,
  Sparkles,
  Globe,
  Radio,
  User,
  Flame,
  Award,
} from 'lucide-react';
import GomokuBoard from '../components/GomokuBoard';
import SeoContentSection from '../components/SeoContentSection';
import LoginModal from '../components/LoginModal';
import {
  AIDifficulty,
  BoardState,
  GameMode,
  GameStatus,
  Move,
  Player,
  RuleMode,
  OnlineOpponent,
} from '../lib/types';
import { createEmptyBoard, checkWin } from '../lib/renju';
import { calculateAIMove } from '../lib/ai';
import { soundManager } from '../lib/audio';
import {
  UserProfile,
  loadUserProfile,
  saveUserProfile,
  detectCountry,
  getTierInfo,
  recordMatchResult,
} from '../lib/user';
import { generateMatchedOpponent } from '../lib/matchmaker';

export default function Home() {
  const [board, setBoard] = useState<BoardState>(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  const [history, setHistory] = useState<Move[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [ruleMode, setRuleMode] = useState<RuleMode>('renju');
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string>('');

  // User Profile & Rating
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [lastRatingChange, setLastRatingChange] = useState<number | null>(null);

  // Online Matchmaking State
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [matchingTime, setMatchingTime] = useState<number>(0);
  const [onlineOpponent, setOnlineOpponent] = useState<OnlineOpponent | null>(null);
  const [playerStoneColor, setPlayerStoneColor] = useState<Player>('black');

  const [, startTransition] = useTransition();

  const aiPlayer: Player = 'white';
  const lastMove: Move | null = history.length > 0 ? history[history.length - 1] : null;

  // Initialize User Profile & Detect IP Country
  useEffect(() => {
    const profile = loadUserProfile();
    setUserProfile(profile);

    // If default country, asynchronously detect actual IP country
    if (profile.countryCode === 'KR') {
      detectCountry().then((detected) => {
        if (detected.code !== profile.countryCode) {
          const updated: UserProfile = {
            ...profile,
            countryCode: detected.code,
            countryName: detected.name,
            countryFlag: detected.flag,
          };
          saveUserProfile(updated);
          setUserProfile(updated);
        }
      });
    }
  }, []);

  // Toggle audio
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
  };

  // Reset Game
  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('black');
    setHistory([]);
    setGameStatus('playing');
    setIsThinking(false);
    setLastRatingChange(null);
  }, []);

  // Generate random room ID on mount or on friend link select
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setRoomId(roomParam);
        setGameMode('friend_link');
      } else {
        setRoomId(Math.random().toString(36).substring(2, 8));
      }
    }
  }, []);

  // BroadcastChannel for cross-tab multiplayer sync in friend mode
  useEffect(() => {
    if (gameMode !== 'friend_link' || !roomId || typeof window === 'undefined') return;

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(`webomok_${roomId}`);
      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'MOVE') {
          const { x, y, player } = payload;
          setBoard((prev) => {
            if (prev[y][x] !== null) return prev;
            const next = prev.map((r) => [...r]);
            next[y][x] = player;
            return next;
          });
          setHistory((prev) => [
            ...prev,
            { x, y, player, moveNumber: prev.length + 1, timestamp: Date.now() },
          ]);
          soundManager.playStoneClick();

          // Check Win on received move
          setBoard((currentB) => {
            const hasWon = checkWin(currentB, x, y, player, ruleMode);
            if (hasWon) {
              setGameStatus(player === 'black' ? 'black_win' : 'white_win');
              soundManager.playWin();
            } else {
              setCurrentPlayer(player === 'black' ? 'white' : 'black');
            }
            return currentB;
          });
        } else if (type === 'RESET') {
          resetGame();
        }
      };
    } catch {
      // BroadcastChannel unsupported fallback
    }

    return () => {
      if (channel) channel.close();
    };
  }, [gameMode, roomId, ruleMode, resetGame]);

  // Online Matchmaking Timer & Simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isMatching) {
      interval = setInterval(() => {
        setMatchingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setMatchingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMatching]);

  // Start Online Match Search
  const handleStartOnlineMatch = () => {
    setIsMatching(true);
    setOnlineOpponent(null);
    resetGame();

    // Match with realistic global ladder opponent after 2.5~4.5s search
    const delay = 2500 + Math.random() * 2000;
    setTimeout(() => {
      const opp = generateMatchedOpponent(userProfile?.rating || 1200);
      setOnlineOpponent(opp);
      setIsMatching(false);

      // Randomize Black / White stone allocation
      const isBlack = Math.random() > 0.4;
      setPlayerStoneColor(isBlack ? 'black' : 'white');
      soundManager.playStoneClick();

      // If user is White, online opponent moves first
      if (!isBlack) {
        setIsThinking(true);
        setTimeout(() => {
          // Play central star point
          const startBoard = createEmptyBoard();
          startBoard[7][7] = 'black';
          setBoard(startBoard);
          setHistory([
            { x: 7, y: 7, player: 'black', moveNumber: 1, timestamp: Date.now() },
          ]);
          setCurrentPlayer('white');
          setIsThinking(false);
          soundManager.playStoneClick();
        }, 1200);
      }
    }, delay);
  };

  // Cancel Matching
  const handleCancelMatching = () => {
    setIsMatching(false);
    setOnlineOpponent(null);
  };

  // Process game end & update rating
  const handleGameEnd = useCallback(
    (status: GameStatus, totalMoves: number) => {
      setGameStatus(status);
      soundManager.playWin();

      if (!userProfile) return;

      // Online Match or AI Mode can update rating
      if (gameMode === 'online_match' && onlineOpponent) {
        const isWin =
          (playerStoneColor === 'black' && status === 'black_win') ||
          (playerStoneColor === 'white' && status === 'white_win');
        const isDraw = status === 'draw';
        const result = isWin ? 'win' : isDraw ? 'draw' : 'loss';

        const { updatedProfile, ratingChange } = recordMatchResult(
          userProfile,
          {
            nickname: onlineOpponent.nickname,
            countryCode: onlineOpponent.countryCode,
            rating: onlineOpponent.rating,
          },
          result,
          totalMoves,
          'online_match'
        );

        setUserProfile(updatedProfile);
        setLastRatingChange(ratingChange);
      } else if (gameMode === 'ai') {
        const isWin = status === 'black_win';
        const isDraw = status === 'draw';
        const result = isWin ? 'win' : isDraw ? 'draw' : 'loss';
        const aiRating =
          aiDifficulty === 'easy' ? 1000 : aiDifficulty === 'medium' ? 1250 : 1550;

        const { updatedProfile, ratingChange } = recordMatchResult(
          userProfile,
          {
            nickname: `AI (${aiDifficulty === 'easy' ? '입문' : aiDifficulty === 'medium' ? '중급' : '마스터'})`,
            countryCode: 'KR',
            rating: aiRating,
          },
          result,
          totalMoves,
          'ai'
        );

        setUserProfile(updatedProfile);
        setLastRatingChange(ratingChange);
      }
    },
    [aiDifficulty, gameMode, onlineOpponent, playerStoneColor, userProfile]
  );

  // Execute stone placement
  const handlePlaceStone = (x: number, y: number) => {
    if (gameStatus !== 'playing' || isThinking || board[y][x] !== null) return;

    // Check if player turn in online match
    if (gameMode === 'online_match') {
      if (currentPlayer !== playerStoneColor) return;
    }

    // Apply Move
    const newBoard = board.map((row) => [...row]);
    newBoard[y][x] = currentPlayer;

    const newMove: Move = {
      x,
      y,
      player: currentPlayer,
      moveNumber: history.length + 1,
      timestamp: Date.now(),
    };
    const newHistory = [...history, newMove];

    setBoard(newBoard);
    setHistory(newHistory);

    // Sync in friend mode
    if (gameMode === 'friend_link' && roomId && typeof window !== 'undefined') {
      try {
        const bc = new BroadcastChannel(`webomok_${roomId}`);
        bc.postMessage({ type: 'MOVE', payload: { x, y, player: currentPlayer } });
        bc.close();
      } catch {
        // BroadcastChannel fallback
      }
    }

    // Check Win
    const hasWon = checkWin(newBoard, x, y, currentPlayer, ruleMode);
    if (hasWon) {
      handleGameEnd(
        currentPlayer === 'black' ? 'black_win' : 'white_win',
        newHistory.length
      );
      return;
    }

    // Check Draw (Board Full)
    if (newHistory.length >= 15 * 15) {
      handleGameEnd('draw', newHistory.length);
      return;
    }

    const nextPlayer: Player = currentPlayer === 'black' ? 'white' : 'black';
    setCurrentPlayer(nextPlayer);

    // 1. If AI Mode and next player is AI, trigger AI calculation
    if (gameMode === 'ai' && nextPlayer === aiPlayer) {
      setIsThinking(true);
      setTimeout(() => {
        startTransition(() => {
          const aiMove = calculateAIMove(newBoard, aiPlayer, aiDifficulty, ruleMode);
          const aiUpdatedBoard = newBoard.map((row) => [...row]);
          aiUpdatedBoard[aiMove.y][aiMove.x] = aiPlayer;

          const aiMoveRecord: Move = {
            x: aiMove.x,
            y: aiMove.y,
            player: aiPlayer,
            moveNumber: newHistory.length + 1,
            timestamp: Date.now(),
          };

          setBoard(aiUpdatedBoard);
          setHistory([...newHistory, aiMoveRecord]);
          soundManager.playStoneClick();

          // Check if AI won
          const aiWon = checkWin(aiUpdatedBoard, aiMove.x, aiMove.y, aiPlayer, ruleMode);
          if (aiWon) {
            handleGameEnd('white_win', newHistory.length + 1);
          } else if (newHistory.length + 1 >= 15 * 15) {
            handleGameEnd('draw', newHistory.length + 1);
          } else {
            setCurrentPlayer('black');
          }
          setIsThinking(false);
        });
      }, 380);
    }

    // 2. If Online Mode and next player is Online Opponent, simulate human-like pace
    if (gameMode === 'online_match' && nextPlayer !== playerStoneColor && onlineOpponent) {
      setIsThinking(true);
      const thinkingMs = 1200 + Math.random() * 1600;

      setTimeout(() => {
        startTransition(() => {
          const opponentDifficulty: AIDifficulty =
            onlineOpponent.rating > 1400
              ? 'hard'
              : onlineOpponent.rating > 1200
              ? 'medium'
              : 'easy';
          const oppMove = calculateAIMove(newBoard, nextPlayer, opponentDifficulty, ruleMode);
          const oppUpdatedBoard = newBoard.map((row) => [...row]);
          oppUpdatedBoard[oppMove.y][oppMove.x] = nextPlayer;

          const oppMoveRecord: Move = {
            x: oppMove.x,
            y: oppMove.y,
            player: nextPlayer,
            moveNumber: newHistory.length + 1,
            timestamp: Date.now(),
          };

          setBoard(oppUpdatedBoard);
          setHistory([...newHistory, oppMoveRecord]);
          soundManager.playStoneClick();

          const oppWon = checkWin(oppUpdatedBoard, oppMove.x, oppMove.y, nextPlayer, ruleMode);
          if (oppWon) {
            handleGameEnd(
              nextPlayer === 'black' ? 'black_win' : 'white_win',
              newHistory.length + 1
            );
          } else if (newHistory.length + 1 >= 15 * 15) {
            handleGameEnd('draw', newHistory.length + 1);
          } else {
            setCurrentPlayer(playerStoneColor);
          }
          setIsThinking(false);
        });
      }, thinkingMs);
    }
  };

  // Undo (무르기)
  const handleUndo = () => {
    if (history.length === 0 || isThinking) return;

    if (gameMode === 'online_match') {
      alert('온라인 랭킹전에서는 무르기가 허용되지 않습니다.');
      return;
    }

    let targetHistory: Move[];
    let nextTurn: Player = 'black';

    if (gameMode === 'ai') {
      if (history.length >= 2) {
        targetHistory = history.slice(0, -2);
      } else {
        targetHistory = [];
      }
      nextTurn = 'black';
    } else {
      targetHistory = history.slice(0, -1);
      nextTurn = currentPlayer === 'black' ? 'white' : 'black';
    }

    const freshBoard = createEmptyBoard();
    targetHistory.forEach((m) => {
      freshBoard[m.y][m.x] = m.player;
    });

    setBoard(freshBoard);
    setHistory(targetHistory);
    setCurrentPlayer(nextTurn);
    setGameStatus('playing');
  };

  // Resign (기권)
  const handleResign = () => {
    if (gameStatus !== 'playing' || history.length === 0) return;
    if (confirm('대국을 기권하시겠습니까?')) {
      const winner = currentPlayer === 'black' ? 'white_win' : 'black_win';
      handleGameEnd(winner, history.length);
    }
  };

  // Copy Friend Invite Link
  const handleCopyInviteLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedNotice('초대 링크가 복사되었습니다! 친구에게 보내보세요.');
      setTimeout(() => setCopiedNotice(null), 3000);
    });
  };

  // Share Game Result
  const handleShareResult = () => {
    const winnerText =
      gameStatus === 'black_win'
        ? '흑돌 승리'
        : gameStatus === 'white_win'
        ? '백돌 승리'
        : '무승부';
    const text = `[웹오목] ${history.length}수 만에 ${winnerText}! 레이팅 ${userProfile?.rating || 1200}RP. 설치 없이 브라우저에서 바로 즐기는 무료 오목: https://webomok.com`;

    if (navigator.share) {
      navigator
        .share({
          title: '웹오목 (WebOmok) 대국 결과',
          text,
          url: 'https://webomok.com',
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedNotice('대국 결과 텍스트가 클립보드에 복사되었습니다!');
        setTimeout(() => setCopiedNotice(null), 3000);
      });
    }
  };

  const tier = userProfile ? getTierInfo(userProfile.rating) : null;

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 pb-24 text-base">
      {/* 1. Global Navigation Bar */}
      <header className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-slate-950 shadow-xl text-xl">
            五
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
                WebOmok
              </span>
              <span className="text-xs sm:text-sm font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                웹오목
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-400 hidden sm:block">
              설치 없는 무료 2인용 온라인 오목 &amp; 인공지능 랭킹 대국
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* User Profile Pill & Rating Button */}
          {userProfile && (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/90 text-left transition shadow-md group cursor-pointer"
              title="내 전적 및 프로필 보기"
            >
              <span className="text-xl sm:text-2xl">{userProfile.countryFlag}</span>
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base text-white flex items-center gap-1 group-hover:text-amber-400 transition-colors">
                  {userProfile.nickname}
                  {tier && <span className="text-xs">{tier.icon}</span>}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-400">
                  {userProfile.rating} <span className="text-[11px] font-normal text-slate-400">RP</span>
                </span>
              </div>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            aria-label={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/80 cursor-pointer"
            title={soundEnabled ? '효과음 켜짐' : '효과음 꺼짐'}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-amber-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* Quick Scroll to Rules */}
          <a
            href="#guide"
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-700/80 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>규칙 안내</span>
          </a>
        </div>
      </header>

      {/* 2. Main Game Arena */}
      <main className="w-full max-w-4xl mx-auto px-4 mt-6 flex flex-col items-center">
        {/* Game Mode Tabs */}
        <nav aria-label="게임 모드 선택" className="w-full flex justify-center mb-6">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl gap-1">
            <button
              onClick={() => {
                setGameMode('online_match');
                setIsMatching(false);
                setOnlineOpponent(null);
                resetGame();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer ${
                gameMode === 'online_match'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>랜덤 온라인 매칭</span>
            </button>

            <button
              onClick={() => {
                setGameMode('ai');
                setIsMatching(false);
                setOnlineOpponent(null);
                resetGame();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer ${
                gameMode === 'ai'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>AI 인공지능 대국</span>
            </button>

            <button
              onClick={() => {
                setGameMode('friend_link');
                setIsMatching(false);
                setOnlineOpponent(null);
                resetGame();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer ${
                gameMode === 'friend_link'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>친구 초대 대전</span>
            </button>

            <button
              onClick={() => {
                setGameMode('pass_and_play');
                setIsMatching(false);
                setOnlineOpponent(null);
                resetGame();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer hidden sm:flex ${
                gameMode === 'pass_and_play'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>1기기 2인 대전</span>
            </button>
          </div>
        </nav>

        {/* Dynamic Mode Sub-Options Bar */}
        <div className="w-full max-w-2xl bg-slate-900/95 border border-slate-800 rounded-2xl p-4 mb-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          {/* Online Match Mode Options */}
          {gameMode === 'online_match' && (
            <div className="flex items-center gap-3">
              {!onlineOpponent && !isMatching && (
                <button
                  onClick={handleStartOnlineMatch}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm sm:text-base transition shadow-md animate-pulse cursor-pointer"
                >
                  <Radio className="w-4 h-4" />
                  <span>상대 찾기 (매칭 시작)</span>
                </button>
              )}

              {isMatching && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm sm:text-base animate-pulse">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                    <span>전 세계 상대 검색 중... ({matchingTime}s)</span>
                  </div>
                  <button
                    onClick={handleCancelMatching}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg border border-slate-700"
                  >
                    취소
                  </button>
                </div>
              )}

              {onlineOpponent && (
                <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-xl">{onlineOpponent.countryFlag}</span>
                  <div className="text-sm">
                    <span className="font-bold text-white">{onlineOpponent.nickname}</span>
                    <span className="text-xs text-amber-400 font-extrabold ml-1.5">
                      {onlineOpponent.rating} RP
                    </span>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold ml-1">
                    매칭됨
                  </span>
                </div>
              )}
            </div>
          )}

          {/* AI Mode Options */}
          {gameMode === 'ai' && (
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-slate-300">AI 난이도:</span>
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-sm">
                {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((level) => {
                  const label =
                    level === 'easy' ? '입문' : level === 'medium' ? '중급' : '마스터';
                  return (
                    <button
                      key={level}
                      onClick={() => setAiDifficulty(level)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                        aiDifficulty === level
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Friend Link Options */}
          {gameMode === 'friend_link' && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyInviteLink}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm sm:text-base hover:bg-amber-400 transition shadow-md cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>초대 링크 복사</span>
              </button>
              <span className="text-sm text-slate-400 hidden sm:inline">
                방 코드: <code className="text-amber-400 font-mono font-bold">{roomId}</code>
              </span>
            </div>
          )}

          {/* Pass & Play Mode Options */}
          {gameMode === 'pass_and_play' && (
            <div className="flex items-center gap-2 text-sm sm:text-base text-slate-300 font-medium">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>한 기기에서 두 사람이 번갈아 착수합니다.</span>
            </div>
          )}

          {/* Right Sub-Options: Rule Selection */}
          <div className="flex items-center gap-2.5 ml-auto">
            <span className="text-sm font-bold text-slate-300">규칙:</span>
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-sm">
              <button
                onClick={() => setRuleMode('renju')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  ruleMode === 'renju'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="흑 3-3, 4-4, 장목 금수 (대회 공식 룰)"
              >
                렌주룰 (공식)
              </button>
              <button
                onClick={() => setRuleMode('free')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  ruleMode === 'free'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="금수 없이 5목 이상 승리"
              >
                자유룰
              </button>
            </div>
          </div>
        </div>

        {/* Copied Notice Banner */}
        {copiedNotice && (
          <div className="mb-4 px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-sm font-bold flex items-center gap-2.5 animate-fadeIn">
            <Check className="w-5 h-5 text-amber-400" />
            <span>{copiedNotice}</span>
          </div>
        )}

        {/* Turn Status & Game Action Controls */}
        <div className="w-full max-w-2xl flex items-center justify-between px-3 mb-3.5">
          {/* Turn Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 border-slate-500 shadow-lg ${
                currentPlayer === 'black'
                  ? 'bg-gradient-to-br from-zinc-800 to-black'
                  : 'bg-gradient-to-br from-white to-zinc-300'
              }`}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-white">
                  {currentPlayer === 'black' ? '흑돌(선공)' : '백돌(후공)'} 차례
                </span>
                {isThinking && (
                  <span className="text-xs sm:text-sm text-amber-400 font-bold animate-pulse">
                    (수 읽는 중...)
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm text-slate-400 font-mono font-medium">
                수순: {history.length}수 {lastMove && `(최근: ${String.fromCharCode(65 + lastMove.x)}${15 - lastMove.y})`}
              </span>
            </div>
          </div>

          {/* Action Buttons: Undo, Reset, Resign */}
          <div className="flex items-center gap-2">
            {gameMode !== 'online_match' && (
              <button
                onClick={handleUndo}
                disabled={history.length === 0 || isThinking || gameStatus !== 'playing'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold text-slate-200 transition border border-slate-700 cursor-pointer"
                title="한 수 무르기"
              >
                <Undo2 className="w-4 h-4" />
                <span className="hidden sm:inline">무르기</span>
              </button>
            )}

            <button
              onClick={resetGame}
              disabled={isThinking}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sm font-bold text-slate-200 transition border border-slate-700 cursor-pointer"
              title="판 초기화"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">다시 시작</span>
            </button>

            <button
              onClick={handleResign}
              disabled={history.length === 0 || isThinking || gameStatus !== 'playing'}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold text-rose-300 transition border border-rose-800/70 cursor-pointer"
              title="기권하기"
            >
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">기권</span>
            </button>
          </div>
        </div>

        {/* 3. Interactive Gomoku Board Component */}
        <div className="w-full flex justify-center">
          <GomokuBoard
            board={board}
            currentPlayer={currentPlayer}
            ruleMode={ruleMode}
            lastMove={lastMove}
            disabled={isThinking || gameStatus !== 'playing'}
            onPlaceStone={handlePlaceStone}
          />
        </div>

        {/* 4. Game Result Modal Dialog */}
        {gameStatus !== 'playing' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                <Trophy className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {gameStatus === 'black_win'
                    ? '흑돌(●) 승리! 🎉'
                    : gameStatus === 'white_win'
                    ? '백돌(○) 승리! 🎉'
                    : '무승부입니다! 🤝'}
                </h3>
                <p className="text-sm sm:text-base text-slate-300">
                  총 {history.length}수 만에 승부가 결정되었습니다.
                </p>
              </div>

              {/* Rating Change Badge */}
              {lastRatingChange !== null && userProfile && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{userProfile.countryFlag}</span>
                    <div className="text-left">
                      <span className="text-sm text-slate-400 block">{userProfile.nickname}</span>
                      <span className="text-base font-bold text-white">
                        {tier?.icon} {tier?.name} 티어
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xl font-black block ${
                        lastRatingChange > 0
                          ? 'text-emerald-400'
                          : lastRatingChange < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {lastRatingChange > 0 ? `+${lastRatingChange}` : lastRatingChange} RP
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{userProfile.rating} RP</span>
                  </div>
                </div>
              )}

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-sm text-slate-300 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">적용 규칙</span>
                  <span className="font-bold text-amber-400">
                    {ruleMode === 'renju' ? '렌주룰 (공식 금수)' : '자유룰'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">대국 모드</span>
                  <span className="font-bold text-slate-200">
                    {gameMode === 'online_match'
                      ? `온라인 랜덤 매칭 (${onlineOpponent?.nickname || '상대'})`
                      : gameMode === 'ai'
                      ? `AI 대국 (${aiDifficulty === 'easy' ? '입문' : aiDifficulty === 'medium' ? '중급' : '마스터'})`
                      : gameMode === 'pass_and_play'
                      ? '1기기 2인 대전'
                      : '친구 초대 대전'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                {gameMode === 'online_match' ? (
                  <button
                    onClick={handleStartOnlineMatch}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-xl cursor-pointer"
                  >
                    다음 상대 찾기 (새 매칭)
                  </button>
                ) : (
                  <button
                    onClick={resetGame}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-xl cursor-pointer"
                  >
                    새 게임 시작하기
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-sm transition border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>내 전적 보기</span>
                  </button>
                  <button
                    onClick={handleShareResult}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>결과 공유</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Login & Profile Modal */}
        {userProfile && (
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            profile={userProfile}
            onUpdateProfile={(newProfile) => setUserProfile(newProfile)}
          />
        )}

        {/* 6. Comprehensive 2,500+ Word SEO Guide & Family Network Section */}
        <div id="guide" className="w-full">
          <SeoContentSection />
        </div>
      </main>
    </div>
  );
}
