'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Send, ArrowRight, HelpCircle, BarChart2, TrendingUp, UserCheck, Lightbulb, ChevronDown, ChevronUp, Command, Target, Users, Zap, FileText } from 'lucide-react';
import { AnalysisMetrics } from './types';

// Slash Commands (Vercel v0 / Notion 스타일)
const SLASH_COMMANDS = [
  {
    command: '/analyze',
    label: '심층 분석',
    description: '현재 아이디어를 더 깊이 분석합니다',
    icon: Target,
    prompt: '지금까지의 아이디어를 심층 분석해 주세요. 강점, 약점, 기회, 위협 요소를 SWOT 프레임워크로 정리해 주세요.'
  },
  {
    command: '/competitor',
    label: '경쟁사 분석',
    description: '경쟁 환경을 분석합니다',
    icon: Users,
    prompt: '이 아이디어의 경쟁사와 대안 솔루션을 분석해 주세요. 차별화 포인트는 무엇인가요?'
  },
  {
    command: '/pivot',
    label: '피벗 제안',
    description: '새로운 방향성을 제안받습니다',
    icon: Zap,
    prompt: '현재 아이디어의 피벗 가능성을 검토해 주세요. 어떤 방향으로 전환하면 더 좋을까요?'
  },
  {
    command: '/summary',
    label: '요약 정리',
    description: '지금까지의 대화를 요약합니다',
    icon: FileText,
    prompt: '지금까지의 검증 내용을 요약해 주세요. 핵심 인사이트와 다음 액션 아이템을 정리해 주세요.'
  },
];

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFinish: () => void;
  isTyping: boolean;
  metrics: AnalysisMetrics | null;
  showInputMode: boolean;
  onShowInputMode: () => void;
  turnCount: number;
  placeholder?: string;
  isGovernmentMode?: boolean;
  showQuickActions?: boolean;
  currentSectionTitle?: string;
}

// Context-Sensitive Help (섹션별 도움말)
const SECTION_HELP: Record<string, { tip: string; example: string }> = {
  '문제인식': {
    tip: '고객이 실제로 겪는 문제를 구체적인 수치와 함께 설명하세요',
    example: '예: "직장인 70%가 점심 메뉴 선택에 매일 15분 이상 소비"',
  },
  '실현가능성': {
    tip: '기술적 구현 가능성과 팀의 역량을 구체적으로 보여주세요',
    example: '예: "팀원 3명 모두 5년+ 경력, MVP 3개월 내 출시 예정"',
  },
  '성장전략': {
    tip: '시장 규모와 고객 획득 전략을 명확히 제시하세요',
    example: '예: "TAM 1조원, 초기 B2B SaaS로 시작 후 B2C 확장"',
  },
  '팀구성': {
    tip: '팀원의 관련 경험과 역할 분담을 설명하세요',
    example: '예: "CTO 네이버 출신 7년, CPO 토스 출신 5년"',
  },
};

const QUICK_ACTIONS = [
  { label: '구체화 요청', icon: HelpCircle, prompt: '이 부분을 더 구체적으로 설명해 주세요' },
  { label: '경쟁 분석', icon: BarChart2, prompt: '경쟁사 대비 차별점을 분석해 주세요' },
  { label: '시장 규모', icon: TrendingUp, prompt: '타겟 시장 규모를 추정해 주세요' },
];

const GOVT_QUICK_ACTIONS = [
  { label: '심사위원 시점', icon: UserCheck, prompt: '심사위원 관점에서 이 답변의 설득력을 평가해 주세요' },
];

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  onInputChange,
  onSend,
  onFinish,
  isTyping,
  metrics,
  showInputMode,
  onShowInputMode,
  turnCount,
  placeholder = "아이디어나 답변을 입력하세요...",
  isGovernmentMode = false,
  showQuickActions = true,
  currentSectionTitle,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const contextHelp = currentSectionTitle ? SECTION_HELP[currentSectionTitle] : null;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef2 = useRef<HTMLTextAreaElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  // 슬래시 커맨드 필터링
  const filteredCommands = useMemo(() => {
    if (!slashFilter) return SLASH_COMMANDS;
    const filter = slashFilter.toLowerCase();
    return SLASH_COMMANDS.filter(cmd =>
      cmd.command.toLowerCase().includes(filter) ||
      cmd.label.toLowerCase().includes(filter)
    );
  }, [slashFilter]);

  // 슬래시 커맨드 감지
  useEffect(() => {
    if (input.startsWith('/')) {
      setShowSlashMenu(true);
      setSlashFilter(input.slice(1));
      setSelectedCommandIndex(0);
    } else {
      setShowSlashMenu(false);
      setSlashFilter('');
    }
  }, [input]);

  // Issue #1: 슬래시 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showSlashMenu &&
        slashMenuRef.current &&
        !slashMenuRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSlashMenu(false);
        setSlashFilter('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSlashMenu]);

  // 슬래시 커맨드 선택
  const selectCommand = (cmd: typeof SLASH_COMMANDS[0]) => {
    onInputChange(cmd.prompt);
    setShowSlashMenu(false);
    textareaRef.current?.focus();
  };

  // 자동 높이 조절
  const adjustHeight = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`; // 최대 150px
    }
  };

  useEffect(() => {
    adjustHeight(textareaRef.current);
  }, [input]);

  useEffect(() => {
    adjustHeight(textareaRef2.current);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.metaKey || e.ctrlKey;

    // Cmd/Ctrl + K: 슬래시 명령어 메뉴 열기
    if (isMod && e.key === 'k') {
      e.preventDefault();
      onInputChange('/');
      return;
    }

    // Cmd/Ctrl + Enter: 전송 (Shift 없이도)
    if (isMod && e.key === 'Enter') {
      e.preventDefault();
      if (input.trim() && !isTyping && !showSlashMenu) {
        onSend();
      }
      return;
    }

    // 슬래시 메뉴가 열려있을 때 키보드 네비게이션
    if (showSlashMenu && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        // Issue #3: 범위 초과 방지
        const safeIndex = Math.min(selectedCommandIndex, filteredCommands.length - 1);
        if (safeIndex >= 0 && filteredCommands[safeIndex]) {
          selectCommand(filteredCommands[safeIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(false);
        onInputChange('');
        return;
      }
    }

    // 일반 Enter 처리
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 md:p-6 shrink-0 z-10">
      <div className="max-w-4xl mx-auto relative">
        {/* No metrics yet - show normal input */}
        {!metrics && (
          <>
            {/* Context-Sensitive Help (Progressive Disclosure 스타일) */}
            {contextHelp && isGovernmentMode && !input && (
              <div className="mb-3">
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="flex items-center gap-2 text-xs text-txt-secondary hover:text-txt-primary transition-colors"
                >
                  <Lightbulb size={14} />
                  <span className="font-medium">'{currentSectionTitle}' 작성 팁</span>
                  {showHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showHelp && (
                  <div className="mt-2 p-3 bg-surface-sunken rounded-xl border border-border animate-fadeIn">
                    <p className="text-sm text-txt-primary mb-2">{contextHelp.tip}</p>
                    <p className="text-xs text-txt-tertiary italic">{contextHelp.example}</p>
                  </div>
                )}
              </div>
            )}

            {/* 퀵 액션 버튼 (v0 스타일) */}
            {showQuickActions && !input && (
              <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                <span className="text-[10px] text-txt-tertiary font-mono uppercase tracking-wider shrink-0">빠른 입력:</span>
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => onInputChange(action.prompt)}
                      disabled={isTyping}
                      className="shrink-0 px-3 py-1.5 bg-surface-sunken text-txt-secondary text-xs rounded-lg hover:bg-border-subtle transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Icon size={12} />
                      {action.label}
                    </button>
                  );
                })}
                {isGovernmentMode && GOVT_QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => onInputChange(action.prompt)}
                      disabled={isTyping}
                      className="shrink-0 px-3 py-1.5 bg-surface-sunken text-txt-secondary text-xs rounded-lg hover:bg-border-subtle transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Icon size={12} />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="relative">
              {/* Slash Command Dropdown (Notion/v0 스타일) - Issue #4: ARIA 접근성 추가 */}
              {showSlashMenu && filteredCommands.length > 0 && (
                <div
                  ref={slashMenuRef}
                  id="slash-menu-listbox"
                  role="listbox"
                  aria-label="슬래시 명령어 목록"
                  className="absolute bottom-full left-0 right-0 mb-2 bg-surface-card border border-border rounded-xl shadow-md overflow-hidden z-40 animate-in fade-in slide-in-from-bottom-2"
                >
                  <div className="p-2 border-b border-border-subtle bg-surface-sunken">
                    <div className="flex items-center gap-2 text-[10px] text-txt-tertiary font-mono uppercase tracking-wider">
                      <Command size={12} />
                      <span>명령어 선택 (↑↓로 이동, Enter로 선택)</span>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCommands.map((cmd, idx) => {
                      const Icon = cmd.icon;
                      const isSelected = idx === selectedCommandIndex;
                      return (
                        <button
                          key={cmd.command}
                          id={`slash-cmd-${idx}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => selectCommand(cmd)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? 'bg-surface-sunken text-txt-primary'
                              : 'hover:bg-surface-sunken/50 text-txt-secondary'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-surface-inverse text-txt-inverse' : 'bg-surface-sunken text-txt-secondary'
                          }`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-txt-secondary">{cmd.command}</span>
                              <span className="font-medium text-sm">{cmd.label}</span>
                            </div>
                            <p className="text-xs text-txt-tertiary truncate">{cmd.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 bg-surface-card border border-border rounded-xl px-4 py-3 shadow-sm focus-within:border-border-strong focus-within:shadow-md transition-all min-h-[52px]">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  className="flex-1 bg-transparent text-base text-txt-primary focus:outline-none placeholder-txt-disabled resize-none leading-relaxed self-center"
                  placeholder={placeholder}
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  aria-haspopup="listbox"
                  aria-expanded={showSlashMenu}
                  aria-controls={showSlashMenu ? "slash-menu-listbox" : undefined}
                  aria-activedescendant={showSlashMenu ? `slash-cmd-${selectedCommandIndex}` : undefined}
                />
                <button
                  onClick={onSend}
                  disabled={isTyping || !input.trim() || showSlashMenu}
                  aria-label="메시지 전송"
                  className={`p-2 rounded-lg transition-colors
                    ${input.trim() && !isTyping && !showSlashMenu
                      ? 'bg-surface-inverse text-txt-inverse hover:opacity-90'
                      : 'bg-surface-sunken text-txt-disabled cursor-not-allowed'}
                  `}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-txt-tertiary mt-2 font-mono">
              <kbd className="px-1 py-0.5 bg-surface-sunken rounded text-txt-secondary text-[9px]">⌘K</kbd> 명령어 · <kbd className="px-1 py-0.5 bg-surface-sunken rounded text-txt-secondary text-[9px]">⌘↵</kbd> 전송 · Draft AI can make mistakes.
            </p>
          </>
        )}

        {/* Has metrics but not in input mode - show thin status bar only */}
        {metrics && !showInputMode && (
          <div className="flex items-center justify-between p-4 bg-surface-card rounded-xl shadow-md">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-txt-secondary">현재 점수: </span>
                <span className="font-bold text-txt-primary">{metrics.score}점</span>
              </div>
              <span className="text-border">|</span>
              <span className="text-sm text-txt-secondary">{turnCount}/10 턴</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onShowInputMode}
                className="px-4 py-2 border border-border text-txt-secondary text-xs font-bold rounded-lg hover:bg-surface-sunken transition-colors"
              >
                계속 대화하기
              </button>
              <button
                onClick={onFinish}
                className="px-4 py-2 bg-surface-inverse text-txt-inverse text-xs font-bold rounded-lg hover:opacity-90 transition-colors flex items-center gap-2"
              >
                검증 완료
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Has metrics and in input mode - show input with status */}
        {metrics && showInputMode && (
          <div className="bg-surface-card rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 text-xs text-txt-secondary">
                <span>현재 점수: <span className="font-bold text-txt-primary">{metrics.score}점</span></span>
                <span className="text-border">|</span>
                <span>{turnCount}/10 턴</span>
              </div>
              <button
                onClick={onFinish}
                className="px-3 py-1.5 bg-surface-inverse text-txt-inverse text-xs font-bold rounded-lg hover:opacity-90 transition-colors flex items-center gap-1.5"
              >
                검증 완료
                <ArrowRight size={12} />
              </button>
            </div>
            <div className="relative flex items-center gap-3 bg-surface-sunken rounded-xl px-4 py-2 focus-within:bg-surface-card focus-within:ring-2 focus-within:ring-border-strong/10 transition-all min-h-[44px]">
              <textarea
                ref={textareaRef2}
                rows={1}
                className="flex-1 bg-transparent text-base text-txt-primary focus:outline-none placeholder-txt-disabled resize-none leading-relaxed self-center"
                placeholder="추가 질문이나 답변을 입력하세요..."
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                autoFocus
              />
              <button
                onClick={onSend}
                disabled={isTyping || !input.trim()}
                aria-label="메시지 전송"
                className={`p-2 rounded-lg transition-colors
                  ${input.trim() && !isTyping
                    ? 'bg-surface-inverse text-txt-inverse hover:opacity-90'
                    : 'bg-surface-sunken text-txt-disabled cursor-not-allowed'}
                `}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
