'use client';

import React from 'react';
import { WorkflowStep, WorkflowStepConfig, WorkflowMode, FULL_WORKFLOW_STEPS } from './types';
import { MessageSquare, FileText, Briefcase, Download, Check, ChevronRight, Building2, Users, Layers, CheckCircle, Zap } from 'lucide-react';

interface WorkflowStepperProps {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  onStepClick?: (step: WorkflowStep) => void;
  compact?: boolean;
  steps?: WorkflowStepConfig[];
  mode?: WorkflowMode;
}

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  MessageSquare,
  FileText,
  Briefcase,
  Download,
  Users,
  Layers,
  CheckCircle,
  Zap,
};

export default function WorkflowStepper({
  currentStep,
  completedSteps,
  onStepClick,
  compact = false,
  steps = FULL_WORKFLOW_STEPS,
  mode,
}: WorkflowStepperProps) {
  // 모드에 따른 색상 테마
  const isQuickMode = mode === 'quick';
  const primaryColor = isQuickMode ? 'yellow' : 'blue';

  const getStepStatus = (stepId: WorkflowStep) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (currentStep === stepId) return 'current';
    return 'upcoming';
  };

  const isStepClickable = (stepId: WorkflowStep) => {
    // 완료된 단계는 클릭 가능
    if (completedSteps.includes(stepId)) return true;
    // 현재 단계는 클릭 가능
    if (currentStep === stepId) return true;
    // 이전 단계가 완료되었으면 다음 단계도 클릭 가능
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex > 0) {
      const prevStep = steps[stepIndex - 1];
      return completedSteps.includes(prevStep.id);
    }
    return false;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 px-3 py-2 bg-surface-sunken rounded-lg">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = STEP_ICONS[step.icon] || MessageSquare;
          const clickable = isStepClickable(step.id);

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => clickable && onStepClick?.(step.id)}
                disabled={!clickable}
                className={`
                  flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all
                  ${status === 'completed' ? 'bg-status-success-bg text-status-success-text' : ''}
                  ${status === 'current' ? 'bg-surface-sunken text-txt-primary ring-2 ring-border-strong' : ''}
                  ${status === 'upcoming' ? 'bg-surface-sunken text-txt-tertiary' : ''}
                  ${clickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                `}
                title={step.titleKo}
              >
                {status === 'completed' ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Icon className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">{step.titleKo}</span>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className="w-3 h-3 text-txt-disabled flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop: Horizontal Stepper - Stripe 스타일 */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Progress Line - 더 두껍고 둥글게 */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-surface-sunken z-0 rounded-full" />
        <div
          className="absolute top-6 left-0 h-1 bg-surface-inverse z-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${(completedSteps.length / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = STEP_ICONS[step.icon] || MessageSquare;
          const clickable = isStepClickable(step.id);

          return (
            <div
              key={step.id}
              className={`
                relative z-10 flex flex-col items-center
                ${index === 0 ? '' : 'flex-1'}
              `}
            >
              <button
                onClick={() => clickable && onStepClick?.(step.id)}
                disabled={!clickable}
                className={`
                  relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
                  ${status === 'completed' ? 'bg-surface-inverse text-txt-inverse shadow-lg' : ''}
                  ${status === 'current' ? 'bg-surface-inverse text-txt-inverse shadow-lg ring-4 ring-border' : ''}
                  ${status === 'upcoming' ? 'bg-surface-card text-txt-tertiary border-2 border-border' : ''}
                  ${clickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                `}
              >
                {/* 현재 단계 펄스 애니메이션 */}
                {status === 'current' && (
                  <span className="absolute inset-0 rounded-full bg-gray-500 animate-ping opacity-30" />
                )}
                {status === 'completed' ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <>
                    <Icon className="w-6 h-6" />
                    {/* 단계 번호 배지 */}
                    <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center
                      ${status === 'current' ? 'bg-surface-card text-txt-primary shadow-sm' : 'bg-border text-txt-tertiary'}
                    `}>
                      {index + 1}
                    </span>
                  </>
                )}
              </button>

              <div className="mt-3 text-center">
                <p
                  className={`
                    text-sm font-semibold
                    ${status === 'completed' ? 'text-txt-primary' : ''}
                    ${status === 'current' ? 'text-txt-primary' : ''}
                    ${status === 'upcoming' ? 'text-txt-tertiary' : ''}
                  `}
                >
                  {step.titleKo}
                </p>
                <p className="text-xs text-txt-tertiary mt-0.5 max-w-[120px]">
                  {status === 'completed' ? '완료' : status === 'current' ? '진행 중' : '대기'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical Stepper */}
      <div className="md:hidden space-y-3">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = STEP_ICONS[step.icon] || MessageSquare;
          const clickable = isStepClickable(step.id);

          return (
            <button
              key={step.id}
              onClick={() => clickable && onStepClick?.(step.id)}
              disabled={!clickable}
              className={`
                w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300
                ${status === 'completed' ? 'bg-status-success-bg border-2 border-border' : ''}
                ${status === 'current' ? 'bg-surface-sunken border-2 border-border-strong shadow-lg' : ''}
                ${status === 'upcoming' ? 'bg-surface-sunken border-2 border-border-subtle' : ''}
                ${clickable ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed opacity-60'}
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${status === 'completed' ? 'bg-surface-inverse text-txt-inverse' : ''}
                  ${status === 'current' ? 'bg-surface-inverse text-txt-inverse' : ''}
                  ${status === 'upcoming' ? 'bg-border text-txt-tertiary' : ''}
                `}
              >
                {status === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 text-left">
                <p
                  className={`
                    font-semibold
                    ${status === 'completed' ? 'text-txt-primary' : ''}
                    ${status === 'current' ? 'text-txt-primary' : ''}
                    ${status === 'upcoming' ? 'text-txt-tertiary' : ''}
                  `}
                >
                  Step {index + 1}. {step.titleKo}
                </p>
                <p className="text-xs text-txt-tertiary mt-0.5">{step.description}</p>
              </div>

              {status === 'current' && (
                <ChevronRight className="w-5 h-5 text-txt-tertiary flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
