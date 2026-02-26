'use client';

import React, { memo, useMemo } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import {
  Scorecard,
  CategoryUpdate,
  ScorecardCategory,
  SCORECARD_CATEGORIES,
  checkLevelEligibility,
  LEVEL_REQUIREMENTS,
} from './types';

interface ScorecardPanelProps {
  scorecard: Scorecard;
  recentUpdates: CategoryUpdate[];
  targetLevel: 'sketch' | 'mvp' | 'defense';
  className?: string;
}

// 개별 카테고리 바 컴포넌트
const CategoryBar = memo(({
  category,
  score,
  isFailing,
  minimumRequired,
}: {
  category: ScorecardCategory;
  score: { current: number; max: number; filled: boolean };
  isFailing: boolean;
  minimumRequired?: number;
}) => {
  const info = SCORECARD_CATEGORIES[category];
  const percentage = (score.current / score.max) * 100;

  return (
    <div className={`flex items-center gap-3 py-2 ${isFailing ? 'text-red-600' : ''}`}>
      {/* 채움 상태 표시 */}
      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
        score.filled
          ? 'bg-gray-900 border-gray-900'
          : isFailing
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300'
      }`}>
        {score.filled && <Check size={10} className="text-white" />}
      </div>

      {/* 카테고리명 */}
      <span className={`text-xs w-20 shrink-0 ${
        isFailing ? 'font-bold text-red-600' : 'text-gray-600'
      }`}>
        {info.nameKo}
      </span>

      {/* 프로그레스 바 */}
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isFailing ? 'bg-red-500' : 'bg-gray-900'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* 점수 */}
      <span className={`text-xs font-mono w-12 text-right ${
        isFailing ? 'text-red-600 font-bold' : 'text-gray-500'
      }`}>
        {score.current}/{score.max}
      </span>

      {/* 과락 경고 */}
      {isFailing && minimumRequired !== undefined && (
        <AlertCircle size={12} className="text-red-500 shrink-0" />
      )}
    </div>
  );
});
CategoryBar.displayName = 'CategoryBar';

// 최근 업데이트 아이템
const UpdateItem = memo(({ update }: { update: CategoryUpdate }) => {
  const info = SCORECARD_CATEGORIES[update.category];
  if (!info) return null; // 유효하지 않은 카테고리 무시
  return (
    <div className="flex items-center gap-2 text-xs text-gray-600 py-1">
      <span className="text-green-600 font-bold">+{update.delta}</span>
      <span className="text-gray-900">{info.nameKo}</span>
    </div>
  );
});
UpdateItem.displayName = 'UpdateItem';

const ScorecardPanel: React.FC<ScorecardPanelProps> = ({
  scorecard,
  recentUpdates,
  targetLevel,
  className = '',
}) => {
  // 레벨 달성 여부 체크
  const eligibility = useMemo(
    () => checkLevelEligibility(scorecard, targetLevel),
    [scorecard, targetLevel]
  );

  // 다음 목표까지 남은 점수
  const requirement = LEVEL_REQUIREMENTS[targetLevel];
  const pointsToGoal = Math.max(0, requirement.totalScore - scorecard.totalScore);

  // 레벨 이름 한글화
  const levelNames: Record<string, string> = {
    sketch: 'Sketch',
    mvp: 'MVP',
    defense: 'Defense',
  };

  const categories: ScorecardCategory[] = [
    'problemDefinition',
    'solution',
    'marketAnalysis',
    'revenueModel',
    'differentiation',
    'logicalConsistency',
    'feasibility',
    'feedbackReflection',
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded ${className}`}>
      {/* 헤더 - 총점 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest">
            SCORE
          </span>
          <span className="text-xl font-bold font-mono text-gray-900">
            {scorecard.totalScore}/100
          </span>
        </div>

        {/* 전체 프로그레스 바 */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${scorecard.totalScore}%` }}
          />
        </div>

        {/* 목표까지 */}
        {pointsToGoal > 0 ? (
          <p className="text-xs text-gray-500">
            {levelNames[targetLevel]} 등록까지{' '}
            <span className="font-bold text-gray-900">{pointsToGoal}점</span>
          </p>
        ) : eligibility.eligible ? (
          <p className="text-xs text-green-600 font-bold">
            {levelNames[targetLevel]} 등록 가능
          </p>
        ) : (
          <p className="text-xs text-amber-600">
            총점 달성, 과락 항목 해소 필요
          </p>
        )}
      </div>

      {/* 레벨 조건 표시 (총점 달성했지만 과락이 있는 경우) */}
      {eligibility.totalPassed && eligibility.failingCategories.length > 0 && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-100">
          <p className="text-[10px] font-bold text-red-700 mb-2">
            {levelNames[targetLevel]} 등록 조건:
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <Check size={12} className="text-green-600" />
              <span className="text-gray-600">총점 {requirement.totalScore}점 이상</span>
            </div>
            {eligibility.failingCategories.map((cat) => {
              const min = requirement.minimumPerCategory[cat];
              const current = scorecard[cat].current;
              return (
                <div key={cat} className="flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle size={12} />
                  <span>
                    {SCORECARD_CATEGORIES[cat].nameKo} {min}점+ (현재 {current}점)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 카테고리별 점수 */}
      <div className="p-4 border-b border-gray-100">
        {categories.map((cat) => (
          <CategoryBar
            key={cat}
            category={cat}
            score={scorecard[cat]}
            isFailing={eligibility.failingCategories.includes(cat)}
            minimumRequired={requirement.minimumPerCategory[cat]}
          />
        ))}
      </div>

      {/* 최근 업데이트 */}
      {recentUpdates.length > 0 && (
        <div className="p-4">
          <span className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest block mb-2">
            RECENT
          </span>
          <div className="space-y-1">
            {recentUpdates.slice(0, 5).map((update, idx) => (
              <UpdateItem key={`${update.category}-${idx}`} update={update} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ScorecardPanel);
