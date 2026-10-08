'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BoardState, Cell, ForbiddenCheckResult, Move, Player, RuleMode } from '../lib/types';
import { BOARD_SIZE, checkForbiddenMove, isInBoard } from '../lib/renju';
import { soundManager } from '../lib/audio';

interface GomokuBoardProps {
  board: BoardState;
  currentPlayer: Player;
  ruleMode: RuleMode;
  lastMove: Move | null;
  disabled: boolean;
  onPlaceStone: (x: number, y: number) => void;
}

export default function GomokuBoard({
  board,
  currentPlayer,
  ruleMode,
  lastMove,
  disabled,
  onPlaceStone,
}: GomokuBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [forbiddenReason, setForbiddenReason] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<number>(600);

  // Resize canvas responsively according to container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        // Keep square and limit max size
        const size = Math.min(width, 680);
        setCanvasSize(size);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Board drawing logic
  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);

    const padding = canvasSize * 0.06;
    const boardArea = canvasSize - padding * 2;
    const cellSize = boardArea / (BOARD_SIZE - 1);

    // 1. Draw Board Background (Warm premium kaya wood tone)
    ctx.fillStyle = '#E4A657'; // Traditional kaya wood golden tone
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Subtle wood texture grain gradient
    const grad = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.03)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Outer border
    ctx.strokeStyle = '#613E1B';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(padding - 1, padding - 1, boardArea + 2, boardArea + 2);

    // 2. Draw Grid Lines
    ctx.strokeStyle = '#7A4F23';
    ctx.lineWidth = 1;

    for (let i = 0; i < BOARD_SIZE; i++) {
      const pos = padding + i * cellSize;

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(padding, pos);
      ctx.lineTo(padding + boardArea, pos);
      ctx.stroke();

      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(pos, padding);
      ctx.lineTo(pos, padding + boardArea);
      ctx.stroke();
    }

    // 3. Draw 5 Star Points (화점)
    const starPoints = [
      { x: 3, y: 3 },
      { x: 11, y: 3 },
      { x: 7, y: 7 },
      { x: 3, y: 11 },
      { x: 11, y: 11 },
    ];

    ctx.fillStyle = '#5A3616';
    starPoints.forEach(({ x, y }) => {
      const px = padding + x * cellSize;
      const py = padding + y * cellSize;
      ctx.beginPath();
      ctx.arc(px, py, cellSize * 0.1, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Draw Coordinates (A-O, 1-15) along borders
    ctx.fillStyle = '#7A4F23';
    ctx.font = `600 ${Math.max(10, cellSize * 0.28)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cols = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'];
    for (let i = 0; i < BOARD_SIZE; i++) {
      const pos = padding + i * cellSize;
      // Top labels
      ctx.fillText(cols[i], pos, padding * 0.45);
      // Bottom labels
      ctx.fillText(cols[i], pos, canvasSize - padding * 0.45);
      // Left numbers (1-15)
      ctx.fillText(String(15 - i), padding * 0.4, pos);
      // Right numbers
      ctx.fillText(String(15 - i), canvasSize - padding * 0.4, pos);
    }

    // 5. Draw Placed Stones
    const stoneRadius = cellSize * 0.44;

    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const stone = board[y][x];
        if (!stone) continue;

        const cx = padding + x * cellSize;
        const cy = padding + y * cellSize;

        // Shadow under stone
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = cellSize * 0.18;
        ctx.shadowOffsetX = cellSize * 0.08;
        ctx.shadowOffsetY = cellSize * 0.08;

        ctx.beginPath();
        ctx.arc(cx, cy, stoneRadius, 0, Math.PI * 2);

        if (stone === 'black') {
          // Black Stone Gradient (Matte slate black to charcoal shine)
          const stoneGrad = ctx.createRadialGradient(
            cx - stoneRadius * 0.3,
            cy - stoneRadius * 0.3,
            stoneRadius * 0.05,
            cx,
            cy,
            stoneRadius
          );
          stoneGrad.addColorStop(0, '#555555');
          stoneGrad.addColorStop(0.35, '#222222');
          stoneGrad.addColorStop(1, '#080808');
          ctx.fillStyle = stoneGrad;
        } else {
          // White Stone Gradient (Pearl luster with edge vignette)
          const stoneGrad = ctx.createRadialGradient(
            cx - stoneRadius * 0.3,
            cy - stoneRadius * 0.3,
            stoneRadius * 0.05,
            cx,
            cy,
            stoneRadius
          );
          stoneGrad.addColorStop(0, '#FFFFFF');
          stoneGrad.addColorStop(0.7, '#EEEEEE');
          stoneGrad.addColorStop(1, '#CCCCCC');
          ctx.fillStyle = stoneGrad;
        }

        ctx.fill();
        ctx.restore();
      }
    }

    // 6. Highlight Last Move
    if (lastMove) {
      const lx = padding + lastMove.x * cellSize;
      const ly = padding + lastMove.y * cellSize;

      ctx.beginPath();
      ctx.arc(lx, ly, stoneRadius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = lastMove.player === 'black' ? '#F6AD55' : '#E53E3E';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 7. Draw Hover Ghost Stone & Forbidden Warning
    if (hoverPos && !disabled && board[hoverPos.y][hoverPos.x] === null) {
      const hx = padding + hoverPos.x * cellSize;
      const hy = padding + hoverPos.y * cellSize;

      const forbiddenCheck = checkForbiddenMove(
        board,
        hoverPos.x,
        hoverPos.y,
        currentPlayer,
        ruleMode
      );

      if (forbiddenCheck.forbidden) {
        // Red Forbidden 'X' marker
        ctx.strokeStyle = '#E53E3E';
        ctx.lineWidth = 3;
        const arm = stoneRadius * 0.45;
        ctx.beginPath();
        ctx.moveTo(hx - arm, hy - arm);
        ctx.lineTo(hx + arm, hy + arm);
        ctx.moveTo(hx + arm, hy - arm);
        ctx.lineTo(hx - arm, hy + arm);
        ctx.stroke();
      } else {
        // Ghost stone preview
        ctx.beginPath();
        ctx.arc(hx, hy, stoneRadius * 0.88, 0, Math.PI * 2);
        ctx.fillStyle =
          currentPlayer === 'black'
            ? 'rgba(0, 0, 0, 0.45)'
            : 'rgba(255, 255, 255, 0.65)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }, [board, canvasSize, currentPlayer, disabled, hoverPos, lastMove, ruleMode]);

  useEffect(() => {
    drawBoard();
  }, [drawBoard]);

  // Coordinate conversion helper
  const getGridCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const padding = canvasSize * 0.06;
    const boardArea = canvasSize - padding * 2;
    const cellSize = boardArea / (BOARD_SIZE - 1);

    const gx = Math.round((mouseX - padding) / cellSize);
    const gy = Math.round((mouseY - padding) / cellSize);

    if (isInBoard(gx, gy)) {
      return { x: gx, y: gy };
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const coords = getGridCoords(e);
    if (coords) {
      setHoverPos(coords);
      if (board[coords.y][coords.x] === null && currentPlayer === 'black' && ruleMode === 'renju') {
        const f = checkForbiddenMove(board, coords.x, coords.y, 'black', 'renju');
        if (f.forbidden) {
          setForbiddenReason(f.reason === '3-3' ? '3-3 금수 자리' : f.reason === '4-4' ? '4-4 금수 자리' : '6목 장목 금수');
        } else {
          setForbiddenReason(null);
        }
      } else {
        setForbiddenReason(null);
      }
    } else {
      setHoverPos(null);
      setForbiddenReason(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
    setForbiddenReason(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const coords = getGridCoords(e);
    if (!coords) return;

    if (board[coords.y][coords.x] !== null) return;

    if (currentPlayer === 'black' && ruleMode === 'renju') {
      const f = checkForbiddenMove(board, coords.x, coords.y, 'black', 'renju');
      if (f.forbidden) {
        soundManager.playWarning();
        setForbiddenReason(f.reason === '3-3' ? '3-3 금수입니다!' : f.reason === '4-4' ? '4-4 금수입니다!' : '6목 장목 금수입니다!');
        return;
      }
    }

    soundManager.playStoneClick();
    onPlaceStone(coords.x, coords.y);
  };

  // Touch device handling
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const coords = getGridCoords(e);
    if (!coords) return;
    if (board[coords.y][coords.x] !== null) return;

    if (currentPlayer === 'black' && ruleMode === 'renju') {
      const f = checkForbiddenMove(board, coords.x, coords.y, 'black', 'renju');
      if (f.forbidden) {
        soundManager.playWarning();
        setForbiddenReason(f.reason === '3-3' ? '3-3 금수입니다!' : f.reason === '4-4' ? '4-4 금수입니다!' : '6목 장목 금수입니다!');
        return;
      }
    }

    soundManager.playStoneClick();
    onPlaceStone(coords.x, coords.y);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col items-center select-none">
      <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-[#4A2D13]">
        <canvas
          ref={canvasRef}
          style={{ width: `${canvasSize}px`, height: `${canvasSize}px` }}
          className="cursor-pointer touch-none block"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onTouchEnd={handleTouchEnd}
        />

        {/* Warning Tooltip overlay */}
        {forbiddenReason && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/95 text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-lg border border-red-400 animate-bounce">
            ⚠️ {forbiddenReason}
          </div>
        )}
      </div>
    </div>
  );
}
