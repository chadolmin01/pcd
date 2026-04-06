'use client';

import React, { useState, memo } from 'react';
import { Sparkles, ArrowRight, Zap, Layers, Sword, Cpu, Paintbrush, DollarSign, Megaphone, Scale, ClipboardList, Server, Calculator, User, Settings, Check, RotateCcw, Lock, Loader2, X } from 'lucide-react';
import { ValidationLevel, PersonaRole, PERSONA_PRESETS, DEFAULT_PERSONAS, PersonaPreset } from './types';
import { useUsage } from '@/src/hooks/useUsage';

// Icon mapping
const PERSONA_ICONS: Record<string, (size: number) => React.ReactNode> = {
  'Cpu': (size) => <Cpu size={size} />,
  'Paintbrush': (size) => <Paintbrush size={size} />,
  'DollarSign': (size) => <DollarSign size={size} />,
  'Megaphone': (size) => <Megaphone size={size} />,
  'Scale': (size) => <Scale size={size} />,
  'ClipboardList': (size) => <ClipboardList size={size} />,
  'Server': (size) => <Server size={size} />,
  'Calculator': (size) => <Calculator size={size} />,
  'User': (size) => <User size={size} />,
  'Settings': (size) => <Settings size={size} />,
};

const getPersonaIcon = (iconName: string, size: number = 20): React.ReactNode => {
  const iconFn = PERSONA_ICONS[iconName];
  return iconFn ? iconFn(size) : <Cpu size={size} />;
};


// Persona Card Component - main Draft 스타일
const PersonaCard = memo(({
  persona,
  isSelected,
  selectionIndex,
  onClick
}: {
  persona: PersonaPreset;
  isSelected: boolean;
  selectionIndex: number;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col items-start p-4 w-full h-[120px] bg-surface-card border transition-all duration-200 text-left rounded-xl hover:shadow-sm
      ${isSelected
        ? 'bg-surface-sunken border-surface-inverse shadow-sm'
        : 'border-border hover:border-border-strong'
      }
    `}
  >
    {isSelected && (
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-surface-inverse text-txt-inverse rounded-full flex items-center justify-center text-xs font-bold">
        {selectionIndex + 1}
      </div>
    )}

    <div className="w-full flex items-start gap-3 h-full">
      <div className={`p-2 border rounded transition-colors shrink-0 ${isSelected ? 'bg-surface-inverse border-surface-inverse text-txt-inverse' : 'bg-surface-sunken border-border text-txt-secondary'}`}>
        {getPersonaIcon(persona.icon, 18)}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-txt-primary">{persona.nameKo}</span>
          <span className="text-[10px] text-txt-tertiary font-mono whitespace-nowrap">{persona.name}</span>
        </div>
        <p className="text-[11px] text-txt-tertiary leading-relaxed break-keep line-clamp-2">
          {persona.description}
        </p>
      </div>
    </div>
  </button>
));
PersonaCard.displayName = 'PersonaCard';

// Persona Detail Modal
const PersonaDetailModal = memo(({
  persona,
  isSelected,
  onSelect,
  onDeselect,
  onClose,
  canSelect
}: {
  persona: PersonaPreset;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onClose: () => void;
  canSelect: boolean;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="bg-surface-card rounded-xl max-w-md w-full shadow-md border border-border animate-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-6 border-b border-border-subtle">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded border bg-surface-sunken border-border text-txt-secondary">
              {getPersonaIcon(persona.icon, 28)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-txt-primary">{persona.nameKo}</h3>
              <span className="text-xs text-txt-tertiary font-mono">{persona.name}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-sunken rounded transition-colors"
            aria-label="닫기"
          >
            <X size={18} className="text-txt-tertiary" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        <p className="text-sm text-txt-secondary leading-relaxed">
          {persona.detailDescription}
        </p>

        <div>
          <h4 className="text-[10px] font-bold font-mono text-txt-tertiary uppercase tracking-widest mb-3">
            검토 포인트
          </h4>
          <div className="flex flex-wrap gap-2">
            {persona.checkPoints.map((point, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded text-xs font-medium border border-border text-txt-secondary bg-surface-sunken"
              >
                {point}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border-subtle flex items-center justify-between bg-surface-sunken">
        {isSelected ? (
          <>
            <div className="flex items-center gap-2 text-sm text-txt-primary">
              <div className="w-5 h-5 rounded-full bg-surface-inverse text-txt-inverse flex items-center justify-center">
                <Check size={12} />
              </div>
              <span className="font-medium">선택됨</span>
            </div>
            <button
              onClick={() => { onDeselect(); onClose(); }}
              className="px-5 py-2.5 border border-border text-txt-secondary rounded font-medium text-sm hover:bg-surface-card transition-all"
            >
              선택 해제
            </button>
          </>
        ) : (
          <>
            <div className="text-xs text-txt-tertiary">
              {canSelect ? '3명까지 선택 가능' : '최대 3명 선택됨'}
            </div>
            <button
              onClick={() => { onSelect(); onClose(); }}
              disabled={!canSelect}
              className={`px-5 py-2.5 rounded font-medium text-sm transition-all flex items-center gap-2
                ${canSelect
                  ? 'bg-surface-inverse text-txt-inverse hover:opacity-90'
                  : 'bg-border text-txt-disabled cursor-not-allowed'
                }
              `}
            >
              <Check size={14} />
              선택하기
            </button>
          </>
        )}
      </div>
    </div>
  </div>
));
PersonaDetailModal.displayName = 'PersonaDetailModal';

// Level Card Component
const LevelCard = memo(({
  level: _level,
  title,
  desc,
  icon,
  colorTheme,
  recommended = false,
  onSelect,
  usageInfo,
  loading = false
}: {
  level: ValidationLevel,
  title: string,
  desc: string,
  icon: React.ReactNode,
  colorTheme: 'yellow' | 'blue' | 'red',
  recommended?: boolean,
  onSelect: () => void,
  usageInfo?: { remaining: number; limit: number; available: boolean; label: string; unlocked?: boolean },
  loading?: boolean
}) => {
  const isLocked = usageInfo && usageInfo.unlocked === false;
  const isExhausted = usageInfo && !usageInfo.available && !isLocked;

  return (
    <button
      onClick={onSelect}
      disabled={isLocked || isExhausted}
      className={`group relative flex flex-col items-start p-5 w-full h-full bg-surface-card border transition-all duration-200 text-left rounded-xl
        ${isLocked || isExhausted ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-sm hover:border-border-strong'}
        ${recommended ? 'border-surface-inverse ring-1 ring-surface-inverse' : 'border-border'}`}
    >
      {recommended && !isLocked && !isExhausted && (
        <div className="absolute -top-2.5 left-5 bg-surface-inverse text-txt-inverse text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono rounded">
          Recommended
        </div>
      )}

      {isLocked && (
        <div className="absolute -top-2.5 left-5 bg-txt-tertiary text-txt-inverse text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono rounded flex items-center gap-1">
          <Lock size={10} /> Locked
        </div>
      )}

      {isExhausted && (
        <div className="absolute -top-2.5 left-5 bg-status-danger-text text-txt-inverse text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono rounded">
          오늘 소진
        </div>
      )}

      <div className="w-full flex justify-between items-start mb-4">
        <div className="p-2 border rounded transition-colors bg-surface-sunken text-txt-secondary border-border">
          {icon}
        </div>
        {isLocked ? (
          <Lock size={14} className="text-txt-disabled" />
        ) : (
          <ArrowRight size={14} className="text-txt-disabled group-hover:text-txt-primary group-hover:translate-x-1 transition-all" />
        )}
      </div>

      <h4 className="text-xs font-bold text-txt-primary mb-2 font-mono uppercase tracking-wide">{title}</h4>
      <p className="text-xs text-txt-tertiary leading-relaxed break-keep mb-3">
        {desc}
      </p>

      {loading ? (
        <div className="mt-auto pt-3 border-t border-border-subtle w-full flex items-center gap-2">
          <Loader2 size={12} className="animate-spin text-txt-tertiary" />
          <span className="text-[10px] text-txt-tertiary">로딩 중...</span>
        </div>
      ) : usageInfo && (
        <div className="mt-auto pt-3 border-t border-border-subtle w-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-txt-tertiary">{usageInfo.label}</span>
            {usageInfo.limit === -1 ? (
              <span className="text-[10px] font-bold text-txt-primary">∞ 무제한</span>
            ) : (
              <span className={`text-[10px] font-bold ${usageInfo.remaining > 0 ? 'text-txt-primary' : 'text-status-danger-text'}`}>
                {usageInfo.remaining}/{usageInfo.limit} 남음
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  );
});
LevelCard.displayName = 'LevelCard';

// Selected Personas Summary
const SelectedPersonasSummary = memo(({ selectedPersonas }: { selectedPersonas: PersonaRole[] }) => (
  <div className="flex items-center gap-2 mb-6">
    <span className="text-[10px] font-mono text-txt-tertiary uppercase tracking-wider">Selected:</span>
    <div className="flex items-center gap-1">
      {selectedPersonas.map((pId) => {
        const persona = PERSONA_PRESETS.find(p => p.id === pId);
        if (!persona) return null;
        return (
          <div key={pId} className="flex items-center gap-1 px-2 py-1 bg-surface-inverse text-txt-inverse rounded text-[10px] font-bold">
            {getPersonaIcon(persona.icon, 12)}
            <span>{persona.nameKo}</span>
          </div>
        );
      })}
    </div>
  </div>
));
SelectedPersonasSummary.displayName = 'SelectedPersonasSummary';

interface SelectionScreenProps {
  onSelect: (mode: 'general' | 'ai', level?: ValidationLevel, personas?: PersonaRole[], interactionMode?: 'individual' | 'discussion') => void;
  onBack?: () => void;
  userEmail?: string;
  onWorkflowStart?: () => void;
}

type SelectionStep = 'personas' | 'level';

const SelectionScreen: React.FC<SelectionScreenProps> = ({ onSelect, onBack, userEmail, onWorkflowStart }) => {
  const [step, setStep] = useState<SelectionStep>('personas');
  const [selectedPersonas, setSelectedPersonas] = useState<PersonaRole[]>([]);
  const [modalPersona, setModalPersona] = useState<PersonaPreset | null>(null);
  const { usage, loading: usageLoading } = useUsage(userEmail || null);

  const resetToDefault = () => {
    setSelectedPersonas(DEFAULT_PERSONAS);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center h-full w-full px-6 py-8 overflow-y-auto bg-surface-sunken">
        <div className="w-full max-w-6xl">

          {/* Step 1: Persona Selection */}
          {step === 'personas' && (
            <div className="flex flex-col items-center justify-center opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
              {/* 지원사업 워크플로우 배너 */}
              {onWorkflowStart && (
                <div className="w-full max-w-6xl mb-6">
                  <button
                    onClick={onWorkflowStart}
                    className="w-full flex items-center justify-between px-4 py-3 bg-surface-sunken border border-border rounded-lg hover:border-border-strong hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-surface-sunken rounded-lg flex items-center justify-center text-txt-secondary group-hover:bg-surface-sunken transition-colors">
                        <Sparkles size={16} />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-txt-primary">지원사업 준비 워크플로우</span>
                          <span className="px-1.5 py-0.5 bg-surface-inverse text-txt-inverse text-[10px] font-bold rounded">NEW</span>
                        </div>
                        <p className="text-xs text-txt-tertiary">아이디어 검증부터 사업계획서까지</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-txt-tertiary group-hover:text-txt-primary group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              )}

              <div className="text-center mb-6">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="text-[10px] font-bold text-txt-tertiary hover:text-txt-primary mb-4 flex items-center gap-1 uppercase tracking-widest font-mono transition-colors mx-auto"
                  >
                    ← Back
                  </button>
                )}
                <h2 className="text-3xl font-bold text-txt-primary tracking-tight mb-2">검증 페르소나 선택</h2>
                <p className="text-sm text-txt-tertiary">3명의 전문가를 선택하세요. 선택 순서대로 번호가 부여됩니다.</p>
              </div>

              {/* Reset Button */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-[11px] text-txt-tertiary">
                  <span className="font-bold text-txt-primary">{selectedPersonas.length}</span>/3 선택됨
                </div>
                <button
                  onClick={resetToDefault}
                  className="flex items-center gap-1 text-[10px] font-mono text-txt-tertiary hover:text-txt-primary transition-colors"
                >
                  <RotateCcw size={12} />
                  기본값으로 초기화
                </button>
              </div>

              {/* Persona Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 max-w-6xl w-full">
                {PERSONA_PRESETS.map((persona, idx) => (
                  <div
                    key={persona.id}
                    className="opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards]"
                    style={{ animationDelay: `${0.3 + idx * 0.05}s` }}
                  >
                    <PersonaCard
                      persona={persona}
                      isSelected={selectedPersonas.includes(persona.id)}
                      selectionIndex={selectedPersonas.indexOf(persona.id)}
                      onClick={() => setModalPersona(persona)}
                    />
                  </div>
                ))}
              </div>

              {/* Continue Button */}
              <button
                onClick={() => setStep('level')}
                disabled={selectedPersonas.length !== 3}
                className={`px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-all
                  ${selectedPersonas.length === 3
                    ? 'bg-surface-inverse text-txt-inverse hover:opacity-90'
                    : 'bg-border text-txt-disabled cursor-not-allowed'
                  }
                `}
              >
                다음: 난이도 선택
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 3: Level Selection */}
          {step === 'level' && (
            <div className="flex flex-col items-center justify-center opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
              <div className="text-center mb-4">
                <button
                  onClick={() => setStep('personas')}
                  className="text-[10px] font-bold text-txt-tertiary hover:text-txt-primary mb-4 flex items-center gap-1 uppercase tracking-widest font-mono transition-colors mx-auto"
                >
                  ← Back
                </button>
                <h2 className="text-3xl font-bold text-txt-primary tracking-tight">검증 난이도를 선택하세요</h2>
              </div>

              {/* Selected Personas Summary */}
              <SelectedPersonasSummary selectedPersonas={selectedPersonas} />

              <div className="flex flex-col sm:flex-row justify-center items-stretch gap-4 w-full max-w-5xl px-4">
                <div className="w-full sm:w-72 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.4s_forwards]">
                  <LevelCard
                    level={ValidationLevel.SKETCH}
                    title="Lv.1 Idea Sketch"
                    desc="초기 아이디어 구체화 단계. 친절한 조력자와 함께 가능성을 탐색합니다."
                    icon={<Zap size={20} />}
                    colorTheme="yellow"
                    onSelect={() => onSelect('ai', ValidationLevel.SKETCH, selectedPersonas, 'discussion')}
                    usageInfo={usage?.sketch}
                    loading={usageLoading}
                  />
                </div>
                <div className="w-full sm:w-72 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.55s_forwards]">
                  <LevelCard
                    level={ValidationLevel.MVP}
                    title="Lv.2 MVP Build"
                    desc="실무 중심 검증. 불필요한 기능을 제거하고 핵심 가치에 집중합니다."
                    icon={<Layers size={20} />}
                    colorTheme="blue"
                    recommended={usage?.mvp?.available !== false}
                    onSelect={() => onSelect('ai', ValidationLevel.MVP, selectedPersonas, 'discussion')}
                    usageInfo={usage?.mvp}
                    loading={usageLoading}
                  />
                </div>
                <div className="w-full sm:w-72 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.7s_forwards]">
                  <LevelCard
                    level={ValidationLevel.DEFENSE}
                    title="Lv.3 VC Defense"
                    desc="투자 심사 시뮬레이션. 공격적인 질문을 통해 비즈니스 모델을 검증합니다."
                    icon={<Sword size={20} />}
                    colorTheme="red"
                    onSelect={() => onSelect('ai', ValidationLevel.DEFENSE, selectedPersonas, 'discussion')}
                    usageInfo={usage?.defense}
                    loading={usageLoading}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Persona Detail Modal */}
      {modalPersona && (
        <PersonaDetailModal
          persona={modalPersona}
          isSelected={selectedPersonas.includes(modalPersona.id)}
          onSelect={() => {
            if (!selectedPersonas.includes(modalPersona.id) && selectedPersonas.length < 3) {
              setSelectedPersonas([...selectedPersonas, modalPersona.id]);
            } else if (selectedPersonas.length >= 3) {
              setSelectedPersonas([...selectedPersonas.slice(0, 2), modalPersona.id]);
            }
          }}
          onDeselect={() => {
            if (selectedPersonas.length > 1) {
              setSelectedPersonas(selectedPersonas.filter(p => p !== modalPersona.id));
            }
          }}
          onClose={() => setModalPersona(null)}
          canSelect={selectedPersonas.length < 3 || selectedPersonas.includes(modalPersona.id)}
        />
      )}
    </>
  );
};

export default SelectionScreen;
