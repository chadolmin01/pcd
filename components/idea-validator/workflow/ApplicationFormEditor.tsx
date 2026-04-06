'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  FileText,
  Sparkles,
  ChevronRight,
  Check,
  Loader2,
  Send,
  RefreshCw,
  Lightbulb,
  Search,
  Globe,
  TrendingUp,
  Link2,
  Link2Off,
  Download,
  FileDown,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { GovernmentSection } from './types';
import { GOVERNMENT_PROGRAMS } from './types';
import type { ApplicationFormData } from '@/lib/document-sync/types';
import { useDocumentSync } from './document-sync/hooks/useDocumentSync';
import SyncStatusIndicator from './document-sync/SyncStatusIndicator';

interface ApplicationFormEditorProps {
  programId: string;
  ideaData?: {
    title: string;
    problemDefinition?: string;
    solution?: string;
    targetCustomer?: string;
    marketSize?: string;
    businessModel?: string;
    team?: string;
  };
  onComplete: (formData: Record<string, string>) => void;
  onBack: () => void;
}

interface SectionContent {
  content: string;
  aiSuggestion?: string;
  isGenerating?: boolean;
  feedback?: string;
}

export default function ApplicationFormEditor({
  programId,
  ideaData,
  onComplete,
  onBack,
}: ApplicationFormEditorProps) {
  const program = GOVERNMENT_PROGRAMS.find(p => p.id === programId);

  // 섹션별 내용 상태
  const [sectionContents, setSectionContents] = useState<Record<string, SectionContent>>(() => {
    const initial: Record<string, SectionContent> = {};
    program?.sections.forEach(section => {
      initial[section.id] = { content: '' };
    });
    return initial;
  });

  // 현재 활성 섹션
  const [activeSection, setActiveSection] = useState<string>(program?.sections[0]?.id || '');

  // AI 채팅 상태
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'ai' | 'search'; content: string; searchQuery?: string}>>([
    { role: 'ai', content: '안녕하세요! 지원서 작성을 도와드릴게요. 각 섹션을 클릭하면 해당 항목에 대한 조언을 드릴 수 있어요. 시장 데이터가 필요하면 웹 검색 기능을 사용해보세요!' }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Word 동기화 안내 배너 표시 여부
  const [showSyncBanner, setShowSyncBanner] = useState(true);

  // 모바일에서 패널 전환 (반응형)
  const [mobileView, setMobileView] = useState<'form' | 'ai'>('form');

  // [FIX] formData 변환 (동기화용) - createdAt 안정화
  const createdAtRef = useRef(new Date());

  const formData = useMemo<ApplicationFormData | null>(() => {
    if (!program) return null;
    return {
      programId: program.id,
      programName: program.nameKo,
      sections: program.sections.map((section) => ({
        id: section.id,
        titleKo: section.titleKo,
        weight: section.weight,
        content: sectionContents[section.id]?.content || '',
      })),
      ideaTitle: ideaData?.title,
      createdAt: createdAtRef.current,
      updatedAt: new Date(),
    };
  }, [program, sectionContents, ideaData?.title]);

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

  // 섹션 완료 여부 확인
  const isSectionComplete = (sectionId: string) => {
    const content = sectionContents[sectionId]?.content || '';
    return content.trim().length >= 50; // 최소 50자 이상
  };

  // 완료된 섹션 수
  const completedCount = program?.sections.filter(s => isSectionComplete(s.id)).length || 0;
  const totalCount = program?.sections.length || 0;

  // AI 초안 생성
  const generateDraft = useCallback(async (sectionId: string) => {
    const section = program?.sections.find(s => s.id === sectionId);
    if (!section) return;

    setSectionContents(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], isGenerating: true }
    }));

    try {
      // TODO: 실제 AI API 호출
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 임시 생성 텍스트
      const draftContent = generateMockDraft(section, ideaData);

      setSectionContents(prev => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          content: draftContent,
          isGenerating: false
        }
      }));

      toast.success('초안이 생성되었습니다');
    } catch (error) {
      toast.error('초안 생성 실패');
      setSectionContents(prev => ({
        ...prev,
        [sectionId]: { ...prev[sectionId], isGenerating: false }
      }));
    }
  }, [program, ideaData]);

  // AI 피드백 요청
  const requestFeedback = useCallback(async (sectionId: string) => {
    const content = sectionContents[sectionId]?.content;
    if (!content || content.trim().length < 20) {
      toast.error('피드백을 받으려면 먼저 내용을 작성해주세요');
      return;
    }

    setIsAiLoading(true);

    try {
      // TODO: 실제 AI API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));

      const section = program?.sections.find(s => s.id === sectionId);
      const feedback = `"${section?.titleKo}" 섹션을 검토했습니다.\n\n좋은 점:\n- 문제 상황이 명확하게 정의되어 있습니다\n\n개선 제안:\n- 구체적인 수치나 데이터를 추가하면 더 설득력이 높아질 것 같아요\n- 타겟 고객층을 더 세분화해보시면 어떨까요?`;

      setAiMessages(prev => [...prev, { role: 'ai', content: feedback }]);
    } catch (error) {
      toast.error('피드백 요청 실패');
    } finally {
      setIsAiLoading(false);
    }
  }, [sectionContents, program]);

  // AI 채팅 전송
  const sendAiMessage = useCallback(async () => {
    if (!aiInput.trim()) return;

    const userMessage = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

    try {
      // TODO: 실제 AI API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));

      const aiResponse = `네, "${userMessage}"에 대해 답변드릴게요.\n\n지원서에서 이 부분을 강조하실 때는 구체적인 사례나 수치를 함께 제시하면 좋습니다. 예를 들어, 문제의 규모를 나타내는 통계나 기존 솔루션의 한계를 보여주는 데이터가 있다면 포함해주세요.`;

      setAiMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      toast.error('응답 실패');
    } finally {
      setIsAiLoading(false);
    }
  }, [aiInput]);

  // 웹 검색 실행
  const executeWebSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setAiMessages(prev => [...prev, {
      role: 'search',
      content: `🔍 검색 중: "${query}"`,
      searchQuery: query
    }]);

    try {
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          context: `지원서 작성 중인 아이디어: ${ideaData?.title || '헬스케어 서비스'}`,
        }),
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();

      if (data.success) {
        setAiMessages(prev => [...prev, {
          role: 'ai',
          content: `📊 **검색 결과: "${query}"**\n\n${data.data.result}`
        }]);
        toast.success('검색 완료! 결과를 확인하세요.');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Web search error:', error);
      setAiMessages(prev => [...prev, {
        role: 'ai',
        content: '검색 중 오류가 발생했습니다. 다시 시도해주세요.'
      }]);
      toast.error('검색 실패');
    } finally {
      setIsSearching(false);
    }
  }, [ideaData]);

  // 내용 변경
  const updateContent = (sectionId: string, content: string) => {
    setSectionContents(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], content }
    }));
  };

  // 완료 처리
  const handleComplete = () => {
    const formDataResult: Record<string, string> = {};
    Object.entries(sectionContents).forEach(([id, data]) => {
      formDataResult[id] = data.content;
    });
    onComplete(formDataResult);
  };

  // 파일 연결 핸들러
  const handleConnectFile = async () => {
    const success = await connectFile();
    if (success) {
      setShowSyncBanner(false);
      toast.success('Word 파일이 연결되었습니다! 작성 내용이 자동으로 저장됩니다.');
    }
  };

  if (!program) {
    return <div className="p-8 text-center text-txt-tertiary">프로그램을 찾을 수 없습니다</div>;
  }

  const activeIndex = program.sections.findIndex(s => s.id === activeSection);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-surface-sunken">
      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex border-b border-border bg-surface-card">
        <button
          onClick={() => setMobileView('form')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            mobileView === 'form'
              ? 'border-border-strong text-txt-primary bg-surface-sunken'
              : 'border-transparent text-txt-tertiary'
          }`}
        >
          <FileText className="w-4 h-4" />
          지원서 작성
        </button>
        <button
          onClick={() => setMobileView('ai')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            mobileView === 'ai'
              ? 'border-border-strong text-txt-secondary bg-surface-sunken'
              : 'border-transparent text-txt-tertiary'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI 도우미
        </button>
      </div>

      {/* Left Panel: Form */}
      <div className={`w-full lg:w-[55%] flex flex-col border-r border-border bg-surface-card ${mobileView !== 'form' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Word 동기화 안내 배너 (미연결 시) - 모바일 반응형 개선 */}
        {showSyncBanner && !syncState.isConnected && syncState.isSupported && (
          <div className="bg-surface-inverse text-txt-inverse p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-surface-card/20 flex items-center justify-center shrink-0">
                  <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">Word 파일과 실시간 동기화</h3>
                  <p className="text-xs text-txt-inverse/70 mt-1 hidden sm:block">
                    파일을 연결하면 작성 내용이 자동으로 Word 문서에 저장됩니다.
                    <br />
                    Word에서 파일을 열어두고 실시간으로 확인하세요!
                  </p>
                  <p className="text-xs text-txt-inverse/70 mt-1 sm:hidden">
                    작성 내용이 자동으로 저장됩니다.
                  </p>
                </div>
                {/* 모바일에서 닫기 버튼 우측 상단 */}
                <button
                  onClick={() => setShowSyncBanner(false)}
                  className="sm:hidden p-1.5 hover:bg-surface-card/20 rounded-lg transition-colors"
                  aria-label="동기화 안내 배너 닫기"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleConnectFile}
                  className="flex-1 sm:flex-none px-4 py-2 bg-surface-card text-txt-primary rounded-lg text-sm font-semibold hover:bg-surface-sunken transition-colors flex items-center justify-center gap-2"
                  aria-label="Word 파일 연결"
                >
                  <Link2 className="w-4 h-4" aria-hidden="true" />
                  파일 연결
                </button>
                {/* 데스크톱 닫기 버튼 */}
                <button
                  onClick={() => setShowSyncBanner(false)}
                  className="hidden sm:flex p-2 hover:bg-surface-card/20 rounded-lg transition-colors min-w-[36px] min-h-[36px] items-center justify-center"
                  aria-label="동기화 안내 배너 닫기"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Header with Sync Status */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-txt-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-txt-secondary" />
              {program.nameKo} 지원서
            </h2>

            {/* 동기화 상태 표시 (항상 보임) */}
            <div className="flex items-center gap-3">
              {syncState.isConnected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-sunken border border-border rounded-lg">
                  <SyncStatusIndicator
                    status={syncState.status}
                    isConnected={syncState.isConnected}
                    fileName={syncState.fileName}
                    lastSyncAt={syncState.lastSyncAt}
                    error={syncState.error}
                    compact
                  />
                  {/* 자동 저장 토글 */}
                  <button
                    onClick={() => setAutoSync(!syncOptions.autoSync)}
                    className="p-1.5 hover:bg-surface-sunken rounded transition-colors flex items-center gap-1"
                    title={syncOptions.autoSync ? '자동 저장 켜짐' : '자동 저장 꺼짐'}
                    aria-label="자동 저장 토글"
                    role="switch"
                    aria-checked={syncOptions.autoSync}
                  >
                    {syncOptions.autoSync ? (
                      <ToggleRight className="w-4 h-4 text-txt-secondary" aria-hidden="true" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-txt-tertiary" aria-hidden="true" />
                    )}
                  </button>
                  <div className="w-px h-4 bg-border" />
                  <button
                    onClick={() => triggerSync()}
                    disabled={syncState.status === 'syncing'}
                    className="p-1.5 hover:bg-surface-sunken rounded transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                    title="수동 동기화"
                    aria-label="수동 동기화"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-status-success-text ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => downloadFile()}
                    className="p-1.5 hover:bg-surface-sunken rounded transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                    title="별도 파일로 다운로드"
                    aria-label="다운로드"
                  >
                    <Download className="w-3.5 h-3.5 text-status-success-text" aria-hidden="true" />
                  </button>
                  <div className="w-px h-4 bg-border" />
                  <button
                    onClick={disconnect}
                    className="p-1.5 hover:bg-surface-sunken rounded transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                    title="연결 해제"
                    aria-label="파일 연결 해제"
                  >
                    <Link2Off className="w-3.5 h-3.5 text-status-danger-text" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectFile}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-sunken text-txt-secondary rounded-lg hover:bg-border transition-colors text-sm"
                >
                  {syncState.isSupported ? (
                    <>
                      <Link2 className="w-4 h-4" />
                      Word 연결
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      다운로드
                    </>
                  )}
                </button>
              )}
              <div className="text-sm text-txt-tertiary">
                {completedCount}/{totalCount} 완료
              </div>
            </div>
          </div>
          <div className="w-full h-2 bg-surface-sunken rounded-full overflow-hidden">
            <div
              className="h-full bg-surface-sunken0 transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Section Tabs - 스크롤 힌트 추가 */}
        <div className="flex border-b border-border overflow-x-auto scrollbar-hide relative">
          {/* 모바일 스크롤 힌트 (그라데이션) */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none lg:hidden z-10" />
          {program.sections.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeSection === section.id
                  ? 'border-border-strong text-txt-primary bg-surface-sunken'
                  : 'border-transparent text-txt-tertiary hover:text-txt-secondary hover:bg-surface-sunken'
                }
              `}
            >
              {isSectionComplete(section.id) ? (
                <Check className="w-4 h-4 text-status-success-text" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-border text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
              )}
              {section.titleKo}
              <span className="text-xs text-txt-tertiary">({section.weight}점)</span>
            </button>
          ))}
        </div>

        {/* Active Section Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {program.sections.map(section => (
            <div
              key={section.id}
              className={activeSection === section.id ? 'block' : 'hidden'}
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-txt-primary mb-1">{section.titleKo}</h3>
                <p className="text-sm text-txt-tertiary">배점: {section.weight}점</p>
              </div>

              {/* Fields hint */}
              <div className="mb-4 p-3 bg-surface-sunken rounded-lg">
                <p className="text-sm text-txt-secondary flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>포함할 내용: {section.fields.join(', ')}</span>
                </p>
              </div>

              {/* Content textarea */}
              <div className="relative">
                <textarea
                  value={sectionContents[section.id]?.content || ''}
                  onChange={(e) => updateContent(section.id, e.target.value)}
                  placeholder={`${section.titleKo}에 대한 내용을 작성해주세요...`}
                  className="w-full h-64 p-4 border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-border-strong focus:border-transparent"
                  disabled={sectionContents[section.id]?.isGenerating}
                />
                {sectionContents[section.id]?.isGenerating && (
                  <div className="absolute inset-0 bg-surface-card/80 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-6 h-6 animate-spin text-txt-secondary" />
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generateDraft(section.id)}
                    disabled={sectionContents[section.id]?.isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-sunken text-txt-secondary rounded-lg hover:bg-border transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI 초안 생성
                  </button>
                  <button
                    onClick={() => requestFeedback(section.id)}
                    disabled={isAiLoading || !sectionContents[section.id]?.content}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-sunken text-txt-secondary rounded-lg hover:bg-border transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    피드백 받기
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {/* 자동 저장 상태 */}
                  {syncState.isConnected && syncState.status === 'synced' && (
                    <span className="text-xs text-status-success-text flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      저장됨
                    </span>
                  )}
                  <div className="text-sm text-txt-tertiary">
                    {(sectionContents[section.id]?.content || '').length}자
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-border-subtle">
                <button
                  onClick={() => {
                    const prevIdx = activeIndex - 1;
                    if (prevIdx >= 0) setActiveSection(program.sections[prevIdx].id);
                  }}
                  disabled={activeIndex === 0}
                  className="text-sm text-txt-tertiary hover:text-txt-secondary disabled:opacity-30"
                >
                  ← 이전 항목
                </button>
                {activeIndex < program.sections.length - 1 ? (
                  <button
                    onClick={() => {
                      const nextIdx = activeIndex + 1;
                      if (nextIdx < program.sections.length) {
                        setActiveSection(program.sections[nextIdx].id);
                      }
                    }}
                    className="flex items-center gap-1 text-sm text-txt-primary hover:text-txt-secondary font-medium"
                  >
                    다음 항목 <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-inverse text-txt-inverse rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    <Check className="w-4 h-4" />
                    작성 완료
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Right Panel: AI Assistant */}
      <div className={`w-full lg:w-[45%] flex flex-col bg-surface-sunken ${mobileView !== 'ai' ? 'hidden lg:flex' : 'flex'}`}>
        {/* AI Header */}
        <div className="p-4 border-b border-border bg-surface-card">
          <h3 className="font-bold text-txt-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-txt-tertiary" />
            AI 작성 도우미
          </h3>
          <p className="text-sm text-txt-tertiary mt-1">질문하거나 피드백을 요청하세요</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {aiMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap
                  ${msg.role === 'user'
                    ? 'bg-surface-inverse text-txt-inverse rounded-br-md'
                    : msg.role === 'search'
                    ? 'bg-surface-sunken border border-border text-txt-secondary rounded-bl-md flex items-center gap-2'
                    : 'bg-surface-card border border-border text-txt-secondary rounded-bl-md shadow-sm'
                  }
                `}
              >
                {msg.role === 'search' && <Search className="w-4 h-4 animate-pulse" />}
                {msg.content}
              </div>
            </div>
          ))}
          {(isAiLoading || isSearching) && (
            <div className="flex justify-start">
              <div className={`p-3 rounded-2xl rounded-bl-md shadow-sm flex items-center gap-2 ${isSearching ? 'bg-surface-sunken border border-border' : 'bg-surface-card border border-border'}`}>
                <Loader2 className={`w-5 h-5 animate-spin ${isSearching ? 'text-txt-secondary' : 'text-txt-tertiary'}`} />
                {isSearching && <span className="text-sm text-txt-primary">검색 중...</span>}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t border-border bg-surface-card">
          <p className="text-[10px] text-txt-tertiary mb-2">빠른 질문</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setAiInput('이 섹션을 어떻게 작성하면 좋을까요?')}
              className="text-xs px-3 py-1.5 bg-surface-sunken text-txt-secondary rounded-full hover:bg-border transition-colors"
            >
              작성 방법
            </button>
            <button
              onClick={() => setAiInput('평가위원이 중요하게 보는 포인트가 뭐예요?')}
              className="text-xs px-3 py-1.5 bg-surface-sunken text-txt-secondary rounded-full hover:bg-border transition-colors"
            >
              평가 포인트
            </button>
            <button
              onClick={() => setAiInput('예시를 보여주세요')}
              className="text-xs px-3 py-1.5 bg-surface-sunken text-txt-secondary rounded-full hover:bg-border transition-colors"
            >
              예시 요청
            </button>
          </div>

          {/* Web Search Actions */}
          <p className="text-[10px] text-txt-tertiary mb-2 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            웹 검색
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => executeWebSearch(`${ideaData?.title || '헬스케어'} 시장 규모 2024 2025`)}
              disabled={isSearching}
              className="text-xs px-3 py-1.5 bg-surface-sunken text-txt-primary rounded-full hover:bg-surface-sunken transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <TrendingUp className="w-3 h-3" />
              시장 규모
            </button>
            <button
              onClick={() => executeWebSearch(`${ideaData?.title || '헬스케어'} 경쟁사 분석 스타트업`)}
              disabled={isSearching}
              className="text-xs px-3 py-1.5 bg-surface-sunken text-txt-primary rounded-full hover:bg-surface-sunken transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <Search className="w-3 h-3" />
              경쟁사 분석
            </button>
            <button
              onClick={() => executeWebSearch(`${ideaData?.title || '헬스케어'} 정부 정책 규제 2024`)}
              disabled={isSearching}
              className="text-xs px-3 py-1.5 bg-surface-sunken text-txt-primary rounded-full hover:bg-surface-sunken transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <Globe className="w-3 h-3" />
              정책/규제
            </button>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-border bg-surface-card">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendAiMessage()}
              placeholder="AI에게 질문하세요..."
              className="flex-1 px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-border-strong focus:border-transparent text-sm"
            />
            <button
              onClick={sendAiMessage}
              disabled={!aiInput.trim() || isAiLoading}
              className="p-2.5 bg-surface-inverse text-txt-inverse rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock draft generation (임시)
function generateMockDraft(section: GovernmentSection, ideaData?: ApplicationFormEditorProps['ideaData']): string {
  const templates: Record<string, string> = {
    problem: `[문제 인식]

1. 시장 현황
현재 ${ideaData?.targetCustomer || '타겟 고객'}이 직면한 주요 문제는 ${ideaData?.problemDefinition || '아직 정의되지 않음'}입니다.

2. 문제 정의
기존 솔루션들은 다음과 같은 한계를 가지고 있습니다:
- 높은 비용 구조
- 복잡한 사용 방식
- 제한된 접근성

3. 개발 필요성
이러한 문제를 해결하기 위해 새로운 접근 방식이 필요합니다.`,

    solution: `[실현 가능성]

1. 개발 계획
${ideaData?.solution || '솔루션 설명'}을 통해 문제를 해결하고자 합니다.

2. 차별성
기존 경쟁 서비스 대비 다음과 같은 차별점을 가집니다:
- 사용자 중심의 직관적인 인터페이스
- AI 기반의 자동화된 프로세스
- 합리적인 가격 정책

3. 경쟁력
핵심 기술과 팀의 전문성을 바탕으로 시장에서 경쟁력을 확보할 수 있습니다.`,

    growth: `[성장 전략]

1. 비즈니스 모델
${ideaData?.businessModel || '수익 모델'}을 통해 수익을 창출합니다.

2. 시장 규모 (TAM/SAM/SOM)
- TAM (전체 시장): ${ideaData?.marketSize || '시장 규모'}
- SAM (유효 시장): TAM의 약 30%
- SOM (초기 목표): 1년 내 1% 점유율 달성

3. 사업화 로드맵
- 1년차: MVP 출시 및 초기 사용자 확보
- 2년차: 서비스 고도화 및 수익화
- 3년차: 시장 확장 및 신규 서비스 런칭`,

    team: `[팀 구성]

1. 대표자 역량
${ideaData?.team || '대표자 정보'}

2. 팀원 구성
- 기술 개발: 관련 분야 경력자
- 비즈니스: 사업 개발 및 마케팅 담당
- 디자인: UX/UI 전문가

3. 팀 시너지
각 분야의 전문가로 구성되어 효율적인 협업이 가능합니다.`,
  };

  return templates[section.id] || `[${section.titleKo}]\n\n이 섹션의 내용을 작성해주세요.`;
}
