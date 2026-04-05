'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  WorkflowStep,
  WorkflowState,
  WorkflowMode,
  ValidationData,
  PrdData,
  GovernmentProgram,
  GOVERNMENT_PROGRAMS,
  MINUTES_PER_QUESTION,
  MIN_ESTIMATED_MINUTES,
  GovernmentProgramConfig,
  QUICK_WORKFLOW_STEPS,
  FULL_WORKFLOW_STEPS,
} from './types';
import WorkflowStepper from './WorkflowStepper';
import { toast } from 'sonner';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Download,
  Check,
  Building2,
  Zap,
  FileText,
  Users,
  Layers,
  Sword,
  Cpu,
  Paintbrush,
  DollarSign,
  Megaphone,
  Scale,
  ClipboardList,
  Server,
  Calculator,
  User,
  Settings,
  Folder,
} from 'lucide-react';

// Persona icon mapping
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

const getPersonaIcon = (iconName: string, size: number = 24): React.ReactNode => {
  const iconFn = PERSONA_ICONS[iconName];
  return iconFn ? iconFn(size) : <Cpu size={size} />;
};

// Import existing components
import ChatInterface from '../ChatInterface';
import ResultView from '../ResultView';
import ApplicationFormEditor from './ApplicationFormEditor';
import IdeaRefineWithSync from './IdeaRefineWithSync';
import {
  ValidationLevel,
  PersonaRole,
  DEFAULT_PERSONAS,
  ChatMessage,
  Scorecard,
  createEmptyScorecard,
  InteractionMode,
  PERSONA_PRESETS,
} from '../types';

// Import portfolio components
import {
  PortfolioView,
  IdeaDetailView,
  NewVersionFlow,
} from '../portfolio';
import type { IdeaCore, IdeaVersion } from '@/lib/portfolio/types';

interface WorkflowContainerProps {
  userData: {
    id?: string; // User ID for portfolio
    name: string;
    email: string;
    organization?: string;
  };
  onBack?: () => void;
  onComplete?: () => void;
  initialStep?: WorkflowStep; // Optional initial step (e.g., 'portfolio')
}

export default function WorkflowContainer({
  userData,
  onBack,
  onComplete,
  initialStep,
}: WorkflowContainerProps) {
  // Workflow state - 목표 선택부터 시작
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentStep: initialStep || 'quick-level',
    completedSteps: [],
    workflowMode: 'quick',
    selectedProgram: null,
    currentSectionIndex: 0,
    completedSectionIds: [],
    validationData: null,
    prdData: null,
    businessPlanData: null,
    selectedIdeaId: undefined,
    selectedVersionId: undefined,
    forkFromVersionId: undefined,
  });

  // Portfolio state
  const [forkFromVersion, setForkFromVersion] = useState<IdeaVersion | null>(null);

  // Validation state (for ChatInterface)
  const [selectedLevel, setSelectedLevel] = useState<ValidationLevel>(ValidationLevel.MVP);
  const [selectedPersonas, setSelectedPersonas] = useState<PersonaRole[]>(DEFAULT_PERSONAS);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('discussion');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [scorecard, setScorecard] = useState<Scorecard>(createEmptyScorecard());
  const [conversationHistory, setConversationHistory] = useState<string>('');
  const [projectIdea, setProjectIdea] = useState<string>('');
  const [reflectedAdvice, setReflectedAdvice] = useState<string[]>([]);
  const [ideaCategory, setIdeaCategory] = useState<string>('');

  
  // Step navigation
  const goToStep = useCallback((step: WorkflowStep) => {
    setWorkflowState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const completeStep = useCallback((step: WorkflowStep, data?: unknown) => {
    setWorkflowState((prev) => {
      const newCompletedSteps = prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step];

      // 모드에 따른 다음 단계 결정
      const quickStepOrder: WorkflowStep[] = ['quick-persona', 'quick-level', 'quick-validation', 'quick-result'];
      const fullStepOrder: WorkflowStep[] = ['program-select', 'idea-refine', 'application-form', 'export'];

      const stepOrder = prev.workflowMode === 'quick' ? quickStepOrder : fullStepOrder;
      const currentIndex = stepOrder.indexOf(step);
      const nextStep = stepOrder[currentIndex + 1] as WorkflowStep;

      return {
        ...prev,
        completedSteps: newCompletedSteps,
        currentStep: nextStep || step,
        ...(step === 'validation' && data ? { validationData: data as ValidationData } : {}),
        ...(step === 'quick-validation' && data ? { validationData: data as ValidationData } : {}),
        ...(step === 'prd' && data ? { prdData: data as PrdData } : {}),
      };
    });
  }, []);

  // Handle goal selection (Quick vs Full)
  const handleGoalSelect = useCallback((mode: WorkflowMode) => {
    setWorkflowState((prev) => ({
      ...prev,
      workflowMode: mode,
      currentStep: mode === 'quick' ? 'quick-persona' : 'program-select',
    }));

    if (mode === 'quick') {
      toast.success('빠른 검증 모드를 시작합니다!');
    } else {
      toast.success('지원사업 준비 워크플로우를 시작합니다!');
    }
  }, []);


  // Continue from quick validation to full workflow
  const handleContinueToFull = useCallback(() => {
    setWorkflowState((prev) => ({
      ...prev,
      workflowMode: 'full',
      currentStep: 'program-select',
      // 빠른 검증 완료 상태 유지하여 PRD 단계에서 활용
    }));
    toast.success('지원사업 준비로 계속합니다. 프로그램을 선택해주세요!');
  }, []);

  // Handle quick validation complete
  const handleQuickValidationComplete = useCallback(
    async (
      history: string,
      idea: string,
      advice: string[],
      score?: number,
      messages?: ChatMessage[],
      currentScorecard?: Scorecard,
      category?: string
    ) => {
      setConversationHistory(history);
      setProjectIdea(idea);
      setReflectedAdvice(advice);
      if (messages) setChatMessages(messages);
      if (currentScorecard) setScorecard(currentScorecard);
      if (category) setIdeaCategory(category);

      const validationData: ValidationData = {
        conversationHistory: history,
        projectIdea: idea,
        reflectedAdvice: advice,
        scorecard: currentScorecard || {},
        ideaCategory: category || '',
        completedAt: new Date(),
      };

      completeStep('quick-validation', validationData);
      toast.success('아이디어 검증 완료!');
    },
    [completeStep]
  );

  // Handle validation complete
  const handleValidationComplete = useCallback(
    async (
      history: string,
      idea: string,
      advice: string[],
      score?: number,
      messages?: ChatMessage[],
      currentScorecard?: Scorecard,
      category?: string
    ) => {
      setConversationHistory(history);
      setProjectIdea(idea);
      setReflectedAdvice(advice);
      if (messages) setChatMessages(messages);
      if (currentScorecard) setScorecard(currentScorecard);
      if (category) setIdeaCategory(category);

      const validationData: ValidationData = {
        conversationHistory: history,
        projectIdea: idea,
        reflectedAdvice: advice,
        scorecard: currentScorecard || {},
        ideaCategory: category || '',
        completedAt: new Date(),
      };

      completeStep('validation', validationData);
      toast.success('아이디어 검증 완료! PRD 생성 단계로 이동합니다.');
    },
    [completeStep]
  );

  // 질문 수 기반 동적 소요시간 계산
  const calculateEstimatedTime = useCallback((program: GovernmentProgramConfig) => {
    const totalQuestions = program.sections.reduce(
      (acc, s) => acc + (s.questions?.length || 0),
      0
    );
    const minutes = Math.max(MIN_ESTIMATED_MINUTES, Math.ceil(totalQuestions * MINUTES_PER_QUESTION));
    return `약 ${minutes}분`;
  }, []);

  // 선택된 프로그램 설정 (메모이제이션)
  const selectedProgramConfig = useMemo(() => {
    return GOVERNMENT_PROGRAMS.find(p => p.id === workflowState.selectedProgram) || null;
  }, [workflowState.selectedProgram]);

  // 프로그램별 질문 목록 (메모이제이션)
  const programQuestions = useMemo(() => {
    if (!selectedProgramConfig) return [];
    return selectedProgramConfig.sections.flatMap(section =>
      (section.questions || []).map(q => ({
        ...q,
        sectionId: section.id,
        sectionTitle: section.titleKo,
      }))
    );
  }, [selectedProgramConfig]);

  // Handle program selection - 첫 단계에서 프로그램 선택
  const handleProgramSelect = useCallback(
    (programId: GovernmentProgram) => {
      const selectedProgramInfo = GOVERNMENT_PROGRAMS.find(p => p.id === programId);

      setWorkflowState((prev) => ({
        ...prev,
        selectedProgram: programId,
      }));
      completeStep('program-select');

      toast.success(
        `${selectedProgramInfo?.nameKo || '지원사업'} 선택 완료! 맞춤 검증을 시작합니다.`
      );
    },
    [completeStep]
  );

  // Render current step content
  const renderStepContent = () => {
    switch (workflowState.currentStep) {
      case 'goal-select':
        return (
          <div className="h-full overflow-y-auto flex items-center justify-center">
            <div className="w-full max-w-4xl mx-auto px-6 py-8">
              {/* Hero Section */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  {userData.name}님, 환영합니다!
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  무엇을 도와드릴까요?
                </h1>
                <p className="text-gray-600 max-w-xl mx-auto">
                  빠르게 아이디어만 검증하거나, 지원사업 준비까지 한 번에 진행할 수 있습니다.
                </p>
              </div>

              {/* Portfolio Button - hidden for MVP cohort */}

              {/* Goal Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Quick Validation */}
                <button
                  onClick={() => handleGoalSelect('quick')}
                  className="group relative bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:border-yellow-500 hover:shadow-lg transition-all"
                >
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-mono font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                      5~15분
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                        빠른 아이디어 검증
                      </h3>
                      <p className="text-sm text-gray-500">아이디어만 빠르게 검증</p>
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm text-gray-600 mb-4">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-yellow-500" />
                      AI 전문가 페르소나 선택
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-yellow-500" />
                      실시간 피드백 & 점수
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-yellow-500" />
                      검증 후 지원사업 준비 연계 가능
                    </li>
                  </ul>

                  <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                    <span className="flex items-center gap-1 text-yellow-600 font-medium text-sm group-hover:gap-2 transition-all">
                      시작하기 <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </button>

                {/* Full Workflow - 포트폴리오에서 아이디어 선택 필요 */}
                <button
                  onClick={() => {
                    // 아이디어 선택 모드로 포트폴리오 이동
                    setWorkflowState((prev) => ({
                      ...prev,
                      workflowMode: 'full',
                      currentStep: 'portfolio',
                    }));
                    toast.info('지원사업에 사용할 아이디어를 선택해주세요');
                  }}
                  className="group relative bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:border-blue-500 hover:shadow-lg transition-all"
                >
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      30분~1시간
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        지원사업 준비
                      </h3>
                      <p className="text-sm text-gray-500">아이디어 선택 → 사업계획서 완성</p>
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm text-gray-600 mb-4">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500" />
                      저장된 아이디어 불러오기
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500" />
                      지원서 양식에 맞춰 다듬기
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500" />
                      AI와 함께 사업계획서 작성
                    </li>
                  </ul>

                  <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                    <span className="flex items-center gap-1 text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                      아이디어 선택하기 <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </button>
              </div>

            </div>
          </div>
        );

      case 'quick-persona':
        return (
          <div className="h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto px-6 py-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium mb-4">
                  <Users className="w-4 h-4" />
                  Step 1/3
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  검증 페르소나 선택
                </h1>
                <p className="text-gray-600">
                  3명의 AI 전문가를 선택하세요. 다양한 관점에서 피드백을 받을 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {PERSONA_PRESETS.map((persona) => {
                  const isSelected = selectedPersonas.includes(persona.id);
                  const selectionIndex = selectedPersonas.indexOf(persona.id);
                  return (
                    <button
                      key={persona.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPersonas(prev => prev.filter(p => p !== persona.id));
                        } else if (selectedPersonas.length < 3) {
                          setSelectedPersonas(prev => [...prev, persona.id]);
                        }
                      }}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {selectionIndex + 1}
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${isSelected ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {getPersonaIcon(persona.icon, 20)}
                      </div>
                      <div className="font-semibold text-sm text-gray-900">{persona.nameKo}</div>
                      <div className="text-[10px] text-gray-500">{persona.name}</div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => completeStep('quick-persona')}
                  disabled={selectedPersonas.length !== 3}
                  className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  다음: 난이도 선택
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-3">
                {selectedPersonas.length}/3 선택됨
              </p>
            </div>
          </div>
        );

      case 'quick-level':
        return (
          <div className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium mb-4">
                  <Layers className="w-4 h-4" />
                  Step 2/3
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  검증 난이도 선택
                </h1>
                <p className="text-gray-600">
                  아이디어의 완성도에 맞는 검증 수준을 선택하세요.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  { level: ValidationLevel.SKETCH, name: 'Sketch', nameKo: '스케치', desc: '초기 아이디어 탐색', time: '5분', icon: Zap },
                  { level: ValidationLevel.MVP, name: 'MVP', nameKo: 'MVP', desc: '핵심 가치 검증', time: '10분', icon: Layers },
                ].map(({ level, name, nameKo, desc, time, icon: Icon }) => (
                  <button
                    key={level}
                    onClick={() => {
                      setSelectedLevel(level);
                      completeStep('quick-level');
                    }}
                    className={`w-full p-6 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                      selectedLevel === level
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-300 bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-gray-900">{nameKo}</span>
                        <span className="text-sm text-gray-500">{name}</span>
                      </div>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                    <div className="text-sm font-medium text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                      {time}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'quick-validation':
        return (
          <div className="h-full">
            <ChatInterface
              onComplete={handleQuickValidationComplete}
              level={selectedLevel}
              personas={selectedPersonas}
              interactionMode={interactionMode}
              onBack={() => goToStep('quick-level')}
            />
          </div>
        );

      case 'quick-result':
        return (
          <div className="h-full overflow-y-auto">
            <ResultView
              conversationHistory={conversationHistory}
              originalIdea={projectIdea}
              reflectedAdvice={reflectedAdvice}
              rawMessages={chatMessages}
              scorecard={scorecard}
              ideaCategory={ideaCategory}
              onComplete={onComplete}
            />

            {/* Continue to Full Workflow CTA */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  검증 결과를 바탕으로 사업계획서까지 작성하시겠어요?
                </div>
                <button
                  onClick={handleContinueToFull}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
                >
                  <FileText className="w-5 h-5" />
                  지원사업 준비 계속하기
                </button>
              </div>
            </div>
          </div>
        );

      case 'program-select':
        return (
          <div className="h-full overflow-y-auto flex items-center justify-center relative">
            {/* Back Button */}
            <button
              onClick={() => goToStep('goal-select')}
              className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-full max-w-6xl mx-auto px-6">
              {/* Hero Section */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
                  <Building2 className="w-4 h-4" />
                  정부 지원사업 합격률을 높여드립니다
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  어떤 지원사업에 도전하시나요?
                </h1>
                <p className="text-gray-600 max-w-xl mx-auto">
                  선택하신 프로그램의 <strong>평가항목에 최적화된 검증 질문</strong>을 준비했습니다.
                  <br />각 항목별로 철저히 준비하여 합격 가능성을 높여보세요.
                </p>
              </div>

              {/* Program Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {GOVERNMENT_PROGRAMS.map((program) => (
                  <button
                    key={program.id}
                    onClick={() => handleProgramSelect(program.id)}
                    aria-label={`${program.nameKo} 프로그램 선택. ${program.sections.length}개 평가항목, 예상 소요시간 ${calculateEstimatedTime(program)}`}
                    className="group relative bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:border-blue-500 hover:shadow-lg transition-all"
                  >
                    {/* Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {program.sections.length}개 평가항목
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {program.nameKo}
                        </h3>
                        <p className="text-sm text-gray-500">{program.description}</p>
                      </div>
                    </div>

                    {/* Sections Preview */}
                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-medium text-gray-400 uppercase">평가항목 미리보기</p>
                      <div className="flex flex-wrap gap-2">
                        {program.sections.map((section) => (
                          <span
                            key={section.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-700 text-xs rounded-md border border-gray-200"
                          >
                            {section.titleKo}
                            <span className="text-gray-400 font-medium">{section.weight}점</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-500">
                        예상 소요시간 <strong className="text-gray-900">{calculateEstimatedTime(program)}</strong>
                      </span>
                      <span className="flex items-center gap-1 text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                        시작하기 <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'idea-refine':
        return (
          <IdeaRefineWithSync
            programId={workflowState.selectedProgram || 'pre-startup'}
            level={selectedLevel}
            personas={selectedPersonas}
            interactionMode={interactionMode}
            programQuestions={programQuestions}
            onComplete={(history, idea, advice, score, messages, currentScorecard, category) => {
              setConversationHistory(history);
              setProjectIdea(idea);
              setReflectedAdvice(advice);
              if (messages) setChatMessages(messages);
              if (currentScorecard) setScorecard(currentScorecard);
              if (category) setIdeaCategory(category);
              completeStep('idea-refine');
              toast.success('아이디어 다듬기 완료! 지원서 작성을 시작합니다.');
            }}
            onBack={() => goToStep('program-select')}
          />
        );

      case 'application-form':
        return (
          <ApplicationFormEditor
            programId={workflowState.selectedProgram || 'pre-startup'}
            ideaData={{
              title: projectIdea.slice(0, 50),
              problemDefinition: projectIdea,
              solution: conversationHistory ? '대화 내용에서 추출된 솔루션' : undefined,
              targetCustomer: undefined,
              marketSize: undefined,
              businessModel: undefined,
              team: userData.name,
            }}
            onComplete={(formData) => {
              // TODO: formData 저장
              completeStep('application-form');
              toast.success('지원서 작성 완료!');
            }}
            onBack={() => goToStep('idea-refine')}
          />
        );

      case 'validation':
        return (
          <div className="h-full">
            <ChatInterface
              onComplete={handleValidationComplete}
              level={selectedLevel}
              personas={selectedPersonas}
              interactionMode={interactionMode}
              onBack={() => goToStep('program-select')}
              programQuestions={programQuestions}
              programName={selectedProgramConfig?.nameKo}
            />
          </div>
        );

      case 'prd':
        return (
          <div className="h-full overflow-y-auto">
            <ResultView
              conversationHistory={conversationHistory}
              originalIdea={projectIdea}
              reflectedAdvice={reflectedAdvice}
              rawMessages={chatMessages}
              scorecard={scorecard}
              ideaCategory={ideaCategory}
              onComplete={() => completeStep('prd')}
              // 워크플로우 모드: PRD 탭만 활성화
              workflowMode="prd"
              selectedProgram={workflowState.selectedProgram}
            />

            {/* PRD 완료 후 사업계획서 진행 버튼 */}
            {workflowState.completedSteps.includes('validation') && (
              <div className="fixed bottom-6 right-6 z-50">
                <button
                  onClick={() => completeStep('prd')}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
                >
                  <span>사업계획서 작성하기</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        );

      case 'business-plan':
        return (
          <div className="h-full overflow-y-auto">
            <ResultView
              conversationHistory={conversationHistory}
              originalIdea={projectIdea}
              reflectedAdvice={reflectedAdvice}
              rawMessages={chatMessages}
              scorecard={scorecard}
              ideaCategory={ideaCategory}
              onComplete={() => completeStep('business-plan')}
              // 워크플로우 모드: 사업계획서 탭 활성화
              workflowMode="business-plan"
              selectedProgram={workflowState.selectedProgram}
            />

            {/* 내보내기 진행 버튼 */}
            <div className="fixed bottom-6 right-6 z-50">
              <button
                onClick={() => completeStep('business-plan')}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition-all hover:scale-105"
              >
                <Download className="w-5 h-5" />
                <span>내보내기</span>
              </button>
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">모든 준비가 완료되었습니다!</h2>
                <p className="text-gray-600 mt-2">
                  아래에서 원하는 형식으로 문서를 내보내세요.
                </p>
              </div>

              <ResultView
                conversationHistory={conversationHistory}
                originalIdea={projectIdea}
                reflectedAdvice={reflectedAdvice}
                rawMessages={chatMessages}
                scorecard={scorecard}
                ideaCategory={ideaCategory}
                onComplete={onComplete}
                // 워크플로우 모드: 내보내기 탭 활성화
                workflowMode="export"
              />
            </div>
          </div>
        );

      // Portfolio related steps
      case 'portfolio':
        return (
          <PortfolioView
            userId={userData.id || ''}
            selectionMode={workflowState.workflowMode === 'full' ? 'grant' : undefined}
            onSelectIdea={(ideaId) => {
              // 지원사업 모드면 프로그램 선택으로, 아니면 상세보기로
              if (workflowState.workflowMode === 'full') {
                setWorkflowState((prev) => ({
                  ...prev,
                  selectedIdeaId: ideaId,
                  currentStep: 'program-select',
                }));
                toast.success('아이디어가 선택되었습니다! 지원사업을 선택해주세요.');
              } else {
                setWorkflowState((prev) => ({
                  ...prev,
                  selectedIdeaId: ideaId,
                  currentStep: 'idea-detail',
                }));
              }
            }}
            onCreateNew={() => {
              handleGoalSelect('quick');
            }}
            onImportSuccess={(ideaCore, ideaVersion) => {
              setWorkflowState((prev) => ({
                ...prev,
                selectedIdeaId: ideaCore.id,
                selectedVersionId: ideaVersion.id,
                workflowMode: 'full',
                currentStep: 'program-select',
              }));
              toast.success('아이디어를 가져왔습니다! 지원사업을 선택해주세요.');
            }}
            onBack={workflowState.workflowMode === 'full' ? () => {
              setWorkflowState((prev) => ({
                ...prev,
                workflowMode: null,
                currentStep: 'goal-select',
              }));
            } : undefined}
          />
        );

      case 'idea-detail':
        return workflowState.selectedIdeaId ? (
          <IdeaDetailView
            ideaId={workflowState.selectedIdeaId}
            userId={userData.id || ''}
            onBack={() => goToStep('portfolio')}
            onNewVersion={(ideaId, forkFromVersionId) => {
              setWorkflowState((prev) => ({
                ...prev,
                selectedIdeaId: ideaId,
                forkFromVersionId: forkFromVersionId,
                currentStep: 'new-version',
              }));
            }}
            onContinueValidation={(versionId) => {
              setWorkflowState((prev) => ({
                ...prev,
                selectedVersionId: versionId,
                currentStep: 'validation',
                workflowMode: 'full',
              }));
            }}
          />
        ) : null;

      case 'new-version':
        return workflowState.selectedIdeaId ? (
          <NewVersionFlow
            ideaId={workflowState.selectedIdeaId}
            userId={userData.id || ''}
            forkFromVersion={forkFromVersion}
            onComplete={(versionId, targetProgramId) => {
              setWorkflowState((prev) => ({
                ...prev,
                selectedVersionId: versionId,
                selectedProgram: targetProgramId as GovernmentProgram,
                currentStep: 'validation',
                workflowMode: 'full',
              }));
              toast.success('새 버전이 생성되었습니다. 검증을 시작합니다!');
            }}
            onCancel={() => {
              setWorkflowState((prev) => ({
                ...prev,
                currentStep: 'idea-detail',
                forkFromVersionId: undefined,
              }));
            }}
          />
        ) : null;

      default:
        return null;
    }
  };

  // 현재 모드에 따른 스텝 목록 선택
  const currentSteps = workflowState.workflowMode === 'quick' ? QUICK_WORKFLOW_STEPS : FULL_WORKFLOW_STEPS;

  // goal-select, program-select, validation 및 포트폴리오 관련 단계에서는 헤더 숨김
  const portfolioSteps: WorkflowStep[] = ['portfolio', 'idea-detail', 'new-version', 'version-compare', 'gap-analysis'];
  const hideHeaderSteps: WorkflowStep[] = ['goal-select', 'program-select', 'idea-refine', 'application-form', 'validation'];
  const showHeader = !hideHeaderSteps.includes(workflowState.currentStep) && !portfolioSteps.includes(workflowState.currentStep);

  // goal-select에서는 UnifiedHomeScreen이 자체 헤더를 가지므로 GNB 숨김
  const hideGNB = workflowState.currentStep === 'goal-select';

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Simple GNB - goal-select에서는 숨김 */}
      {!hideGNB && (
        <div className="flex-shrink-0 h-12 border-b border-gray-100 bg-white px-4 flex items-center gap-3">
          <button
            onClick={() => {
              if (workflowState.currentStep === 'validation' && workflowState.workflowMode === 'full') {
                // 정부지원사업 모드에서는 program-select로
                goToStep('program-select');
              } else if (workflowState.currentStep === 'program-select') {
                goToStep('goal-select');
              } else {
                goToStep('goal-select');
              }
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-lg font-bold text-gray-900">Draft</span>
        </div>
      )}

      {/* Header with Stepper - goal-select에서는 숨김 */}
      {showHeader && (
        <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (workflowState.workflowMode) {
                    // 모드 선택으로 돌아가기
                    setWorkflowState(prev => ({
                      ...prev,
                      currentStep: 'goal-select',
                      workflowMode: null,
                    }));
                  } else {
                    onBack?.();
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {workflowState.workflowMode === 'quick' ? (
                    <>
                      <Zap className="w-5 h-5 text-yellow-500" />
                      빠른 아이디어 검증
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-blue-500" />
                      지원사업 준비 워크플로우
                    </>
                  )}
                </h1>
                <p className="text-xs text-gray-500">
                  {workflowState.workflowMode === 'quick'
                    ? `${userData.name}님의 아이디어를 빠르게 검증합니다`
                    : `${userData.name}님의 아이디어를 사업계획서까지 완성합니다`
                  }
                </p>
              </div>
            </div>

            {workflowState.workflowMode === 'full' && workflowState.selectedProgram && (
              <button
                onClick={() => goToStep('program-select')}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {GOVERNMENT_PROGRAMS.find((p) => p.id === workflowState.selectedProgram)?.nameKo}
                </span>
                <span className="text-xs text-blue-500">변경</span>
              </button>
            )}
          </div>

          <WorkflowStepper
            currentStep={workflowState.currentStep}
            completedSteps={workflowState.completedSteps}
            onStepClick={goToStep}
            compact
            steps={currentSteps}
            mode={workflowState.workflowMode}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">{renderStepContent()}</main>
    </div>
  );
}
