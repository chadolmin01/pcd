'use client';

import React from 'react';
import {
  GitBranch,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { IdeaVersion } from '@/lib/portfolio/types';
import {
  VERSION_STATUS_ICONS,
  VERSION_STATUS_LABELS,
  getScoreColor,
} from '@/lib/portfolio';

interface VersionTimelineProps {
  versions: IdeaVersion[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
  onForkVersion: (versionId: string) => void;
}

export default function VersionTimeline({
  versions,
  selectedVersionId,
  onSelectVersion,
  onForkVersion,
}: VersionTimelineProps) {
  if (versions.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-txt-tertiary">버전 히스토리가 없습니다.</p>
      </div>
    );
  }

  // Calculate score changes between versions
  const versionsWithDelta = versions.map((version, index) => {
    const prevVersion = versions[index + 1]; // Versions are sorted desc
    const scoreDelta = prevVersion
      ? (version.total_score || 0) - (prevVersion.total_score || 0)
      : 0;
    return { ...version, scoreDelta };
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h3 className="text-lg font-bold text-txt-primary mb-6">버전 히스토리</h3>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-border" />

        {/* Timeline Items */}
        <div className="space-y-4">
          {versionsWithDelta.map((version, index) => {
            const isSelected = version.id === selectedVersionId;
            const isLatest = index === 0;
            const score = version.total_score || 0;

            return (
              <div
                key={version.id}
                className="relative flex items-start gap-4"
              >
                {/* Timeline Node */}
                <div
                  className={`relative z-10 w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shrink-0 ${
                    isSelected
                      ? 'bg-surface-sunken border-border-strong'
                      : isLatest
                      ? 'bg-surface-sunken border-border-strong'
                      : 'bg-surface-card border-border-strong'
                  }`}
                >
                  <span className={`text-sm font-bold ${isSelected ? 'text-txt-primary' : isLatest ? 'text-txt-primary' : 'text-txt-secondary'}`}>
                    {score}
                  </span>
                  <span className="text-[8px] text-txt-tertiary">점</span>
                </div>

                {/* Content Card */}
                <button
                  onClick={() => onSelectVersion(version.id)}
                  className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'bg-surface-sunken border-border-strong ring-2 ring-border'
                      : 'bg-surface-card border-border hover:border-border-strong hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-txt-primary">
                          v{version.version_number}
                        </span>
                        <span className="text-sm text-txt-secondary">
                          {version.version_name}
                        </span>
                        {isLatest && (
                          <span className="px-1.5 py-0.5 bg-surface-sunken text-txt-primary text-[10px] font-bold rounded">
                            최신
                          </span>
                        )}
                      </div>
                      {version.target_program_name && (
                        <p className="text-xs text-txt-tertiary mt-1">
                          타겟: {version.target_program_name}
                        </p>
                      )}
                    </div>

                    {/* Score Delta */}
                    {version.scoreDelta !== 0 && (
                      <div
                        className={`flex items-center gap-1 text-sm font-medium ${
                          version.scoreDelta > 0
                            ? 'text-status-success-text'
                            : 'text-status-danger-text'
                        }`}
                      >
                        {version.scoreDelta > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {version.scoreDelta > 0 ? '+' : ''}
                        {version.scoreDelta}
                      </div>
                    )}
                  </div>

                  {/* Key Feedback */}
                  {version.key_feedback && version.key_feedback.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {version.key_feedback.slice(0, 3).map((feedback, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-surface-sunken text-txt-secondary text-[10px] rounded-full"
                        >
                          {feedback.length > 30
                            ? feedback.slice(0, 30) + '...'
                            : feedback}
                        </span>
                      ))}
                      {version.key_feedback.length > 3 && (
                        <span className="text-[10px] text-txt-tertiary">
                          +{version.key_feedback.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
                    <div className="flex items-center gap-2 text-xs text-txt-tertiary">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          version.status === 'submitted'
                            ? 'text-status-success-text'
                            : version.status === 'in_progress'
                            ? 'text-txt-primary'
                            : ''
                        }`}
                      >
                        {VERSION_STATUS_ICONS[version.status]}{' '}
                        {VERSION_STATUS_LABELS[version.status]}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(version.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>

                    {/* Fork Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onForkVersion(version.id);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken rounded transition-colors"
                    >
                      <GitBranch className="w-3 h-3" />
                      Fork
                    </button>
                  </div>

                  {/* Forked From Indicator */}
                  {version.forked_from && (
                    <div className="mt-2 pt-2 border-t border-dashed border-border">
                      <p className="text-[10px] text-txt-tertiary flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        이전 버전에서 분기됨
                      </p>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
