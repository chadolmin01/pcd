'use client';

import React, { memo } from 'react';
import { Users, ArrowUpRight } from 'lucide-react';

const DRAFT_URL = 'https://draft-eta.vercel.app';

export const ComingSoonCard = memo(() => (
  <div className="bg-surface-inverse border border-gray-700 rounded p-6 shadow-lg overflow-hidden relative">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
    </div>

    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} className="text-txt-inverse" />
        <h3 className="text-xs font-bold text-txt-inverse uppercase tracking-widest">Next Step</h3>
      </div>

      <h4 className="text-lg font-bold text-txt-inverse mb-2">
        팀원을 찾아보세요
      </h4>

      <p className="text-sm text-gray-400 mb-4 leading-relaxed">
        검증된 아이디어를 함께 실행할 팀원을 만나보세요.
      </p>

      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
          <span>프로젝트 게시 & 팀원 모집</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
          <span>관심사 기반 매칭</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
          <span>실시간 커피챗</span>
        </div>
      </div>

      <a
        href={DRAFT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-card text-txt-primary font-semibold text-sm rounded-lg hover:bg-surface-sunken transition-colors"
      >
        Draft에서 팀 찾기
        <ArrowUpRight size={16} />
      </a>
    </div>
  </div>
));
ComingSoonCard.displayName = 'ComingSoonCard';
