'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Send, Cpu, Paintbrush, DollarSign, ArrowRight, Lightbulb, Check, MessageSquare, X, Edit3, Sparkles, MessageCircle, TrendingUp, AlertTriangle, ShieldCheck, Layers, Coins, Lock, Zap, Sword, MoreHorizontal, Megaphone, Scale, ClipboardList, Server, Calculator, User, Settings, HelpCircle } from 'lucide-react';
import { ChatMessage, AnalysisMetrics, ValidationLevel, PersonaRole, PERSONA_PRESETS, DEFAULT_PERSONAS, PerspectiveAdvice, Scorecard, CategoryUpdate, createEmptyScorecard, ScorecardCategory } from './types';
import { analyzeIdea } from './geminiService';
import { useTutorialSafe } from './tutorial';
import { saveDecisionBatch, startNewSession, getCurrentRound, incrementRound, getCurrentSessionId } from './decisionAnalyzer';
import DecisionProfileCard from './DecisionProfileCard';
import ScorecardPanel from './ScorecardPanel';


interface ChatInterfaceProps {
  onComplete: (history: string, idea: string, reflectedAdvice: string[], score?: number) => void;
  level: ValidationLevel;
  personas?: PersonaRole[];
  // External input control (for using persistent input from parent)
  externalInput?: string;
  onExternalInputChange?: (value: string) => void;
  hideInput?: boolean;
  onRegisterSend?: (sendFn: () => void) => void;
  onBack?: () => void; // Go back to selection screen
}

interface ReflectionModalState {
  msgId: string;
  respIdx: number;
  role: string;
  originalContent: string;
  suggestedActions: string[];
  // 새로운 필드: 서브 관점
  perspectives?: PerspectiveAdvice[];
  selectedPerspectiveIdx?: number;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, level, personas = DEFAULT_PERSONAS, externalInput, onExternalInputChange, hideInput = false, onRegisterSend, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [internalInput, setInternalInput] = useState('');

  // Use external input if provided, otherwise use internal
  const input = externalInput !== undefined ? externalInput : internalInput;
  const setInput = onExternalInputChange || setInternalInput;
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Metrics State
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);

  // Modal State
  const [reflectionModal, setReflectionModal] = useState<ReflectionModalState | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  // Token System State
  const FREE_TURNS = 10;
  const [turnCount, setTurnCount] = useState(0);
  const [tokens, setTokens] = useState(30);
  const [showInputMode, setShowInputMode] = useState(true); // 입력창 vs 결과 미리보기

  // Tutorial
  const tutorial = useTutorialSafe();
  const [hasShownCardTutorial, setHasShownCardTutorial] = useState(false);
  const [hasShownModalTutorial, setHasShownModalTutorial] = useState(false);

  // 성향 분석용 상태
  const [ideaCategory, setIdeaCategory] = useState<string>('Unknown');
  const [currentRound, setCurrentRound] = useState(0);

  // Progressive Scorecard 상태
  const [scorecard, setScorecard] = useState<Scorecard>(createEmptyScorecard());
  const [recentUpdates, setRecentUpdates] = useState<CategoryUpdate[]>([]);

  // 모달 열린 시간 추적 (응답 시간 측정용)
  const [modalOpenTime, setModalOpenTime] = useState<number | null>(null);

  // 새 세션 시작
  useEffect(() => {
    startNewSession();
    setCurrentRound(0);
  }, []);

  // Initial greeting
  useEffect(() => {
    let greeting = "";
    if (level === ValidationLevel.SKETCH) {
      greeting = "환영합니다! 아이디어 스케치 모드입니다. 부담 갖지 말고 생각나는 대로 말씀해 주세요. 우리가 함께 다듬어 드릴게요!";
    } else if (level === ValidationLevel.DEFENSE) {
      greeting = "투자자 방어 모드입니다. 준비 되셨습니까? 논리가 빈약하면 살아남기 힘들 겁니다. 아이디어를 제시하세요.";
    } else {
      greeting = "Draft. 시스템 가동. MVP 빌딩 모드입니다. 가상의 공동 창업자들(개발, 디자인, VC)이 냉철하게 검증을 시작합니다.";
    }

    setMessages([{
      id: 'init',
      isUser: false,
      timestamp: Date.now(),
      responses: [{
        role: 'System' as any,
        name: 'Draft. OS',
        avatar: '',
        content: greeting,
        tone: 'Neutral',
        suggestedActions: []
      }]
    }]);
  }, [level]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Core AI processing logic
  const processAIResponse = async (userInput: string, currentMessages: ChatMessage[]) => {
    setIsTyping(true);
    try {
      // Build history for context with explicit Decision/Reflection markers
      const historyStrings = currentMessages.flatMap(m => {
        if (m.isUser) return [`User: ${m.text}`];
        // For AI responses, if it was reflected, mark it clearly so Gemini knows user committed to it.
        return m.responses?.map(r => {
             if (r.isReflected) {
                 return `[User ACCEPTED & DECIDED]: The user has decided to follow the advice from ${r.role}: "${r.reflectedText || r.content}"`;
             }
             return `${r.role}: ${r.content}`;
        }) || [];
      });

      // 현재 스코어카드를 AI에게 전달
      const analysisResult = await analyzeIdea(userInput, historyStrings, level, personas, scorecard);

      // Safety check for responses
      if (!analysisResult.responses || !Array.isArray(analysisResult.responses)) {
        console.error('Invalid response format:', analysisResult);
        throw new Error('Invalid response format from AI');
      }

      // Update Metrics
      if (analysisResult.metrics) {
        setMetrics(analysisResult.metrics);
        setShowInputMode(false); // Switch to results preview mode
      }

      // 아이디어 카테고리 저장
      if (analysisResult.ideaCategory) {
        setIdeaCategory(analysisResult.ideaCategory);
      }

      // Progressive Scorecard 업데이트
      if (analysisResult.scorecard) {
        setScorecard(prev => {
          // 점수 감소 방지 로직 (클라이언트 측 추가 안전장치)
          const newScorecard = { ...analysisResult.scorecard! };
          const categories: ScorecardCategory[] = [
            'problemDefinition', 'solution', 'marketAnalysis', 'revenueModel',
            'differentiation', 'logicalConsistency', 'feasibility', 'feedbackReflection'
          ];

          let recalculatedTotal = 0;
          for (const cat of categories) {
            // 점수 감소 방지
            if (prev[cat].current > newScorecard[cat].current) {
              newScorecard[cat].current = prev[cat].current;
            }
            // filled 상태 유지
            if (prev[cat].filled) {
              newScorecard[cat].filled = true;
            }
            recalculatedTotal += newScorecard[cat].current;
          }
          newScorecard.totalScore = recalculatedTotal;

          return newScorecard;
        });
      }

      // 최근 업데이트 저장
      if (analysisResult.categoryUpdates && analysisResult.categoryUpdates.length > 0) {
        setRecentUpdates(analysisResult.categoryUpdates);
      }

      // Update Messages
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        responses: analysisResult.responses.map(r => ({ ...r, isReflected: false })),
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);
      setTurnCount(prev => prev + 1); // Increment turn count

      // 라운드 증가
      const newRound = incrementRound();
      setCurrentRound(newRound);

      // Show card tutorial after first AI response with persona cards
      if (!hasShownCardTutorial && tutorial?.shouldShowTutorial('chat-interface')) {
        setHasShownCardTutorial(true);
        setTimeout(() => {
          tutorial.startTutorial('chat-interface');
        }, 800);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    // Token Check
    if (turnCount >= FREE_TURNS) {
       if (tokens <= 0) {
         alert("토큰이 부족합니다.");
         return;
       }
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      isUser: true,
      text: input,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    const currentInput = input;
    setInput('');

    await processAIResponse(currentInput, newMessages);
  }, [input, turnCount, tokens, messages, setInput]);

  // Register handleSend with parent if using external input
  useEffect(() => {
    if (onRegisterSend) {
      onRegisterSend(handleSend);
    }
  }, [onRegisterSend, handleSend]);

  const consumeTokenAndContinue = () => {
    if (tokens > 0) {
       setTokens(prev => prev - 1);
       setTurnCount(0);
    }
  };

  const openReflectionModal = (
    msgId: string,
    idx: number,
    role: string,
    content: string,
    suggestedActions: string[] = [],
    existingReflectedText?: string,
    perspectives?: PerspectiveAdvice[]
  ) => {
    // 모달 열린 시간 기록 (응답 시간 측정용)
    setModalOpenTime(Date.now());

    setReflectionModal({
      msgId,
      respIdx: idx,
      role,
      originalContent: content,
      suggestedActions,
      perspectives,
      selectedPerspectiveIdx: 0, // 기본적으로 첫 번째 관점 선택
    });
    // 기존 선택된 텍스트가 있으면 사용, 없으면 첫 번째 관점의 내용
    setReflectionText(existingReflectedText || (perspectives?.[0]?.content || ''));

    // Show modal tutorial on first open
    if (!hasShownModalTutorial && tutorial?.shouldShowTutorial('reflection-modal')) {
      setHasShownModalTutorial(true);
      setTimeout(() => {
        tutorial.startTutorial('reflection-modal');
      }, 400);
    }
  };

  const closeReflectionModal = () => {
    setReflectionModal(null);
    setReflectionText('');
  };

  const saveReflectionLocally = () => {
    if (!reflectionModal) return;

    const selectedPerspective = reflectionModal.perspectives?.[reflectionModal.selectedPerspectiveIdx || 0];
    const finalText = reflectionText.trim() || selectedPerspective?.content || reflectionModal.originalContent;

    // 응답 시간 계산 (초 단위)
    const responseTimeSec = modalOpenTime ? Math.round((Date.now() - modalOpenTime) / 1000) : 0;

    // 직접 입력 여부 판단: 선택지와 다른 텍스트를 입력했으면 custom_input
    const isCustomInput = selectedPerspective
      ? finalText !== selectedPerspective.content
      : true;

    const updatedMessages = messages.map(msg => {
      if (msg.id !== reflectionModal.msgId || !msg.responses) return msg;
      const newResponses = [...msg.responses];
      newResponses[reflectionModal.respIdx] = {
        ...newResponses[reflectionModal.respIdx],
        isReflected: true,
        reflectedText: finalText
      };
      return { ...msg, responses: newResponses };
    });
    setMessages(updatedMessages);

    // 의사결정 데이터 저장 (새로운 구조)
    if (reflectionModal.perspectives && selectedPerspective) {
      const sessionId = getCurrentSessionId();
      const options = reflectionModal.perspectives.map(p => p.perspectiveLabel);

      saveDecisionBatch(
        sessionId,                                              // ideaId (세션 ID 사용)
        ideaCategory,                                           // ideaCategory
        currentRound,                                           // round
        reflectionModal.role as 'Developer' | 'Designer' | 'VC', // persona
        reflectionModal.role,                                   // questionTopic
        options,                                                // options
        selectedPerspective.perspectiveId,                      // selectedPerspectiveId
        selectedPerspective.perspectiveLabel,                   // selectedPerspectiveLabel
        isCustomInput,                                          // isCustomInput
        responseTimeSec                                         // responseTimeSec
      );
    }

    setModalOpenTime(null);
    closeReflectionModal();
  };

  const removeReflection = () => {
    if (!reflectionModal) return;
    setMessages(prevMessages => prevMessages.map(msg => {
      if (msg.id !== reflectionModal.msgId || !msg.responses) return msg;
      const newResponses = [...msg.responses];
      newResponses[reflectionModal.respIdx] = {
        ...newResponses[reflectionModal.respIdx],
        isReflected: false,
        reflectedText: undefined
      };
      return { ...msg, responses: newResponses };
    }));
    closeReflectionModal();
  };

  const handleConsolidatedSend = async () => {
      const lastAiMsg = messages[messages.length - 1];
      if (!lastAiMsg || !lastAiMsg.responses) return;
      const stagedReflections = lastAiMsg.responses.filter(r => r.isReflected);
      if (stagedReflections.length === 0) return;

      const reflectionSummary = stagedReflections.map(r => `• ${r.role} 결정: ${r.reflectedText}`).join('\n');
      const consolidatedText = `[종합 결정 사항]\n${reflectionSummary}\n\n위 결정들을 바탕으로 아이디어를 발전시키고 다음 단계를 진행해주세요.`;

      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          isUser: true,
          text: consolidatedText,
          timestamp: Date.now(),
      };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      await processAIResponse(consolidatedText, newMessages);
  };

  const handleFinish = () => {
    const fullConv = messages.map(m => {
      if(m.isUser) return `User: ${m.text}`;
      return m.responses?.map(r => `${r.role}: ${r.content}`).join('\n');
    }).join('\n\n');
    const reflectedAdvice = messages.flatMap(m =>
      m.responses?.filter(r => r.isReflected).map(r => `[${r.role}] ${r.reflectedText || r.content}`) || []
    );
    const firstIdea = messages.find(m => m.isUser)?.text || "Startup Project";
    // Progressive Scorecard의 totalScore 사용 (기존 metrics.score 대신)
    const finalScore = scorecard.totalScore > 0 ? scorecard.totalScore : metrics?.score;
    onComplete(fullConv, firstIdea, reflectedAdvice, finalScore);
  };

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

  const getPersonaColor = (role: string) => {
    const preset = PERSONA_PRESETS.find(p => p.id === role || p.name === role);
    if (preset) {
      return preset.color;
    }
    return 'bg-gray-50 border-gray-200 text-gray-600';
  };

  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const pendingReflections = lastMsg && !lastMsg.isUser && lastMsg.responses
    ? lastMsg.responses.filter(r => r.isReflected)
    : [];
  const hasPendingReflections = pendingReflections.length > 0;
  const isLimitReached = turnCount >= FREE_TURNS;

  return (
    <div className="flex h-full w-full bg-[#FAFAFA]">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Session Header */}
        <div className="flex items-center justify-center gap-2 py-3 text-[10px] border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-sm border ${
            level === ValidationLevel.SKETCH ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
            level === ValidationLevel.DEFENSE ? 'bg-red-50 border-red-200 text-red-700' :
            'bg-white border-gray-200 text-gray-700'
          }`}>
            {level === ValidationLevel.SKETCH ? <Zap size={10}/> : level === ValidationLevel.DEFENSE ? <Sword size={10}/> : <Layers size={10}/>}
            <span className="font-bold font-mono">
              {level === ValidationLevel.SKETCH ? 'Lv.1' : level === ValidationLevel.DEFENSE ? 'Lv.3' : 'Lv.2'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            {personas.map((pId, idx) => {
              const preset = PERSONA_PRESETS.find(p => p.id === pId);
              return (
                <span key={pId} className="flex items-center gap-1">
                  {idx > 0 && <span>·</span>}
                  <span className="text-gray-600">{preset?.nameKo}</span>
                </span>
              );
            })}
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="ml-2 px-2 py-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-sm transition-colors font-medium"
            >
              변경
            </button>
          )}
          <button
            onClick={() => tutorial?.resetTutorial()}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-sm transition-colors"
            title="튜토리얼 보기"
          >
            <HelpCircle size={14} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
          <div className={`w-full max-w-4xl mx-auto space-y-6 pt-4 ${hideInput ? 'pb-20' : 'pb-6'}`}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>

                {msg.isUser ? (
                  // User Message - Draft style
                  <>
                    <div className="max-w-[70%] space-y-1">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-xs font-bold text-gray-900">Me</span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`p-4 rounded-sm text-sm leading-relaxed shadow-sm break-keep
                        ${msg.text?.startsWith('[종합 결정 사항]')
                            ? 'bg-black text-white border border-black'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}>
                        {msg.text}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-sm bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 mt-6">
                      <span className="text-gray-500 text-xs font-bold">U</span>
                    </div>
                  </>
                ) : (
                  // AI Persona Grid
                  <>
                    {msg.responses && msg.responses[0].role === 'System' ? (
                      <>
                        <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center shrink-0 mt-6">
                          <span className="text-white font-bold text-xs">D</span>
                        </div>
                        <div className="max-w-[70%] space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-900">Draft AI</span>
                            <span className="text-[10px] font-mono text-gray-400">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="p-4 bg-white border border-gray-200 rounded-sm text-sm text-gray-700 leading-relaxed break-keep shadow-sm">
                            {msg.responses[0].content}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
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
                              onClick={() => resp.role !== 'System' && openReflectionModal(
                                msg.id, idx, resp.role, resp.content,
                                resp.suggestedActions, resp.reflectedText, resp.perspectives
                              )}
                              className={`relative flex flex-col items-start p-5 border transition-all duration-200 text-left group w-full h-full
                                ${resp.isReflected
                                  ? 'bg-gray-50 border-gray-300 shadow-sm rounded-sm'
                                  : 'bg-white border-gray-200 hover:border-black hover:shadow-sm rounded-sm'
                                }
                              `}
                              style={{ animationDelay: `${idx * 100}ms` }}
                            >
                              {/* Persona Icon */}
                              <div className={`w-9 h-9 border rounded-sm flex items-center justify-center mb-4 transition-colors
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
                                  <div className="flex gap-1">
                                    {resp.perspectives.slice(0, 3).map((p, pIdx) => (
                                      <span key={pIdx} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono">
                                        {p.perspectiveLabel}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <p className="text-xs text-gray-500 leading-relaxed break-keep flex-1">
                                {resp.isReflected && resp.reflectedText ? resp.reflectedText : resp.content}
                              </p>

                              {/* Selected Badge */}
                              {resp.isReflected && (
                                <div className="absolute top-4 right-4 w-5 h-5 bg-gray-800 rounded-sm flex items-center justify-center">
                                   <Check size={12} className="text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Next Step Button - shown below cards when this is the last message with reflections */}
                        {msg.id === lastMsg?.id && msg.responses?.some(r => r.isReflected) && (
                          <div className="ml-10 mt-4 flex items-center justify-between p-3 bg-white border border-gray-200 rounded-sm" data-tutorial="next-step-button">
                            <div className="flex items-center gap-3">
                              <div className="text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wide">
                                {msg.responses.filter(r => r.isReflected).length}개 조언 선택됨
                              </div>
                            </div>
                            <button
                              onClick={handleConsolidatedSend}
                              disabled={isTyping}
                              className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-sm font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
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

            {isTyping && (
              <div className="flex items-center gap-3 ml-10">
                 <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></div>
                 <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              </div>
            )}
            <div className="h-4"></div>
          </div>
        </div>

        {/* Token Limit Warning - always shown when limit reached */}
        {isLimitReached && (
          <div className="p-4 md:p-6 bg-white border-t border-gray-200 shrink-0 z-10">
            <div className="max-w-4xl mx-auto relative">
              <div className="w-full bg-gray-50 border border-gray-200 rounded-sm p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-sm flex items-center justify-center text-gray-500">
                        <Lock size={14} />
                    </div>
                    <div className="text-sm">
                        <span className="font-bold text-gray-900 block">대화 턴 소진</span>
                        <span className="text-xs text-gray-500">심도 있는 검증을 위해 토큰을 사용하세요.</span>
                    </div>
                 </div>
                 <button
                    onClick={consumeTokenAndContinue}
                    className="bg-black text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-gray-800 transition-colors"
                 >
                    토큰 1개 사용 (잔여: {tokens})
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Area - Input or Results Preview */}
        {!hideInput && !isLimitReached && (
          <div className="p-4 md:p-6 bg-white border-t border-gray-200 shrink-0 z-10">
            <div className="max-w-4xl mx-auto relative">
              {/* No metrics yet - show normal input */}
              {!metrics && (
                <>
                  <div className="relative flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-sm px-4 py-2 focus-within:bg-white focus-within:border-black transition-all">
                    <input
                      type="text"
                      className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400"
                      placeholder="아이디어나 답변을 입력하세요..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      disabled={isTyping}
                    />
                    <button
                      onClick={handleSend}
                      disabled={isTyping || !input.trim()}
                      className={`p-2 rounded-sm transition-colors
                        ${input.trim() && !isTyping
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                      `}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  <p className="text-center text-[10px] text-gray-400 mt-2 font-mono">
                    Draft AI can make mistakes. Consider checking important information.
                  </p>
                </>
              )}

              {/* Has metrics but not in input mode - show thin status bar only */}
              {metrics && !showInputMode && (
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-sm">
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-gray-500">현재 점수: </span>
                      <span className="font-bold text-gray-900">{metrics.score}점</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm text-gray-500">{turnCount}/10 턴</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowInputMode(true)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-sm hover:bg-gray-100 transition-colors"
                    >
                      계속 대화하기
                    </button>
                    <button
                      onClick={handleFinish}
                      className="px-4 py-2 bg-black text-white text-xs font-bold rounded-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      검증 완료
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Has metrics and in input mode - show input with status */}
              {metrics && showInputMode && (
                <>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>현재 점수: <span className="font-bold text-gray-900">{metrics.score}점</span></span>
                      <span className="text-gray-300">|</span>
                      <span>{turnCount}/10 턴</span>
                    </div>
                    <button
                      onClick={handleFinish}
                      className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-sm hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                    >
                      검증 완료
                      <ArrowRight size={12} />
                    </button>
                  </div>
                  <div className="relative flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-sm px-4 py-2 focus-within:bg-white focus-within:border-black transition-all">
                    <input
                      type="text"
                      className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400"
                      placeholder="추가 질문이나 답변을 입력하세요..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      disabled={isTyping}
                      autoFocus
                    />
                    <button
                      onClick={handleSend}
                      disabled={isTyping || !input.trim()}
                      className={`p-2 rounded-sm transition-colors
                        ${input.trim() && !isTyping
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                      `}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Auto-complete when limit reached */}
        {isLimitReached && metrics && (
          <div className="p-4 md:p-6 bg-white border-t border-gray-200 shrink-0 z-10">
            <div className="max-w-4xl mx-auto">
              <div className="bg-black text-white rounded-sm p-5 text-center">
                <div className="text-2xl font-black mb-2">{metrics.score}점</div>
                <p className="text-sm text-gray-300 mb-4">10턴 검증이 완료되었습니다</p>
                <button
                  onClick={handleFinish}
                  className="px-6 py-3 bg-white text-black text-sm font-bold rounded-sm hover:bg-gray-100 transition-colors flex items-center gap-2 mx-auto"
                >
                  결과 확인하기
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Analytics Panel */}
      <div className="w-56 lg:w-64 bg-white border-l border-gray-200 overflow-y-auto shrink-0 p-4 hidden md:block" data-tutorial="chat-sidebar">

         {/* Live Status */}
         <div className="flex items-center justify-between mb-5">
             <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest">Live Analysis</span>
             </div>
         </div>

         {/* Progressive Scorecard Panel */}
         <ScorecardPanel
           scorecard={scorecard}
           recentUpdates={recentUpdates}
           targetLevel={level === ValidationLevel.SKETCH ? 'sketch' : level === ValidationLevel.DEFENSE ? 'defense' : 'mvp'}
           className="mb-6"
         />

         {/* 검증 완료 버튼 */}
         {scorecard.totalScore > 0 && (
           <button
             onClick={handleFinish}
             className="w-full bg-black text-white py-2.5 rounded-sm text-xs font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mb-6"
           >
             전체 리포트 보기
             <ArrowRight size={14} />
           </button>
         )}

         {/* Key Insights */}
         {metrics && (
             <div className="space-y-5">
                 <div>
                     <h4 className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest mb-2">Strengths</h4>
                     <div className="space-y-1.5">
                        {metrics.keyStrengths.map((str, i) => (
                            <div key={i} className="flex gap-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-sm border border-gray-100">
                                <Check size={12} className="text-green-600 shrink-0 mt-0.5" />
                                <span className="leading-relaxed break-keep">{str}</span>
                            </div>
                        ))}
                     </div>
                 </div>

                 <div>
                     <h4 className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest mb-2">Risks</h4>
                     <div className="space-y-1.5">
                        {metrics.keyRisks.map((risk, i) => (
                            <div key={i} className="flex gap-2 text-xs text-gray-700 bg-red-50 p-2.5 rounded-sm border border-red-100">
                                <AlertTriangle size={12} className="text-red-500 shrink-0 mt-0.5" />
                                <span className="leading-relaxed break-keep">{risk}</span>
                            </div>
                        ))}
                     </div>
                 </div>
             </div>
         )}

         {/* Decision Profile Card */}
         <DecisionProfileCard compact className="mt-6" />
      </div>

      {/* Reflection Modal */}
      {reflectionModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-sm shadow-xl border border-gray-200 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-100 rounded-sm text-gray-700">
                    {getPersonaIcon(reflectionModal.role)}
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900 text-sm">{reflectionModal.role} 관점 선택</h3>
                    <p className="text-[10px] text-gray-500 font-mono">3가지 관점 중 하나를 선택하세요</p>
                 </div>
              </div>
              <button
                onClick={closeReflectionModal}
                className="text-gray-400 hover:text-gray-900 transition-colors p-1.5 rounded-sm hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto" data-tutorial="modal-content">
               {/* 서브 관점 선택 UI */}
               {reflectionModal.perspectives && reflectionModal.perspectives.length > 0 ? (
                 <div className="mb-5" data-tutorial="quick-select">
                   <label className="flex items-center gap-2 text-[9px] font-bold font-mono text-gray-400 uppercase mb-3 tracking-widest">
                     <Sparkles size={10} />
                     관점 선택
                   </label>
                   <div className="grid grid-cols-1 gap-3">
                     {reflectionModal.perspectives.map((perspective, idx) => (
                       <button
                         key={idx}
                         onClick={() => {
                           setReflectionModal(prev => prev ? { ...prev, selectedPerspectiveIdx: idx } : null);
                           setReflectionText(perspective.content);
                         }}
                         className={`text-left p-4 rounded-sm border transition-all ${
                           reflectionModal.selectedPerspectiveIdx === idx
                             ? 'bg-gray-50 border-gray-300 shadow-sm'
                             : 'bg-white border-gray-200 hover:border-gray-400'
                         }`}
                       >
                         <div className="flex items-start gap-3">
                           <div className={`mt-0.5 w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 ${
                             reflectionModal.selectedPerspectiveIdx === idx
                               ? 'border-gray-800 bg-gray-800'
                               : 'border-gray-300'
                           }`}>
                             {reflectionModal.selectedPerspectiveIdx === idx && <Check size={12} className="text-white" />}
                           </div>
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="font-bold text-sm text-gray-900">{perspective.perspectiveLabel}</span>
                               <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono">
                                 {perspective.perspectiveId}
                               </span>
                             </div>
                             <p className="text-xs text-gray-600 leading-relaxed break-keep mb-2">
                               {perspective.content}
                             </p>
                             {perspective.suggestedActions && perspective.suggestedActions.length > 0 && (
                               <div className="flex flex-wrap gap-1.5 mt-2">
                                 {perspective.suggestedActions.map((action, aIdx) => (
                                   <span key={aIdx} className="text-[10px] px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
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
                     <label className="text-[9px] font-bold font-mono text-gray-400 uppercase mb-2 block tracking-widest">Original</label>
                     <div className="p-4 bg-gray-50 rounded-sm border border-gray-200 text-sm text-gray-700 leading-relaxed break-keep">
                       {reflectionModal.originalContent}
                     </div>
                   </div>

                   {reflectionModal.suggestedActions && reflectionModal.suggestedActions.length > 0 && (
                     <div className="mb-5">
                       <label className="flex items-center gap-2 text-[9px] font-bold font-mono text-gray-400 uppercase mb-2 tracking-widest">
                         <Sparkles size={10} />
                         Quick Select
                       </label>
                       <div className="grid grid-cols-1 gap-2">
                         {reflectionModal.suggestedActions.map((action, idx) => (
                           <button
                             key={idx}
                             onClick={() => setReflectionText(action)}
                             className={`text-left p-3 rounded-sm border transition-all text-sm ${
                               reflectionText === action
                                 ? 'bg-gray-50 border-gray-300 shadow-sm text-gray-900'
                                 : 'bg-white border-gray-200 hover:border-gray-400 text-gray-600'
                             }`}
                           >
                             <div className="flex items-start gap-3">
                               <div className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${
                                 reflectionText === action ? 'border-gray-800 bg-gray-800' : 'border-gray-300'
                               }`}>
                                 {reflectionText === action && <Check size={10} className="text-white" />}
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

              <div data-tutorial="my-decision">
                <label className="text-[9px] font-bold font-mono text-gray-400 uppercase mb-2 block tracking-widest">
                   나의 결정 (수정 가능)
                </label>
                <textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  className="w-full h-24 p-4 bg-white border border-gray-200 rounded-sm text-gray-900 text-sm leading-relaxed focus:outline-none focus:border-black resize-none transition-all"
                  placeholder="선택한 관점의 조언을 수정하거나 직접 작성하세요..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
              {messages.find(m => m.id === reflectionModal.msgId)?.responses?.[reflectionModal.respIdx].isReflected && (
                <button
                  onClick={removeReflection}
                  className="mr-auto text-red-500 text-[10px] font-bold font-mono uppercase hover:underline"
                >
                  선택 취소
                </button>
              )}

              <button
                onClick={saveReflectionLocally}
                disabled={!reflectionText.trim()}
                className="px-5 py-2 bg-black text-white font-bold rounded-sm hover:bg-gray-800 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {messages.find(m => m.id === reflectionModal.msgId)?.responses?.[reflectionModal.respIdx].isReflected ? '수정' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
