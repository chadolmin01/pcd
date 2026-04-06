'use client'

import React from 'react'
import { X, ArrowRight, Building2, Award, Sparkles, FileText } from 'lucide-react'
import { GovernmentProgram, GOVERNMENT_PROGRAMS } from './types'
import { ProgramCard } from './ProgramCard'

interface ProgramSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (programId: GovernmentProgram) => void
  validationScore?: number  // 검증 점수로 추천 프로그램 결정
}

// Marquee 배경색
const MARQUEE_COLORS = ['bg-surface-inverse', 'bg-surface-inverse', 'bg-surface-inverse', 'bg-surface-inverse', 'bg-surface-inverse']

// 간단한 프로그램 추천 로직
function getRecommendedProgram(score?: number): GovernmentProgram {
  if (!score) return 'pre-startup'
  if (score >= 80) return 'early-startup'  // 높은 점수: 초기창업패키지 도전
  return 'pre-startup'  // 기본: 예비창업패키지
}

export const ProgramSelectorModal: React.FC<ProgramSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  validationScore,
}) => {
  if (!isOpen) return null

  const recommendedProgramId = getRecommendedProgram(validationScore)

  // Marquee용 프로그램 정보 (반복)
  const marqueeItems = [...GOVERNMENT_PROGRAMS, ...GOVERNMENT_PROGRAMS, ...GOVERNMENT_PROGRAMS]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#FAFAFA] rounded-sm shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border-subtle bg-surface-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-sm bg-surface-inverse text-txt-inverse flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-txt-primary">지원사업 양식 선택</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-mono text-txt-tertiary uppercase">
                  GOVERNMENT PROGRAM
                </span>
                {validationScore && (
                  <span className="flex items-center gap-1 text-xs font-mono text-txt-primary bg-surface-sunken px-2 py-0.5 rounded-sm">
                    <Sparkles size={10} />
                    검증점수 {validationScore}점 기반 추천
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-sunken rounded-sm transition-colors"
          >
            <X size={20} className="text-txt-tertiary" />
          </button>
        </div>

        {/* Marquee */}
        <div className="relative w-full overflow-hidden bg-surface-sunken group">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-surface-sunken to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-surface-sunken to-transparent z-10 pointer-events-none" />

          <div className="flex gap-4 animate-marquee hover:[animation-play-state:paused] w-max py-4">
            {marqueeItems.map((program, index) => {
              const bgColor = MARQUEE_COLORS[index % MARQUEE_COLORS.length]
              return (
                <div
                  key={`${program.id}-${index}`}
                  onClick={() => onSelect(program.id)}
                  className={`
                    relative overflow-hidden rounded-xl p-4 h-32 w-[280px] flex flex-col justify-between shrink-0 cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300
                    ${bgColor}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold text-white border border-white/30 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm uppercase">
                      {program.id === recommendedProgramId ? '추천' : '지원사업'}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                      <ArrowRight className="text-white" size={12} />
                    </div>
                  </div>

                  <div className="text-white">
                    <h3 className="text-lg font-bold mb-0.5 truncate">{program.nameKo}</h3>
                    <p className="text-white/70 text-xs line-clamp-1">{program.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Section Title */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-txt-primary flex items-center gap-2">
              <Award size={16} /> 지원 가능한 프로그램
            </h3>
            <span className="text-[10px] font-mono text-txt-tertiary">
              {GOVERNMENT_PROGRAMS.length}개 프로그램
            </span>
          </div>

          {/* Program Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {GOVERNMENT_PROGRAMS.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onSelect={onSelect}
                isRecommended={program.id === recommendedProgramId}
              />
            ))}
          </div>

          {/* Custom Option */}
          <div
            onClick={() => onSelect('custom')}
            className="p-5 border-2 border-dashed border-border-strong rounded-sm hover:border-txt-tertiary hover:bg-surface-card transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-sm bg-surface-sunken border border-border flex items-center justify-center group-hover:bg-surface-inverse group-hover:text-txt-inverse group-hover:border-surface-inverse transition-colors">
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-txt-secondary group-hover:text-txt-primary">자유 양식</h4>
                <p className="text-sm text-txt-tertiary">
                  특정 양식 없이 일반적인 사업계획서를 작성합니다. IR 피치덱이나 자유 형식의 제안서에 적합합니다.
                </p>
              </div>
              <ArrowRight size={20} className="text-txt-tertiary group-hover:text-txt-primary transition-colors" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border-subtle bg-surface-card">
          <div className="flex items-center gap-4">
            <span className="text-xs text-txt-tertiary">
              선택한 양식에 맞춰 AI가 사업계획서를 작성합니다
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-txt-tertiary hover:text-txt-secondary text-sm font-medium"
          >
            나중에 선택하기
          </button>
        </div>
      </div>

    </div>
  )
}

export default ProgramSelectorModal
