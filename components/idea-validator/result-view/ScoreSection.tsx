'use client';

import React, { memo } from 'react';
import { Cpu, Paintbrush, DollarSign } from 'lucide-react';
import { Scorecard } from '../types';

interface ScoreBarProps {
  label: string;
  score: number;
  colorClass: string;
  icon: React.ReactNode;
}

export const ScoreBar = memo(({ label, score, colorClass, icon }: ScoreBarProps) => (
  <div className="mb-5">
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icon}
        {label}
      </div>
      <span className="text-sm font-bold text-gray-900">{score}</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-1000 ease-out ${colorClass}`}
        style={{ width: `${score}%` }}
      />
    </div>
  </div>
));
ScoreBar.displayName = 'ScoreBar';

interface PersonaScores {
  developer: number;
  designer: number;
  vc: number;
}

export function calculateValidationScores(
  scorecard: Scorecard | undefined,
  fallbackScores?: PersonaScores
): PersonaScores {
  if (!scorecard || scorecard.totalScore === 0) {
    return fallbackScores || { developer: 0, designer: 0, vc: 0 };
  }

  // Tech Feasibility: solution + feasibility + logicalConsistency (max: 15+15+15=45)
  const techScore = Math.round(
    ((scorecard.solution.current / 15) * 0.4 +
     (scorecard.feasibility.current / 15) * 0.4 +
     (scorecard.logicalConsistency.current / 15) * 0.2) * 100
  );

  // UX & Design: problemDefinition + solution + differentiation (max: 15+15+10=40)
  const uxScore = Math.round(
    ((scorecard.problemDefinition.current / 15) * 0.35 +
     (scorecard.solution.current / 15) * 0.35 +
     (scorecard.differentiation.current / 10) * 0.3) * 100
  );

  // Business Model: marketAnalysis + revenueModel + differentiation (max: 10+10+10=30)
  const bizScore = Math.round(
    ((scorecard.marketAnalysis.current / 10) * 0.35 +
     (scorecard.revenueModel.current / 10) * 0.35 +
     (scorecard.differentiation.current / 10) * 0.3) * 100
  );

  return {
    developer: Math.min(100, techScore),
    designer: Math.min(100, uxScore),
    vc: Math.min(100, bizScore)
  };
}

interface ValidationScoresCardProps {
  scorecard?: Scorecard;
  fallbackScores?: PersonaScores;
}

export const ValidationScoresCard = memo(({ scorecard, fallbackScores }: ValidationScoresCardProps) => {
  const scores = calculateValidationScores(scorecard, fallbackScores);

  return (
    <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Validation Scores</h3>

      <ScoreBar
        label="Tech Feasibility"
        score={scores.developer}
        colorClass="bg-indigo-500"
        icon={<Cpu size={16} className="text-indigo-500" />}
      />

      <ScoreBar
        label="UX & Design"
        score={scores.designer}
        colorClass="bg-pink-500"
        icon={<Paintbrush size={16} className="text-pink-500" />}
      />

      <ScoreBar
        label="Business Model"
        score={scores.vc}
        colorClass="bg-emerald-500"
        icon={<DollarSign size={16} className="text-emerald-500" />}
      />
    </div>
  );
});
ValidationScoresCard.displayName = 'ValidationScoresCard';
