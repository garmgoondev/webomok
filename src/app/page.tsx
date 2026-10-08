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
} from 'lucide-react';
import GomokuBoard from '../components/GomokuBoard';
import SeoContentSection from '../components/SeoContentSection';
import {
  AIDifficulty,
  BoardState,
  GameMode,
  GameStatus,
  Move,
  Player,
  RuleMode,
} from '../lib/types';
import { createEmptyBoard, checkWin } from '../lib/renju';
import { calculateAIMove } from '../lib/ai';
import { soundManager } from '../lib/audio';

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
  const [, startTransition] = useTransition();

  const aiPlayer: Player = 'white';
  const lastMove: Move | null = history.length > 0 ? history[history.length - 1] : null;

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

  // Execute stone placement
  const handlePlaceStone = (x: number, y: number) => {
    if (gameStatus !== 'playing' || isThinking || board[y][x] !== null) return;

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
      setGameStatus(currentPlayer === 'black' ? 'black_win' : 'white_win');
      soundManager.playWin();
      return;
    }

    // Check Draw (Board Full)
    if (newHistory.length >= 15 * 15) {
      setGameStatus('draw');
      return;
    }

    const nextPlayer: Player = currentPlayer === 'black' ? 'white' : 'black';
    setCurrentPlayer(nextPlayer);

    // If AI Mode and next player is AI, trigger AI calculation
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
            setGameStatus('white_win');
            soundManager.playWin();
          } else if (newHistory.length + 1 >= 15 * 15) {
            setGameStatus('draw');
          } else {
            setCurrentPlayer('black');
          }
          setIsThinking(false);
        });
      }, 380);
    }
  };

  // Undo (무르기)
  const handleUndo = () => {
    if (history.length === 0 || isThinking) return;

    let targetHistory: Move[];
    let nextTurn: Player = 'black';

    if (gameMode === 'ai') {
      // In AI mode, undo both AI and player moves (2 moves)
      if (history.length >= 2) {
        targetHistory = history.slice(0, -2);
      } else {
        targetHistory = [];
      }
      nextTurn = 'black';
    } else {
      // In 2P mode, undo 1 move
      targetHistory = history.slice(0, -1);
      nextTurn = currentPlayer === 'black' ? 'white' : 'black';
    }

    // Reconstruct board
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
      setGameStatus(winner);
      soundManager.playWin();
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
    const text = `[웹오목] ${history.length}수 만에 ${winnerText}! 설치 없이 브라우저에서 바로 즐기는 무료 오목: https://webomok.com`;

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

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 pb-20">
      {/* 1. Global Navigation Bar */}
      <header className="w-full max-w-5xl mx-auto px-4 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-slate-950 shadow-lg text-lg">
            五
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">
                WebOmok
              </span>
              <span className="text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                웹오목
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              설치 없는 무료 2인용 온라인 오목 &amp; 인공지능 대국
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            aria-label={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/80 cursor-pointer"
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/80 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>규칙 안내</span>
          </a>
        </div>
      </header>

      {/* 2. Main Game Arena */}
      <main className="w-full max-w-4xl mx-auto px-4 mt-6 flex flex-col items-center">
        {/* Game Mode Tabs */}
        <nav aria-label="게임 모드 선택" className="w-full flex justify-center mb-5">
          <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
            <button
              onClick={() => {
                setGameMode('ai');
                resetGame();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                gameMode === 'ai'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>AI 대국</span>
            </button>
            <button
              onClick={() => {
                setGameMode('pass_and_play');
                resetGame();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                gameMode === 'pass_and_play'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>1기기 2인 대전</span>
            </button>
            <button
              onClick={() => {
                setGameMode('friend_link');
                resetGame();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                gameMode === 'friend_link'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>친구 초대 대전</span>
            </button>
          </div>
        </nav>

        {/* Dynamic Mode Sub-Options Bar */}
        <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          {/* Left Sub-Options: Difficulty or Invite */}
          {gameMode === 'ai' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">AI 난이도:</span>
              <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
                {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((level) => {
                  const label =
                    level === 'easy' ? '입문' : level === 'medium' ? '중급' : '마스터';
                  return (
                    <button
                      key={level}
                      onClick={() => setAiDifficulty(level)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        aiDifficulty === level
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
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

          {gameMode === 'friend_link' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyInviteLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>초대 링크 복사</span>
              </button>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                방 코드: <code className="text-amber-400 font-mono">{roomId}</code>
              </span>
            </div>
          )}

          {gameMode === 'pass_and_play' && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>하나의 기기에서 두 사람이 번갈아 착수합니다.</span>
            </div>
          )}

          {/* Right Sub-Options: Rule Selection */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-400 font-medium">규칙:</span>
            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setRuleMode('renju')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  ruleMode === 'renju'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="흑 3-3, 4-4, 장목 금수 (대회 공식 룰)"
              >
                렌주룰 (공식)
              </button>
              <button
                onClick={() => setRuleMode('free')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  ruleMode === 'free'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
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
          <div className="mb-4 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-amber-400" />
            <span>{copiedNotice}</span>
          </div>
        )}

        {/* Turn Status & Game Action Controls */}
        <div className="w-full max-w-2xl flex items-center justify-between px-2 mb-3">
          {/* Turn Indicator */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-5 h-5 rounded-full border border-slate-600 shadow-md ${
                currentPlayer === 'black'
                  ? 'bg-gradient-to-br from-zinc-800 to-black'
                  : 'bg-gradient-to-br from-white to-zinc-300'
              }`}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  {currentPlayer === 'black' ? '흑돌(선공)' : '백돌(후공)'} 차례
                </span>
                {isThinking && (
                  <span className="text-[11px] text-amber-400 font-semibold animate-pulse">
                    (AI 연산 중...)
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                수순: {history.length}수 {lastMove && `(최근: ${String.fromCharCode(65 + lastMove.x)}${15 - lastMove.y})`}
              </span>
            </div>
          </div>

          {/* Action Buttons: Undo, Reset, Resign */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleUndo}
              disabled={history.length === 0 || isThinking || gameStatus !== 'playing'}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-300 transition-colors border border-slate-700 cursor-pointer"
              title="한 수 무르기"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">무르기</span>
            </button>

            <button
              onClick={resetGame}
              disabled={isThinking}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-slate-300 transition-colors border border-slate-700 cursor-pointer"
              title="판 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">다시 시작</span>
            </button>

            <button
              onClick={handleResign}
              disabled={history.length === 0 || isThinking || gameStatus !== 'playing'}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-red-300 transition-colors border border-red-800/60 cursor-pointer"
              title="기권하기"
            >
              <Flag className="w-3.5 h-3.5" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-5">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <Trophy className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {gameStatus === 'black_win'
                    ? '흑돌(●) 승리! 🎉'
                    : gameStatus === 'white_win'
                    ? '백돌(○) 승리! 🎉'
                    : '무승부입니다! 🤝'}
                </h3>
                <p className="text-xs text-slate-400">
                  총 {history.length}수 만에 승부가 결정되었습니다.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">적용 규칙</span>
                  <span className="font-semibold text-amber-400">
                    {ruleMode === 'renju' ? '렌주룰 (공식 금수)' : '자유룰'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">대국 모드</span>
                  <span className="font-semibold text-slate-200">
                    {gameMode === 'ai'
                      ? `AI 대국 (${aiDifficulty === 'easy' ? '입문' : aiDifficulty === 'medium' ? '중급' : '마스터'})`
                      : gameMode === 'pass_and_play'
                      ? '1기기 2인 대전'
                      : '친구 초대 대전'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={resetGame}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg cursor-pointer"
                >
                  새 게임 시작하기
                </button>
                <button
                  onClick={handleShareResult}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>결과 복사 / 공유하기</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Comprehensive 2,500+ Word SEO Guide & Family Network Section */}
        <div id="guide" className="w-full">
          <SeoContentSection />
        </div>
      </main>
    </div>
  );
}
