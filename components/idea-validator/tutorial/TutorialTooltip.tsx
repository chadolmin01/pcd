'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTutorial } from './TutorialContext';

interface TooltipPosition {
  top: number;
  left: number;
  transformOrigin: string;
}

const TutorialTooltip: React.FC = () => {
  const {
    isActive,
    getCurrentStep,
    getTotalSteps,
    currentStep,
    nextStep,
    prevStep,
    endTutorial,
  } = useTutorial();

  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const step = getCurrentStep();
  const totalSteps = getTotalSteps();

  useEffect(() => {
    if (!step || !isActive) {
      setPosition(null);
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const target = document.querySelector(step.targetSelector);
      if (!target || !tooltipRef.current) return;

      const rect = target.getBoundingClientRect();
      setTargetRect(rect);

      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const padding = step.spotlightPadding || 8;
      const gap = 12;

      let top = 0;
      let left = 0;
      let transformOrigin = 'top left';

      switch (step.position) {
        case 'top':
          top = rect.top - tooltipRect.height - gap - padding;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          transformOrigin = 'bottom center';
          break;
        case 'bottom':
          top = rect.bottom + gap + padding;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          transformOrigin = 'top center';
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          left = rect.left - tooltipRect.width - gap - padding;
          transformOrigin = 'center right';
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          left = rect.right + gap + padding;
          transformOrigin = 'center left';
          break;
      }

      // Keep tooltip within viewport
      const viewportPadding = 16;
      left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding));
      top = Math.max(viewportPadding, Math.min(top, window.innerHeight - tooltipRect.height - viewportPadding));

      setPosition({ top, left, transformOrigin });
    };

    // Initial position
    requestAnimationFrame(updatePosition);

    // Update on resize/scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [step, isActive]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          endTutorial();
          break;
        case 'ArrowRight':
        case 'Enter':
          nextStep();
          break;
        case 'ArrowLeft':
          prevStep();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, endTutorial]);

  if (!isActive || !step) return null;

  return (
    <>
      {/* Spotlight overlay */}
      <TutorialSpotlight targetRect={targetRect} padding={step.spotlightPadding || 8} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10001] w-72 bg-white rounded-sm shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200"
        style={{
          top: position?.top ?? -9999,
          left: position?.left ?? -9999,
          transformOrigin: position?.transformOrigin,
          visibility: position ? 'visible' : 'hidden',
        }}
      >
        {/* Progress dots */}
        <div className="flex items-center gap-1.5 px-4 pt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentStep ? 'bg-black' : i < currentStep ? 'bg-gray-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-2">{step.title}</h3>
          <p className="text-xs text-gray-500 leading-relaxed break-keep">{step.content}</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-gray-100">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
            <span>이전</span>
          </button>

          <span className="text-[10px] font-mono text-gray-400">
            {currentStep + 1}/{totalSteps}
          </span>

          <button
            onClick={nextStep}
            className="flex items-center gap-1 text-xs font-bold text-gray-900 hover:text-black transition-colors"
          >
            <span>{currentStep === totalSteps - 1 ? '완료' : '다음'}</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={endTutorial}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-900 transition-colors"
          aria-label="튜토리얼 닫기"
        >
          <X size={14} />
        </button>
      </div>
    </>
  );
};

// Spotlight component with SVG mask
const TutorialSpotlight: React.FC<{ targetRect: DOMRect | null; padding: number }> = ({
  targetRect,
  padding,
}) => {
  if (!targetRect) return null;

  const x = targetRect.left - padding;
  const y = targetRect.top - padding;
  const width = targetRect.width + padding * 2;
  const height = targetRect.height + padding * 2;
  const radius = 12;

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={radius}
              ry={radius}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.5)"
          mask="url(#spotlight-mask)"
          className="backdrop-blur-[2px]"
        />
        {/* Pulse ring around target */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={radius}
          ry={radius}
          fill="none"
          stroke="rgba(0, 0, 0, 0.3)"
          strokeWidth="2"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
};

export default TutorialTooltip;
