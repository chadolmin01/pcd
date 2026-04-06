'use client'

import React from 'react'
import { ArrowRight, Award, Target, Zap, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { GovernmentProgram, GovernmentProgramConfig } from './types'

interface ProgramCardProps {
  program: GovernmentProgramConfig
  onSelect: (programId: GovernmentProgram) => void
  isRecommended?: boolean
}

// 프로그램별 추가 정보
const PROGRAM_META: Record<string, {
  deadline: string
  funding: string
  targetAudience: string
  bgColor: string
  features: string[]
}> = {
  'pre-startup': {
    deadline: '상시접수',
    funding: '최대 1억원',
    targetAudience: '예비창업자',
    bgColor: 'bg-surface-inverse',
    features: ['멘토링 지원', '사업화 자금', '공간 제공']
  },
  'early-startup': {
    deadline: '3월, 9월',
    funding: '최대 3억원',
    targetAudience: '3년 이내 창업기업',
    bgColor: 'bg-surface-inverse',
    features: ['기술개발 지원', 'IR 컨설팅', '해외진출 지원']
  },
}

export const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  onSelect,
  isRecommended = false,
}) => {
  const meta = PROGRAM_META[program.id] || {
    deadline: '별도 공지',
    funding: '프로그램별 상이',
    targetAudience: '창업자',
    bgColor: 'bg-surface-inverse',
    features: []
  }

  return (
    <Card
      className="group h-full flex flex-col hover:-translate-y-1 overflow-hidden"
      padding="p-0"
      onClick={() => onSelect(program.id)}
    >
      {/* Header with gradient */}
      <div className={`${meta.bgColor} p-5 relative`}>
        {isRecommended && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-mono font-bold text-yellow-900 bg-yellow-400 px-2 py-1 rounded-full flex items-center gap-1">
              <Zap size={10} />
              추천
            </span>
          </div>
        )}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
            <Award className="text-white" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{program.nameKo}</h3>
            <p className="text-[10px] font-mono text-white/70 uppercase">{program.name}</p>
          </div>
        </div>
        <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
          {program.description}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-surface-sunken">
        <div className="bg-surface-card p-3 text-center">
          <div className="text-[10px] font-mono text-txt-tertiary uppercase mb-0.5">접수</div>
          <div className="text-xs font-bold text-txt-primary">{meta.deadline}</div>
        </div>
        <div className="bg-surface-card p-3 text-center">
          <div className="text-[10px] font-mono text-txt-tertiary uppercase mb-0.5">지원금</div>
          <div className="text-xs font-bold text-txt-primary">{meta.funding}</div>
        </div>
        <div className="bg-surface-card p-3 text-center">
          <div className="text-[10px] font-mono text-txt-tertiary uppercase mb-0.5">대상</div>
          <div className="text-xs font-bold text-txt-primary">{meta.targetAudience}</div>
        </div>
      </div>

      {/* Sections Preview */}
      <div className="p-4 flex-1">
        <div className="text-[10px] font-mono text-txt-tertiary uppercase mb-2">평가 항목</div>
        <div className="space-y-2">
          {program.sections.slice(0, 3).map((section) => (
            <div key={section.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={12} className="text-txt-tertiary" />
                <span className="text-xs text-txt-secondary">{section.titleKo}</span>
              </div>
              <span className="text-[10px] font-mono text-txt-tertiary bg-surface-sunken px-2 py-0.5 rounded-lg">
                {section.weight}점
              </span>
            </div>
          ))}
          {program.sections.length > 3 && (
            <div className="text-[10px] text-txt-tertiary">
              +{program.sections.length - 3}개 항목 더보기
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      {meta.features.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {meta.features.map((feature) => (
              <span
                key={feature}
                className="text-[10px] font-mono text-txt-secondary bg-surface-sunken px-2 py-1 rounded-lg border border-border flex items-center gap-1"
              >
                <CheckCircle size={8} />
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border-subtle p-4 mt-auto">
        <button
          className="w-full px-4 py-2.5 bg-surface-inverse text-txt-inverse text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group-hover:gap-3 focus:outline-none focus:ring-2 focus:ring-border-strong focus:ring-offset-2"
        >
          이 양식으로 준비하기
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </Card>
  )
}

export default ProgramCard
