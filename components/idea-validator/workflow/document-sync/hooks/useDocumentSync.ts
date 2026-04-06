'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type {
  SyncStatus,
  DocumentSyncState,
  SyncOptions,
  ApplicationFormData,
} from '@/lib/document-sync/types';
import { DEFAULT_SYNC_OPTIONS } from '@/lib/document-sync/types';
import { generateApplicationDocx, downloadAsDocx } from '@/lib/document-sync/word-generator';
import { useFileSystemAccess } from './useFileSystemAccess';

interface UseDocumentSyncProps {
  formData: ApplicationFormData | null;
  options?: Partial<SyncOptions>;
}

interface UseDocumentSyncReturn {
  state: DocumentSyncState;
  options: SyncOptions;
  setAutoSync: (enabled: boolean) => void;
  connectFile: (suggestedName?: string) => Promise<boolean>;
  disconnect: () => void;
  triggerSync: () => Promise<boolean>;
  downloadFile: () => Promise<void>;
}

/**
 * 문서 동기화 로직을 담당하는 훅
 * - FSA API 지원 시: 로컬 파일에 직접 쓰기
 * - 미지원 시: 다운로드 방식으로 폴백
 */
export function useDocumentSync({
  formData,
  options: optionsProp,
}: UseDocumentSyncProps): UseDocumentSyncReturn {
  // 옵션 병합
  const [options, setOptions] = useState<SyncOptions>({
    ...DEFAULT_SYNC_OPTIONS,
    ...optionsProp,
  });

  // 동기화 상태
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // FSA API 훅
  const fsa = useFileSystemAccess();

  // Debounce를 위한 타이머 ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFormDataRef = useRef<string>('');

  // [FIX] setTimeout 정리를 위한 ref
  const statusResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // [FIX] Race Condition 방지를 위한 lock ref
  const isSyncingRef = useRef(false);

  // 자동 동기화 토글
  const setAutoSync = useCallback((enabled: boolean) => {
    setOptions((prev) => ({ ...prev, autoSync: enabled }));
  }, []);

  // 실제 동기화 수행 - [FIX] connectFile보다 먼저 정의
  const performSync = useCallback(
    async (data: ApplicationFormData): Promise<boolean> => {
      // [FIX] Race Condition 방지: 이미 동기화 중이면 스킵
      if (isSyncingRef.current) {
        return false;
      }

      if (!fsa.fileHandle) {
        setSyncError('연결된 파일이 없습니다.');
        return false;
      }

      isSyncingRef.current = true;
      setStatus('syncing');
      setSyncError(null);

      try {
        const buffer = await generateApplicationDocx(data);
        // Buffer를 Uint8Array로 변환 (타입 호환성을 위해 ArrayBuffer로 복사)
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        const success = await fsa.writeToFile(arrayBuffer as ArrayBuffer);

        if (success) {
          setStatus('synced');
          setLastSyncAt(new Date());
          setSyncError(null);

          // [FIX] 기존 타이머 취소
          if (statusResetTimerRef.current) {
            clearTimeout(statusResetTimerRef.current);
          }

          // 3초 후 idle로 복귀
          statusResetTimerRef.current = setTimeout(() => {
            setStatus((prev) => (prev === 'synced' ? 'idle' : prev));
          }, 3000);

          return true;
        } else {
          setStatus('error');
          setSyncError(fsa.error || '동기화 실패');
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '동기화 중 오류 발생';
        setStatus('error');
        setSyncError(message);
        return false;
      } finally {
        // [FIX] 반드시 lock 해제
        isSyncingRef.current = false;
      }
    },
    [fsa]
  );

  // 파일 연결 - [FIX] performSync를 의존성에 추가
  const connectFile = useCallback(
    async (suggestedName?: string): Promise<boolean> => {
      setStatus('connecting');
      setSyncError(null);

      const defaultName = formData
        ? `${formData.programName}_지원서.docx`
        : '지원서.docx';

      const success = await fsa.connectFile(suggestedName || defaultName);

      if (success) {
        setStatus('idle');
        // 연결 직후 초기 저장
        if (formData) {
          await performSync(formData);
        }
      } else if (fsa.error) {
        setStatus('error');
        setSyncError(fsa.error);
      } else {
        setStatus('idle');
      }

      return success;
    },
    [fsa, formData, performSync] // [FIX] performSync 추가
  );

  // 파일 연결 해제
  const disconnect = useCallback(() => {
    fsa.disconnect();
    setStatus('idle');
    setLastSyncAt(null);
    setSyncError(null);
  }, [fsa]);

  // 수동 동기화 트리거
  const triggerSync = useCallback(async (): Promise<boolean> => {
    if (!formData) {
      setSyncError('저장할 데이터가 없습니다.');
      return false;
    }

    return performSync(formData);
  }, [formData, performSync]);

  // 다운로드 (폴백)
  const downloadFile = useCallback(async (): Promise<void> => {
    if (!formData) {
      setSyncError('저장할 데이터가 없습니다.');
      return;
    }

    try {
      await downloadAsDocx(formData);
      setLastSyncAt(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : '다운로드 실패';
      setSyncError(message);
    }
  }, [formData]);

  // formData 변경 시 자동 동기화 (debounce 적용)
  useEffect(() => {
    if (!options.autoSync || !formData || !fsa.fileHandle) {
      return;
    }

    // 데이터 변경 감지 (JSON 비교)
    const formDataStr = JSON.stringify(formData.sections);
    if (formDataStr === lastFormDataRef.current) {
      return;
    }
    lastFormDataRef.current = formDataStr;

    // 기존 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 새 타이머 설정
    debounceTimerRef.current = setTimeout(() => {
      performSync(formData);
    }, options.debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, options.autoSync, options.debounceMs, fsa.fileHandle, performSync]);

  // FSA 에러 동기화
  useEffect(() => {
    if (fsa.error && !syncError) {
      setSyncError(fsa.error);
    }
  }, [fsa.error, syncError]);

  // [FIX] 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (statusResetTimerRef.current) {
        clearTimeout(statusResetTimerRef.current);
      }
    };
  }, []);

  // 상태 객체 구성 - [FIX] useMemo로 안정화
  const state = useMemo<DocumentSyncState>(() => ({
    status,
    isConnected: !!fsa.fileHandle,
    fileName: fsa.fileName,
    lastSyncAt,
    error: syncError,
    isSupported: fsa.isSupported,
  }), [status, fsa.fileHandle, fsa.fileName, lastSyncAt, syncError, fsa.isSupported]);

  return {
    state,
    options,
    setAutoSync,
    connectFile,
    disconnect,
    triggerSync,
    downloadFile,
  };
}
