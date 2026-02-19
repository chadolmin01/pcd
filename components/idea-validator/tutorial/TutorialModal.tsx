'use client';

import React from 'react';
import { useTutorial } from './TutorialContext';
import { welcomeContent } from './tutorialSteps';

const TutorialModal: React.FC = () => {
  const { isFirstTimeUser, hideWelcome, skipTutorial, startTutorial } = useTutorial();

  if (!isFirstTimeUser) return null;

  const handleStartGuide = () => {
    hideWelcome();
    // Start with level selection tutorial
    setTimeout(() => startTutorial('level-selection'), 300);
  };

  const handleSkip = () => {
    skipTutorial();
  };

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-sm shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-black text-white px-2 py-1 font-mono font-bold text-sm rounded-sm">D</div>
            <h2 className="font-bold text-lg text-gray-900">{welcomeContent.title}</h2>
          </div>
          <p className="text-sm text-gray-500">{welcomeContent.subtitle}</p>
        </div>

        {/* Steps */}
        <div className="px-6 py-5 space-y-3">
          {welcomeContent.steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-3 bg-gray-50 rounded-sm border border-gray-100"
            >
              <div className="w-7 h-7 bg-black text-white rounded-sm flex items-center justify-center font-bold text-xs shrink-0">
                {step.icon}
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900">{step.label}</div>
                <div className="text-xs text-gray-500">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            건너뛰기
          </button>
          <button
            onClick={handleStartGuide}
            className="bg-black text-white px-5 py-2.5 rounded-sm font-bold text-sm hover:bg-gray-800 transition-colors"
          >
            가이드 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
