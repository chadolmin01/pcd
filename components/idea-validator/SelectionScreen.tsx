'use client';

import React, { useState, memo } from 'react';
import { Sparkles, FileText, ArrowRight, Zap, Layers, Sword, Cpu, Paintbrush, DollarSign, Megaphone, Scale, ClipboardList, Server, Calculator, User, Settings, Check, RotateCcw, Lock, Loader2, X } from 'lucide-react';
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

// Selection Card Component
const SelectionCard = memo(({
  icon,
  title,
  description,
  onClick,
  tag,
  variant = 'default'
}: {
  icon: React.ReactNode,
  title: string,
  description: string,
  onClick: () => void,
  tag?: string,
  variant?: 'default' | 'ai'
}) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col items-start p-6 h-full w-full border transition-all duration-200 text-left rounded
      ${variant === 'ai'
        ? 'bg-white border-gray-200 hover:border-black hover:shadow-sm'
        : 'bg-white border-gray-200 hover:border-black hover:shadow-sm'
      }
    `}
  >
    {tag && (
      <div className={`absolute top-5 right-5 text-[9px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider border rounded
        ${variant === 'ai'
          ? 'bg-draft-blue/10 text-draft-blue border-draft-blue/20'
          : 'bg-gray-50 text-gray-500 border-gray-200'
        }`}>
        {tag}
      </div>
    )}

    <div className={`mb-5 p-2.5 rounded border
      ${variant === 'ai'
        ? 'bg-gray-50 border-gray-100 text-gray-900 group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors'
        : 'bg-gray-50 border-gray-100 text-gray-900 group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors'
      }`}>
      {icon}
    </div>

    <h3 className="text-lg font-bold mb-2 tracking-tight text-gray-900">
      {title}
    </h3>

    <p className="text-xs text-gray-500 leading-relaxed mb-6 break-keep">
      {description}
    </p>

    <div className="mt-auto w-full flex items-center justify-between border-t border-gray-100 pt-4">
      <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">
        Select
      </span>
      <ArrowRight size={14} className="text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
    </div>
  </button>
));
SelectionCard.displayName = 'SelectionCard';

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
    className={`group relative flex flex-col items-start p-4 w-full h-[120px] bg-white border transition-all duration-200 text-left rounded hover:shadow-sm
      ${isSelected
        ? 'bg-gray-50 border-black shadow-sm'
        : 'border-gray-200 hover:border-black'
      }
    `}
  >
    {isSelected && (
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-bold">
        {selectionIndex + 1}
      </div>
    )}

    <div className="w-full flex items-start gap-3 h-full">
      <div className={`p-2 border rounded transition-colors shrink-0 ${isSelected ? 'bg-gray-800 border-gray-800 text-white' : persona.color}`}>
        {getPersonaIcon(persona.icon, 18)}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-sm text-gray-900">{persona.nameKo}</span>
          <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">{persona.name}</span>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed break-keep line-clamp-2">
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
      className="bg-white rounded max-w-md w-full shadow-xl border border-gray-200 animate-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded border ${persona.color}`}>
              {getPersonaIcon(persona.icon, 28)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{persona.nameKo}</h3>
              <span className="text-xs text-gray-400 font-mono">{persona.name}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="닫기"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        <p className="text-sm text-gray-600 leading-relaxed">
          {persona.detailDescription}
        </p>

        <div>
          <h4 className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest mb-3">
            검토 포인트
          </h4>
          <div className="flex flex-wrap gap-2">
            {persona.checkPoints.map((point, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded text-xs font-medium border border-gray-200 text-gray-600 bg-gray-50"
              >
                {point}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50">
        {isSelected ? (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center">
                <Check size={12} />
              </div>
              <span className="font-medium">선택됨</span>
            </div>
            <button
              onClick={() => { onDeselect(); onClose(); }}
              className="px-5 py-2.5 border border-gray-200 text-gray-500 rounded font-medium text-sm hover:bg-white hover:border-gray-300 transition-all"
            >
              선택 해제
            </button>
          </>
        ) : (
          <>
            <div className="text-xs text-gray-400">
              {canSelect ? '3명까지 선택 가능' : '최대 3명 선택됨'}
            </div>
            <button
              onClick={() => { onSelect(); onClose(); }}
              disabled={!canSelect}
              className={`px-5 py-2.5 rounded font-medium text-sm transition-all flex items-center gap-2
                ${canSelect
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
  const themeClasses = {
    yellow: {
      border: 'hover:border-yellow-500',
      iconBg: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    },
    blue: {
      border: 'hover:border-black',
      iconBg: 'bg-gray-50 text-gray-900 border-gray-200',
    },
    red: {
      border: 'hover:border-red-500',
      iconBg: 'bg-red-50 text-red-600 border-red-200',
    }
  };

  const currentTheme = themeClasses[colorTheme];
  const isLocked = usageInfo && usageInfo.unlocked === false;
  const isExhausted = usageInfo && !usageInfo.available && !isLocked;

  return (
    <button
      onClick={onSelect}
      disabled={isLocked || isExhausted}
      className={`group relative flex flex-col items-start p-5 w-full h-full bg-white border transition-all duration-200 text-left rounded
        ${isLocked || isExhausted ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-sm ' + currentTheme.border}
        ${recommended ? 'border-black ring-1 ring-black' : 'border-gray-200'}`}
    >
      {recommended && !isLocked && !isExhausted && (
        <div className="absolute -top-2.5 left-5 bg-black text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono rounded">
          Recommended
        </div>
      )}

      {isLocked && (
        <div className="absolute -top-2.5 left-5 bg-gray-500 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono rounded flex items-center gap-1">
          <Lock size={10} /> Locked
        </div>
      )}

      {isExhausted && (
        <div className="absolute -top-2.5 left-5 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono rounded">
          오늘 소진
        </div>
      )}

      <div className="w-full flex justify-between items-start mb-4">
        <div className={`p-2 border rounded transition-colors ${currentTheme.iconBg}`}>
          {icon}
        </div>
        {isLocked ? (
          <Lock size={14} className="text-gray-300" />
        ) : (
          <ArrowRight size={14} className="text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
        )}
      </div>

      <h4 className="text-xs font-bold text-gray-900 mb-2 font-mono uppercase tracking-wide">{title}</h4>
      <p className="text-xs text-gray-500 leading-relaxed break-keep mb-3">
        {desc}
      </p>

      {loading ? (
        <div className="mt-auto pt-3 border-t border-gray-100 w-full flex items-center gap-2">
          <Loader2 size={12} className="animate-spin text-gray-400" />
          <span className="text-[10px] text-gray-400">로딩 중...</span>
        </div>
      ) : usageInfo && (
        <div className="mt-auto pt-3 border-t border-gray-100 w-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-400">{usageInfo.label}</span>
            {usageInfo.limit === -1 ? (
              <span className="text-[10px] font-bold text-green-600">∞ 무제한</span>
            ) : (
              <span className={`text-[10px] font-bold ${usageInfo.remaining > 0 ? 'text-blue-600' : 'text-red-500'}`}>
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
    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Selected:</span>
    <div className="flex items-center gap-1">
      {selectedPersonas.map((pId) => {
        const persona = PERSONA_PRESETS.find(p => p.id === pId);
        if (!persona) return null;
        return (
          <div key={pId} className="flex items-center gap-1 px-2 py-1 bg-gray-800 text-white rounded text-[10px] font-bold">
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
  skipToLevelSelect?: boolean;
  onBack?: () => void;
  userEmail?: string;
}

type SelectionStep = 'mode' | 'personas' | 'level';

const SelectionScreen: React.FC<SelectionScreenProps> = ({ onSelect, skipToLevelSelect = false, onBack, userEmail }) => {
  const [step, setStep] = useState<SelectionStep>(skipToLevelSelect ? 'personas' : 'mode');
  const [selectedPersonas, setSelectedPersonas] = useState<PersonaRole[]>([]);
  const [modalPersona, setModalPersona] = useState<PersonaPreset | null>(null);
  const { usage, loading: usageLoading } = useUsage(userEmail || null);

  const resetToDefault = () => {
    setSelectedPersonas(DEFAULT_PERSONAS);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center h-full w-full px-6 py-8 overflow-y-auto bg-[#FAFAFA]">
        <div className="w-full max-w-6xl">

          {/* Step 1: Mode Selection */}
          {step === 'mode' && (
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Text Area */}
              <div className="w-full lg:col-span-5 space-y-6 lg:space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-gray-200 rounded">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">System Operational</span>
                </div>

                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4 leading-tight">
                    Idea Validator
                  </h1>
                  <p className="text-gray-500 text-sm leading-relaxed break-keep">
                    AI 페르소나와 함께 비즈니스 모델을 점검하고,
                    실행 가능한 PRD를 설계하세요.
                  </p>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-xl font-bold text-gray-900 font-mono">10+</div>
                    <div className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">Personas</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 font-mono">3</div>
                    <div className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">Levels</div>
                  </div>
                </div>
              </div>

              {/* Right Cards Area */}
              <div className="w-full lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                <SelectionCard
                  title="일반 등록 (Manual)"
                  description="검증 과정을 건너뛰고 표준 템플릿을 사용하여 직접 문서를 작성합니다."
                  icon={<FileText size={24} />}
                  onClick={() => onSelect('general')}
                  tag="Standard"
                  variant="default"
                />

                <SelectionCard
                  title="AI 검증 (Validation)"
                  description="원하는 전문가 페르소나를 선택하여 아이디어를 다각도로 분석합니다."
                  icon={<Sparkles size={24} />}
                  onClick={() => setStep('personas')}
                  tag="AI Powered"
                  variant="ai"
                />
              </div>
            </div>
          )}

          {/* Step 2: Persona Selection */}
          {step === 'personas' && (
            <div className="flex flex-col items-center justify-center opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
              <div className="text-center mb-6">
                <button
                  onClick={() => onBack ? onBack() : setStep('mode')}
                  className="text-[10px] font-bold text-gray-400 hover:text-gray-900 mb-4 flex items-center gap-1 uppercase tracking-widest font-mono transition-colors mx-auto"
                >
                  ← Back
                </button>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">검증 페르소나 선택</h2>
                <p className="text-sm text-gray-500">3명의 전문가를 선택하세요. 선택 순서대로 번호가 부여됩니다.</p>
              </div>

              {/* Reset Button */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-[11px] text-gray-500">
                  <span className="font-bold text-gray-900">{selectedPersonas.length}</span>/3 선택됨
                </div>
                <button
                  onClick={resetToDefault}
                  className="flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-gray-900 transition-colors"
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
                className={`px-8 py-3 rounded font-bold text-sm flex items-center gap-2 transition-all
                  ${selectedPersonas.length === 3
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                  className="text-[10px] font-bold text-gray-400 hover:text-gray-900 mb-4 flex items-center gap-1 uppercase tracking-widest font-mono transition-colors mx-auto"
                >
                  ← Back
                </button>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">검증 난이도를 선택하세요</h2>
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
