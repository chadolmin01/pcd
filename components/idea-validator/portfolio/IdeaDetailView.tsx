'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  History,
  BarChart3,
  FileText,
  Calendar,
} from 'lucide-react';
import type {
  IdeaDetailWithVersions,
  IdeaVersion,
  IdeaDetailTab,
} from '@/lib/portfolio/types';
import {
  VERSION_STATUS_ICONS,
  VERSION_STATUS_LABELS,
  SCORECARD_CATEGORY_NAMES,
  getScoreColor,
  getScoreBgColor,
} from '@/lib/portfolio';
import VersionTimeline from './VersionTimeline';
import GapAnalysisPanel from './GapAnalysisPanel';
import SubmissionHistory from './SubmissionHistory';

interface IdeaDetailViewProps {
  ideaId: string;
  userId: string;
  onBack: () => void;
  onNewVersion: (ideaId: string, forkFromVersionId?: string) => void;
  onContinueValidation: (versionId: string) => void;
}

export default function IdeaDetailView({
  ideaId,
  userId,
  onBack,
  onNewVersion,
  onContinueValidation,
}: IdeaDetailViewProps) {
  const [idea, setIdea] = useState<IdeaDetailWithVersions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<IdeaDetailTab>('current');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Fetch idea details
  useEffect(() => {
    const fetchIdea = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/portfolio/${ideaId}`, {
          headers: {
            'x-user-id': userId,
          },
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch idea');
        }

        setIdea(data.data);

        // Select latest version by default
        if (data.data.versions?.length > 0) {
          setSelectedVersionId(data.data.versions[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load idea');
      } finally {
        setLoading(false);
      }
    };

    if (ideaId && userId) {
      fetchIdea();
    }
  }, [ideaId, userId]);

  // Get selected version
  const selectedVersion = useMemo(() => {
    if (!idea || !selectedVersionId) return null;
    return idea.versions.find((v) => v.id === selectedVersionId) || null;
  }, [idea, selectedVersionId]);

  // Get latest version
  const latestVersion = useMemo(() => {
    if (!idea || idea.versions.length === 0) return null;
    return idea.versions[0];
  }, [idea]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-txt-tertiary mx-auto mb-3" />
          <p className="text-sm text-txt-tertiary">아이디어 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-status-danger-text mx-auto mb-3" />
          <p className="text-sm text-status-danger-text mb-4">{error || 'Idea not found'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-surface-sunken text-txt-secondary rounded-lg text-sm hover:bg-border transition-colors"
          >
            포트폴리오로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: IdeaDetailTab; label: string; icon: React.ReactNode }> = [
    { id: 'current', label: '현재 상태', icon: <FileText className="w-4 h-4" /> },
    { id: 'history', label: '히스토리', icon: <History className="w-4 h-4" /> },
    { id: 'analysis', label: '분석', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="h-full flex flex-col bg-surface-sunken">
      {/* Header */}
      <div className="bg-surface-card border-b border-border px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-txt-tertiary mb-3">
          <button
            onClick={onBack}
            className="hover:text-txt-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            내 포트폴리오
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-txt-primary font-medium">{idea.title}</span>
        </div>

        {/* Title & Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-txt-primary">{idea.title}</h1>
            <p className="text-sm text-txt-tertiary">{idea.category}</p>
          </div>
          <button
            onClick={() => onNewVersion(ideaId, latestVersion?.id)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-inverse text-txt-inverse rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            새 버전
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 -mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-surface-sunken text-txt-primary border-t border-l border-r border-border'
                  : 'text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken'
              }`}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'current' && (
          <CurrentStateTab
            version={selectedVersion || latestVersion}
            idea={idea}
            onContinueValidation={onContinueValidation}
          />
        )}

        {activeTab === 'history' && (
          <VersionTimeline
            versions={idea.versions}
            selectedVersionId={selectedVersionId}
            onSelectVersion={setSelectedVersionId}
            onForkVersion={(versionId) => onNewVersion(ideaId, versionId)}
          />
        )}

        {activeTab === 'analysis' && (
          <GapAnalysisPanel
            version={selectedVersion || latestVersion}
            userId={userId}
            onNewVersion={() => onNewVersion(ideaId, selectedVersion?.id || latestVersion?.id)}
          />
        )}
      </div>

      {/* Submissions Footer (always visible) */}
      {idea.submissions.length > 0 && (
        <div className="bg-surface-card border-t border-border px-6 py-3">
          <SubmissionHistory
            submissions={idea.submissions}
            versions={idea.versions}
            compact
          />
        </div>
      )}
    </div>
  );
}

// Current State Tab Component
function CurrentStateTab({
  version,
  idea,
  onContinueValidation,
}: {
  version: IdeaVersion | null;
  idea: IdeaDetailWithVersions;
  onContinueValidation: (versionId: string) => void;
}) {
  if (!version) {
    return (
      <div className="p-6 text-center">
        <p className="text-txt-tertiary">버전이 없습니다. 새 버전을 만들어 검증을 시작하세요.</p>
      </div>
    );
  }

  const score = version.total_score || 0;
  const scorecard = version.scorecard;
  const status = version.status;

  // Find next deadline from submissions
  const nextDeadline = idea.submissions
    .filter((s) => s.deadline && new Date(s.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];

  const daysUntilDeadline = nextDeadline
    ? Math.ceil((new Date(nextDeadline.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Version Header */}
      <div className="bg-surface-card rounded-xl border border-border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-txt-primary">
                {version.version_name}
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  status === 'submitted'
                    ? 'text-status-success-text bg-surface-sunken'
                    : status === 'in_progress'
                    ? 'text-txt-primary bg-surface-sunken'
                    : 'text-txt-tertiary bg-surface-sunken'
                }`}
              >
                {VERSION_STATUS_ICONS[status]} {VERSION_STATUS_LABELS[status]}
              </span>
            </div>
            {version.target_program_name && (
              <p className="text-sm text-txt-tertiary mt-1">
                타겟: {version.target_program_name}
              </p>
            )}
          </div>

          {/* Score */}
          <div
            className={`w-20 h-20 rounded-xl flex flex-col items-center justify-center border-2 ${getScoreBgColor(score)}`}
          >
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score || '—'}
            </span>
            <span className="text-[10px] text-txt-tertiary">점</span>
          </div>
        </div>

        {/* Scorecard Grid */}
        {scorecard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {Object.entries(SCORECARD_CATEGORY_NAMES).map(([key, name]) => {
              const catScore = (scorecard as unknown as Record<string, { current: number; max: number }>)[key];
              if (!catScore) return null;

              const percentage = (catScore.current / catScore.max) * 100;
              const isLow = percentage < 50;

              return (
                <div key={key} className="bg-surface-sunken rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-txt-secondary">{name}</span>
                    <span className={`text-xs font-bold ${isLow ? 'text-status-danger-text' : 'text-txt-primary'}`}>
                      {catScore.current}/{catScore.max}
                    </span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentage >= 70
                          ? 'bg-txt-primary'
                          : percentage >= 50
                          ? 'bg-txt-tertiary'
                          : 'bg-border-strong'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {isLow && (
                    <p className="text-[10px] text-status-danger-text mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      보완 필요
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Action */}
      <div className="bg-surface-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-txt-primary mb-4">다음 액션</h3>

        {nextDeadline && daysUntilDeadline !== null && (
          <div className="flex items-center gap-3 p-3 bg-surface-sunken border border-border rounded-lg mb-4">
            <Calendar className="w-5 h-5 text-status-warning-text" />
            <div>
              <p className="text-sm font-medium text-txt-primary">
                {nextDeadline.program_name} 마감 D-{daysUntilDeadline}
              </p>
              <p className="text-xs text-txt-secondary">
                {new Date(nextDeadline.deadline!).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onContinueValidation(version.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface-inverse text-txt-inverse rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <TrendingUp className="w-5 h-5" />
            이 버전으로 검증 이어하기
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-border text-txt-secondary rounded-lg hover:bg-surface-sunken transition-colors font-medium">
            <BarChart3 className="w-5 h-5" />
            Gap 분석 보기
          </button>
        </div>
      </div>
    </div>
  );
}
