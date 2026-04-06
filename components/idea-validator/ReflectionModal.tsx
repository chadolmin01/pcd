'use client';

import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { PerspectiveAdvice, PERSONA_PRESETS } from './types';
import { Cpu, Paintbrush, DollarSign, Megaphone, Scale, ClipboardList, Server, Calculator, User, Settings } from 'lucide-react';

export interface ReflectionModalState {
  msgId: string;
  respIdx: number;
  role: string;
  originalContent: string;
  suggestedActions: string[];
  perspectives?: PerspectiveAdvice[];
  selectedPerspectiveIdx?: number;
}

interface ReflectionModalProps {
  modalState: ReflectionModalState;
  reflectionText: string;
  onReflectionTextChange: (text: string) => void;
  onSelectPerspective: (idx: number, content: string) => void;
  onClose: () => void;
  onSave: () => void;
  onRemove: () => void;
  isAlreadyReflected: boolean;
}

const getPersonaIcon = (role: string) => {
  const preset = PERSONA_PRESETS.find(p => p.id === role || p.name === role);
  if (preset) {
    const icons: Record<string, React.ReactNode> = {
      'Cpu': <Cpu size={16} />,
      'Paintbrush': <Paintbrush size={16} />,
      'DollarSign': <DollarSign size={16} />,
      'Megaphone': <Megaphone size={16} />,
      'Scale': <Scale size={16} />,
      'ClipboardList': <ClipboardList size={16} />,
      'Server': <Server size={16} />,
      'Calculator': <Calculator size={16} />,
      'User': <User size={16} />,
      'Settings': <Settings size={16} />,
    };
    return icons[preset.icon] || <Cpu size={16} />;
  }
  return <Cpu size={16} />;
};

const ReflectionModal: React.FC<ReflectionModalProps> = ({
  modalState,
  reflectionText,
  onReflectionTextChange,
  onSelectPerspective,
  onClose,
  onSave,
  onRemove,
  isAlreadyReflected,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reflection-modal-title"
        className="bg-surface-card w-full max-w-xl rounded-xl shadow-md border border-border flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-sunken rounded-xl text-txt-secondary">
              {getPersonaIcon(modalState.role)}
            </div>
            <div>
              <h3 id="reflection-modal-title" className="font-bold text-txt-primary text-sm">
                {modalState.role} 관점 선택
              </h3>
              <p className="text-[10px] text-txt-tertiary font-mono">3가지 관점 중 하나를 선택하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="모달 닫기"
            className="text-txt-tertiary hover:text-txt-primary transition-colors p-1.5 rounded hover:bg-surface-sunken"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto" data-tutorial="modal-content">
          {/* 서브 관점 선택 UI */}
          {modalState.perspectives && modalState.perspectives.length > 0 ? (
            <div className="mb-5" data-tutorial="quick-select">
              <label className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest text-txt-tertiary mb-3">
                <Sparkles size={10} />
                관점 선택
              </label>
              <div className="grid grid-cols-1 gap-3">
                {modalState.perspectives.map((perspective, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectPerspective(idx, perspective.content)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      modalState.selectedPerspectiveIdx === idx
                        ? 'bg-surface-sunken border-border-strong shadow-sm'
                        : 'bg-surface-card border-border hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        modalState.selectedPerspectiveIdx === idx
                          ? 'bg-surface-inverse border-surface-inverse'
                          : 'border-border-strong'
                      }`}>
                        {modalState.selectedPerspectiveIdx === idx && <Check size={12} className="text-txt-inverse" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-txt-primary">{perspective.perspectiveLabel}</span>
                          <span className="text-[10px] text-txt-tertiary font-mono">
                            #{perspective.perspectiveId}
                          </span>
                        </div>
                        <p className="text-xs text-txt-secondary leading-relaxed break-keep mb-2">
                          {perspective.content}
                        </p>
                        {perspective.suggestedActions && perspective.suggestedActions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {perspective.suggestedActions.map((action, aIdx) => (
                              <span key={aIdx} className="text-[10px] px-2 py-1 bg-surface-sunken text-txt-secondary rounded-full">
                                {action}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // 기존 UI (perspectives가 없는 경우 폴백)
            <>
              <div className="mb-5">
                <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-txt-tertiary mb-2 block">Original</label>
                <div className="p-4 bg-surface-sunken rounded-xl border border-border text-sm text-txt-secondary leading-relaxed break-keep">
                  {modalState.originalContent}
                </div>
              </div>

              {modalState.suggestedActions && modalState.suggestedActions.length > 0 && (
                <div className="mb-5">
                  <label className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest text-txt-tertiary mb-2">
                    <Sparkles size={10} />
                    Quick Select
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {modalState.suggestedActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => onReflectionTextChange(action)}
                        className={`text-left p-3 rounded-xl border transition-all text-sm ${
                          reflectionText === action
                            ? 'bg-surface-sunken border-border-strong shadow-sm text-txt-primary'
                            : 'bg-surface-card border-border hover:border-border-strong text-txt-secondary'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            reflectionText === action ? 'bg-surface-inverse border-surface-inverse' : 'border-border-strong'
                          }`}>
                            {reflectionText === action && <Check size={10} className="text-txt-inverse" />}
                          </div>
                          <span className="break-keep text-xs">{action}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 나의 결정 입력 */}
          <div data-tutorial="my-decision">
            <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-txt-tertiary mb-2 block">
              나의 결정 (수정 가능)
            </label>
            <textarea
              value={reflectionText}
              onChange={(e) => onReflectionTextChange(e.target.value)}
              className="w-full h-24 p-4 bg-surface-card border border-border rounded-xl text-txt-primary text-sm leading-relaxed focus:outline-none focus:border-border-strong resize-none transition-all"
              placeholder="선택한 관점의 조언을 수정하거나 직접 작성하세요..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface-sunken flex justify-end gap-3 shrink-0">
          {isAlreadyReflected && (
            <button
              onClick={onRemove}
              className="mr-auto text-status-danger-text text-[10px] font-bold font-mono uppercase hover:underline"
            >
              선택 취소
            </button>
          )}

          <button
            onClick={onSave}
            disabled={!reflectionText.trim()}
            className="px-5 py-2 bg-surface-inverse text-txt-inverse font-bold rounded-xl hover:opacity-90 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAlreadyReflected ? '수정' : '확인'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReflectionModal;
