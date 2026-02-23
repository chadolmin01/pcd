'use client';

import React, { memo } from 'react';
import { Sparkles, Calendar } from 'lucide-react';

export const ComingSoonCard = memo(() => (
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded p-6 shadow-lg overflow-hidden relative">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
    </div>

    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-yellow-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Next Step</h3>
        </div>
        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/20 px-2 py-0.5 rounded-full border border-yellow-400/30 animate-pulse">
          COMING SOON
        </span>
      </div>

      <h4 className="text-lg font-bold text-white mb-2">
        🚀 아이디어 실행 지원
      </h4>

      <p className="text-sm text-gray-300 mb-4 leading-relaxed">
        검증된 아이디어를 실제로 만들어 보세요.<br/>
        창업 지원 프로그램, 투자 연결, 팀 빌딩까지.
      </p>

      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
          <span>맞춤형 창업 지원 사업 매칭</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
          <span>VC/엔젤 투자자 네트워킹</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
          <span>공동 창업자 & 팀원 매칭</span>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded p-3 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Draft. Platform</p>
            <p className="text-sm font-bold text-white">2026년 상반기 오픈 예정</p>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
            <Calendar size={20} className="text-white/60" />
          </div>
        </div>
      </div>
    </div>
  </div>
));
ComingSoonCard.displayName = 'ComingSoonCard';
