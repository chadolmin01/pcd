'use client';

import React, { useMemo, useRef } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Link2,
  Link2Off,
  Download,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Info,
  AlertCircle,
} from 'lucide-react';
import type { ApplicationFormData, ApplicationSectionContent } from '@/lib/document-sync/types';
import type { GovernmentProgramConfig } from '../types';
import { useDocumentSync } from './hooks/useDocumentSync';
import SyncStatusIndicator from './SyncStatusIndicator';

interface DocumentSyncPanelProps {
  programConfig: GovernmentProgramConfig;
  sectionContents: Record<string, ApplicationSectionContent>;
  ideaTitle?: string;
}

/**
 * 문서 동기화 패널 컴포넌트
 * - 파일 연결/해제
 * - 자동 동기화 토글
 * - 수동 동기화/다운로드 버튼
 * - 상태 표시
 */
export default function DocumentSyncPanel({
  programConfig,
  sectionContents,
  ideaTitle,
}: DocumentSyncPanelProps) {
  // [FIX] formData 변환 - createdAt 안정화
  const createdAtRef = useRef(new Date());

  const formData = useMemo<ApplicationFormData | null>(() => {
    if (!programConfig) return null;

    return {
      programId: programConfig.id,
      programName: programConfig.nameKo,
      sections: programConfig.sections.map((section) => ({
        id: section.id,
        titleKo: section.titleKo,
        weight: section.weight,
        content: sectionContents[section.id]?.content || '',
      })),
      ideaTitle,
      createdAt: createdAtRef.current,
      updatedAt: new Date(),
    };
  }, [programConfig, sectionContents, ideaTitle]);

  // 동기화 훅
  const {
    state,
    options,
    setAutoSync,
    connectFile,
    disconnect,
    triggerSync,
    downloadFile,
  } = useDocumentSync({ formData });

  return (
    <div className="bg-surface-card border border-border rounded-xl p-4 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-txt-primary flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-txt-secondary" aria-hidden="true" />
          Word 동기화
        </h4>
        {/* [FIX] 사용자 친화적 텍스트로 변경 */}
        {state.isSupported ? (
          <span className="text-[10px] text-txt-tertiary bg-surface-sunken px-2 py-0.5 rounded-full">
            실시간 저장
          </span>
        ) : (
          <span className="text-[10px] text-txt-tertiary bg-surface-sunken px-2 py-0.5 rounded-full">
            수동 저장
          </span>
        )}
      </div>

      {/* 상태 표시 */}
      <div className="mb-3 p-2 bg-surface-sunken rounded-lg">
        <SyncStatusIndicator
          status={state.status}
          isConnected={state.isConnected}
          fileName={state.fileName}
          lastSyncAt={state.lastSyncAt}
          error={state.error}
        />
      </div>

      {/* FSA 지원 브라우저: 전체 기능 */}
      {state.isSupported ? (
        <>
          {/* 연결 상태에 따른 버튼 */}
          {!state.isConnected ? (
            <button
              onClick={() => connectFile()}
              disabled={state.status === 'connecting'}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-surface-inverse text-txt-inverse rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50"
              aria-label="Word 파일 연결하기"
            >
              <Link2 className="w-4 h-4" aria-hidden="true" />
              파일 연결하기
            </button>
          ) : (
            <div className="space-y-2">
              {/* 자동 동기화 토글 */}
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-txt-secondary">자동 동기화 (2초)</span>
                {/* [FIX] 접근성: role="switch", aria-checked 추가 */}
                <button
                  onClick={() => setAutoSync(!options.autoSync)}
                  className="flex items-center gap-1 text-xs p-1 rounded hover:bg-surface-sunken transition-colors"
                  role="switch"
                  aria-checked={options.autoSync}
                  aria-label="자동 동기화 토글"
                >
                  {options.autoSync ? (
                    <ToggleRight className="w-6 h-6 text-txt-secondary" aria-hidden="true" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-txt-tertiary" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex gap-2">
                <button
                  onClick={() => triggerSync()}
                  disabled={state.status === 'syncing'}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-sunken text-txt-secondary rounded-lg hover:bg-border transition-colors text-xs font-medium disabled:opacity-50"
                  aria-label="수동 동기화"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${state.status === 'syncing' ? 'animate-spin' : ''}`} aria-hidden="true" />
                  동기화
                </button>

                {/* [FIX] alert() → toast로 변경 (디자인 리뷰 반영) */}
                <button
                  onClick={() => {
                    toast.info(`"${state.fileName}" 파일이 저장 시 선택한 폴더에 있습니다.`, {
                      description: 'Word 또는 한글 프로그램에서 해당 파일을 열어 확인하세요.',
                      duration: 5000,
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-sunken text-txt-secondary rounded-lg hover:bg-border transition-colors text-xs font-medium"
                  aria-label="파일 위치 확인"
                >
                  <Info className="w-3.5 h-3.5" aria-hidden="true" />
                  위치 확인
                </button>

                <button
                  onClick={disconnect}
                  className="px-3 py-2 text-status-danger-text hover:bg-surface-sunken rounded-lg transition-colors text-xs min-w-[40px]"
                  aria-label="파일 연결 해제"
                >
                  <Link2Off className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* FSA 미지원 브라우저: 다운로드 모드 */
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-2 bg-surface-sunken rounded-lg text-xs text-txt-secondary">
            <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              이 브라우저에서는 수동 저장을 사용합니다.
              <br />
              Chrome 또는 Edge에서 실시간 저장을 사용할 수 있습니다.
            </p>
          </div>

          <button
            onClick={downloadFile}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-surface-inverse text-txt-inverse rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            aria-label="Word 파일 다운로드"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Word 파일 다운로드
          </button>
        </div>
      )}

      {/* 에러 표시 */}
      {state.error && state.status === 'error' && (
        <div className="mt-2 p-2 bg-surface-sunken rounded-lg text-xs text-status-danger-text flex items-start gap-2" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <p>{state.error}</p>
        </div>
      )}

      {/* 안내 문구 */}
      {state.isConnected && state.isSupported && (
        <p className="mt-3 text-[10px] text-txt-tertiary leading-relaxed">
          Word에서 파일을 열어두면 변경 시 자동으로 업데이트됩니다.
          <br />
          Word가 파일을 점유 중이면 저장이 실패할 수 있습니다.
        </p>
      )}
    </div>
  );
}
