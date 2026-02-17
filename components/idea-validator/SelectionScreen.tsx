'use client';

import React, { useState } from 'react';
import { Sparkles, FileText, ArrowRight, Zap, Layers, Sword, Cpu, Paintbrush, DollarSign, Megaphone, Scale, ClipboardList, Server, Calculator, User, Settings, Check, RotateCcw } from 'lucide-react';
import { ValidationLevel, PersonaRole, PERSONA_PRESETS, DEFAULT_PERSONAS, PersonaPreset } from './types';

interface SelectionScreenProps {
  onSelect: (mode: 'general' | 'ai', level?: ValidationLevel, personas?: PersonaRole[]) => void;
  skipToLevelSelect?: boolean;
  onBack?: () => void;
}

type SelectionStep = 'mode' | 'personas' | 'level';

const SelectionScreen: React.FC<SelectionScreenProps> = ({ onSelect, skipToLevelSelect = false, onBack }) => {
  const [step, setStep] = useState<SelectionStep>(skipToLevelSelect ? 'personas' : 'mode');
  const [selectedPersonas, setSelectedPersonas] = useState<PersonaRole[]>(DEFAULT_PERSONAS);

  // Icon mapping
  const getPersonaIcon = (iconName: string, size: number = 20) => {
    const icons: Record<string, React.ReactNode> = {
      'Cpu': <Cpu size={size} />,
      'Paintbrush': <Paintbrush size={size} />,
      'DollarSign': <DollarSign size={size} />,
      'Megaphone': <Megaphone size={size} />,
      'Scale': <Scale size={size} />,
      'ClipboardList': <ClipboardList size={size} />,
      'Server': <Server size={size} />,
      'Calculator': <Calculator size={size} />,
      'User': <User size={size} />,
      'Settings': <Settings size={size} />,
    };
    return icons[iconName] || <Cpu size={size} />;
  };

  const togglePersona = (personaId: PersonaRole) => {
    if (selectedPersonas.includes(personaId)) {
      // Remove if already selected (but keep at least 1)
      if (selectedPersonas.length > 1) {
        setSelectedPersonas(selectedPersonas.filter(p => p !== personaId));
      }
    } else {
      // Add if less than 3 selected
      if (selectedPersonas.length < 3) {
        setSelectedPersonas([...selectedPersonas, personaId]);
      } else {
        // Replace the last one
        setSelectedPersonas([...selectedPersonas.slice(0, 2), personaId]);
      }
    }
  };

  const resetToDefault = () => {
    setSelectedPersonas(DEFAULT_PERSONAS);
  };

  // Sharp Card Component - Matches project design system
  const SelectionCard = ({
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
      className={`group relative flex flex-col items-start p-6 h-full w-full border transition-all duration-200 text-left rounded-sm
        ${variant === 'ai'
          ? 'bg-white border-gray-200 hover:border-black hover:shadow-sm'
          : 'bg-white border-gray-200 hover:border-black hover:shadow-sm'
        }
      `}
    >
      {tag && (
        <div className={`absolute top-5 right-5 text-[9px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider border rounded-sm
          ${variant === 'ai'
            ? 'bg-draft-blue/10 text-draft-blue border-draft-blue/20'
            : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
          {tag}
        </div>
      )}

      <div className={`mb-5 p-2.5 rounded-sm border
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
  );

  // Persona Card Component
  const PersonaCard = ({ persona }: { persona: PersonaPreset }) => {
    const isSelected = selectedPersonas.includes(persona.id);
    const selectionIndex = selectedPersonas.indexOf(persona.id);

    return (
      <button
        onClick={() => togglePersona(persona.id)}
        className={`group relative flex flex-col items-start p-4 w-full h-full min-h-[100px] bg-white border transition-all duration-200 text-left rounded-lg hover:shadow-sm
          ${isSelected
            ? 'border-black ring-1 ring-black'
            : 'border-gray-200 hover:border-gray-400'
          }
        `}
      >
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
            {selectionIndex + 1}
          </div>
        )}

        <div className="w-full flex items-start gap-3 h-full">
          <div className={`p-2 border rounded-lg transition-colors shrink-0 ${isSelected ? 'bg-black border-black text-white' : persona.color}`}>
            {getPersonaIcon(persona.icon, 18)}
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-gray-900">{persona.nameKo}</span>
              <span className="text-[10px] text-gray-400 font-mono">{persona.name}</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed break-keep line-clamp-2">
              {persona.description}
            </p>
          </div>
        </div>
      </button>
    );
  };

  // Level Card Component - Matches project design system
  const LevelCard = ({ level, title, desc, icon, colorTheme, recommended = false }: {
    level: ValidationLevel,
    title: string,
    desc: string,
    icon: React.ReactNode,
    colorTheme: 'yellow' | 'blue' | 'red',
    recommended?: boolean
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

    return (
      <button
        onClick={() => onSelect('ai', level, selectedPersonas)}
        className={`group relative flex flex-col items-start p-5 w-full h-full bg-white border transition-all duration-200 text-left rounded-sm hover:shadow-sm ${currentTheme.border} ${recommended ? 'border-black ring-1 ring-black' : 'border-gray-200'}`}
      >
        {recommended && (
           <div className="absolute -top-2.5 left-5 bg-black text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono rounded-sm">
              Recommended
           </div>
        )}

        <div className="w-full flex justify-between items-start mb-4">
          <div className={`p-2 border rounded-sm transition-colors ${currentTheme.iconBg}`}>
             {icon}
          </div>
          <ArrowRight size={14} className="text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
        </div>

        <h4 className="text-xs font-bold text-gray-900 mb-2 font-mono uppercase tracking-wide">{title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed break-keep">
          {desc}
        </p>
      </button>
    );
  };

  // Selected Personas Summary
  const SelectedPersonasSummary = () => (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Selected:</span>
      <div className="flex items-center gap-1">
        {selectedPersonas.map((pId, idx) => {
          const persona = PERSONA_PRESETS.find(p => p.id === pId);
          if (!persona) return null;
          return (
            <div key={pId} className="flex items-center gap-1 px-2 py-1 bg-black text-white rounded text-[10px] font-bold">
              {getPersonaIcon(persona.icon, 12)}
              <span>{persona.nameKo}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-6 py-8 overflow-y-auto bg-[#FAFAFA]">
      <div className="w-full max-w-6xl">

        {/* Step 1: Mode Selection */}
        {step === 'mode' && (
          <div className="grid grid-cols-12 gap-6 lg:gap-10 items-center">
             {/* Left Text Area */}
             <div className="col-span-5 space-y-6 lg:space-y-8">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-gray-200 rounded-sm">
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

                <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
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
             <div className="col-span-7 grid grid-cols-2 gap-4 lg:gap-5">
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 max-w-5xl auto-rows-fr">
              {PERSONA_PRESETS.map((persona, idx) => (
                <div
                  key={persona.id}
                  className="opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards] h-full"
                  style={{ animationDelay: `${0.3 + idx * 0.05}s` }}
                >
                  <PersonaCard persona={persona} />
                </div>
              ))}
            </div>

            {/* Continue Button */}
            <button
              onClick={() => setStep('level')}
              disabled={selectedPersonas.length !== 3}
              className={`px-8 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-all
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
             <SelectedPersonasSummary />

             <div className="flex justify-center items-stretch gap-4">
                <div className="w-72 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.4s_forwards]">
                  <LevelCard
                    level={ValidationLevel.SKETCH}
                    title="Lv.1 Idea Sketch"
                    desc="초기 아이디어 구체화 단계. 친절한 조력자와 함께 가능성을 탐색합니다."
                    icon={<Zap size={20} />}
                    colorTheme="yellow"
                  />
                </div>
                <div className="w-72 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.55s_forwards]">
                  <LevelCard
                    level={ValidationLevel.MVP}
                    title="Lv.2 MVP Build"
                    desc="실무 중심 검증. 불필요한 기능을 제거하고 핵심 가치에 집중합니다."
                    icon={<Layers size={20} />}
                    colorTheme="blue"
                    recommended={true}
                  />
                </div>
                <div className="w-72 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.7s_forwards]">
                  <LevelCard
                    level={ValidationLevel.DEFENSE}
                    title="Lv.3 VC Defense"
                    desc="투자 심사 시뮬레이션. 공격적인 질문을 통해 비즈니스 모델을 검증합니다."
                    icon={<Sword size={20} />}
                    colorTheme="red"
                  />
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectionScreen;
