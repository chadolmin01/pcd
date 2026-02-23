'use client';

import React, { useEffect, useState } from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';
import {
  analyzeDecisions,
  DecisionAnalysis,
  generateSimpleProfile,
  saveFounderProfile,
  AxisScores,
} from './decisionAnalyzer';
import { determineFounderType, getFounderType, FounderTypeId } from './founderTypes';
import FounderTypeCard from './FounderTypeCard';

interface DecisionProfileCardProps {
  className?: string;
  compact?: boolean;
  onRefresh?: () => void;
  refreshTrigger?: number; // 외부에서 갱신 트리거
}

const DecisionProfileCard: React.FC<DecisionProfileCardProps> = ({ className = '', compact = false, onRefresh, refreshTrigger = 0 }) => {
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);
  const [founderTypeId, setFounderTypeId] = useState<FounderTypeId | null>(null);
  const [showFullCard, setShowFullCard] = useState(false);

  const loadAnalysis = () => {
    const data = analyzeDecisions();

    if (data.records.length > 0 && (!data.profile || data.records.length > (data.profile.recordsCount ?? 0))) {
      const newProfile = generateSimpleProfile(data.axisScores, data.behaviorPattern);
      newProfile.recordsCount = data.records.length;
      saveFounderProfile(newProfile);
      data.profile = newProfile;
    }

    if (data.records.length >= 3) {
      const typeId = determineFounderType(data.axisScores);
      setFounderTypeId(typeId);
    }

    setAnalysis(data);
  };

  // 초기 로드 + refreshTrigger 변경 시 갱신
  useEffect(() => {
    loadAnalysis();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    loadAnalysis();
    onRefresh?.();
  };

  if (!analysis || analysis.behaviorPattern.totalDecisions === 0) {
    return null;
  }

  const { axisScores, behaviorPattern, profile } = analysis;

  const axisLabels: Record<keyof AxisScores, [string, string]> = {
    speedVsQuality: ['완성도', '실행속도'],
    marketVsProduct: ['제품지향', '시장지향'],
    receptiveVsIndependent: ['독립형', '수용형'],
    techVsBusiness: ['비즈니스', '기술중심'],
    riskSeekingVsAvoiding: ['안정형', '도전형'],
  };

  const axisToPercent = (value: number) => Math.round((value + 1) * 50);

  const founderType = founderTypeId ? getFounderType(founderTypeId) : null;

  if (compact) {
    return (
      <>
        <div className={`border border-gray-200 rounded ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest">
              Founder Profile
            </span>
            <button onClick={handleRefresh} className="p-1 text-gray-300 hover:text-gray-600 transition-colors">
              <RefreshCw size={10} />
            </button>
          </div>

          {/* Type Card */}
          <div className="p-4">
            {founderType ? (
              <button
                onClick={() => setShowFullCard(true)}
                className="w-full text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center text-lg"
                    style={{ backgroundColor: founderType.bgColor }}
                  >
                    {founderType.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900 truncate">{founderType.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{founderType.taglineKo}</div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
                </div>
              </button>
            ) : profile ? (
              <div className="mb-3">
                <div className="font-bold text-sm text-gray-900 mb-2">{profile.founderType}</div>
                <div className="flex flex-wrap gap-1">
                  {profile.matchingTags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-[9px] text-gray-400 font-mono">#{tag}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 py-2">
                더 많은 결정을 내리면 분석됩니다
              </div>
            )}

            {/* Axis Preview - 2개만 간결하게 */}
            <div className="space-y-3 mt-4">
              {(['speedVsQuality', 'techVsBusiness'] as const).map(axis => (
                <div key={axis}>
                  <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                    <span>{axisLabels[axis][0]}</span>
                    <span>{axisLabels[axis][1]}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full relative">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rounded-full transition-all"
                      style={{ left: `calc(${axisToPercent(axisScores[axis])}% - 4px)` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{behaviorPattern.totalDecisions}개 결정</span>
              <span>{behaviorPattern.sessionsCount}개 세션</span>
            </div>
          </div>
        </div>

        {/* Full Card Modal */}
        {showFullCard && founderTypeId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative">
              <button
                onClick={() => setShowFullCard(false)}
                className="absolute -top-3 -right-3 z-10 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors border border-gray-200"
              >
                <span className="text-sm">×</span>
              </button>
              <FounderTypeCard typeId={founderTypeId} axes={axisScores} showActions={true} />
            </div>
          </div>
        )}
      </>
    );
  }

  // Full version (non-compact)
  return (
    <div className={`border border-gray-200 rounded overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-sm text-gray-900">창업자 성향 분석</h3>
        <button onClick={handleRefresh} className="p-1.5 text-gray-300 hover:text-gray-600 transition-colors">
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Profile Type */}
        {profile && (
          <div>
            <div className="font-bold text-gray-900 mb-2">{profile.founderType}</div>
            <div className="flex flex-wrap gap-2">
              {profile.matchingTags.map((tag, idx) => (
                <span key={idx} className="text-[10px] text-gray-500 font-mono">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 5-Axis Chart */}
        <div>
          <div className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest mb-4">
            5축 성향
          </div>
          <div className="space-y-4">
            {(Object.keys(axisLabels) as (keyof AxisScores)[]).map(axis => (
              <div key={axis}>
                <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
                  <span>{axisLabels[axis][0]}</span>
                  <span>{axisLabels[axis][1]}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full relative">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-gray-900 rounded-full transition-all"
                    style={{ left: `calc(${axisToPercent(axisScores[axis])}% - 5px)` }}
                  />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Behavior Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {Math.round(behaviorPattern.avgResponseTimeSec)}s
            </div>
            <div className="text-[9px] text-gray-400 mt-1">평균 응답</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {Math.round(behaviorPattern.customInputRatio * 100)}%
            </div>
            <div className="text-[9px] text-gray-400 mt-1">직접 입력</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {behaviorPattern.totalDecisions}
            </div>
            <div className="text-[9px] text-gray-400 mt-1">총 결정</div>
          </div>
        </div>

        {/* Strengths & Blind Spots */}
        {profile && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[9px] font-bold font-mono text-green-500 uppercase tracking-widest mb-3">
                강점
              </div>
              <div className="space-y-2">
                {profile.strengths.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="text-green-500 font-bold">+</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold font-mono text-amber-500 uppercase tracking-widest mb-3">
                보완점
              </div>
              <div className="space-y-2">
                {profile.blindSpots.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="text-amber-500 font-bold">!</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ideal Co-founder */}
        {profile && (
          <div className="pt-4 border-t border-gray-100">
            <div className="text-[9px] font-bold font-mono text-blue-500 uppercase tracking-widest mb-2">
              이상적인 공동 창업자
            </div>
            <div className="text-sm text-gray-700">{profile.idealCofounder}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DecisionProfileCard;
