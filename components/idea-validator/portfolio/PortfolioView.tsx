'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Folder,
  Loader2,
  ChevronRight,
  Upload,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import type { IdeaWithLatestVersion, IdeaCore, IdeaVersion, VersionStatus } from '@/lib/portfolio/types';
import {
  VERSION_STATUS_ICONS,
  VERSION_STATUS_LABELS,
  getScoreColor,
  getScoreBgColor,
} from '@/lib/portfolio';
import ImportIdeaModal from './ImportIdeaModal';

interface PortfolioViewProps {
  userId: string;
  onSelectIdea: (ideaId: string) => void;
  onCreateNew: () => void;
  onImportSuccess?: (ideaCore: IdeaCore, ideaVersion: IdeaVersion) => void;
  selectionMode?: 'grant'; // 지원사업용 아이디어 선택 모드
  onBack?: () => void;
}

export default function PortfolioView({
  userId,
  onSelectIdea,
  onCreateNew,
  onImportSuccess,
  selectionMode,
  onBack,
}: PortfolioViewProps) {
  const [ideas, setIdeas] = useState<IdeaWithLatestVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // 가져오기 성공 핸들러
  const handleImportSuccess = (ideaCore: IdeaCore, ideaVersion: IdeaVersion) => {
    setShowImportModal(false);
    // 목록 새로고침
    setIdeas(prev => [{
      ...ideaCore,
      latest_version: ideaVersion,
      version_count: 1,
    }, ...prev]);
    // 상위 콜백 호출
    if (onImportSuccess) {
      onImportSuccess(ideaCore, ideaVersion);
    }
  };

  // 테스트용 목 데이터
  const MOCK_IDEAS: IdeaWithLatestVersion[] = [
    {
      id: 'mock-idea-1',
      user_id: userId,
      title: 'AI 헬스케어 코칭 앱',
      one_liner: 'AI 기반 개인 맞춤형 건강 코칭 서비스',
      category: '헬스케어',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      latest_version: {
        id: 'mock-version-1',
        core_id: 'mock-idea-1',
        version_number: 1,
        version_name: 'v1',
        target_program_id: 'pre-startup',
        target_program_name: '예비창업패키지',
        validation_level: 'mvp',
        scorecard: null,
        total_score: 78,
        chat_summary: '현대인의 건강 관리 문제를 AI 기반 개인 맞춤형 코칭 앱으로 해결. 25-45세 직장인 타겟, 구독 모델.',
        key_feedback: ['문제 정의 명확', '시장 규모 검증 필요'],
        status: 'in_progress' as const,
        forked_from: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      version_count: 1,
    },
    {
      id: 'mock-idea-2',
      user_id: userId,
      title: '시니어 원격 건강 모니터링',
      one_liner: 'IoT와 AI 기반 시니어 헬스케어 솔루션',
      category: '헬스케어',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      deleted_at: null,
      latest_version: {
        id: 'mock-version-2',
        core_id: 'mock-idea-2',
        version_number: 2,
        version_name: 'v2',
        target_program_id: null,
        target_program_name: null,
        validation_level: 'sketch',
        scorecard: null,
        total_score: 65,
        chat_summary: '고령화 사회 독거 노인 건강 관리를 IoT와 AI로 해결. 하드웨어 + 구독 모델.',
        key_feedback: ['기술적 실현 가능성 보완 필요'],
        status: 'draft' as const,
        forked_from: null,
        deleted_at: null,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
      version_count: 2,
    },
  ];

  useEffect(() => {
    const fetchIdeas = async () => {
      // userId가 없거나 유효하지 않으면 빈 목록 표시
      if (!userId || userId.trim() === '') {
        setLoading(false);
        setIdeas([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/portfolio', {
          headers: {
            'x-user-id': userId,
          },
        });

        // 응답이 실패하면 목 데이터 사용 (개발용)
        if (!response.ok) {
          console.log('Using mock data for development');
          setIdeas(MOCK_IDEAS);
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (!data.success) {
          // API 에러 시 목 데이터 사용 (개발용)
          console.log('Using mock data for development');
          setIdeas(MOCK_IDEAS);
          setLoading(false);
          return;
        }

        // 실제 데이터가 있으면 사용, 없으면 목 데이터
        setIdeas(data.data?.length > 0 ? data.data : MOCK_IDEAS);
      } catch (err) {
        // 네트워크 에러 시 목 데이터 사용
        console.error('Portfolio fetch error:', err);
        console.log('Using mock data for development');
        setIdeas(MOCK_IDEAS);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [userId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-txt-tertiary mx-auto mb-3" />
          <p className="text-sm text-txt-tertiary">포트폴리오 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러가 있어도 빈 상태로 표시 (새 사용자 경험 개선)

  return (
    <div className="h-full overflow-y-auto">
      {/* 지원사업 선택 모드 배너 */}
      {selectionMode === 'grant' && (
        <div className="bg-surface-inverse text-txt-inverse px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <div>
                <p className="font-semibold">지원사업에 사용할 아이디어를 선택하세요</p>
                <p className="text-txt-inverse/70 text-sm">선택한 아이디어를 기반으로 사업계획서를 작성합니다</p>
              </div>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-surface-card/20 hover:bg-surface-card/30 rounded-lg transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                돌아가기
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-txt-primary flex items-center gap-3">
              <Folder className="w-7 h-7 text-txt-secondary" />
              {selectionMode === 'grant' ? '아이디어 선택' : '내 아이디어 포트폴리오'}
            </h1>
            <p className="text-txt-tertiary mt-1">
              {ideas.length}개의 아이디어
            </p>
          </div>
          {selectionMode !== 'grant' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-card border border-border-strong text-txt-secondary rounded-xl hover:bg-surface-sunken hover:border-gray-400 transition-colors font-medium"
              >
                <Upload className="w-4 h-4" />
                파일에서 가져오기
              </button>
              <button
                onClick={onCreateNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-surface-inverse text-txt-inverse rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                새 아이디어
              </button>
            </div>
          )}
        </div>

        {/* Import Modal */}
        <ImportIdeaModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          userId={userId}
          onSuccess={handleImportSuccess}
        />

        {/* Empty State */}
        {ideas.length === 0 && (
          <div className="text-center py-16 bg-surface-sunken rounded-2xl border-2 border-dashed border-border">
            <Folder className="w-12 h-12 text-txt-disabled mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-txt-secondary mb-2">
              {selectionMode === 'grant'
                ? '선택할 아이디어가 없습니다'
                : '아직 아이디어가 없습니다'
              }
            </h3>
            <p className="text-txt-tertiary mb-6">
              {selectionMode === 'grant'
                ? '먼저 "빠른 검증"으로 아이디어를 만들어주세요'
                : '새 아이디어를 추가하거나 기존 문서를 가져와보세요'
              }
            </p>
            <div className="flex items-center justify-center gap-3">
              {selectionMode === 'grant' ? (
                <button
                  onClick={onCreateNew}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-surface-inverse text-txt-inverse rounded-xl hover:bg-gray-800 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  빠른 검증으로 아이디어 만들기
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-surface-card border border-border-strong text-txt-secondary rounded-xl hover:bg-surface-sunken transition-colors font-medium"
                  >
                    <Upload className="w-5 h-5" />
                    파일에서 가져오기
                  </button>
                  <button
                    onClick={onCreateNew}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-surface-inverse text-txt-inverse rounded-xl hover:bg-gray-800 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    새로 시작하기
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-3 gap-5">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onClick={() => onSelectIdea(idea.id)}
            />
          ))}
        </div>

        {/* Mobile List */}
        <div className="md:hidden space-y-3">
          {ideas.map((idea) => (
            <IdeaListItem
              key={idea.id}
              idea={idea}
              onClick={() => onSelectIdea(idea.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Desktop Card Component
function IdeaCard({
  idea,
  onClick,
}: {
  idea: IdeaWithLatestVersion;
  onClick: () => void;
}) {
  const score = idea.latest_version?.total_score || 0;
  const status = idea.latest_version?.status || 'draft';
  const versionName = idea.latest_version?.version_name || '버전 없음';
  const versionCount = idea.version_count;

  return (
    <button
      onClick={onClick}
      className="group relative bg-surface-card border border-border rounded-xl p-5 text-left hover:border-border-strong hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-border-strong focus:ring-offset-2"
      aria-label={`${idea.title}, ${score}점, ${VERSION_STATUS_LABELS[status]}`}
    >
      {/* Score Badge */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 ${getScoreBgColor(score)}`}
        >
          <span className={`text-xl font-bold ${getScoreColor(score)}`}>
            {score || '—'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <h3 className="font-semibold text-txt-primary group-hover:text-txt-secondary transition-colors line-clamp-1">
          {idea.title}
        </h3>
        <p className="text-xs text-txt-tertiary mt-1">
          {idea.category}
        </p>
      </div>

      {/* Version Info */}
      <div className="flex items-center justify-between text-xs text-txt-tertiary pt-3 border-t border-border-subtle">
        <span className="truncate max-w-[120px]">{versionName}</span>
        <span className="flex items-center gap-1">
          v{versionCount}
          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
      </div>

      {/* Score Trend Indicator */}
      {score > 0 && (
        <div className="absolute bottom-5 right-5">
          <ScoreSparkline score={score} />
        </div>
      )}
    </button>
  );
}

// Mobile List Item
function IdeaListItem({
  idea,
  onClick,
}: {
  idea: IdeaWithLatestVersion;
  onClick: () => void;
}) {
  const score = idea.latest_version?.total_score || 0;
  const status = idea.latest_version?.status || 'draft';
  const versionName = idea.latest_version?.version_name || '버전 없음';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-surface-card border border-border rounded-xl hover:border-border-strong hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-border-strong"
      aria-label={`${idea.title}, ${score}점, ${VERSION_STATUS_LABELS[status]}`}
    >
      {/* Score */}
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center border shrink-0 ${getScoreBgColor(score)}`}
      >
        <span className={`text-lg font-bold ${getScoreColor(score)}`}>
          {score || '—'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <h3 className="font-medium text-txt-primary truncate">{idea.title}</h3>
        <p className="text-xs text-txt-tertiary truncate">{versionName}</p>
      </div>

      {/* Status */}
      <div className="shrink-0 flex items-center gap-2">
        <StatusBadge status={status} compact />
        <ChevronRight className="w-4 h-4 text-txt-tertiary" />
      </div>
    </button>
  );
}

// Status Badge Component
function StatusBadge({
  status,
  compact = false,
}: {
  status: VersionStatus;
  compact?: boolean;
}) {
  const icon = VERSION_STATUS_ICONS[status];
  const label = VERSION_STATUS_LABELS[status];

  const colorMap: Record<VersionStatus, string> = {
    draft: 'text-txt-tertiary bg-surface-sunken',
    in_progress: 'text-txt-primary bg-surface-sunken',
    submitted: 'text-status-success-text bg-surface-sunken',
    archived: 'text-txt-disabled bg-surface-sunken',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[status]}`}
      aria-label={label}
    >
      <span aria-hidden="true">{icon}</span>
      {!compact && <span>{label}</span>}
    </span>
  );
}

// Score Sparkline (simplified visual indicator)
function ScoreSparkline({ score }: { score: number }) {
  // Generate a simple bar chart representation
  const bars = [0.3, 0.5, 0.7, 0.4, 0.9].map((h, i) => {
    const height = Math.min(1, (score / 100) * h + 0.2);
    return (
      <div
        key={i}
        className="w-1 bg-border rounded-full overflow-hidden"
        style={{ height: '16px' }}
      >
        <div
          className={`w-full rounded-full transition-all ${score >= 80 ? 'bg-txt-primary' : score >= 60 ? 'bg-txt-tertiary' : 'bg-border-strong'}`}
          style={{ height: `${height * 100}%` }}
        />
      </div>
    );
  });

  return (
    <div className="flex items-end gap-0.5 opacity-40 group-hover:opacity-70 transition-opacity">
      {bars}
    </div>
  );
}
