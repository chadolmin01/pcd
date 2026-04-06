'use client';

import React from 'react';
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText,
  Link2,
  Link2Off,
} from 'lucide-react';
import type { SyncStatus } from '@/lib/document-sync/types';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  isConnected: boolean;
  fileName: string | null;
  lastSyncAt: Date | null;
  error: string | null;
  compact?: boolean;
}

/**
 * 동기화 상태 표시 컴포넌트
 */
export default function SyncStatusIndicator({
  status,
  isConnected,
  fileName,
  lastSyncAt,
  error,
  compact = false,
}: SyncStatusIndicatorProps) {
  // [FIX] 접근성: 상태별 아이콘에 aria-label 추가
  const getStatusIcon = () => {
    if (!isConnected) {
      return <Link2Off className="w-4 h-4 text-txt-tertiary" aria-hidden="true" />;
    }

    switch (status) {
      case 'connecting':
        return <Loader2 className="w-4 h-4 text-txt-secondary animate-spin" aria-hidden="true" />;
      case 'syncing':
        return <Loader2 className="w-4 h-4 text-txt-secondary animate-spin" aria-hidden="true" />;
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-status-success-text" aria-hidden="true" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-status-danger-text" aria-hidden="true" />;
      case 'idle':
      default:
        return <Link2 className="w-4 h-4 text-status-success-text" aria-hidden="true" />;
    }
  };

  const getStatusText = () => {
    if (!isConnected) {
      return '파일 연결 안됨';
    }

    switch (status) {
      case 'connecting':
        return '연결 중...';
      case 'syncing':
        return '동기화 중...';
      case 'synced':
        return '저장됨';
      case 'error':
        return error || '오류 발생';
      case 'idle':
      default:
        return '연결됨';
    }
  };

  // [FIX] 상태별 색상 분기 개선 (syncing 상태에서 파란색)
  const getStatusColor = () => {
    if (status === 'error') return 'text-status-danger-text';
    if (status === 'syncing' || status === 'connecting') return 'text-txt-secondary';
    if (status === 'synced') return 'text-status-success-text';
    if (isConnected) return 'text-txt-secondary';
    return 'text-txt-tertiary';
  };

  // [FIX] Date 직렬화 문제 대응 - string도 처리
  const getTimeAgo = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
      return '알 수 없음';
    }

    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

    if (seconds < 5) return '방금 전';
    if (seconds < 60) return `${seconds}초 전`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;

    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  if (compact) {
    return (
      // [FIX] 접근성: role과 aria-live 추가
      <div className="flex items-center gap-1.5" role="status" aria-live="polite">
        {getStatusIcon()}
        <span className={`text-xs ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1" role="status" aria-live="polite">
      {/* 파일 정보 */}
      {isConnected && fileName && (
        <div className="flex items-center gap-1.5 text-sm text-txt-secondary">
          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="truncate max-w-[150px]" title={fileName}>
            {fileName}
          </span>
        </div>
      )}

      {/* 상태 */}
      <div className="flex items-center gap-1.5">
        {getStatusIcon()}
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* 마지막 동기화 시간 */}
      {lastSyncAt && isConnected && status !== 'error' && (
        <span className="text-xs text-txt-tertiary">
          마지막 저장: {getTimeAgo(lastSyncAt)}
        </span>
      )}

      {/* 에러 메시지 */}
      {status === 'error' && error && error.length > 20 && (
        <span className="text-xs text-status-danger-text max-w-[200px] truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
