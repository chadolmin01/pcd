'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, ArrowRight, Cpu, Paintbrush, DollarSign, Megaphone, Scale, ClipboardList, Server, Calculator, User, Settings } from 'lucide-react';
import { ChatMessage, PERSONA_PRESETS, PerspectiveAdvice, DiscussionTurn } from './types';

interface MessageListProps {
  messages: ChatMessage[];
  lastMsgId: string | undefined;
  isTyping: boolean;
  hideInput: boolean;
  selectedPersonas?: string[]; // 선택된 페르소나 (로딩 애니메이션용)
  interactionMode?: 'individual' | 'discussion'; // 인터랙션 모드
  onOpenReflectionModal: (
    msgId: string,
    idx: number,
    role: string,
    content: string,
    suggestedActions?: string[],
    reflectedText?: string,
    perspectives?: PerspectiveAdvice[]
  ) => void;
  onConsolidatedSend: () => void;
  latestMessageRef?: React.RefObject<HTMLDivElement | null>;
}

// AI가 반환할 수 있는 다양한 이름 → 표준 ID 매핑
const normalizePersonaId = (role: string): string => {
  const aliasMap: Record<string, string> = {
    'Investor': 'VC',
    '투자자': 'VC',
    '개발자': 'Developer',
    '디자이너': 'Designer',
    '마케터': 'Marketer',
    '법률전문가': 'Legal',
    '법률 전문가': 'Legal',
    '프로덕트매니저': 'PM',
    '프로덕트 매니저': 'PM',
    '사용자': 'EndUser',
    '최종사용자': 'EndUser',
    '운영': 'Operations',
  };
  return aliasMap[role] || role;
};

const getPersonaIcon = (role: string) => {
  const normalizedRole = normalizePersonaId(role);
  const preset = PERSONA_PRESETS.find(p => p.id === normalizedRole || p.name === normalizedRole || p.nameKo === role);
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

const getPersonaColor = (role: string) => {
  const normalizedRole = normalizePersonaId(role);
  const preset = PERSONA_PRESETS.find(p => p.id === normalizedRole || p.name === normalizedRole || p.nameKo === role);
  if (preset) {
    return preset.color;
  }
  return 'bg-gray-50 border-gray-200 text-gray-600';
};

const getToneIcon = (tone: DiscussionTurn['tone']) => {
  switch (tone) {
    case 'agree': return '👍';
    case 'disagree': return '🤔';
    case 'question': return '❓';
    case 'suggestion': return '💡';
    default: return '';
  }
};

const getPersonaName = (role: string) => {
  const normalizedRole = normalizePersonaId(role);
  const preset = PERSONA_PRESETS.find(p => p.id === normalizedRole || p.name === normalizedRole || p.nameKo === role);
  return preset?.nameKo || role;
};

// 스택 카드 컴포넌트 (말풍선이 뒤로 쌓이는 느낌)
interface StackedCardsProps {
  items: { persona: string; message: string }[];
  isExpanded: boolean;
  onToggle: () => void;
  type: 'opinion' | 'discussion';
  isStreaming?: boolean;
}

const StackedCards: React.FC<StackedCardsProps> = ({ items, isExpanded, onToggle, type, isStreaming }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  // 스트리밍 중: 아이템이 추가될 때마다 순차적으로 표시
  useEffect(() => {
    if (isStreaming && visibleCount < items.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => prev + 1);
      }, 1800); // 읽을 수 있는 속도 (약 2초)
      return () => clearTimeout(timer);
    } else if (!isStreaming) {
      // 스트리밍 완료 후에는 모두 표시
      setVisibleCount(items.length);
    }
  }, [isStreaming, visibleCount, items.length]);

  // 실제로 보여줄 아이템 (스트리밍 중에는 visibleCount까지만)
  const displayItems = isStreaming ? items.slice(0, visibleCount) : items;

  if (displayItems.length === 0) {
    // 스트리밍 시작했지만 아직 표시할 것이 없을 때
    if (isStreaming && items.length > 0) {
      return (
        <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
        </div>
      );
    }
    return null;
  }

  const shownItems = isExpanded ? displayItems : [displayItems[displayItems.length - 1]];
  const hiddenCount = isExpanded ? 0 : displayItems.length - 1;

  return (
    <div className="relative">
      {/* 스택된 카드들 (접혔을 때) */}
      {!isExpanded && hiddenCount > 0 && (
        <div className="absolute -top-2 left-2 right-2 h-3 bg-gray-100 border border-gray-200 rounded-t-lg opacity-60" />
      )}
      {!isExpanded && hiddenCount > 1 && (
        <div className="absolute -top-4 left-4 right-4 h-3 bg-gray-50 border border-gray-100 rounded-t-lg opacity-40" />
      )}

      {/* 실제 카드들 */}
      <div className={`space-y-2 ${isExpanded ? '' : 'relative z-10'}`}>
        {shownItems.map((item, idx) => {
          const isLeft = type === 'discussion' ? idx % 2 === 0 : true;

          return (
            <div
              key={idx}
              className={`flex ${isLeft ? 'justify-start' : 'justify-end'} animate-[fadeInUp_0.3s_ease-out]`}
            >
              <div className={`flex gap-3 max-w-[85%] ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-9 h-9 border-2 rounded-full flex items-center justify-center shrink-0 shadow-sm ${getPersonaColor(item.persona)}`}>
                  {getPersonaIcon(item.persona)}
                </div>
                <div className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'}`}>
                  <span className="font-bold text-xs text-gray-900 mb-1">{getPersonaName(item.persona)}</span>
                  <div className={`p-3 rounded-2xl text-sm text-gray-700 leading-relaxed break-keep shadow-sm ${
                    isLeft ? 'bg-white border border-gray-200 rounded-tl-sm' : 'bg-gray-50 border border-gray-200 rounded-tr-sm'
                  }`}>
                    {item.message}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 스트리밍 중 다음 카드 로딩 표시 */}
      {isStreaming && visibleCount < items.length && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
        </div>
      )}

      {/* 펼치기/접기 버튼 */}
      {displayItems.length > 1 && !isStreaming && (
        <button
          onClick={onToggle}
          className="mt-2 text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>접기</>
          ) : (
            <>+{hiddenCount}개 더 보기</>
          )}
        </button>
      )}
    </div>
  );
};

// 토론 블록 컴포넌트 (병렬 + 합성 스트리밍)
interface DiscussionBlockProps {
  msg: ChatMessage;
  lastMsgId: string | undefined;
  isTyping: boolean;
  onOpenReflectionModal: (
    msgId: string,
    idx: number,
    role: string,
    content: string,
    suggestedActions?: string[],
    reflectedText?: string,
    perspectives?: PerspectiveAdvice[]
  ) => void;
  onConsolidatedSend: () => void;
}

const DiscussionBlock: React.FC<DiscussionBlockProps> = ({
  msg,
  lastMsgId,
  isTyping,
  onOpenReflectionModal,
  onConsolidatedSend,
}) => {
  const opinions = msg.opinions || [];
  const closingRemarks = msg.closingRemarks || [];
  const waitingMessages = msg.waitingMessages || [];
  const discussion = msg.discussion || [];
  const isStreaming = msg.isStreaming;
  const streamPhase = msg.streamPhase || 'opinions';

  const [isOpinionsExpanded, setIsOpinionsExpanded] = useState(false);
  const [isDiscussionExpanded, setIsDiscussionExpanded] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const finalCardsRef = useRef<HTMLDivElement>(null);

  // 최종 제안 카드가 표시되면 화면 상단에 보이도록 스크롤
  useEffect(() => {
    if (showCards && finalCardsRef.current) {
      setTimeout(() => {
        finalCardsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [showCards]);

  // 모든 메시지를 하나의 연속된 대화로 합치기
  const allMessages: { type: 'opinion' | 'closing' | 'waiting' | 'discussion'; persona: string; message: string; idx: number; tone?: 'positive' | 'concern' | 'neutral' }[] = [
    ...opinions.map((o, idx) => ({ type: 'opinion' as const, persona: o.persona, message: o.message, idx, tone: o.tone })),
    ...closingRemarks.map((c, idx) => ({ type: 'closing' as const, persona: c.persona, message: c.message, idx: opinions.length + idx })),
    ...waitingMessages.map((w, idx) => ({ type: 'waiting' as const, persona: w.persona, message: w.message, idx: opinions.length + closingRemarks.length + idx })),
    ...discussion.map((d, idx) => ({ type: 'discussion' as const, persona: d.persona, message: d.message, idx: opinions.length + closingRemarks.length + waitingMessages.length + idx })),
  ];

  // 순차 표시를 위한 상태
  const [displayCount, setDisplayCount] = useState(0);
  // 스트리밍이 시작되었는지 추적 (한번 시작되면 true, 끝나도 true 유지)
  const [wasEverStreaming, setWasEverStreaming] = useState(false);

  // 스트리밍 시작 감지
  useEffect(() => {
    if (isStreaming) {
      setWasEverStreaming(true);
    }
  }, [isStreaming]);

  // 새 메시지가 오면 순차적으로 표시 (스트리밍 중이거나, 스트리밍이었던 경우)
  // 로딩 애니메이션을 먼저 보여주고 → 메시지 표시하는 UX
  useEffect(() => {
    if (displayCount < allMessages.length) {
      // 스트리밍 중이거나 스트리밍이었던 메시지는 순차 표시
      if (wasEverStreaming || isStreaming) {
        // 로딩 애니메이션을 보여준 후 메시지 표시
        // 여유있는 타이밍으로 자연스러운 대화 느낌
        const loadingDelay = displayCount === 0 ? 1200 : 1800;
        const timer = setTimeout(() => {
          setDisplayCount(prev => prev + 1);
        }, loadingDelay);
        return () => clearTimeout(timer);
      } else {
        // 히스토리에서 로드된 메시지는 즉시 표시
        setDisplayCount(allMessages.length);
      }
    }
  }, [displayCount, allMessages.length, wasEverStreaming, isStreaming]);

  const visibleMessages = allMessages.slice(0, displayCount);
  const isShowingAll = displayCount >= allMessages.length;

  // 모든 메시지가 표시된 후에만 최종 제안 카드 표시
  useEffect(() => {
    if (!isStreaming && msg.responses && msg.responses.length > 0 && isShowingAll) {
      const timer = setTimeout(() => setShowCards(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, msg.responses, isShowingAll]);

  return (
    <div className="w-full">
      {/* 토론 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">D</span>
        </div>
        <span className="text-xs font-bold text-gray-900">팀 토론</span>
        <span className="text-[10px] font-mono text-gray-400">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* 스택 카드 형태의 대화 흐름 */}
      <div className="ml-10">
        {visibleMessages.length > 0 && (
          <div
            className="relative cursor-pointer"
            onClick={() => !isStreaming && visibleMessages.length > 1 && setIsDiscussionExpanded(!isDiscussionExpanded)}
          >
            {/* 펼쳐진 상태: 모든 메시지 표시 */}
            {isDiscussionExpanded ? (
              <div className="space-y-3">
                {visibleMessages.map((item, idx) => {
                  const isClosing = item.type === 'closing';
                  const isWaiting = item.type === 'waiting';
                  const isDiscussionMsg = item.type === 'discussion';
                  const isOpinion = item.type === 'opinion';

                  const getMessageStyle = () => {
                    if (isClosing) return 'bg-gray-50 border border-gray-200 text-gray-500 italic';
                    if (isWaiting) return 'bg-amber-50 border border-amber-100 text-gray-600';
                    if (isDiscussionMsg) return 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-gray-700';
                    if (isOpinion && item.tone === 'positive') return 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 text-gray-700';
                    if (isOpinion && item.tone === 'concern') return 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-gray-700';
                    return 'bg-white border border-gray-200 text-gray-700';
                  };

                  const getToneEmoji = () => {
                    if (isOpinion && item.tone === 'positive') return '👍';
                    if (isOpinion && item.tone === 'concern') return '🤔';
                    return null;
                  };

                  return (
                    <div key={`${item.type}-${item.idx}`} className="flex justify-start animate-[fadeInUp_0.2s_ease-out]">
                      <div className="flex gap-3 max-w-[85%] flex-row">
                        <div className={`w-9 h-9 border-2 rounded-full flex items-center justify-center shrink-0 shadow-sm ${getPersonaColor(item.persona)}`}>
                          {getPersonaIcon(item.persona)}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-xs text-gray-900 mb-1">
                            {getPersonaName(item.persona)}
                            {getToneEmoji() && <span className="ml-1">{getToneEmoji()}</span>}
                          </span>
                          <div className={`p-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm ${getMessageStyle()}`}>
                            {item.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* 접기 버튼 */}
                <button
                  onClick={(e) => { e.stopPropagation(); setIsDiscussionExpanded(false); }}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mt-2 transition-colors"
                >
                  <span>접기</span>
                </button>
              </div>
            ) : (
              /* 접힌 상태: 최신 메시지만 부드럽게 표시 */
              <div className="relative">
                {/* 최신 메시지 */}
                {(() => {
                  const item = visibleMessages[visibleMessages.length - 1];
                  const isClosing = item.type === 'closing';
                  const isWaiting = item.type === 'waiting';
                  const isDiscussionMsg = item.type === 'discussion';
                  const isOpinion = item.type === 'opinion';

                  const getMessageStyle = () => {
                    if (isClosing) return 'bg-gray-50 border border-gray-200 text-gray-500 italic';
                    if (isWaiting) return 'bg-amber-50 border border-amber-100 text-gray-600';
                    if (isDiscussionMsg) return 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-gray-700';
                    if (isOpinion && item.tone === 'positive') return 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 text-gray-700';
                    if (isOpinion && item.tone === 'concern') return 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-gray-700';
                    return 'bg-white border border-gray-200 text-gray-700';
                  };

                  const getToneEmoji = () => {
                    if (isOpinion && item.tone === 'positive') return '👍';
                    if (isOpinion && item.tone === 'concern') return '🤔';
                    return null;
                  };

                  return (
                    <div
                      key={`${item.type}-${item.idx}`}
                      className="flex justify-start animate-[fadeIn_0.4s_ease-out]"
                    >
                      <div className="flex gap-3 max-w-[85%] flex-row">
                        <div className={`w-9 h-9 border-2 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 ${getPersonaColor(item.persona)}`}>
                          {getPersonaIcon(item.persona)}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-xs text-gray-900 mb-1">
                            {getPersonaName(item.persona)}
                            {getToneEmoji() && <span className="ml-1">{getToneEmoji()}</span>}
                          </span>
                          <div className={`p-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm transition-all duration-300 ${getMessageStyle()}`}>
                            {item.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 더보기 힌트 */}
                {visibleMessages.length > 1 && !isStreaming && (
                  <div className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
                    <span>+{visibleMessages.length - 1}개 더 보기</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 다음 메시지 로딩 표시 */}
        {!isShowingAll && allMessages.length > 0 && (
          <div className={`flex justify-start ${visibleMessages.length > 0 ? 'mt-3' : ''}`}>
            <div className="flex gap-3 flex-row">
              <div className={`w-9 h-9 border-2 rounded-full flex items-center justify-center shrink-0 animate-pulse ${
                allMessages[displayCount] ? getPersonaColor(allMessages[displayCount].persona) : 'bg-gray-100 border-gray-200'
              }`}>
                {allMessages[displayCount] && getPersonaIcon(allMessages[displayCount].persona)}
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-xs text-gray-400 mb-1">
                  {allMessages[displayCount] ? getPersonaName(allMessages[displayCount].persona) : '...'}
                </span>
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 rounded-2xl rounded-tl-sm">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 스트리밍 시작 대기 표시 */}
        {isStreaming && allMessages.length === 0 && (
          <div className="flex justify-start">
            <div className="flex gap-3 flex-row">
              <div className="w-9 h-9 border-2 rounded-full flex items-center justify-center shrink-0 animate-pulse bg-gray-100 border-gray-200">
                <span className="text-gray-400 text-xs">?</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-xs text-gray-400 mb-1">검토 시작...</span>
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 rounded-2xl rounded-tl-sm">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 토론 후 제안 카드 (모든 토론 완료 후 표시) */}
      {showCards && msg.responses && msg.responses.length > 0 && msg.responses[0].role !== 'System' && (
        <>
          <div ref={finalCardsRef} className="ml-10 mt-6 mb-3 flex items-center gap-2 scroll-mt-4">
            <div className="h-px flex-1 bg-gray-200"></div>
            <span className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-wider">최종 제안</span>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-10" data-tutorial="persona-cards">
            {msg.responses?.map((resp, idx) => (
              <button
                key={idx}
                onClick={() => resp.role !== 'System' && onOpenReflectionModal(
                  msg.id, idx, resp.role, resp.content,
                  resp.suggestedActions, resp.reflectedText, resp.perspectives
                )}
                className={`relative flex flex-col items-start p-5 border transition-all duration-200 text-left group w-full min-h-[180px] opacity-0 animate-[fadeInUp_0.4s_ease-out_forwards]
                  ${resp.isReflected
                    ? 'bg-gray-50 border-gray-300 shadow-sm rounded'
                    : 'bg-white border-gray-200 hover:border-black hover:shadow-sm rounded'
                  }
                `}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`w-9 h-9 border rounded flex items-center justify-center mb-4 transition-colors
                  ${resp.isReflected
                    ? 'bg-gray-800 border-gray-800 text-white'
                    : `${getPersonaColor(resp.role)} group-hover:bg-black group-hover:border-black group-hover:text-white`
                  }
                `}>
                  {getPersonaIcon(resp.role)}
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-bold text-sm text-gray-900">{resp.role}</span>
                  {resp.perspectives && resp.perspectives.length > 0 && (
                    <span className="text-[10px] text-gray-400 font-mono">
                      {resp.perspectives.slice(0, 3).map((p, pIdx) => (
                        <span key={pIdx}>#{p.perspectiveLabel.replace(/\s+/g, '')} </span>
                      ))}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed break-keep flex-1">
                  {resp.isReflected && resp.reflectedText ? resp.reflectedText : resp.content}
                </p>
                {resp.isReflected && (
                  <div className="absolute top-4 right-4 w-5 h-5 bg-gray-800 rounded flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Next Step Button */}
          {msg.id === lastMsgId && msg.responses?.some(r => r.isReflected) && (
            <div className="ml-10 mt-4 flex items-center justify-between p-3 bg-white border border-gray-200 rounded" data-tutorial="next-step-button">
              <div className="text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wide">
                {msg.responses.filter(r => r.isReflected).length}개 조언 선택됨
              </div>
              <button
                onClick={onConsolidatedSend}
                disabled={isTyping}
                className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                다음 단계
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const MessageList: React.FC<MessageListProps> = ({
  messages,
  lastMsgId,
  isTyping,
  hideInput,
  selectedPersonas = [],
  interactionMode = 'individual',
  onOpenReflectionModal,
  onConsolidatedSend,
  latestMessageRef,
}) => {
  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 pt-4 pb-[30vh]`}>
      {messages.map((msg, msgIndex) => (
        <div
          key={msg.id}
          ref={msgIndex === messages.length - 1 ? latestMessageRef : undefined}
          className={`flex gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'} scroll-mt-4`}
        >
          {msg.isUser ? (
            // User Message
            <>
              <div className="max-w-[70%] space-y-1">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs font-bold text-gray-900">Me</span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`p-4 rounded text-sm leading-relaxed shadow-sm break-keep
                  ${msg.text?.startsWith('[종합 결정 사항]')
                      ? 'bg-black text-white border border-black'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                  {msg.text}
                </div>
              </div>
              <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 mt-6">
                <span className="text-gray-500 text-xs font-bold">U</span>
              </div>
            </>
          ) : (
            // AI Responses (Discussion or Individual)
            <>
              {/* 토론 모드 (토론 + 제안 카드) - 스트리밍 중이거나 토론이 있을 때 */}
              {(msg.isStreaming || (msg.discussion && msg.discussion.length > 0)) ? (
                <DiscussionBlock
                  msg={msg}
                  lastMsgId={lastMsgId}
                  isTyping={isTyping}
                  onOpenReflectionModal={onOpenReflectionModal}
                  onConsolidatedSend={onConsolidatedSend}
                />
              ) : msg.responses && msg.responses.length > 0 && msg.responses[0].role === 'System' ? (
                <>
                  <div className="w-8 h-8 bg-black rounded flex items-center justify-center shrink-0 mt-6">
                    <span className="text-white font-bold text-xs">D</span>
                  </div>
                  <div className="max-w-[70%] space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">Draft AI</span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded text-sm text-gray-700 leading-relaxed break-keep shadow-sm">
                      {msg.responses[0].content}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                      <span className="text-white font-bold text-xs">D</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">Draft AI</span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-10" data-tutorial="persona-cards">
                    {msg.responses?.map((resp, idx) => (
                      <button
                        key={idx}
                        onClick={() => resp.role !== 'System' && onOpenReflectionModal(
                          msg.id, idx, resp.role, resp.content,
                          resp.suggestedActions, resp.reflectedText, resp.perspectives
                        )}
                        className={`relative flex flex-col items-start p-5 border transition-all duration-200 text-left group w-full min-h-[180px]
                          ${resp.isReflected
                            ? 'bg-gray-50 border-gray-300 shadow-sm rounded'
                            : 'bg-white border-gray-200 hover:border-black hover:shadow-sm rounded'
                          }
                        `}
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        {/* Persona Icon */}
                        <div className={`w-9 h-9 border rounded flex items-center justify-center mb-4 transition-colors
                          ${resp.isReflected
                            ? 'bg-gray-800 border-gray-800 text-white'
                            : `${getPersonaColor(resp.role)} group-hover:bg-black group-hover:border-black group-hover:text-white`
                          }
                        `}>
                          {getPersonaIcon(resp.role)}
                        </div>

                        {/* Role Label + Perspective Tags */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-bold text-sm text-gray-900">{resp.role}</span>
                          {resp.perspectives && resp.perspectives.length > 0 && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              {resp.perspectives.slice(0, 3).map((p, pIdx) => (
                                <span key={pIdx}>#{p.perspectiveLabel.replace(/\s+/g, '')} </span>
                              ))}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <p className="text-xs text-gray-500 leading-relaxed break-keep flex-1">
                          {resp.isReflected && resp.reflectedText ? resp.reflectedText : resp.content}
                        </p>

                        {/* Selected Badge */}
                        {resp.isReflected && (
                          <div className="absolute top-4 right-4 w-5 h-5 bg-gray-800 rounded flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Next Step Button */}
                  {msg.id === lastMsgId && msg.responses?.some(r => r.isReflected) && (
                    <div className="ml-10 mt-4 flex items-center justify-between p-3 bg-white border border-gray-200 rounded" data-tutorial="next-step-button">
                      <div className="flex items-center gap-3">
                        <div className="text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wide">
                          {msg.responses.filter(r => r.isReflected).length}개 조언 선택됨
                        </div>
                      </div>
                      <button
                        onClick={onConsolidatedSend}
                        disabled={isTyping}
                        className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        다음 단계
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {/* Typing Indicator - 개별 모드에서만 표시 (토론 모드는 스트리밍으로 실시간 표시) */}
      {isTyping && interactionMode !== 'discussion' && (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="text-xs font-bold text-gray-900">Draft AI</span>
            <span className="text-[10px] font-mono text-gray-400">분석 중...</span>
          </div>
          <div className="ml-10 p-4 bg-white border border-gray-200 rounded shadow-sm">
            <div className="flex items-center gap-4">
              {selectedPersonas.length > 0 ? (
                <>
                  {selectedPersonas.map((persona, idx) => (
                    <div
                      key={persona}
                      className="flex flex-col items-center gap-2"
                      style={{ animationDelay: `${idx * 200}ms` }}
                    >
                      <div
                        className={`w-10 h-10 border rounded flex items-center justify-center transition-all duration-300 ${getPersonaColor(persona)}`}
                        style={{
                          animation: `pulse 1.5s ease-in-out infinite`,
                          animationDelay: `${idx * 300}ms`
                        }}
                      >
                        {getPersonaIcon(persona)}
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {getPersonaName(persona)}
                      </span>
                    </div>
                  ))}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      <span className="ml-2 text-xs">검토하는 중</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="h-4"></div>
    </div>
  );
};

export default MessageList;
