'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useTutorialSafe } from './TutorialContext';

interface TutorialHelpButtonProps {
  className?: string;
}

const TutorialHelpButton: React.FC<TutorialHelpButtonProps> = ({ className = '' }) => {
  const tutorial = useTutorialSafe();

  if (!tutorial) return null;

  const handleClick = () => {
    tutorial.resetTutorial();
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-sm transition-colors ${className}`}
      title="튜토리얼 다시 보기"
    >
      <HelpCircle size={14} />
      <span className="text-xs font-medium">가이드</span>
    </button>
  );
};

export default TutorialHelpButton;
