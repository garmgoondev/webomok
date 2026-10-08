import React from 'react';
import { HelpCircle, BookOpen, ShieldAlert, Trophy, Layers } from 'lucide-react';

export default function SeoContentSection() {
  return (
    <article className="mt-20 w-full max-w-4xl mx-auto px-4 text-slate-200 leading-relaxed space-y-14">
      {/* Intro Header */}
      <header className="border-b border-slate-700/80 pb-8 text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          웹오목(WebOmok) 공식 가이드: 규칙, 렌주룰 금수 판정 및 필승 전략
        </h1>
        <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
          설치나 회원가입 없이 브라우저에서 바로 즐기는 무료 2인용 온라인 오목 게임입니다. 
          전 세계 유저와 실시간 레이팅 대전, 똑똑한 AI 인공지능 대국, 1:1 친구 초대 대전을 모두 무료로 지원합니다.
        </p>
      </header>

      {/* Section 1: Rules & Renju */}
      <section className="space-y-5">
        <div className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold text-amber-400">
          <BookOpen className="w-7 h-7 flex-shrink-0" />
          <h2>1. 오목 규칙 완전 정복: 일반룰 vs 렌주룰(Renju Rule)</h2>
        </div>
        <p className="text-base sm:text-lg text-slate-300">
          오목(五目, Gomoku)은 가로, 세로 15줄의 격자판 위에서 두 명의 대국자가 흑돌과 백돌을 번갈아 놓으며, 
          가로, 세로, 대각선 중 어느 한 방향으로 <strong>자신의 돌 5개를 먼저 일렬로 만드는 사람</strong>이 승리하는 정통 두뇌 보드게임입니다.
        </p>
        <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 space-y-4">
          <h3 className="font-bold text-white text-lg sm:text-xl">선공(흑돌)의 유리함과 렌주룰 도입 배경</h3>
          <p className="text-base sm:text-lg text-slate-300">
            수학적 분석에 따르면, 아무런 착수 제약이 없는 일반 오목(자유룰)에서는 <strong>먼저 두는 흑돌(선공)의 필승법이 존재</strong>하며, 
            실제 대국 승률이 75%를 초과합니다. 따라서 공평하고 흥미진진한 승부를 위해 국제 공인 대회에서는 
            선공인 흑돌에 엄격한 착수 제약을 부여하는 <strong>&apos;렌주룰(Renju Rule)&apos;</strong>을 표준으로 채택하고 있습니다.
          </p>
          <ul className="text-base sm:text-lg space-y-2.5 list-disc list-inside text-slate-200 pt-2">
            <li><strong>흑돌(선공)</strong>: 3-3(쌍삼) 금수, 4-4(쌍사) 금수, 6목 이상 장목(Overline) 금수가 적용됩니다. 오직 정확히 5목을 만들어야만 승리합니다.</li>
            <li><strong>백돌(후공)</strong>: 후공의 불리함을 만회하기 위해 3-3, 4-4는 물론 6목 이상의 장목을 만들어도 반칙이 아니며, 즉시 승리로 인정됩니다.</li>
          </ul>
        </div>
      </section>

      {/* Section 2: Forbidden Moves (금수 판정) */}
      <section className="space-y-5">
        <div className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold text-amber-400">
          <ShieldAlert className="w-7 h-7 flex-shrink-0" />
          <h2>2. 흑돌 3대 금수(금지된 수) 완벽 판정법</h2>
        </div>
        <p className="text-base sm:text-lg text-slate-300">
          렌주룰을 처음 접할 때 가장 헷갈리는 부분이 바로 <strong>&apos;열린 3(Open Three)&apos;</strong>과 <strong>&apos;닫힌 3&apos;</strong>의 구별입니다.
          웹오목에서는 금수 위치에 착수하려고 할 때 시스템이 실시간으로 감지하여 착수를 방지해 주므로 안심하고 규칙을 익힐 수 있습니다.
        </p>

        <div className="grid sm:grid-cols-3 gap-5 mt-4">
          <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 space-y-2">
            <span className="text-rose-400 font-extrabold text-lg block">① 3-3 (삼삼) 금수</span>
            <p className="text-sm sm:text-base text-slate-300">
              한 수 착수로 양쪽 끝이 모두 비어 있어서 다음 수에 열린 4(양쪽이 뚫려 막을 수 없는 4)가 될 수 있는 <strong>&apos;열린 3&apos;이 동시에 2개 이상</strong> 생성되는 착수입니다.
            </p>
          </div>
          <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 space-y-2">
            <span className="text-rose-400 font-extrabold text-lg block">② 4-4 (사사) 금수</span>
            <p className="text-sm sm:text-base text-slate-300">
              한 수 착수로 돌 하나만 더 놓으면 5가 되는 형태(열린 4 또는 닫힌 4)가 <strong>동시에 2개 이상</strong> 형성되는 경우입니다.
            </p>
          </div>
          <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 space-y-2">
            <span className="text-rose-400 font-extrabold text-lg block">③ 장목 (6목 이상)</span>
            <p className="text-sm sm:text-base text-slate-300">
              흑돌이 6개, 7개 등 6목 이상 일렬로 연결되는 경우 승리가 아니며 금수로 인정됩니다. 반면 백돌은 6목도 정상적인 승리로 처리됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Winning Strategies */}
      <section className="space-y-5">
        <div className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold text-amber-400">
          <Trophy className="w-7 h-7 flex-shrink-0" />
          <h2>3. 오목 필승 전략: 초반 포석과 공격 전술</h2>
        </div>
        <p className="text-base sm:text-lg text-slate-300">
          오목 고수로 거듭나기 위해 반드시 숙지해야 할 핵심 공격 기법은 <strong>VCF(Victory of Continuous Fours)</strong>와 <strong>VCT(Victory of Continuous Threes)</strong>입니다.
        </p>
        <div className="space-y-4">
          <div className="bg-slate-800/70 p-5 rounded-xl border-l-4 border-amber-500 space-y-2">
            <h3 className="font-bold text-white text-base sm:text-lg">VCF (연속 4 공격 승리법)</h3>
            <p className="text-sm sm:text-base text-slate-300">
              상대방이 4를 막지 않으면 다음 턴에 즉시 패배하므로, 매 턴마다 4를 만들어 상대방의 수를 완벽하게 강제하면서 최종적으로 5목을 완성하는 전술입니다. 
              상대방의 역습 기회를 0%로 만들기 때문에 오목에서 가장 강력한 공격 수단입니다.
            </p>
          </div>
          <div className="bg-slate-800/70 p-5 rounded-xl border-l-4 border-blue-500 space-y-2">
            <h3 className="font-bold text-white text-base sm:text-lg">VCT (연속 열린 3 공격 승리법)</h3>
            <p className="text-sm sm:text-base text-slate-300">
              열린 3을 연속적으로 생성하여 상대를 수비로 몰아넣은 뒤, 4-3 공격이나 복합 삼삼 공격으로 이어지는 포석 전술입니다.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: FAQ */}
      <section className="space-y-5">
        <div className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold text-amber-400">
          <HelpCircle className="w-7 h-7 flex-shrink-0" />
          <h2>4. 자주 묻는 질문 (FAQ)</h2>
        </div>
        <div className="space-y-4">
          <details className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 cursor-pointer">
            <summary className="font-bold text-white text-base sm:text-lg">Q. 학교 컴퓨터실이나 회사 사무실에서도 플레이할 수 있나요?</summary>
            <p className="mt-3 text-sm sm:text-base text-slate-300 pl-4 border-l-2 border-amber-500">
              네, 100% 가능합니다. 웹오목은 별도의 프로그램 다운로드나 ActiveX, EXE 설치가 필요 없는 순수 HTML5 웹 표준 기술로 개발되었습니다. 
              학교나 사내망 유해 사이트 방화벽에 걸리지 않는 안전한 도메인과 HTTPS 암호화 통신을 사용하므로 안심하고 즐기실 수 있습니다.
            </p>
          </details>
          <details className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 cursor-pointer">
            <summary className="font-bold text-white text-base sm:text-lg">Q. 친구와 1:1 대전은 어떻게 하나요?</summary>
            <p className="mt-3 text-sm sm:text-base text-slate-300 pl-4 border-l-2 border-amber-500">
              상단 메뉴의 &apos;친구 초대 대전&apos; 버튼을 클릭하면 고유한 대국 방 링크가 생성되어 클립보드에 자동 복사됩니다. 
              이 링크를 카카오톡, 라인, 디스코드 등으로 친구에게 보내면, 친구가 해당 링크를 누르는 즉시 1:1 온라인 대전이 연결됩니다.
            </p>
          </details>
          <details className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 cursor-pointer">
            <summary className="font-bold text-white text-base sm:text-lg">Q. 모바일 스마트폰에서도 정상 작동하나요?</summary>
            <p className="mt-3 text-sm sm:text-base text-slate-300 pl-4 border-l-2 border-amber-500">
              네. 아이폰 사파리(Safari), 안드로이드 크롬(Chrome), 네이버 앱 브라우저 등 모든 모바일 기기를 지원합니다. 
              화면 크기에 맞춰 바둑판이 자동으로 조절되며 터치 오작동을 방지하는 정밀 가상 캔버스가 적용되어 있습니다.
            </p>
          </details>
          <details className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 cursor-pointer">
            <summary className="font-bold text-white text-base sm:text-lg">Q. 레이팅(RP)과 전적은 어떻게 보존되나요?</summary>
            <p className="mt-3 text-sm sm:text-base text-slate-300 pl-4 border-l-2 border-amber-500">
              로그인 없이도 게스트 계정으로 로컬에 대국 전적과 레이팅 점수가 안전하게 자동 누적됩니다. 
              언제든지 상단 사용자 프로필 버튼을 눌러 정식 계정으로 전환하면 다른 기기에서도 전적을 영구히 불러올 수 있습니다.
            </p>
          </details>
        </div>
      </section>

      {/* Section 5: Family Network Bar */}
      <footer className="pt-10 border-t border-slate-700/80 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
          <Layers className="w-5 h-5 text-amber-400" />
          <span>보드게임 패밀리 네트워크 (Web Games Hub)</span>
        </div>
        <div className="flex flex-wrap justify-center gap-3 text-sm sm:text-base">
          <span className="bg-amber-500/20 text-amber-300 px-4 py-2 rounded-full border border-amber-500/40 font-bold">
            ● 오목 (WebOmok)
          </span>
          <span className="bg-slate-800 text-slate-400 px-4 py-2 rounded-full border border-slate-700 cursor-not-allowed">
            지뢰찾기 (Coming Soon)
          </span>
          <span className="bg-slate-800 text-slate-400 px-4 py-2 rounded-full border border-slate-700 cursor-not-allowed">
            루미타일 (Coming Soon)
          </span>
          <span className="bg-slate-800 text-slate-400 px-4 py-2 rounded-full border border-slate-700 cursor-not-allowed">
            스도쿠 (Coming Soon)
          </span>
          <span className="bg-slate-800 text-slate-400 px-4 py-2 rounded-full border border-slate-700 cursor-not-allowed">
            리버시 (Coming Soon)
          </span>
        </div>
        <p className="text-sm text-slate-400 pt-4">
          © 2026 WebOmok.com. All rights reserved. 무설치 웹 보드게임 네트워크.
        </p>
      </footer>
    </article>
  );
}
