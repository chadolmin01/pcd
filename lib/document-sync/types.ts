// 문서 동기화 관련 타입 정의

export type SyncStatus = 'idle' | 'connecting' | 'syncing' | 'synced' | 'error';

export interface DocumentSyncState {
  status: SyncStatus;
  isConnected: boolean;
  fileName: string | null;
  lastSyncAt: Date | null;
  error: string | null;
  isSupported: boolean; // File System Access API 지원 여부
}

export interface SyncOptions {
  autoSync: boolean;
  debounceMs: number;
  format: 'docx'; // 추후 hwp 추가 가능
}

export const DEFAULT_SYNC_OPTIONS: SyncOptions = {
  autoSync: true,
  debounceMs: 2000,
  format: 'docx',
};

// 지원서 섹션 데이터 구조 (ApplicationFormEditor와 호환)
export interface ApplicationSectionContent {
  content: string;
  aiSuggestion?: string;
  isGenerating?: boolean;
  feedback?: string;
}

export interface ApplicationFormData {
  programId: string;
  programName: string;
  sections: Array<{
    id: string;
    titleKo: string;
    weight: number;
    content: string;
  }>;
  ideaTitle?: string;
  createdAt: Date;
  updatedAt: Date;
}

// File System Access API 타입 확장
export interface FileSystemFileHandleWithWrite extends FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

// Window 타입 확장 (File System Access API)
declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>;
  }
}

export interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
}

export interface OpenFilePickerOptions {
  multiple?: boolean;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
}
