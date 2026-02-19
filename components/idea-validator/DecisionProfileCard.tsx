'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, User, Cpu, Paintbrush, DollarSign, Zap, Target, Brain, RefreshCw, ChevronRight } from 'lucide-react';
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
}

const DecisionProfileCard: React.FC<DecisionProfileCardProps> = ({ className = '', compact = false, onRefresh }) => {
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);
  const [founderTypeId, setFounderTypeId] = useState<FounderTypeId | null>(null);
  const [showFullCard, setShowFullCard] = useState(false);

  const loadAnalysis = () => {
    const data = analyzeDecisions();

    // 프로필이 없거나 데이터가 변경되었으면 새로 생성
    if (data.records.length > 0 && (!data.profile || data.records.length > (data.profile as any)?.recordsCount)) {
      const newProfile = generateSimpleProfile(data.axisScores, data.behaviorPattern);
      saveFounderProfile(newProfile);
      data.profile = newProfile;
    }

    // 창업자 유형 결정
    if (data.records.length >= 3) {
      const typeId = determineFounderType(data.axisScores);
      setFounderTypeId(typeId);
    }

    setAnalysis(data);
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  const handleRefresh = () => {
    loadAnalysis();
    onRefresh?.();
  };

  if (!analysis || analysis.behaviorPattern.totalDecisions === 0) {
    return null;
  }

  const { axisScores, behaviorPattern, profile } = analysis;

  // 축 라벨 (양쪽 끝)
  const axisLabels: Record<keyof AxisScores, [string, string]> = {
    speedVsQuality: ['완성도', '실행속도'],
    marketVsProduct: ['제품지향', '시장지향'],
    receptiveVsIndependent: ['독립형', '수용형'],
    techVsBusiness: ['비즈니스', '기술중심'],
    riskSeekingVsAvoiding: ['안정형', '도전형'],
  };

  // 축 값을 0~100 퍼센트로 변환
  const axisToPercent = (value: number) => Math.round((value + 1) * 50);

  // 유형이 결정되면 유형 정보 표시
  const founderType = founderTypeId ? getFounderType(founderTypeId) : null;

  if (compact) {
    return (
      <>
        <div className={`bg-white border border-gray-200 rounded-sm p-4 ${className}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-gray-500" />
              <span className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest">
                창업자 유형
              </span>
            </div>
            <button onClick={handleRefresh} className="p-1 text-gray-400 hover:text-gray-600">
              <RefreshCw size={12} />
            </button>
          </div>

          {/* 유형 카드 미니 버전 */}
          {founderType ? (
            <button
              onClick={() => setShowFullCard(true)}
              className="w-full text-left mb-3 p-3 rounded-sm border transition-all hover:shadow-sm"
              style={{ backgroundColor: founderType.bgColor, borderColor: founderType.color }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{founderType.emoji}</span>
                <span className="font-bold text-sm text-gray-900">{founderType.name}</span>
                <ChevronRight size={14} className="ml-auto text-gray-400" />
              </div>
              <div className="text-[10px] text-gray-600 italic">"{founderType.taglineKo}"</div>
            </button>
          ) : profile ? (
            <div className="mb-3">
              <div className="font-bold text-xs text-gray-900 mb-1">{profile.founderType}</div>
              <div className="flex flex-wrap gap-1">
                {profile.matchingTags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 mb-3">
              더 많은 결정을 내리면 유형이 분석됩니다
            </div>
          )}

          {/* 주요 축 미니 차트 */}
          <div className="space-y-2">
            {(['speedVsQuality', 'techVsBusiness'] as const).map(axis => (
              <div key={axis}>
                <div className="flex justify-between text-[9px] text-gray-400 mb-0.5">
                  <span>{axisLabels[axis][0]}</span>
                  <span>{axisLabels[axis][1]}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full relative">
                  <div
                    className="absolute top-0 bottom-0 w-2 bg-black rounded-full transition-all"
                    style={{ left: `calc(${axisToPercent(axisScores[axis])}% - 4px)` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400">
            {behaviorPattern.totalDecisions}개 결정 · {behaviorPattern.sessionsCount}개 세션
          </div>
        </div>

        {/* 전체 카드 모달 */}
        {showFullCard && founderTypeId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="relative">
              <button
                onClick={() => setShowFullCard(false)}
                className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-900"
              >
                ×
              </button>
              <FounderTypeCard typeId={founderTypeId} axes={axisScores} showActions={true} />
            </div>
          </div>
        )}
      </>
    );
  }

  // Full version
  return (
    <div className={`bg-white border border-gray-200 rounded-sm p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-gray-900" />
          <h3 className="font-bold text-sm text-gray-900">창업자 성향 분석</h3>
        </div>
        <button onClick={handleRefresh} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Profile Type */}
      {profile && (
        <div className="mb-5 p-4 bg-gray-50 rounded-sm border border-gray-100">
          <div className="font-bold text-gray-900 mb-2">{profile.founderType}</div>
          <div className="flex flex-wrap gap-1.5">
            {profile.matchingTags.map((tag, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 text-gray-700 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5축 차트 */}
      <div className="mb-5">
        <div className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest mb-3">
          5축 성향 분석
        </div>
        <div className="space-y-3">
          {(Object.keys(axisLabels) as (keyof AxisScores)[]).map(axis => (
            <div key={axis}>
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>{axisLabels[axis][0]}</span>
                <span>{axisLabels[axis][1]}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full relative">
                <div
                  className="absolute top-0 bottom-0 w-3 bg-black rounded-full transition-all shadow-sm"
                  style={{ left: `calc(${axisToPercent(axisScores[axis])}% - 6px)` }}
                />
                {/* 중앙선 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 행동 패턴 */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="p-2 bg-gray-50 rounded-sm text-center">
          <div className="text-lg font-bold text-gray-900">
            {Math.round(behaviorPattern.avgResponseTimeSec)}s
          </div>
          <div className="text-[9px] text-gray-500">평균 응답</div>
        </div>
        <div className="p-2 bg-gray-50 rounded-sm text-center">
          <div className="text-lg font-bold text-gray-900">
            {Math.round(behaviorPattern.customInputRatio * 100)}%
          </div>
          <div className="text-[9px] text-gray-500">직접 입력</div>
        </div>
        <div className="p-2 bg-gray-50 rounded-sm text-center">
          <div className="text-lg font-bold text-gray-900">
            {behaviorPattern.totalDecisions}
          </div>
          <div className="text-[9px] text-gray-500">총 결정</div>
        </div>
      </div>

      {/* 강점 & 약점 */}
      {profile && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-[9px] font-bold font-mono text-green-600 uppercase tracking-widest mb-2">
              강점
            </div>
            <ul className="space-y-1">
              {profile.strengths.map((s, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[9px] font-bold font-mono text-orange-600 uppercase tracking-widest mb-2">
              보완점
            </div>
            <ul className="space-y-1">
              {profile.blindSpots.map((b, idx) => (
                <li key={idx} className="text-xs text-gray-700 flex items-start gap-1.5">
                  <span className="text-orange-500 mt-0.5">!</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 이상적인 공동 창업자 */}
      {profile && (
        <div className="p-3 bg-blue-50 rounded-sm border border-blue-100">
          <div className="text-[9px] font-bold font-mono text-blue-600 uppercase tracking-widest mb-1">
            이상적인 공동 창업자
          </div>
          <div className="text-xs text-blue-900">{profile.idealCofounder}</div>
        </div>
      )}
    </div>
  );
};

export default DecisionProfileCard;
