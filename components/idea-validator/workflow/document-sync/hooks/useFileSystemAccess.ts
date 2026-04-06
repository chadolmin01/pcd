'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { FileSystemFileHandleWithWrite } from '@/lib/document-sync/types';

interface UseFileSystemAccessReturn {
  isSupported: boolean;
  fileHandle: FileSystemFileHandle | null;
  fileName: string | null;
  isConnecting: boolean;
  error: string | null;
  connectFile: (suggestedName?: string) => Promise<boolean>;
  writeToFile: (buffer: BufferSource) => Promise<boolean>;
  disconnect: () => void;
}

/**
 * File System Access API를 래핑하는 훅
 * Chrome/Edge에서 로컬 파일에 직접 쓰기 가능
 */
export function useFileSystemAccess(): UseFileSystemAccessReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);

  // 브라우저 지원 여부 체크
  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
    setIsSupported(supported);
  }, []);

  /**
   * 파일 선택/생성 다이얼로그 표시
   */
  const connectFile = useCallback(async (suggestedName = '지원서.docx'): Promise<boolean> => {
    if (!isSupported) {
      setError('이 브라우저는 File System Access API를 지원하지 않습니다.');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // 파일 저장 다이얼로그 표시
      const handle = await window.showSaveFilePicker!({
        suggestedName,
        types: [
          {
            description: 'Word 문서',
            accept: {
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            },
          },
        ],
        excludeAcceptAllOption: false,
      });

      fileHandleRef.current = handle;
      setFileHandle(handle);
      setFileName(handle.name);
      setError(null);
      return true;
    } catch (err) {
      // 사용자가 취소한 경우
      if (err instanceof Error && err.name === 'AbortError') {
        setError(null);
        return false;
      }
      const message = err instanceof Error ? err.message : '파일 연결 중 오류가 발생했습니다.';
      setError(message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isSupported]);

  /**
   * 연결된 파일에 데이터 쓰기
   */
  const writeToFile = useCallback(async (buffer: BufferSource): Promise<boolean> => {
    const handle = fileHandleRef.current;

    if (!handle) {
      setError('연결된 파일이 없습니다.');
      return false;
    }

    try {
      // 쓰기 스트림 생성
      const writable = await (handle as FileSystemFileHandleWithWrite).createWritable();

      // 버퍼 쓰기
      await writable.write(buffer);

      // 스트림 닫기
      await writable.close();

      setError(null);
      return true;
    } catch (err) {
      let message = '파일 저장 중 오류가 발생했습니다.';

      if (err instanceof Error) {
        // 파일이 다른 프로그램에서 열려 있는 경우
        if (err.name === 'NoModificationAllowedError' || err.message.includes('locked')) {
          message = '파일이 다른 프로그램에서 사용 중입니다. Word를 닫고 다시 시도해주세요.';
        } else if (err.name === 'NotAllowedError') {
          message = '파일 쓰기 권한이 없습니다. 다시 연결해주세요.';
        } else {
          message = err.message;
        }
      }

      setError(message);
      return false;
    }
  }, []);

  /**
   * 파일 연결 해제
   */
  const disconnect = useCallback(() => {
    fileHandleRef.current = null;
    setFileHandle(null);
    setFileName(null);
    setError(null);
  }, []);

  // [FIX] 반환 객체 안정화 - 불필요한 useEffect 재실행 방지
  return useMemo(() => ({
    isSupported,
    fileHandle,
    fileName,
    isConnecting,
    error,
    connectFile,
    writeToFile,
    disconnect,
  }), [isSupported, fileHandle, fileName, isConnecting, error, connectFile, writeToFile, disconnect]);
}
