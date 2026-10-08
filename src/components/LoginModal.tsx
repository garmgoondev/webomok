'use client';

import React, { useState } from 'react';
import { X, User, Trophy, Shield, Globe, LogIn, UserPlus, LogOut, CheckCircle, Flame } from 'lucide-react';
import { UserProfile, getTierInfo, saveUserProfile, createDefaultGuest } from '../lib/user';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'login' | 'signup'>('profile');
  const [nicknameInput, setNicknameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const tier = getTierInfo(profile.rating);
  const totalGames = profile.wins + profile.losses + profile.draws;
  const winRate = totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) {
      setMessage('닉네임을 입력해 주세요.');
      return;
    }

    const updated: UserProfile = {
      ...profile,
      isGuest: false,
      nickname: nicknameInput.trim(),
      email: emailInput.trim() || undefined,
    };

    saveUserProfile(updated);
    onUpdateProfile(updated);
    setMessage('성공적으로 로그인되었습니다!');
    setTimeout(() => {
      setMessage(null);
      setActiveTab('profile');
    }, 1000);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) {
      setMessage('사용할 닉네임을 입력해 주세요.');
      return;
    }

    const updated: UserProfile = {
      ...profile,
      isGuest: false,
      nickname: nicknameInput.trim(),
      email: emailInput.trim() || undefined,
    };

    saveUserProfile(updated);
    onUpdateProfile(updated);
    setMessage('회원가입이 완료되어 정식 계정으로 전환되었습니다!');
    setTimeout(() => {
      setMessage(null);
      setActiveTab('profile');
    }, 1000);
  };

  const handleLogout = () => {
    if (confirm('로그아웃하고 새로운 게스트 계정으로 전환하시겠습니까?')) {
      const guest = createDefaultGuest({
        code: profile.countryCode,
        name: profile.countryName,
        flag: profile.countryFlag,
      });
      saveUserProfile(guest);
      onUpdateProfile(guest);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 text-2xl font-bold shadow-md">
              {profile.countryFlag}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                {profile.nickname}
                <span className={`text-xs sm:text-sm px-3 py-1 rounded-full border font-bold ${tier.bgBadge}`}>
                  {tier.icon} {tier.name}
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-medium">
                {profile.isGuest ? '게스트 계정 (로컬 저장)' : '인증 회원 계정'} &middot; {profile.countryName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 text-base sm:text-lg font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            내 전적 및 레이팅
          </button>
          {profile.isGuest && (
            <>
              <button
                onClick={() => setActiveTab('login')}
                className={`pb-3 px-4 text-base sm:text-lg font-bold transition border-b-2 cursor-pointer ${
                  activeTab === 'login'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                기존 계정 로그인
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`pb-3 px-4 text-base sm:text-lg font-bold transition border-b-2 cursor-pointer ${
                  activeTab === 'signup'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                정식 계정 등록
              </button>
            </>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {message && (
            <div className="p-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-base font-bold flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* ELO Rating Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 text-center">
                  <span className="text-sm font-bold text-slate-400 block mb-1">현재 레이팅</span>
                  <span className="text-3xl font-black text-amber-400">{profile.rating}</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-300 block mt-1">RP</span>
                </div>
                <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 text-center">
                  <span className="text-sm font-bold text-slate-400 block mb-1">최고 레이팅</span>
                  <span className="text-3xl font-black text-white">{profile.peakRating}</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-300 block mt-1">PEAK</span>
                </div>
                <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 text-center">
                  <span className="text-sm font-bold text-slate-400 block mb-1">총 대국수</span>
                  <span className="text-3xl font-black text-white">{totalGames}</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-300 block mt-1">전</span>
                </div>
                <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 text-center">
                  <span className="text-sm font-bold text-slate-400 block mb-1">승률</span>
                  <span className="text-3xl font-black text-emerald-400">{winRate}%</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-300 block mt-1">
                    {profile.wins}승 {profile.losses}패 {profile.draws}무
                  </span>
                </div>
              </div>

              {/* Guest Warning / CTA Banner */}
              {profile.isGuest && (
                <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-5 rounded-2xl border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-extrabold text-amber-300">💡 현재 게스트 상태로 기록 중입니다</h4>
                    <p className="text-sm text-slate-200 mt-1">
                      브라우저 캐시 삭제 시 전적이 초기화될 수 있습니다. 정식 계정으로 전환하여 영구 보존하세요.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('signup')}
                    className="flex-shrink-0 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-extrabold rounded-xl transition shadow-md cursor-pointer"
                  >
                    계정 연동
                  </button>
                </div>
              )}

              {/* Match History */}
              <div>
                <h3 className="text-lg font-extrabold text-white mb-3.5 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  최근 대국 기록 ({profile.matchHistory?.length || 0}건)
                </h3>

                {profile.matchHistory && profile.matchHistory.length > 0 ? (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {profile.matchHistory.map((m) => {
                      const isWin = m.result === 'win';
                      const isLoss = m.result === 'loss';
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-sm sm:text-base"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                                isWin
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                  : isLoss
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                                  : 'bg-slate-500/20 text-slate-300 border border-slate-500/50'
                              }`}
                            >
                              {isWin ? '승' : isLoss ? '패' : '무'}
                            </span>
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>vs {m.opponentName}</span>
                                <span className="text-xs sm:text-sm text-amber-400 font-extrabold">({m.opponentRating} RP)</span>
                              </div>
                              <span className="text-xs sm:text-sm text-slate-400">
                                {new Date(m.timestamp).toLocaleDateString()} &middot; {m.totalMoves}수
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-black text-base sm:text-lg ${
                                m.ratingChange > 0
                              ? 'text-emerald-400'
                              : m.ratingChange < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                            }`}
                          >
                            {m.ratingChange > 0 ? `+${m.ratingChange}` : m.ratingChange} RP
                          </span>
                          <span className="text-xs sm:text-sm text-slate-400 font-bold block">{m.newRating} RP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-300 text-base font-medium">
                  아직 완료된 대국 기록이 없습니다. 온라인 대국을 플레이해 보세요!
                </div>
              )}
            </div>

            {!profile.isGuest && (
              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 text-rose-400 hover:text-rose-300 text-sm font-bold rounded-xl hover:bg-rose-950/30 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-bold text-slate-300 mb-2">닉네임</label>
              <input
                type="text"
                required
                placeholder="예: 오목마스터"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-bold text-slate-300 mb-2">이메일 (선택)</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-bold text-slate-300 mb-2">비밀번호</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-base"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-base transition shadow-xl mt-3 cursor-pointer"
            >
              로그인 및 전적 불러오기
            </button>
          </form>
        )}

        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-bold text-slate-300 mb-2">사용할 닉네임</label>
              <input
                type="text"
                required
                placeholder="원하는 닉네임 입력 (2~12자)"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-bold text-slate-300 mb-2">이메일 (계정 복구용)</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-bold text-slate-300 mb-2">비밀번호</label>
              <input
                type="password"
                required
                placeholder="비밀번호 설정"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-base"
              />
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              * 가입 시 현재까지의 대국 전적 및 레이팅 점수({profile.rating} RP)가 그대로 보존됩니다.
            </p>
            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-base transition shadow-xl mt-3 cursor-pointer"
            >
              정식 계정으로 전환 완료
            </button>
          </form>
        )}
      </div>
    </div>
  </div>
  );
}
