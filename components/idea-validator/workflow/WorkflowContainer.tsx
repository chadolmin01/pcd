'use client';

import React, { useState, useCallback } from 'react';
import {
  WorkflowStep,
  WorkflowState,
  ValidationData,
  PrdData,
  GovernmentProgram,
  GOVERNMENT_PROGRAMS,
} from './types';
import WorkflowStepper from './WorkflowStepper';
import { toast } from 'sonner';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileText,
  Briefcase,
  Download,
  Check,
  ChevronDown,
  Building2,
} from 'lucide-react';

// Import existing components
import ChatInterface from '../ChatInterface';
import ResultView from '../ResultView';
import {
  ValidationLevel,
  PersonaRole,
  DEFAULT_PERSONAS,
  ChatMessage,
  Scorecard,
  createEmptyScorecard,
  InteractionMode,
} from '../types';

interface WorkflowContainerProps {
  userData: {
    name: string;
    email: string;
    organization?: string;
  };
  onBack?: () => void;
  onComplete?: () => void;
}

export default function WorkflowContainer({
  userData,
  onBack,
  onComplete,
}: WorkflowContainerProps) {
  // Workflow state
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentStep: 'validation',
    completedSteps: [],
    selectedProgram: null,
    validationData: null,
    prdData: null,
    businessPlanData: null,
  });

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

  // Program selection modal
  const [showProgramSelector, setShowProgramSelector] = useState(false);

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

      // 다음 단계로 자동 이동
      const currentIndex = ['validation', 'prd', 'business-plan', 'export'].indexOf(step);
      const nextStep = ['validation', 'prd', 'business-plan', 'export'][currentIndex + 1] as WorkflowStep;

      return {
        ...prev,
        completedSteps: newCompletedSteps,
        currentStep: nextStep || step,
        ...(step === 'validation' && data ? { validationData: data as ValidationData } : {}),
        ...(step === 'prd' && data ? { prdData: data as PrdData } : {}),
      };
    });
  }, []);

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

  // Handle PRD generation complete
  const handlePrdComplete = useCallback(() => {
    // PRD가 생성되면 사업계획서 단계 표시
    setShowProgramSelector(true);
  }, []);

  // Handle program selection
  const handleProgramSelect = useCallback(
    (programId: GovernmentProgram) => {
      setWorkflowState((prev) => ({
        ...prev,
        selectedProgram: programId,
      }));
      setShowProgramSelector(false);
      completeStep('prd');
      toast.success('사업계획서 작성 단계로 이동합니다.');
    },
    [completeStep]
  );

  // Render current step content
  const renderStepContent = () => {
    switch (workflowState.currentStep) {
      case 'validation':
        return (
          <div className="h-full">
            <ChatInterface
              onComplete={handleValidationComplete}
              level={selectedLevel}
              personas={selectedPersonas}
              interactionMode={interactionMode}
              onBack={onBack}
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
              onComplete={handlePrdComplete}
              // 워크플로우 모드: PRD 탭만 활성화
              workflowMode="prd"
            />

            {/* PRD 완료 후 사업계획서 진행 버튼 */}
            {workflowState.completedSteps.includes('validation') && (
              <div className="fixed bottom-6 right-6 z-50">
                <button
                  onClick={() => setShowProgramSelector(true)}
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

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with Stepper */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                지원사업 준비 워크플로우
              </h1>
              <p className="text-xs text-gray-500">
                {userData.name}님의 아이디어를 사업계획서까지 완성합니다
              </p>
            </div>
          </div>

          {workflowState.selectedProgram && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {GOVERNMENT_PROGRAMS.find((p) => p.id === workflowState.selectedProgram)?.nameKo}
              </span>
            </div>
          )}
        </div>

        <WorkflowStepper
          currentStep={workflowState.currentStep}
          completedSteps={workflowState.completedSteps}
          onStepClick={goToStep}
          compact
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">{renderStepContent()}</main>

      {/* Program Selection Modal */}
      {showProgramSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">지원사업 양식 선택</h3>
            <p className="text-gray-600 text-sm mb-6">
              어떤 정부 지원사업에 지원하시나요? 해당 양식에 맞춰 사업계획서를 작성해드립니다.
            </p>

            <div className="space-y-3">
              {GOVERNMENT_PROGRAMS.map((program) => (
                <button
                  key={program.id}
                  onClick={() => handleProgramSelect(program.id)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-700">
                        {program.nameKo}
                      </h4>
                      <p className="text-sm text-gray-500 mt-0.5">{program.description}</p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-blue-500 -rotate-90" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {program.sections.map((section) => (
                      <span
                        key={section.id}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {section.titleKo}
                      </span>
                    ))}
                  </div>
                </button>
              ))}

              <button
                onClick={() => handleProgramSelect('custom')}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all text-left"
              >
                <h4 className="font-semibold text-gray-700">자유 양식</h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  특정 양식 없이 일반적인 사업계획서를 작성합니다
                </p>
              </button>
            </div>

            <button
              onClick={() => setShowProgramSelector(false)}
              className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              나중에 선택하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
