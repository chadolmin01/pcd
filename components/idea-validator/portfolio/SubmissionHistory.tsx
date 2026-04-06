'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type { IdeaSubmission, IdeaVersion } from '@/lib/portfolio/types';
import {
  SUBMISSION_RESULT_LABELS,
  SUBMISSION_RESULT_COLORS,
} from '@/lib/portfolio/types';

interface SubmissionHistoryProps {
  submissions: IdeaSubmission[];
  versions: IdeaVersion[];
  compact?: boolean;
  onAddSubmission?: () => void;
}

export default function SubmissionHistory({
  submissions,
  versions,
  compact = false,
  onAddSubmission,
}: SubmissionHistoryProps) {
  // Get version info for each submission
  const submissionsWithVersion = submissions.map((submission) => {
    const version = versions.find((v) => v.id === submission.version_id);
    return { ...submission, version };
  });

  // Sort by deadline (upcoming first) or submitted_at
  const sortedSubmissions = [...submissionsWithVersion].sort((a, b) => {
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  });

  if (submissions.length === 0) {
    return null;
  }

  // Compact view for footer
  if (compact) {
    const upcoming = sortedSubmissions.filter(
      (s) => s.deadline && new Date(s.deadline) > new Date()
    );
    const recent = sortedSubmissions.slice(0, 3);

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-txt-secondary">
            <FileText className="w-4 h-4" />
            <span>제출 이력 {submissions.length}건</span>
          </div>
          {upcoming.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-status-warning-text">
              <Clock className="w-4 h-4" />
              <span>예정 마감 {upcoming.length}건</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {recent.slice(0, 2).map((sub) => (
            <ResultBadge key={sub.id} result={sub.result} compact />
          ))}
          {recent.length > 2 && (
            <span className="text-xs text-txt-tertiary">+{recent.length - 2}</span>
          )}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-txt-primary">제출 이력</h3>
        {onAddSubmission && (
          <button
            onClick={onAddSubmission}
            className="text-sm text-txt-secondary hover:text-txt-primary font-medium"
          >
            + 제출 기록 추가
          </button>
        )}
      </div>

      <div className="space-y-3">
        {sortedSubmissions.map((submission) => {
          const daysUntilDeadline = submission.deadline
            ? Math.ceil(
                (new Date(submission.deadline).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )
            : null;

          return (
            <div
              key={submission.id}
              className="bg-surface-card rounded-lg border border-border p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-txt-primary">
                    {submission.program_name}
                  </h4>
                  {submission.version && (
                    <p className="text-xs text-txt-tertiary mt-0.5">
                      v{submission.version.version_number} -{' '}
                      {submission.version.version_name}
                    </p>
                  )}
                </div>
                <ResultBadge result={submission.result} />
              </div>

              <div className="flex items-center gap-4 text-xs text-txt-tertiary">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  제출일:{' '}
                  {new Date(submission.submitted_at).toLocaleDateString('ko-KR')}
                </div>
                {submission.deadline && (
                  <div
                    className={`flex items-center gap-1 ${
                      daysUntilDeadline !== null && daysUntilDeadline <= 7
                        ? 'text-status-warning-text'
                        : ''
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    마감:{' '}
                    {new Date(submission.deadline).toLocaleDateString('ko-KR')}
                    {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
                      <span className="font-medium ml-1">
                        (D-{daysUntilDeadline})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {submission.result_note && (
                <p className="mt-2 text-sm text-txt-secondary bg-surface-sunken rounded p-2">
                  {submission.result_note}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Result Badge Component
function ResultBadge({
  result,
  compact = false,
}: {
  result: IdeaSubmission['result'];
  compact?: boolean;
}) {
  if (!result) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-sunken text-txt-tertiary text-xs rounded-full">
        <AlertCircle className="w-3 h-3" />
        {!compact && '대기중'}
      </span>
    );
  }

  const colorClass = SUBMISSION_RESULT_COLORS[result];
  const label = SUBMISSION_RESULT_LABELS[result];

  const IconComponent =
    result === 'final_pass'
      ? CheckCircle
      : result === 'document_pass'
      ? CheckCircle
      : result === 'rejected'
      ? XCircle
      : AlertCircle;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${colorClass}`}
    >
      <IconComponent className="w-3 h-3" />
      {!compact && label}
    </span>
  );
}
