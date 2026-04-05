'use client';

import React, { useState } from 'react';
import OnboardingScreen from './OnboardingScreen';
import { AppState, OnboardingData } from './types';
import { toast } from 'sonner';
import { WorkflowContainer } from './workflow';

interface IdeaValidatorProps {
  onClose?: () => void;
  onComplete?: (result: { id: string; projectIdea: string }) => void;
  embedded?: boolean; // When true, hides the top nav (used in Chat.tsx)
}

const IdeaValidator: React.FC<IdeaValidatorProps> = ({ onClose, onComplete, embedded = false }) => {
  const [view, setView] = useState<AppState>(AppState.WORKFLOW);
  const [userData, setUserData] = useState<OnboardingData | null>({
    id: 'cohort-user',
    name: '참여자',
    email: '',
    organization: '',
    privacyConsent: true,
  });

  const handleOnboardingComplete = (data: OnboardingData) => {
    setUserData(data);
    setView(AppState.WORKFLOW);
    toast.success(`${data.name}님, 환영합니다!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('prd_demo_session');
    setUserData(null);
    setView(AppState.ONBOARDING);
    toast.info('로그아웃 되었습니다');
  };

  const renderView = () => {
    switch (view) {
      case AppState.ONBOARDING:
        return (
          <div className="h-full w-full animate-in fade-in duration-500">
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          </div>
        );
      case AppState.WORKFLOW:
        return userData ? (
          <WorkflowContainer
            userData={{
              id: userData.id,
              name: userData.name,
              email: userData.email,
              organization: userData.organization,
            }}
            onBack={handleLogout}
            onComplete={() => {
              toast.success('완료되었습니다!');
              if (onComplete) {
                onComplete({ id: '', projectIdea: '' });
              }
            }}
          />
        ) : null;
      default:
        return (
          <div className="h-full w-full animate-in fade-in duration-500">
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col font-sans text-draft-black selection:bg-blue-100 selection:text-blue-900 bg-white overflow-hidden">
      {/* Top Navigation Bar - Hidden when embedded or on onboarding screen or in workflow */}
      {!embedded && view !== AppState.ONBOARDING && view !== AppState.WORKFLOW && (
        <nav className="w-full h-12 border-b border-gray-200 bg-white flex shrink-0 items-center justify-between px-4 z-50">
          <div className="flex items-center cursor-pointer gap-2" onClick={() => setView(AppState.WORKFLOW)}>
            <div className="bg-draft-black text-white px-1.5 py-0.5 font-mono font-bold text-sm rounded-sm">D</div>
            <span className="text-base font-bold tracking-tight">Draft.</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-[10px] font-mono text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span>SYSTEM OPERATIONAL</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-sm hover:bg-gray-100 transition-colors text-gray-500"
              >
                ✕
              </button>
            )}
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
};

export default IdeaValidator;
