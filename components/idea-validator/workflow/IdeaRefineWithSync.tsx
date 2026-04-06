'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Link2,
  Link2Off,
  Download,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Sparkles,
  FileDown,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import ChatInterface from '../ChatInterface';
import { useDocumentSync } from './document-sync/hooks/useDocumentSync';
import SyncStatusIndicator from './document-sync/SyncStatusIndicator';
import type { ApplicationFormData } from '@/lib/document-sync/types';
import type { GovernmentProgramConfig, ProgramQuestion } from './types';
import { GOVERNMENT_PROGRAMS } from './types';
import type {
  ValidationLevel,
  PersonaRole,
  InteractionMode,
  ChatMessage,
  Scorecard,
} from '../types';

interface IdeaRefineWithSyncProps {
  programId: string;
  level: ValidationLevel;
  personas: PersonaRole[];
  interactionMode: InteractionMode;
  programQuestions?: ProgramQuestion[];
  onComplete: (
    history: string,
    idea: string,
    reflectedAdvice: string[],
    score?: number,
    messages?: ChatMessage[],
    currentScorecard?: Scorecard,
    category?: string
  ) => void;
  onBack?: () => void;
}

interface DocumentSection {
  id: string;
  title: string;
  content: string;
  aiGenerated: boolean;
}

/**
 * 아이디어 다듬기 + Word 동기화 통합 컴포넌트
 * - 왼쪽: AI 채팅 (ChatInterface)
 * - 오른쪽: 실시간 문서 미리보기 + Word 동기화
 */
export default function IdeaRefineWithSync({
  programId,
  level,
  personas,
  interactionMode,
  programQuestions,
  onComplete,
  onBack,
}: IdeaRefineWithSyncProps) {
  const program = GOVERNMENT_PROGRAMS.find((p) => p.id === programId);

  // 문서 섹션 상태
  const [sections, setSections] = useState<DocumentSection[]>(() => {
    if (!program) return [];
    return program.sections.map((s) => ({
      id: s.id,
      title: s.titleKo,
      content: '',
      aiGenerated: false,
    }));
  });

  // 문서 패널 표시 여부
  const [showDocPanel, setShowDocPanel] = useState(true);

  // 모바일 뷰 상태
  const [mobileView, setMobileView] = useState<'chat' | 'doc'>('chat');

  // 아이디어 제목 (첫 메시지에서 추출)
  const [ideaTitle, setIdeaTitle] = useState<string>('');

  // 대화 내용 추적
  const [conversationSummary, setConversationSummary] = useState<string>('');

  // createdAt 안정화
  const createdAtRef = useRef(new Date());

  // formData 변환 (동기화용)
  const formData = useMemo<ApplicationFormData | null>(() => {
    if (!program) return null;
    return {
      programId: program.id,
      programName: program.nameKo,
      sections: sections.map((s) => ({
        id: s.id,
        titleKo: s.title,
        weight: program.sections.find((ps) => ps.id === s.id)?.weight || 0,
        content: s.content,
      })),
      ideaTitle: ideaTitle || '아이디어 검증 중...',
      createdAt: createdAtRef.current,
      updatedAt: new Date(),
    };
  }, [program, sections, ideaTitle]);

  // 동기화 훅
  const {
    state: syncState,
    options: syncOptions,
    setAutoSync,
    connectFile,
    disconnect,
    triggerSync,
    downloadFile,
  } = useDocumentSync({ formData });

  // 파일 연결 핸들러
  const handleConnectFile = async () => {
    const success = await connectFile();
    if (success) {
      toast.success('Word 파일이 연결되었습니다! 대화하면서 문서가 자동으로 채워집니다.');
    }
  };

  // 대화 내용에서 섹션 업데이트 (AI 응답 기반)
  const updateSectionFromConversation = useCallback(
    (sectionId: string, content: string) => {
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, content, aiGenerated: true }
            : s
        )
      );
    },
    []
  );

  // 섹션 직접 편집
  const updateSectionContent = useCallback((sectionId: string, content: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, content, aiGenerated: false } : s
      )
    );
  }, []);

  // 채팅 완료 핸들러
  const handleChatComplete = useCallback(
    (
      history: string,
      idea: string,
      reflectedAdvice: string[],
      score?: number,
      messages?: ChatMessage[],
      currentScorecard?: Scorecard,
      category?: string
    ) => {
      // 아이디어 제목 추출
      if (!ideaTitle && idea) {
        const title = idea.slice(0, 50) + (idea.length > 50 ? '...' : '');
        setIdeaTitle(title);
      }

      // 대화 요약 저장
      setConversationSummary(history);

      // 섹션에 대화 내용 반영 (간단한 매핑)
      if (messages && messages.length > 0) {
        const userMessages = messages
          .filter((m) => m.isUser)
          .map((m) => m.text || '')
          .join('\n\n');

        // 첫 번째 섹션에 아이디어 개요 저장
        if (sections.length > 0 && !sections[0].content) {
          updateSectionFromConversation(
            sections[0].id,
            `[아이디어 개요]\n${idea}\n\n[검증 대화 요약]\n${history.slice(0, 500)}...`
          );
        }
      }

      // 상위 컴포넌트에 완료 알림
      onComplete(history, idea, reflectedAdvice, score, messages, currentScorecard, category);
    },
    [ideaTitle, sections, updateSectionFromConversation, onComplete]
  );

  // 완료된 섹션 수
  const filledSections = sections.filter((s) => s.content.trim().length > 0).length;
  const totalSections = sections.length;
  const progress = totalSections > 0 ? (filledSections / totalSections) * 100 : 0;

  if (!program) {
    return (
      <div className="h-full flex items-center justify-center text-txt-tertiary">
        프로그램을 찾을 수 없습니다
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row bg-surface-sunken">
      {/* 모바일 탭 바 */}
      <div className="lg:hidden flex border-b border-border bg-surface-card">
        <button
          onClick={() => setMobileView('chat')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            mobileView === 'chat'
              ? 'border-border-strong text-txt-primary bg-surface-sunken'
              : 'border-transparent text-txt-tertiary'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI 대화
        </button>
        <button
          onClick={() => setMobileView('doc')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            mobileView === 'doc'
              ? 'border-border-strong text-status-success-text bg-surface-sunken'
              : 'border-transparent text-txt-tertiary'
          }`}
        >
          <FileText className="w-4 h-4" />
          문서
          {filledSections > 0 && (
            <span className="text-xs bg-surface-sunken text-txt-primary px-1.5 rounded-full">
              {filledSections}
            </span>
          )}
        </button>
      </div>

      {/* 왼쪽: AI 채팅 */}
      <div
        className={`flex-1 flex flex-col bg-surface-card ${
          mobileView !== 'chat' ? 'hidden lg:flex' : 'flex'
        } ${showDocPanel ? 'lg:w-[55%]' : 'lg:w-full'}`}
      >
        <ChatInterface
          onComplete={handleChatComplete}
          level={level}
          personas={personas}
          interactionMode={interactionMode}
          onBack={onBack}
          programQuestions={programQuestions}
          programName={program.nameKo}
        />
      </div>

      {/* 문서 패널 토글 버튼 (데스크톱) */}
      <button
        onClick={() => setShowDocPanel(!showDocPanel)}
        className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-16 bg-surface-card border border-border border-r-0 rounded-l-lg items-center justify-center hover:bg-surface-sunken transition-colors shadow-sm"
        style={{ right: showDocPanel ? 'calc(45% - 12px)' : 0 }}
        aria-label={showDocPanel ? '문서 패널 숨기기' : '문서 패널 보기'}
      >
        {showDocPanel ? (
          <ChevronRight className="w-4 h-4 text-txt-tertiary" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-txt-tertiary" />
        )}
      </button>

      {/* 오른쪽: 문서 미리보기 + Word 동기화 */}
      {showDocPanel && (
        <div
          className={`lg:w-[45%] flex flex-col border-l border-border bg-surface-card ${
            mobileView !== 'doc' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* 문서 헤더 */}
          <div className="p-4 border-b border-border bg-surface-sunken">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-txt-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-status-success-text" />
                {program.nameKo} 지원서
              </h3>

              {/* Word 동기화 상태 */}
              {syncState.isConnected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-card border border-border rounded-lg shadow-sm">
                  <SyncStatusIndicator
                    status={syncState.status}
                    isConnected={syncState.isConnected}
                    fileName={syncState.fileName}
                    lastSyncAt={syncState.lastSyncAt}
                    error={syncState.error}
                    compact
                  />
                  <button
                    onClick={() => setAutoSync(!syncOptions.autoSync)}
                    className="p-1 hover:bg-surface-sunken rounded transition-colors"
                    title={syncOptions.autoSync ? '자동 저장 켜짐' : '자동 저장 꺼짐'}
                    role="switch"
                    aria-checked={syncOptions.autoSync}
                  >
                    {syncOptions.autoSync ? (
                      <ToggleRight className="w-4 h-4 text-txt-secondary" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-txt-tertiary" />
                    )}
                  </button>
                  <button
                    onClick={() => triggerSync()}
                    disabled={syncState.status === 'syncing'}
                    className="p-1 hover:bg-surface-sunken rounded transition-colors"
                    title="수동 동기화"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-status-success-text ${
                        syncState.status === 'syncing' ? 'animate-spin' : ''
                      }`}
                    />
                  </button>
                  <button
                    onClick={disconnect}
                    className="p-1 hover:bg-surface-sunken rounded transition-colors"
                    title="연결 해제"
                  >
                    <Link2Off className="w-4 h-4 text-status-danger-text" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectFile}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-inverse text-txt-inverse rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <Link2 className="w-4 h-4" />
                  Word 연결
                </button>
              )}
            </div>

            {/* 진행률 */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-surface-inverse transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-txt-tertiary font-medium">
                {filledSections}/{totalSections} 섹션
              </span>
            </div>
          </div>

          {/* 문서 내용 미리보기 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 연결 안내 (미연결 시) */}
            {!syncState.isConnected && syncState.isSupported && (
              <div className="p-4 bg-surface-sunken border border-border rounded-xl">
                <div className="flex items-start gap-3">
                  <FileDown className="w-5 h-5 text-txt-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-txt-primary">
                      Word 파일을 연결하세요
                    </p>
                    <p className="text-xs text-txt-secondary mt-1">
                      AI와 대화하면서 문서가 실시간으로 채워집니다.
                      <br />
                      Word에서 파일을 열어두면 변경사항을 바로 확인할 수 있어요!
                    </p>
                    <button
                      onClick={handleConnectFile}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-surface-inverse text-txt-inverse rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                    >
                      <Link2 className="w-4 h-4" />
                      파일 연결하기
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 섹션별 미리보기 */}
            {sections.map((section, idx) => (
              <div
                key={section.id}
                className={`p-4 rounded-xl border transition-all ${
                  section.content
                    ? 'bg-surface-card border-border shadow-sm'
                    : 'bg-surface-sunken border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-txt-primary flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                        section.content
                          ? 'bg-surface-sunken text-txt-primary'
                          : 'bg-border text-txt-tertiary'
                      }`}
                    >
                      {section.content ? <Check className="w-3 h-3" /> : idx + 1}
                    </span>
                    {section.title}
                  </h4>
                  {section.aiGenerated && (
                    <span className="text-[10px] px-2 py-0.5 bg-surface-sunken text-txt-secondary rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </span>
                  )}
                </div>

                {section.content ? (
                  <div className="text-sm text-txt-secondary whitespace-pre-wrap line-clamp-4">
                    {section.content}
                  </div>
                ) : (
                  <p className="text-sm text-txt-tertiary italic">
                    AI와 대화하면 자동으로 채워집니다...
                  </p>
                )}
              </div>
            ))}

            {/* 빈 상태 안내 */}
            {sections.every((s) => !s.content) && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-txt-disabled mx-auto mb-3" />
                <p className="text-txt-tertiary text-sm">
                  왼쪽에서 AI와 대화를 시작하세요.
                  <br />
                  대화 내용이 자동으로 문서에 반영됩니다.
                </p>
              </div>
            )}
          </div>

          {/* 하단 액션 */}
          <div className="p-3 border-t border-border bg-surface-sunken">
            <div className="flex items-center justify-between">
              <button
                onClick={() => downloadFile()}
                className="flex items-center gap-2 px-3 py-2 text-txt-secondary hover:bg-border rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                다운로드
              </button>

              {syncState.isConnected && syncState.lastSyncAt && (
                <span className="text-xs text-txt-tertiary">
                  마지막 저장:{' '}
                  {new Date(syncState.lastSyncAt).toLocaleTimeString('ko-KR')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
