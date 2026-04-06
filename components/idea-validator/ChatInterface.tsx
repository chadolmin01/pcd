'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArrowRight, Check, AlertTriangle, Layers, Lock, Zap, Sword, HelpCircle, Building2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { ChatMessage, AnalysisMetrics, ValidationLevel, PersonaRole, PERSONA_PRESETS, DEFAULT_PERSONAS, PerspectiveAdvice, Scorecard, CategoryUpdate, createEmptyScorecard, ScorecardCategory, InteractionMode, StagedReflection, ScoreEvolution } from './types';
import { ProgramQuestion, GOVERNMENT_PROGRAMS } from './workflow/types';
import { buildReflectionSummaryForUser } from '@/lib/prompts/build-reflection-history';
import { PERSONA_CATEGORY_MAP } from '@/lib/prompts/persona-config';
import { analyzeIdea, analyzeIdeaParallel } from './geminiService';
import { useTutorialSafe } from './tutorial';
import { saveDecisionBatch, startNewSession, incrementRound, getCurrentSessionId } from './decisionAnalyzer';
import {
  initializeAnalyticsSession,
  trackTurn,
  trackReflection,
  trackCompletionWithCategories,
  cleanupAnalyticsSession,
} from '@/lib/analytics';
import DecisionProfileCard from './DecisionProfileCard';
import ScorecardPanel from './ScorecardPanel';
import ReflectionModal, { ReflectionModalState } from './ReflectionModal';
import MessageList from './MessageList';
import ChatInput from './ChatInput';


interface ChatInterfaceProps {
  onComplete: (
    history: string,
    idea: string,
    reflectedAdvice: string[],
    score?: number,
    messages?: ChatMessage[],
    currentScorecard?: Scorecard,
    category?: string
  ) => void;
  level: ValidationLevel;
  personas?: PersonaRole[];
  interactionMode?: InteractionMode; // 개별 조언 vs 토론 모드
  // External input control (for using persistent input from parent)
  externalInput?: string;
  onExternalInputChange?: (value: string) => void;
  hideInput?: boolean;
  onRegisterSend?: (sendFn: () => void) => void;
  onBack?: () => void; // Go back to selection screen
  // 프로그램별 검증 질문 (정부지원사업 워크플로우용)
  programQuestions?: ProgramQuestion[];
  programName?: string;
}


const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, level, personas = DEFAULT_PERSONAS, interactionMode = 'individual', externalInput, onExternalInputChange, hideInput = false, onRegisterSend, onBack, programQuestions, programName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [internalInput, setInternalInput] = useState('');

  // Use external input if provided, otherwise use internal
  const input = externalInput !== undefined ? externalInput : internalInput;
  const setInput = onExternalInputChange || setInternalInput;
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);

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

  // Reflection History 상태 (Staff-level architecture)
  const [scoreEvolution, setScoreEvolution] = useState<ScoreEvolution[]>([]);
  const [allStagedReflections, setAllStagedReflections] = useState<StagedReflection[]>([]);

  // 의사결정 프로필 갱신 트리거
  const [decisionRefreshTrigger, setDecisionRefreshTrigger] = useState(0);

  // 모달 열린 시간 추적 (응답 시간 측정용)
  const [modalOpenTime, setModalOpenTime] = useState<number | null>(null);

  // Stabilize personas array for useEffect dependency (arrays compared by reference)
  const personasKey = personas.join(',');

  // 정부지원사업 모드 계산
  const isGovernmentMode = useMemo(() => {
    return programQuestions && programQuestions.length > 0 && !!programName;
  }, [programQuestions, programName]);

  // 정부지원사업 섹션 정보
  const governmentSections = useMemo(() => {
    if (!isGovernmentMode || !programQuestions || !programName) return [];
    const sections = [...new Set(programQuestions.map(q => q.sectionTitle))];

    // 프로그램 설정에서 weight 정보 가져오기
    const programConfig = GOVERNMENT_PROGRAMS.find(p => p.nameKo === programName);

    return sections.map(title => {
      const questions = programQuestions.filter(q => q.sectionTitle === title);
      const sectionConfig = programConfig?.sections.find(s => s.titleKo === title);
      return {
        title,
        questionCount: questions.length,
        weight: sectionConfig?.weight || 0,
        criteria: questions.flatMap(q => q.evaluationCriteria || []).slice(0, 4),
        questions: questions.map(q => q.question),
      };
    });
  }, [isGovernmentMode, programQuestions, programName]);

  // 정부지원사업 모드: 현재 섹션 진행 상태
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // 마일스톤 달성 추적 (Notion/Slack 스타일)
  const [achievedMilestones, setAchievedMilestones] = useState<string[]>([]);

  // 현재 섹션 정보
  const currentSection = useMemo(() => {
    if (!isGovernmentMode || governmentSections.length === 0) return null;
    return governmentSections[Math.min(currentSectionIndex, governmentSections.length - 1)];
  }, [isGovernmentMode, governmentSections, currentSectionIndex]);

  // 섹션 진행률 계산
  const sectionProgress = useMemo(() => {
    if (!isGovernmentMode || governmentSections.length === 0) return 0;
    return Math.round(((currentSectionIndex + 1) / governmentSections.length) * 100);
  }, [isGovernmentMode, governmentSections.length, currentSectionIndex]);

  // 다음 섹션으로 이동
  const advanceToNextSection = useCallback(() => {
    if (currentSectionIndex < governmentSections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      return true;
    }
    return false;
  }, [currentSectionIndex, governmentSections.length]);

  // 마일스톤 달성 체크 및 축하 (Notion/Slack 스타일)
  useEffect(() => {
    if (!isGovernmentMode || sectionProgress === 0) return;

    const milestones = [
      { threshold: 25, id: '25', title: '첫 번째 마일스톤!', desc: '문제인식 섹션 완료', emoji: '🎯' },
      { threshold: 50, id: '50', title: '절반 완료!', desc: '검증의 중간 지점 도달', emoji: '🚀' },
      { threshold: 75, id: '75', title: '거의 다 왔어요!', desc: '마지막 섹션 진입', emoji: '💪' },
      { threshold: 100, id: '100', title: '검증 완료!', desc: '모든 평가항목 검토 완료', emoji: '🎉' },
    ];

    milestones.forEach(({ threshold, id, title, desc, emoji }) => {
      if (sectionProgress >= threshold && !achievedMilestones.includes(id)) {
        setAchievedMilestones(prev => [...prev, id]);
        toast.success(
          <div className="flex items-center gap-3">
            <div className="text-2xl">{emoji}</div>
            <div>
              <p className="font-bold text-txt-primary">{title}</p>
              <p className="text-xs text-txt-tertiary">{desc}</p>
            </div>
          </div>,
          { duration: 4000 }
        );
      }
    });
  }, [sectionProgress, isGovernmentMode, achievedMilestones]);

  // 새 세션 시작 + Analytics 초기화
  useEffect(() => {
    startNewSession();
    setCurrentRound(0);

    // Analytics 세션 초기화 (also calls recoverAbandonedSession internally)
    const sessionId = getCurrentSessionId();
    const analyticsLevel = level === ValidationLevel.SKETCH ? 'sketch'
      : level === ValidationLevel.DEFENSE ? 'defense' : 'mvp';
    initializeAnalyticsSession(sessionId, analyticsLevel, personas, interactionMode);

    // Cleanup on unmount
    return () => {
      cleanupAnalyticsSession();
    };
  }, [level, personasKey, interactionMode]);

  // Initial greeting
  useEffect(() => {
    let greeting = "";
    if (level === ValidationLevel.SKETCH) {
      greeting = "환영합니다! 아이디어 스케치 모드입니다. 부담 갖지 말고 생각나는 대로 말씀해 주세요. 우리가 함께 다듬어 드릴게요!";
    } else if (level === ValidationLevel.DEFENSE) {
      greeting = "투자자 방어 모드입니다. 준비 되셨습니까? 논리가 빈약하면 살아남기 힘들 겁니다. 아이디어를 제시하세요.";
    } else if (programName && programQuestions && programQuestions.length > 0) {
      // 정부지원사업 모드 전용 인사말
      const firstSection = programQuestions[0]?.sectionTitle || '문제인식';
      greeting = `${programName} 맞춤 검증을 시작합니다! 🎯\n\n정부지원사업 심사위원 관점에서 아이디어를 평가해 드릴게요. 첫 번째 평가항목 '${firstSection}'부터 검토해 볼까요?\n\n아래 입력창에 아이디어를 자유롭게 설명해 주세요.`;
    } else {
      greeting = "Draft. 시스템 가동. MVP 빌딩 모드입니다. 가상의 공동 창업자들(개발, 디자인, VC)이 냉철하게 검증을 시작합니다.";
    }

    setMessages([{
      id: 'init',
      isUser: false,
      timestamp: Date.now(),
      responses: [{
        role: 'System',
        name: 'Draft. OS',
        avatar: '',
        content: greeting,
        tone: 'Neutral',
        suggestedActions: []
      }]
    }]);
  }, [level]);

  // 스크롤 함수 - 최신 메시지가 화면 최상단에 위치하도록 (Typeform 스타일 하이라이트)
  const scrollToLatest = useCallback(() => {
    setTimeout(() => {
      if (latestMessageRef.current) {
        latestMessageRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        // 하이라이트 애니메이션 추가
        latestMessageRef.current.classList.add('animate-highlight-message');
        setTimeout(() => {
          latestMessageRef.current?.classList.remove('animate-highlight-message');
        }, 1500);
      }
    }, 150);
  }, []);

  // 최신 메시지가 항상 보이도록 자동 스크롤
  const lastMessage = messages[messages.length - 1];
  const streamingContentLength = lastMessage ? (
    (lastMessage.opinions?.length || 0) +
    (lastMessage.closingRemarks?.length || 0) +
    (lastMessage.waitingMessages?.length || 0) +
    (lastMessage.discussion?.length || 0)
  ) : 0;

  // 메시지 변경 시 스크롤
  useEffect(() => {
    scrollToLatest();
  }, [messages.length, isTyping, scrollToLatest]);

  // 스트리밍 콘텐츠 변경 시 스크롤
  useEffect(() => {
    if (streamingContentLength > 0) {
      scrollToLatest();
    }
  }, [streamingContentLength, scrollToLatest]);


  // Core AI processing logic
  const processAIResponse = async (userInput: string, currentMessages: ChatMessage[]) => {
    setIsTyping(true);
    try {
      // Build history for context with explicit Decision/Reflection markers
      const historyStrings = currentMessages.flatMap(m => {
        if (m.isUser) return [`User: ${m.text}`];
        // For AI responses, if it was reflected, mark it clearly so Gemini knows user committed to it.
        if (m.discussion) {
          return m.discussion.map(d => `${d.persona}: ${d.message}`);
        }
        return m.responses?.map(r => {
             if (r.isReflected) {
                 return `[User ACCEPTED & DECIDED]: The user has decided to follow the advice from ${r.role}: "${r.reflectedText || r.content}"`;
             }
             return `${r.role}: ${r.content}`;
        }) || [];
      });

      // 토론 모드 - 병렬 + 합성 스트리밍 API 사용 (방안 5)
      if (interactionMode === 'discussion') {
        const msgId = (Date.now() + 1).toString();

        // 빈 메시지로 시작 (스트리밍 중 업데이트됨)
        const aiMsg: ChatMessage = {
          id: msgId,
          isUser: false,
          opinions: [], // 개별 의견
          closingRemarks: [], // 결정 멘트
          discussion: [], // 합성된 토론
          responses: [],
          timestamp: Date.now(),
          isStreaming: true,
          streamPhase: 'opinions',
        };
        setMessages(prev => [...prev, aiMsg]);

        await analyzeIdeaParallel(
          userInput,
          historyStrings,
          level,
          personas,
          scorecard,
          turnCount + 1,
          {
            // 개별 의견 도착
            onOpinion: (data) => {
              setMessages(prev => prev.map(m => {
                if (m.id === msgId) {
                  return {
                    ...m,
                    opinions: [...(m.opinions || []), data],
                    streamPhase: 'opinions',
                  };
                }
                return m;
              }));
              scrollToLatest();
            },
            // 결정 멘트 도착
            onClosing: (data) => {
              setMessages(prev => prev.map(m => {
                if (m.id === msgId) {
                  return {
                    ...m,
                    closingRemarks: [...(m.closingRemarks || []), data],
                    streamPhase: 'closing',
                  };
                }
                return m;
              }));
              scrollToLatest();
            },
            // 대기 중 대화 도착
            onWaiting: (data) => {
              setMessages(prev => prev.map(m => {
                if (m.id === msgId) {
                  return {
                    ...m,
                    waitingMessages: [...(m.waitingMessages || []), data],
                    streamPhase: 'waiting',
                  };
                }
                return m;
              }));
              scrollToLatest();
            },
            // 토론 턴 도착
            onDiscussionTurn: (turn) => {
              setMessages(prev => prev.map(m => {
                if (m.id === msgId) {
                  return {
                    ...m,
                    discussion: [...(m.discussion || []), turn],
                    streamPhase: 'discussion',
                  };
                }
                return m;
              }));
              scrollToLatest();
            },
            // 최종 응답 도착
            onFinalResponse: (result) => {
              // Capture previous scorecard BEFORE updating for analytics
              const prevScorecardSnapshot = { ...scorecard };

              if (result.metrics) {
                setMetrics(result.metrics);
                setShowInputMode(false);
              }

              if (result.scorecard) {
                setScorecard(prev => {
                  const newScorecard = { ...result.scorecard! };
                  const categories: ScorecardCategory[] = [
                    'problemDefinition', 'solution', 'marketAnalysis', 'revenueModel',
                    'differentiation', 'logicalConsistency', 'feasibility', 'feedbackReflection'
                  ];

                  let recalculatedTotal = 0;
                  for (const cat of categories) {
                    if (prev[cat].current > newScorecard[cat].current) {
                      newScorecard[cat].current = prev[cat].current;
                    }
                    if (prev[cat].filled) {
                      newScorecard[cat].filled = true;
                    }
                    recalculatedTotal += newScorecard[cat].current;
                  }
                  newScorecard.totalScore = recalculatedTotal;
                  return newScorecard;
                });
              }

              if (result.categoryUpdates && result.categoryUpdates.length > 0) {
                setRecentUpdates(result.categoryUpdates);

                // Staff-level: Score Evolution 추적
                setScoreEvolution(prev => {
                  const newEvolutions: ScoreEvolution[] = result.categoryUpdates!.map(update => ({
                    category: update.category as ScorecardCategory,
                    turn: turnCount + 1,
                    from: scorecard[update.category as ScorecardCategory]?.current || 0,
                    to: (scorecard[update.category as ScorecardCategory]?.current || 0) + update.delta,
                    delta: update.delta,
                    reason: update.reason,
                  }));
                  return [...prev, ...newEvolutions];
                });
              }

              setMessages(prev => prev.map(m => {
                if (m.id === msgId) {
                  return {
                    ...m,
                    responses: result.responses?.map(r => ({ ...r, isReflected: false })),
                    isStreaming: false,
                    streamPhase: 'final',
                  };
                }
                return m;
              }));

              setIsTyping(false);
              setTurnCount(prev => {
                const newTurnCount = prev + 1;
                // 정부지원사업 모드: 2턴마다 다음 섹션으로 자동 이동
                if (isGovernmentMode && newTurnCount > 0 && newTurnCount % 2 === 0) {
                  const nextSectionIdx = Math.floor(newTurnCount / 2);
                  if (nextSectionIdx < governmentSections.length) {
                    setCurrentSectionIndex(nextSectionIdx);
                  }
                }
                return newTurnCount;
              });
              const newRound = incrementRound();
              setCurrentRound(newRound);

              // Analytics: 턴 추적 (use captured snapshot for prev scorecard)
              try {
                const adviceCount = result.responses?.length || 0;
                const personaMap: Record<string, { shown: number; reflected: number }> = {};
                result.responses?.forEach(r => {
                  personaMap[r.role] = { shown: 1, reflected: 0 };
                });
                trackTurn(turnCount + 1, result.scorecard || scorecard, prevScorecardSnapshot, adviceCount, personaMap);
              } catch (e) {
                console.error('[Analytics] trackTurn failed:', e);
              }
            },
            onError: (error) => {
              console.error('Parallel streaming error:', error);
              setIsTyping(false);
              setMessages(prev => prev.map(m => {
                if (m.id === msgId) {
                  return {
                    ...m,
                    isStreaming: false,
                    responses: [{
                      role: 'System',
                      name: '시스템',
                      avatar: '',
                      content: '연결이 불안정합니다. 다시 시도해주세요.',
                      tone: 'Neutral',
                      suggestedActions: []
                    }]
                  };
                }
                return m;
              }));
            },
            // 입력 관련성 경고
            onWarning: (warningMessage) => {
              toast.warning('입력 확인 필요', {
                description: warningMessage,
                duration: 5000,
              });
              setIsTyping(false);
              // 경고 시 메시지 제거 (빈 응답 방지)
              setMessages(prev => prev.filter(m => m.id !== msgId));
            }
          },
          // Staff-level reflection history (Phase 2)
          allStagedReflections,
          scoreEvolution,
          // 정부지원사업 평가항목 기반 질문
          programQuestions || [],
          programName
        );
        return;
      }

      // 개별 조언 모드 (기존 비스트리밍 API)
      const analysisResult = await analyzeIdea(userInput, historyStrings, level, personas, scorecard, turnCount + 1, interactionMode);

      // 경고 메시지 처리
      if (analysisResult.warning) {
        toast.warning('입력 확인 필요', {
          description: analysisResult.warning,
          duration: 5000,
        });
      }

      // 개별 조언 모드 (기존 로직)
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
        responses: (analysisResult.responses || []).map(r => ({ ...r, isReflected: false })),
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);
      setTurnCount(prev => prev + 1); // Increment turn count

      // 라운드 증가
      const newRound = incrementRound();
      setCurrentRound(newRound);

      // Analytics: 턴 추적 (scorecard was already captured before setScorecard)
      try {
        const prevScorecardForTracking = scorecard; // Current scorecard before update
        const adviceCount = analysisResult.responses.length;
        const personaMap: Record<string, { shown: number; reflected: number }> = {};
        analysisResult.responses.forEach(r => {
          personaMap[r.role] = { shown: 1, reflected: 0 };
        });
        trackTurn(turnCount + 1, analysisResult.scorecard || scorecard, prevScorecardForTracking, adviceCount, personaMap);
      } catch (e) {
        console.error('[Analytics] trackTurn failed:', e);
      }

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
      // 토론 모드가 아닐 때만 여기서 isTyping false
      if (interactionMode !== 'discussion') {
        setIsTyping(false);
      }
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

    // Analytics: 반영 추적 (always track, regardless of perspectives)
    try {
      trackReflection(reflectionModal.role);
    } catch (e) {
      console.error('[Analytics] trackReflection failed:', e);
    }

    // 의사결정 데이터 저장 (only when perspectives exist)
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

      // 창업자 프로필 갱신 트리거
      setDecisionRefreshTrigger(prev => prev + 1);
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
      const currentReflections = lastAiMsg.responses.filter(r => r.isReflected);
      if (currentReflections.length === 0) return;

      // 최저점수 카테고리 찾기 (70% 미만, 최대 3개)
      const categoryScores = (Object.keys(scorecard) as ScorecardCategory[])
        .filter(cat => cat !== 'totalScore' as unknown)
        .map(cat => ({
          key: cat,
          ratio: scorecard[cat].current / scorecard[cat].max,
        }));
      const lowestCategories = [...categoryScores]
        .sort((a, b) => a.ratio - b.ratio)
        .slice(0, 3)
        .filter(c => c.ratio < 0.7)
        .map(c => c.key);

      // StagedReflection 타입으로 변환 (Staff-level architecture)
      const newStagedReflections: StagedReflection[] = currentReflections.map(r => {
        // 페르소나 → 담당 카테고리 자동 매핑
        const categoryMap = PERSONA_CATEGORY_MAP[r.role];
        const linkedCategories = categoryMap?.primary as ScorecardCategory[] || [];

        // 최저점수 카테고리와 연결된 결정 → impact="high"
        const hasLowestCategory = linkedCategories.some(cat => lowestCategories.includes(cat));
        const impactScore = hasLowestCategory ? 'high' : 'medium';

        return {
          role: r.role,
          reflectedText: r.reflectedText || r.content,
          turn: turnCount + 1,
          impactScore: impactScore as 'low' | 'medium' | 'high',
          linkedCategories,
        };
      });

      // 전체 반영 이력에 추가
      const updatedAllReflections = [...allStagedReflections, ...newStagedReflections];
      setAllStagedReflections(updatedAllReflections);

      // 구조화된 사용자 메시지 생성
      const consolidatedText = buildReflectionSummaryForUser(newStagedReflections);

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

    // Analytics: 완료 추적 (카테고리 추출 포함)
    // Fire and forget - don't block completion on analytics
    if (finalScore !== undefined) {
      const summary = reflectedAdvice.slice(0, 3).join(' | ');
      trackCompletionWithCategories(finalScore, firstIdea, summary).catch((e) => {
        console.error('[Analytics] trackCompletion failed:', e);
      });
    }

    // messages, scorecard, ideaCategory 추가 전달 (종합 결과물 생성용)
    onComplete(fullConv, firstIdea, reflectedAdvice, finalScore, messages, scorecard, ideaCategory);
  };

  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const isLimitReached = turnCount >= FREE_TURNS;

  // 첫 번째 사용자 아이디어 추출
  const firstIdea = messages.find(m => m.isUser)?.text || '';

  return (
    <div className="flex h-full w-full bg-surface-sunken">
      {/* Left Sidebar - Insights Panel */}
      <div className="w-56 lg:w-64 bg-surface-card border-r border-border overflow-y-auto shrink-0 p-4 hidden md:block">
        {/* 아이디어 요약 */}
        {firstIdea && (
          <div className="mb-6">
            <h4 className="text-[10px] font-bold font-mono text-txt-tertiary uppercase tracking-widest mb-2">Idea Summary</h4>
            <div className="p-4 bg-surface-sunken rounded-xl border border-border-subtle">
              <p className="text-xs text-txt-secondary leading-relaxed break-keep line-clamp-4">
                {firstIdea}
              </p>
            </div>
          </div>
        )}

        {/* Key Insights */}
        {metrics && (
          <div className="space-y-5">
            <div>
              <h4 className="text-[10px] font-bold font-mono text-txt-tertiary uppercase tracking-widest mb-2">Strengths</h4>
              <div className="space-y-2">
                {(metrics.keyStrengths || []).map((str, i) => (
                  <div key={i} className="flex gap-2 text-xs text-txt-secondary">
                    <Check size={12} className="text-status-success-text shrink-0 mt-0.5" />
                    <span className="leading-relaxed break-keep">{str}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold font-mono text-txt-tertiary uppercase tracking-widest mb-2">Risks</h4>
              <div className="space-y-2">
                {(metrics.keyRisks || []).map((risk, i) => (
                  <div key={i} className="flex gap-2 text-xs text-txt-secondary">
                    <AlertTriangle size={12} className="text-status-warning-text shrink-0 mt-0.5" />
                    <span className="leading-relaxed break-keep">{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Decision Profile Card */}
        <DecisionProfileCard compact className="mt-6" refreshTrigger={decisionRefreshTrigger} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Session Header - 일반 모드에서만 표시 */}
        {!isGovernmentMode && (
          <div className="flex items-center justify-center gap-2 py-3 text-[10px] border-b border-border-subtle bg-surface-card/50 backdrop-blur-sm sticky top-0 z-20">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${
              level === ValidationLevel.SKETCH ? 'bg-surface-sunken border-border text-txt-secondary' :
              level === ValidationLevel.DEFENSE ? 'bg-surface-sunken border-border text-txt-secondary' :
              'bg-surface-card border-border text-txt-secondary'
            }`}>
              {level === ValidationLevel.SKETCH ? <Zap size={10}/> : level === ValidationLevel.DEFENSE ? <Sword size={10}/> : <Layers size={10}/>}
              <span className="font-bold font-mono">
                {level === ValidationLevel.SKETCH ? 'Lv.1' : level === ValidationLevel.DEFENSE ? 'Lv.3' : 'Lv.2'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-txt-tertiary">
              {personas.map((pId, idx) => {
                const preset = PERSONA_PRESETS.find(p => p.id === pId);
                return (
                  <span key={pId} className="flex items-center gap-1">
                    {idx > 0 && <span>·</span>}
                    <span className="text-txt-secondary">{preset?.nameKo}</span>
                  </span>
                );
              })}
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="ml-2 px-2 py-1 text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken rounded transition-colors font-medium"
              >
                변경
              </button>
            )}
            <button
              onClick={() => tutorial?.resetTutorial()}
              className="p-1.5 text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken rounded transition-colors"
              title="튜토리얼 보기"
            >
              <HelpCircle size={14} />
            </button>
          </div>
        )}

        {/* 정부지원사업 모드 헤더 - 데스크탑 전용 */}
        {isGovernmentMode && (
          <div className="hidden md:block bg-surface-sunken border-b border-border p-4">
            {/* 프로그램 뱃지 + 진행률 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-surface-inverse text-txt-inverse text-sm font-bold rounded-full shadow-md">
                  <Building2 size={16} />
                  <span>{programName}</span>
                </div>
                <span className="text-xs text-txt-primary font-medium hidden sm:inline">맞춤 검증 모드</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] text-txt-tertiary">
                  <span>진행률</span>
                  <span className="font-bold text-txt-primary">{sectionProgress}%</span>
                </div>
                <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-surface-inverse rounded-full transition-all duration-500"
                    style={{ width: `${sectionProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 섹션 탭 */}
            <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              {governmentSections.map((section, idx) => {
                const isActive = idx === currentSectionIndex;
                const isCompleted = idx < currentSectionIndex;
                return (
                  <button
                    key={section.title}
                    onClick={() => setCurrentSectionIndex(idx)}
                    className={`flex-shrink-0 px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-border-strong focus:ring-offset-1 ${
                      isActive
                        ? 'bg-surface-inverse text-txt-inverse shadow-sm'
                        : isCompleted
                        ? 'bg-surface-sunken text-txt-secondary border border-border'
                        : 'bg-surface-card/70 text-txt-tertiary border border-border hover:bg-surface-card'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isCompleted ? (
                        <Check size={12} />
                      ) : (
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive ? 'bg-white/20' : 'bg-border'
                        }`}>
                          {idx + 1}
                        </span>
                      )}
                      {section.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 현재 섹션 상세 - 질문 가이드 */}
            {currentSection && (
              <div className="bg-surface-card rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-txt-primary">
                      📋 {currentSection.title} 검토 중
                    </span>
                    <span className="text-[10px] text-txt-tertiary">
                      ({currentSectionIndex + 1}/{governmentSections.length})
                    </span>
                  </div>
                  {currentSectionIndex < governmentSections.length - 1 && (
                    <button
                      onClick={() => advanceToNextSection()}
                      className="text-[10px] text-txt-primary hover:text-txt-primary font-medium flex items-center gap-1 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-border-strong"
                    >
                      다음 섹션으로 <ArrowRight size={10} />
                    </button>
                  )}
                </div>

                {/* 평가기준 태그 - 최대 3개 표시 */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {currentSection.criteria.slice(0, 3).map((crit, i) => (
                    <span key={i} className="px-2.5 py-1 bg-surface-sunken text-txt-secondary text-[10px] rounded-full border border-border">
                      {crit}
                    </span>
                  ))}
                  {currentSection.criteria.length > 3 && (
                    <span className="px-2 py-1 text-[10px] text-txt-tertiary">
                      +{currentSection.criteria.length - 3}개
                    </span>
                  )}
                </div>

                {/* 가이드 질문 */}
                {currentSection.questions && currentSection.questions.length > 0 && (
                  <div className="mt-2 p-3 bg-surface-sunken rounded-lg border border-border-subtle">
                    <p className="text-[10px] text-txt-tertiary mb-1.5">💡 이 섹션에서 답해야 할 질문:</p>
                    <p className="text-xs text-txt-secondary leading-relaxed">
                      {currentSection.questions[0]}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 모바일용 정부지원사업 축소 헤더 */}
        {isGovernmentMode && currentSection && (
          <div className="md:hidden bg-surface-sunken border-b border-border">
            <div className="px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-surface-inverse rounded-full flex items-center justify-center">
                    <span className="text-txt-inverse text-[10px] font-bold">{currentSectionIndex + 1}</span>
                  </div>
                  <span className="text-xs font-bold text-txt-primary">
                    {currentSection.title}
                  </span>
                  <span className="text-[10px] text-txt-tertiary">
                    ({currentSectionIndex + 1}/{governmentSections.length})
                  </span>
                </div>
                <span className="text-[10px] font-medium text-txt-primary">
                  {sectionProgress}% 완료
                </span>
              </div>
              <div className="w-full h-1 bg-border rounded-full mt-2">
                <div
                  className="h-full bg-surface-inverse rounded-full transition-all duration-300"
                  style={{ width: `${sectionProgress}%` }}
                />
              </div>
            </div>
            {/* 모바일 가이드 질문 영역 */}
            {currentSection.questions && currentSection.questions.length > 0 && (
              <div className="px-4 py-2 bg-surface-card/50 border-t border-border">
                <div className="flex items-start gap-2">
                  <span className="text-txt-tertiary text-sm">💡</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-txt-tertiary mb-0.5">이번 섹션에서 답해야 할 질문</p>
                    <p className="text-xs text-txt-secondary leading-relaxed">
                      {currentSection.questions[0]}
                    </p>
                  </div>
                </div>
                {/* 평가기준 태그 */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentSection.criteria.slice(0, 2).map((crit, i) => (
                    <span key={i} className="px-2 py-0.5 bg-surface-sunken text-txt-secondary text-[10px] rounded-full border border-border">
                      {crit}
                    </span>
                  ))}
                  {currentSection.criteria.length > 2 && (
                    <span className="text-[10px] text-txt-tertiary">+{currentSection.criteria.length - 2}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
          <MessageList
            messages={messages}
            lastMsgId={lastMsg?.id}
            isTyping={isTyping}
            hideInput={hideInput}
            selectedPersonas={personas}
            interactionMode={interactionMode}
            onOpenReflectionModal={openReflectionModal}
            onConsolidatedSend={handleConsolidatedSend}
            latestMessageRef={latestMessageRef}
          />
        </div>

        {/* Token Limit Warning - always shown when limit reached */}
        {isLimitReached && (
          <div className="p-4 md:p-6 bg-surface-card border-t border-border shrink-0 z-10">
            <div className="max-w-4xl mx-auto relative">
              <div className="w-full bg-surface-sunken border border-border rounded p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-border rounded flex items-center justify-center text-txt-tertiary">
                        <Lock size={14} />
                    </div>
                    <div className="text-sm">
                        <span className="font-bold text-txt-primary block">대화 턴 소진</span>
                        <span className="text-xs text-txt-tertiary">심도 있는 검증을 위해 토큰을 사용하세요.</span>
                    </div>
                 </div>
                 <button
                    onClick={consumeTokenAndContinue}
                    className="bg-surface-inverse text-txt-inverse px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-colors"
                 >
                    토큰 1개 사용 (잔여: {tokens})
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Area - Input or Results Preview */}
        {!hideInput && !isLimitReached && (
          <ChatInput
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            onFinish={handleFinish}
            isTyping={isTyping}
            metrics={metrics}
            showInputMode={showInputMode}
            onShowInputMode={() => setShowInputMode(true)}
            turnCount={turnCount}
            placeholder={
              isGovernmentMode && currentSection?.questions?.[0]
                ? `💡 ${currentSection.questions[0].slice(0, 60)}${currentSection.questions[0].length > 60 ? '...' : ''}`
                : "아이디어나 답변을 입력하세요..."
            }
            isGovernmentMode={isGovernmentMode}
            showQuickActions={!metrics}
            currentSectionTitle={currentSection?.title}
          />
        )}

        {/* Auto-complete when limit reached */}
        {isLimitReached && metrics && (
          <div className="p-4 md:p-6 bg-surface-card border-t border-border shrink-0 z-10">
            <div className="max-w-4xl mx-auto">
              <div className="bg-surface-inverse text-txt-inverse rounded p-5 text-center">
                <div className="text-2xl font-black mb-2">{metrics.score}점</div>
                <p className="text-sm text-txt-disabled mb-4">10턴 검증이 완료되었습니다</p>
                <button
                  onClick={handleFinish}
                  className="px-4 py-3 bg-surface-card text-txt-primary text-sm font-bold rounded-lg hover:bg-surface-sunken transition-colors flex items-center gap-2 mx-auto"
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
      <div className="w-56 lg:w-64 bg-surface-card border-l border-border overflow-y-auto shrink-0 p-4 hidden md:block" data-tutorial="chat-sidebar">
        {isGovernmentMode ? (
          <>
            {/* 정부지원사업 평가항목 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-txt-primary" />
                  <h4 className="text-xs font-bold text-txt-primary">{programName} 평가항목</h4>
                </div>
                <span className="text-[10px] text-txt-tertiary">
                  {currentSectionIndex}/{governmentSections.length} 완료
                </span>
              </div>
              {/* 진행률 바 */}
              <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-surface-inverse transition-all duration-500"
                  style={{ width: `${governmentSections.length > 0 ? (currentSectionIndex / governmentSections.length) * 100 : 0}%` }}
                />
              </div>
              <div className="space-y-2">
                {governmentSections.map((section, idx) => {
                  const isCompleted = idx < currentSectionIndex;
                  const isCurrent = idx === currentSectionIndex;

                  return (
                    <div
                      key={section.title}
                      className={`flex items-center gap-2 p-2.5 rounded-lg transition-all ${
                        isCurrent ? 'bg-surface-sunken border border-border-strong' :
                        isCompleted ? 'bg-surface-sunken border border-border' :
                        'bg-surface-sunken border border-border-subtle'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isCompleted ? 'bg-status-success-text text-txt-inverse' :
                        isCurrent ? 'bg-surface-inverse text-txt-inverse' :
                        'bg-border text-txt-tertiary'
                      }`}>
                        {isCompleted ? <Check size={12} /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${
                          isCompleted ? 'text-txt-secondary' :
                          isCurrent ? 'text-txt-primary' :
                          'text-txt-tertiary'
                        }`}>
                          {section.title}
                        </p>
                        <p className="text-[10px] text-txt-tertiary">
                          {section.questionCount}개 • {section.weight}점
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Live Status */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-status-success-text animate-pulse"></div>
                <span className="text-[10px] font-bold font-mono text-txt-tertiary uppercase tracking-widest">Live Analysis</span>
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
                className="w-full bg-surface-inverse text-txt-inverse py-2.5 rounded text-xs font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
              >
                전체 리포트 보기
                <ArrowRight size={14} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Reflection Modal */}
      {reflectionModal && (
        <ReflectionModal
          modalState={reflectionModal}
          reflectionText={reflectionText}
          onReflectionTextChange={setReflectionText}
          onSelectPerspective={(idx, content) => {
            setReflectionModal(prev => prev ? { ...prev, selectedPerspectiveIdx: idx } : null);
            setReflectionText(content);
          }}
          onClose={closeReflectionModal}
          onSave={saveReflectionLocally}
          onRemove={removeReflection}
          isAlreadyReflected={
            messages.find(m => m.id === reflectionModal.msgId)?.responses?.[reflectionModal.respIdx].isReflected || false
          }
        />
      )}
    </div>
  );
};

export default ChatInterface;
