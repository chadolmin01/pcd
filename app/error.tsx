'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-sunken">
      <div className="max-w-md w-full mx-4">
        <div className="bg-surface-card rounded-xl shadow-md p-8 text-center border border-border">
          <div className="w-16 h-16 mx-auto mb-4 bg-status-danger-bg rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-status-danger-text"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-txt-primary mb-2">
            오류가 발생했습니다
          </h2>
          <p className="text-txt-secondary mb-6">
            예상치 못한 문제가 발생했습니다. 다시 시도해 주세요.
          </p>
          {error.digest && (
            <p className="text-xs text-txt-tertiary mb-4">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-2 bg-surface-inverse text-txt-inverse rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              다시 시도
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-surface-sunken text-txt-secondary rounded-xl font-medium hover:bg-border transition-colors"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
