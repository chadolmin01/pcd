'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { TutorialSection, TutorialStep, getStepsForSection } from './tutorialSteps';

const STORAGE_KEY = 'draft_tutorial_state';

interface TutorialState {
  isFirstTimeUser: boolean;
  hasSeenWelcome: boolean;
  completedSections: TutorialSection[];
  currentStep: number;
  activeSection: TutorialSection | null;
  isActive: boolean;
}

interface TutorialContextType extends TutorialState {
  // Actions
  showWelcome: () => void;
  hideWelcome: () => void;
  startTutorial: (section: TutorialSection) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  endTutorial: () => void;
  resetTutorial: () => void;
  markSectionComplete: (section: TutorialSection) => void;

  // Helpers
  getCurrentStep: () => TutorialStep | null;
  getTotalSteps: () => number;
  shouldShowTutorial: (section: TutorialSection) => boolean;
}

const defaultState: TutorialState = {
  isFirstTimeUser: true,
  hasSeenWelcome: false,
  completedSections: [],
  currentStep: 0,
  activeSection: null,
  isActive: false,
};

const TutorialContext = createContext<TutorialContextType | null>(null);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
};

// Safe hook that returns null if not in provider
export const useTutorialSafe = () => {
  return useContext(TutorialContext);
};

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const [state, setState] = useState<TutorialState>(defaultState);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          isFirstTimeUser: parsed.isFirstTimeUser ?? true,
          hasSeenWelcome: parsed.hasSeenWelcome ?? false,
          completedSections: parsed.completedSections ?? [],
        }));

        // Show welcome modal for first-time users
        if (!parsed.hasSeenWelcome) {
          setTimeout(() => setShowWelcomeModal(true), 500);
        }
      } else {
        // First time user - show welcome after short delay
        setTimeout(() => setShowWelcomeModal(true), 500);
      }
    } catch (e) {
      console.error('Failed to load tutorial state:', e);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        isFirstTimeUser: state.isFirstTimeUser,
        hasSeenWelcome: state.hasSeenWelcome,
        completedSections: state.completedSections,
      }));
    } catch (e) {
      console.error('Failed to save tutorial state:', e);
    }
  }, [state.isFirstTimeUser, state.hasSeenWelcome, state.completedSections]);

  const showWelcome = useCallback(() => {
    setShowWelcomeModal(true);
  }, []);

  const hideWelcome = useCallback(() => {
    setShowWelcomeModal(false);
    setState(prev => ({
      ...prev,
      hasSeenWelcome: true,
    }));
  }, []);

  const startTutorial = useCallback((section: TutorialSection) => {
    const steps = getStepsForSection(section);
    if (steps.length === 0) return;

    setState(prev => ({
      ...prev,
      activeSection: section,
      currentStep: 0,
      isActive: true,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      if (!prev.activeSection) return prev;

      const steps = getStepsForSection(prev.activeSection);
      const nextIndex = prev.currentStep + 1;

      if (nextIndex >= steps.length) {
        // Tutorial complete for this section
        return {
          ...prev,
          isActive: false,
          activeSection: null,
          currentStep: 0,
          completedSections: prev.completedSections.includes(prev.activeSection)
            ? prev.completedSections
            : [...prev.completedSections, prev.activeSection],
        };
      }

      return {
        ...prev,
        currentStep: nextIndex,
      };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  const skipTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      activeSection: null,
      currentStep: 0,
      hasSeenWelcome: true,
    }));
    setShowWelcomeModal(false);
  }, []);

  const endTutorial = useCallback(() => {
    setState(prev => {
      const completedSections = prev.activeSection && !prev.completedSections.includes(prev.activeSection)
        ? [...prev.completedSections, prev.activeSection]
        : prev.completedSections;

      return {
        ...prev,
        isActive: false,
        activeSection: null,
        currentStep: 0,
        completedSections,
      };
    });
  }, []);

  const resetTutorial = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
    setTimeout(() => setShowWelcomeModal(true), 300);
  }, []);

  const markSectionComplete = useCallback((section: TutorialSection) => {
    setState(prev => ({
      ...prev,
      completedSections: prev.completedSections.includes(section)
        ? prev.completedSections
        : [...prev.completedSections, section],
    }));
  }, []);

  const getCurrentStep = useCallback((): TutorialStep | null => {
    if (!state.activeSection || !state.isActive) return null;
    const steps = getStepsForSection(state.activeSection);
    return steps[state.currentStep] || null;
  }, [state.activeSection, state.currentStep, state.isActive]);

  const getTotalSteps = useCallback((): number => {
    if (!state.activeSection) return 0;
    return getStepsForSection(state.activeSection).length;
  }, [state.activeSection]);

  const shouldShowTutorial = useCallback((section: TutorialSection): boolean => {
    return !state.completedSections.includes(section);
  }, [state.completedSections]);

  const value: TutorialContextType = {
    ...state,
    isFirstTimeUser: state.isFirstTimeUser && showWelcomeModal,
    showWelcome,
    hideWelcome,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    endTutorial,
    resetTutorial,
    markSectionComplete,
    getCurrentStep,
    getTotalSteps,
    shouldShowTutorial,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};
