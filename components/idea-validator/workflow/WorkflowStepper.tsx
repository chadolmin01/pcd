'use client';

import React from 'react';
import { WorkflowStep, WORKFLOW_STEPS } from './types';
import { MessageSquare, FileText, Briefcase, Download, Check, ChevronRight } from 'lucide-react';

interface WorkflowStepperProps {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  onStepClick?: (step: WorkflowStep) => void;
  compact?: boolean;
}

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  FileText,
  Briefcase,
  Download,
};

export default function WorkflowStepper({
  currentStep,
  completedSteps,
  onStepClick,
  compact = false,
}: WorkflowStepperProps) {
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
    const stepIndex = WORKFLOW_STEPS.findIndex(s => s.id === stepId);
    if (stepIndex > 0) {
      const prevStep = WORKFLOW_STEPS[stepIndex - 1];
      return completedSteps.includes(prevStep.id);
    }
    return false;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 rounded-lg">
        {WORKFLOW_STEPS.map((step, index) => {
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
                  ${status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                  ${status === 'current' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' : ''}
                  ${status === 'upcoming' ? 'bg-gray-100 text-gray-400' : ''}
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
              {index < WORKFLOW_STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop: Horizontal Stepper */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-6 left-0 h-0.5 bg-blue-500 z-0 transition-all duration-500"
          style={{
            width: `${(completedSteps.length / (WORKFLOW_STEPS.length - 1)) * 100}%`,
          }}
        />

        {WORKFLOW_STEPS.map((step, index) => {
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
                  w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                  ${status === 'completed' ? 'bg-green-500 text-white shadow-lg shadow-green-200' : ''}
                  ${status === 'current' ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100' : ''}
                  ${status === 'upcoming' ? 'bg-gray-100 text-gray-400 border-2 border-gray-200' : ''}
                  ${clickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                `}
              >
                {status === 'completed' ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </button>

              <div className="mt-3 text-center">
                <p
                  className={`
                    text-sm font-semibold
                    ${status === 'completed' ? 'text-green-600' : ''}
                    ${status === 'current' ? 'text-blue-600' : ''}
                    ${status === 'upcoming' ? 'text-gray-400' : ''}
                  `}
                >
                  {step.titleKo}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 max-w-[120px]">
                  {status === 'completed' ? '완료' : status === 'current' ? '진행 중' : '대기'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical Stepper */}
      <div className="md:hidden space-y-3">
        {WORKFLOW_STEPS.map((step, index) => {
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
                ${status === 'completed' ? 'bg-green-50 border-2 border-green-200' : ''}
                ${status === 'current' ? 'bg-blue-50 border-2 border-blue-300 shadow-lg' : ''}
                ${status === 'upcoming' ? 'bg-gray-50 border-2 border-gray-100' : ''}
                ${clickable ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed opacity-60'}
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${status === 'completed' ? 'bg-green-500 text-white' : ''}
                  ${status === 'current' ? 'bg-blue-500 text-white' : ''}
                  ${status === 'upcoming' ? 'bg-gray-200 text-gray-400' : ''}
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
                    ${status === 'completed' ? 'text-green-700' : ''}
                    ${status === 'current' ? 'text-blue-700' : ''}
                    ${status === 'upcoming' ? 'text-gray-400' : ''}
                  `}
                >
                  Step {index + 1}. {step.titleKo}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
              </div>

              {status === 'current' && (
                <ChevronRight className="w-5 h-5 text-blue-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
