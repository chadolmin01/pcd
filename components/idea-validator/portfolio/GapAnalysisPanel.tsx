'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Target,
  Lightbulb,
} from 'lucide-react';
import type { IdeaVersion, GapAnalysis, ProgramEligibility } from '@/lib/portfolio/types';

interface GapAnalysisPanelProps {
  version: IdeaVersion | null;
  userId: string;
  onNewVersion: () => void;
}

export default function GapAnalysisPanel({
  version,
  userId,
  onNewVersion,
}: GapAnalysisPanelProps) {
  const [programs, setPrograms] = useState<ProgramEligibility[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Fetch programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoadingPrograms(true);
        const response = await fetch('/api/portfolio/programs');
        const data = await response.json();

        if (data.success) {
          setPrograms(data.data);
          // Auto-select first program or version's target program
          if (data.data.length > 0) {
            const targetId = version?.target_program_id || data.data[0].program_id;
            setSelectedProgramId(targetId);
          }
        }
      } catch (err) {
        console.error('Failed to fetch programs:', err);
      } finally {
        setLoadingPrograms(false);
      }
    };

    fetchPrograms();
  }, [version?.target_program_id]);

  // Fetch gap analysis when program is selected
  useEffect(() => {
    const fetchGapAnalysis = async () => {
      if (!version || !selectedProgramId) return;

      try {
        setLoading(true);
        const response = await fetch('/api/portfolio/gap-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({
            version_id: version.id,
            program_id: selectedProgramId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setGapAnalysis(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch gap analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGapAnalysis();
  }, [version, selectedProgramId, userId]);

  if (!version) {
    return (
      <div className="p-6 text-center">
        <p className="text-txt-tertiary">버전을 선택하면 Gap 분석을 볼 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h3 className="text-lg font-bold text-txt-primary mb-2">Gap 분석</h3>
      <p className="text-sm text-txt-tertiary mb-6">
        타겟 프로그램의 평가 기준과 현재 점수를 비교합니다
      </p>

      {/* Program Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-txt-secondary mb-2">
          타겟 프로그램 선택
        </label>
        {loadingPrograms ? (
          <div className="flex items-center gap-2 text-txt-tertiary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">프로그램 불러오는 중...</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {programs.map((program) => (
              <button
                key={program.program_id}
                onClick={() => setSelectedProgramId(program.program_id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedProgramId === program.program_id
                    ? 'bg-surface-inverse text-txt-inverse'
                    : 'bg-surface-sunken text-txt-secondary hover:bg-border'
                }`}
              >
                {program.program_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gap Analysis Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-txt-tertiary" />
        </div>
      ) : gapAnalysis ? (
        <div className="space-y-6">
          {/* Score Summary */}
          <div className="bg-surface-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-txt-primary">점수 요약</h4>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-txt-primary">
                    {gapAnalysis.currentTotalScore}
                  </p>
                  <p className="text-xs text-txt-tertiary">현재</p>
                </div>
                <ArrowRight className="w-5 h-5 text-txt-tertiary" />
                <div className="text-right">
                  <p className="text-2xl font-bold text-txt-primary">
                    {gapAnalysis.targetTotalScore}
                  </p>
                  <p className="text-xs text-txt-tertiary">목표</p>
                </div>
              </div>
            </div>

            {/* Overall Gap Bar */}
            <div className="h-3 bg-surface-sunken rounded-full overflow-hidden">
              <div
                className="h-full bg-surface-inverse rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (gapAnalysis.currentTotalScore / gapAnalysis.targetTotalScore) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-txt-tertiary mt-2">
              목표 대비{' '}
              <span className="font-bold text-txt-primary">
                {Math.round(
                  (gapAnalysis.currentTotalScore / gapAnalysis.targetTotalScore) * 100
                )}
                %
              </span>{' '}
              달성
            </p>
          </div>

          {/* Category Gaps */}
          <div className="bg-surface-card rounded-xl border border-border p-6">
            <h4 className="font-semibold text-txt-primary mb-4">
              카테고리별 Gap
            </h4>
            <div className="space-y-4">
              {gapAnalysis.gaps.map((gap) => {
                const percentage = gap.target > 0 ? (gap.current / gap.target) * 100 : 100;
                const isOk = gap.gap <= 0;
                const isCritical = gap.isBelowThreshold;

                return (
                  <div key={gap.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-txt-secondary">
                          {gap.categoryName}
                        </span>
                        {isCritical && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-surface-sunken text-status-danger-text text-[10px] font-bold rounded">
                            <AlertTriangle className="w-3 h-3" />
                            과락 위험
                          </span>
                        )}
                        {isOk && (
                          <CheckCircle className="w-4 h-4 text-status-success-text" />
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-txt-primary">
                          {gap.current}
                        </span>
                        <span className="text-txt-tertiary"> / {gap.target}</span>
                        {gap.gap > 0 && (
                          <span className="ml-2 text-status-danger-text font-medium">
                            -{gap.gap}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCritical
                            ? 'bg-border-strong'
                            : isOk
                            ? 'bg-txt-primary'
                            : 'bg-txt-tertiary'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                    {gap.recommendation && gap.gap > 0 && (
                      <p className="text-xs text-txt-tertiary mt-1">
                        {gap.recommendation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Recommendations */}
          {gapAnalysis.aiRecommendations.length > 0 && (
            <div className="bg-surface-sunken rounded-xl border border-border p-6">
              <h4 className="font-semibold text-txt-primary mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                AI 추천 개선 방향
              </h4>
              <ul className="space-y-3">
                {gapAnalysis.aiRecommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-txt-secondary"
                  >
                    <span className="w-5 h-5 rounded-full bg-border text-txt-secondary flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>

              <button
                onClick={onNewVersion}
                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface-inverse text-txt-inverse rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                <Target className="w-5 h-5" />
                이 분석 기반으로 새 버전 시작하기
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-txt-tertiary">
          프로그램을 선택하면 Gap 분석을 볼 수 있습니다.
        </div>
      )}
    </div>
  );
}
