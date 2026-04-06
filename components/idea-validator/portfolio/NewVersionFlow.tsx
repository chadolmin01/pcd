'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  Loader2,
  Sparkles,
  Target,
} from 'lucide-react';
import type { ProgramEligibility, GapAnalysis, IdeaVersion } from '@/lib/portfolio/types';

interface NewVersionFlowProps {
  ideaId: string;
  userId: string;
  forkFromVersion?: IdeaVersion | null;
  onComplete: (versionId: string, targetProgramId: string) => void;
  onCancel: () => void;
}

export default function NewVersionFlow({
  ideaId,
  userId,
  forkFromVersion,
  onComplete,
  onCancel,
}: NewVersionFlowProps) {
  const [step, setStep] = useState(1);
  const [programs, setPrograms] = useState<ProgramEligibility[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [applyAiRecommendations, setApplyAiRecommendations] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingGap, setLoadingGap] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/portfolio/programs');
        const data = await response.json();

        if (data.success) {
          setPrograms(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch programs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  // Fetch gap analysis when program is selected and we have a fork source
  useEffect(() => {
    const fetchGapAnalysis = async () => {
      if (!selectedProgramId || !forkFromVersion) return;

      try {
        setLoadingGap(true);
        const response = await fetch('/api/portfolio/gap-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({
            version_id: forkFromVersion.id,
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
        setLoadingGap(false);
      }
    };

    fetchGapAnalysis();
  }, [selectedProgramId, forkFromVersion, userId]);

  // Create new version
  const handleCreate = async () => {
    if (!selectedProgramId) return;

    try {
      setCreating(true);

      const selectedProgram = programs.find((p) => p.program_id === selectedProgramId);
      const versionName = `${selectedProgram?.program_name || '새 버전'} ${new Date().toLocaleDateString('ko-KR')}`;

      const requestBody = forkFromVersion
        ? {
            fork_from: forkFromVersion.id,
            version_name: versionName,
            target_program_id: selectedProgramId,
            target_program_name: selectedProgram?.program_name,
          }
        : {
            version_name: versionName,
            target_program_id: selectedProgramId,
            target_program_name: selectedProgram?.program_name,
            status: 'draft',
          };

      const response = await fetch(`/api/portfolio/${ideaId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        onComplete(data.data.id, selectedProgramId);
      } else {
        throw new Error(data.error || 'Failed to create version');
      }
    } catch (err) {
      console.error('Failed to create version:', err);
      alert('버전 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setCreating(false);
    }
  };

  const selectedProgram = programs.find((p) => p.program_id === selectedProgramId);

  return (
    <div className="h-full overflow-y-auto bg-surface-sunken">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-txt-secondary hover:text-txt-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            취소
          </button>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 1 ? 'bg-surface-inverse text-txt-inverse' : 'bg-border text-txt-tertiary'
              }`}
            >
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className="w-8 h-0.5 bg-border">
              <div
                className={`h-full bg-surface-inverse transition-all ${
                  step >= 2 ? 'w-full' : 'w-0'
                }`}
              />
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 2 ? 'bg-surface-inverse text-txt-inverse' : 'bg-border text-txt-tertiary'
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* Step 1: Program Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-txt-primary mb-2">
              타겟 대회 선택
            </h2>
            <p className="text-txt-tertiary mb-6">
              어떤 지원사업/대회를 목표로 준비하시나요?
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-txt-tertiary" />
              </div>
            ) : (
              <div className="space-y-3">
                {programs.map((program) => {
                  const isSelected = selectedProgramId === program.program_id;

                  return (
                    <button
                      key={program.program_id}
                      onClick={() => setSelectedProgramId(program.program_id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-border-strong bg-surface-sunken'
                          : 'border-border bg-surface-card hover:border-border-strong'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-txt-primary">
                            {program.program_name}
                          </h3>
                          {program.max_company_age_months && (
                            <p className="text-xs text-txt-tertiary mt-1">
                              {program.requires_incorporation
                                ? `법인 설립 후 ${program.max_company_age_months}개월 이내`
                                : '예비창업자 가능'}
                            </p>
                          )}
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-surface-inverse bg-surface-inverse'
                              : 'border-border-strong'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Custom Option */}
                <button
                  onClick={() => setSelectedProgramId('custom')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedProgramId === 'custom'
                      ? 'border-border-strong bg-surface-sunken'
                      : 'border-border bg-surface-card hover:border-border-strong border-dashed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-txt-primary">
                        기타 (직접 입력)
                      </h3>
                      <p className="text-xs text-txt-tertiary mt-1">
                        다른 대회나 목적을 위한 검증
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedProgramId === 'custom'
                          ? 'border-border-strong bg-surface-inverse'
                          : 'border-border'
                      }`}
                    >
                      {selectedProgramId === 'custom' && (
                        <Check className="w-4 h-4 text-txt-inverse" />
                      )}
                    </div>
                  </div>
                </button>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!selectedProgramId}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface-inverse text-txt-inverse rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              다음
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: AI Recommendations */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-txt-primary mb-2">
              AI 추천 반영
            </h2>
            <p className="text-txt-tertiary mb-6">
              이전 검증 결과를 바탕으로 개선 방향을 제안합니다
            </p>

            {forkFromVersion && loadingGap ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-txt-tertiary" />
              </div>
            ) : forkFromVersion && gapAnalysis ? (
              <div className="space-y-4">
                {/* Gap Summary */}
                <div className="bg-surface-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-txt-secondary">현재 점수</span>
                    <span className="font-bold text-txt-primary">
                      {gapAnalysis.currentTotalScore}점
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-txt-secondary">목표 점수</span>
                    <span className="font-bold text-txt-primary">
                      {gapAnalysis.targetTotalScore}점
                    </span>
                  </div>
                  <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                    <div
                      className="h-full bg-surface-inverse rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (gapAnalysis.currentTotalScore / gapAnalysis.targetTotalScore) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* AI Recommendations Toggle */}
                <button
                  onClick={() => setApplyAiRecommendations(!applyAiRecommendations)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    applyAiRecommendations
                      ? 'border-border-strong bg-surface-sunken'
                      : 'border-border bg-surface-card'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        applyAiRecommendations
                          ? 'border-surface-inverse bg-surface-inverse'
                          : 'border-border-strong'
                      }`}
                    >
                      {applyAiRecommendations && (
                        <Check className="w-4 h-4 text-txt-inverse" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-txt-secondary" />
                        <span className="font-semibold text-txt-primary">
                          AI Gap 분석 결과 반영
                        </span>
                      </div>
                      {gapAnalysis.aiRecommendations.length > 0 && (
                        <ul className="space-y-1 mt-2">
                          {gapAnalysis.aiRecommendations.slice(0, 3).map((rec, i) => (
                            <li
                              key={i}
                              className="text-sm text-txt-secondary flex items-start gap-2"
                            >
                              <span className="text-txt-tertiary shrink-0">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </button>

                {/* Critical Gaps Warning */}
                {gapAnalysis.gaps.some((g) => g.isBelowThreshold) && (
                  <div className="flex items-start gap-3 p-4 bg-surface-sunken border border-border rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-status-warning-text shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-txt-primary">
                        과락 위험 카테고리 발견
                      </p>
                      <p className="text-xs text-txt-secondary mt-1">
                        {gapAnalysis.gaps
                          .filter((g) => g.isBelowThreshold)
                          .map((g) => g.categoryName)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-surface-sunken rounded-xl border border-border p-6 text-center">
                <Target className="w-8 h-8 text-txt-tertiary mx-auto mb-3" />
                <p className="text-txt-secondary">
                  새로운 검증을 시작합니다.
                  <br />
                  <span className="text-sm text-txt-tertiary">
                    {selectedProgram?.program_name} 평가 기준에 맞춰 검증합니다.
                  </span>
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 border border-border text-txt-secondary rounded-xl hover:bg-surface-sunken transition-colors font-medium"
              >
                이전
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface-inverse text-txt-inverse rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    검증 시작
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
