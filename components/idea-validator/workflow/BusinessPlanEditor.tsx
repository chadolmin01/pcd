'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  FileText,
  Link2,
  Link2Off,
  Download,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentSync } from './document-sync/hooks/useDocumentSync';
import SyncStatusIndicator from './document-sync/SyncStatusIndicator';
import type { ApplicationFormData } from '@/lib/document-sync/types';
import {
  FORM_TEMPLATES,
  type FormTemplateType,
  type FormSection,
  type SectionField,
} from '@/lib/types/business-plan';

interface BusinessPlanEditorProps {
  templateType: FormTemplateType;
  initialData?: Record<string, Record<string, string>>;
  ideaTitle?: string;
  onSave?: (data: Record<string, Record<string, string>>) => void;
  onBack?: () => void;
}

/**
 * 사업계획서 에디터 - 실제 양식 기반
 *
 * 왼쪽: 실제 폼 필드 편집
 * 오른쪽: AI 도우미
 */
export default function BusinessPlanEditor({
  templateType,
  initialData,
  ideaTitle = '',
  onSave,
  onBack,
}: BusinessPlanEditorProps) {
  // 템플릿 찾기
  const template = FORM_TEMPLATES.find((t) => t.id === templateType);

  // 폼 데이터 상태
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>(() => {
    if (initialData) return initialData;

    const initial: Record<string, Record<string, string>> = {};
    template?.sections.forEach((section) => {
      initial[section.type] = {};
      section.fields.forEach((field) => {
        initial[section.type][field.id] = '';
      });
    });
    return initial;
  });

  // 현재 선택된 섹션
  const [activeSection, setActiveSection] = useState<string>(
    template?.sections[0]?.type || 'problem'
  );

  // 확장된 섹션들
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([template?.sections[0]?.type || 'problem'])
  );

  // AI 채팅 상태
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([
    {
      role: 'ai',
      content: `안녕하세요! ${template?.name || '사업계획서'} 작성을 도와드릴게요.\n\n각 섹션을 클릭하고 내용을 작성해보세요. 막히는 부분이 있으면 질문해주세요!`,
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeField, setActiveField] = useState<{ section: string; field: string } | null>(null);

  // 모바일 뷰
  const [mobileView, setMobileView] = useState<'form' | 'ai'>('form');

  // Word 동기화용 데이터 변환
  const createdAtRef = useRef(new Date());

  const syncFormData = useMemo<ApplicationFormData | null>(() => {
    if (!template) return null;

    return {
      programId: templateType,
      programName: template.name,
      sections: template.sections.map((section) => ({
        id: section.type,
        titleKo: section.title,
        weight: section.weight,
        content: Object.entries(formData[section.type] || {})
          .map(([fieldId, value]) => {
            const field = section.fields.find((f) => f.id === fieldId);
            return value ? `[${field?.label || fieldId}]\n${value}` : '';
          })
          .filter(Boolean)
          .join('\n\n'),
      })),
      ideaTitle: ideaTitle || '사업계획서',
      createdAt: createdAtRef.current,
      updatedAt: new Date(),
    };
  }, [template, templateType, formData, ideaTitle]);

  // 동기화 훅
  const {
    state: syncState,
    options: syncOptions,
    setAutoSync,
    connectFile,
    disconnect,
    triggerSync,
    downloadFile,
  } = useDocumentSync({ formData: syncFormData });

  // 필드 업데이트
  const updateField = useCallback((sectionType: string, fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [sectionType]: {
        ...prev[sectionType],
        [fieldId]: value,
      },
    }));
  }, []);

  // 섹션 토글
  const toggleSection = useCallback((sectionType: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionType)) {
        next.delete(sectionType);
      } else {
        next.add(sectionType);
      }
      return next;
    });
    setActiveSection(sectionType);
  }, []);

  // AI 메시지 전송
  const sendAiMessage = useCallback(async () => {
    if (!aiInput.trim()) return;

    const userMessage = aiInput.trim();
    setAiInput('');
    setAiMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

    try {
      // TODO: 실제 AI API 호출
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const currentSection = template?.sections.find((s) => s.type === activeSection);
      const aiResponse = `"${currentSection?.title || '이 섹션'}"에 대해 답변드릴게요.\n\n${userMessage}에 대한 내용을 작성할 때는:\n\n1. 구체적인 숫자와 데이터를 포함하세요\n2. 출처를 명시하면 신뢰도가 높아집니다\n3. 문제-해결의 1:1 매칭을 유지하세요\n\n작성 예시를 보여드릴까요?`;

      setAiMessages((prev) => [...prev, { role: 'ai', content: aiResponse }]);
    } catch {
      toast.error('AI 응답 실패');
    } finally {
      setIsAiLoading(false);
    }
  }, [aiInput, activeSection, template]);

  // AI로 필드 생성
  const generateWithAi = useCallback(
    async (sectionType: string, fieldId: string) => {
      const section = template?.sections.find((s) => s.type === sectionType);
      const field = section?.fields.find((f) => f.id === fieldId);

      if (!field) return;

      setIsAiLoading(true);
      setActiveField({ section: sectionType, field: fieldId });

      try {
        // TODO: 실제 AI API 호출
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const generatedContent = `[AI 생성 - ${field.label}]\n\n이 부분은 AI가 자동으로 생성한 내용입니다.\n\n실제 서비스에서는 아이디어 정보를 바탕으로 맞춤형 내용이 생성됩니다.\n\n수정이 필요한 부분을 직접 편집해주세요.`;

        updateField(sectionType, fieldId, generatedContent);
        toast.success(`"${field.label}" 생성 완료`);
      } catch {
        toast.error('AI 생성 실패');
      } finally {
        setIsAiLoading(false);
        setActiveField(null);
      }
    },
    [template, updateField]
  );

  // 완료율 계산
  const completionRate = useMemo(() => {
    if (!template) return 0;

    let filled = 0;
    let total = 0;

    template.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.required) {
          total++;
          if (formData[section.type]?.[field.id]?.trim()) {
            filled++;
          }
        }
      });
    });

    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }, [template, formData]);

  // 파일 연결
  const handleConnectFile = async () => {
    const success = await connectFile();
    if (success) {
      toast.success('Word 파일 연결됨! 작성 내용이 실시간으로 저장됩니다.');
    }
  };

  if (!template) {
    return (
      <div className="h-full flex items-center justify-center text-txt-tertiary">
        템플릿을 찾을 수 없습니다
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row bg-surface-sunken">
      {/* 모바일 탭 */}
      <div className="lg:hidden flex border-b border-border bg-surface-card">
        <button
          onClick={() => setMobileView('form')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            mobileView === 'form'
              ? 'border-border-strong text-txt-primary'
              : 'border-transparent text-txt-tertiary'
          }`}
        >
          <FileText className="w-4 h-4" />
          양식 작성
        </button>
        <button
          onClick={() => setMobileView('ai')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
            mobileView === 'ai'
              ? 'border-border-strong text-txt-secondary'
              : 'border-transparent text-txt-tertiary'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI 도우미
        </button>
      </div>

      {/* 왼쪽: 폼 에디터 */}
      <div
        className={`flex-1 lg:w-[55%] flex flex-col bg-surface-card border-r border-border ${
          mobileView !== 'form' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* 헤더 */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-txt-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-txt-secondary" />
                {template.name}
              </h2>
              <p className="text-sm text-txt-tertiary">{template.description}</p>
            </div>

            {/* Word 동기화 */}
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
                <button
                  onClick={() => setAutoSync(!syncOptions.autoSync)}
                  className="p-1 hover:bg-surface-sunken rounded"
                  title={syncOptions.autoSync ? '자동 저장 ON' : '자동 저장 OFF'}
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
                  className="p-1 hover:bg-surface-sunken rounded"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-status-success-text ${
                      syncState.status === 'syncing' ? 'animate-spin' : ''
                    }`}
                  />
                </button>
                <button onClick={disconnect} className="p-1 hover:bg-surface-sunken rounded">
                  <Link2Off className="w-4 h-4 text-status-danger-text" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectFile}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface-inverse text-txt-inverse rounded-lg hover:bg-gray-800 text-sm font-medium"
              >
                <Link2 className="w-4 h-4" />
                Word 연결
              </button>
            )}
          </div>

          {/* 진행률 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-surface-sunken rounded-full overflow-hidden">
              <div
                className="h-full bg-surface-sunken0 transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="text-sm font-medium text-txt-secondary">{completionRate}%</span>
          </div>
        </div>

        {/* 섹션 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {template.sections.map((section) => (
            <div
              key={section.type}
              className={`border rounded-xl overflow-hidden transition-all ${
                activeSection === section.type
                  ? 'border-border-strong shadow-sm'
                  : 'border-border'
              }`}
            >
              {/* 섹션 헤더 */}
              <button
                onClick={() => toggleSection(section.type)}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                  activeSection === section.type ? 'bg-surface-sunken' : 'bg-surface-card hover:bg-surface-sunken'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      Object.values(formData[section.type] || {}).some((v) => v?.trim())
                        ? 'bg-surface-sunken text-txt-primary'
                        : 'bg-surface-sunken text-txt-tertiary'
                    }`}
                  >
                    {Object.values(formData[section.type] || {}).some((v) => v?.trim()) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      template.sections.indexOf(section) + 1
                    )}
                  </span>
                  <div>
                    <h3 className="font-semibold text-txt-primary">{section.title}</h3>
                    <p className="text-xs text-txt-tertiary">배점 {section.weight}점</p>
                  </div>
                </div>
                {expandedSections.has(section.type) ? (
                  <ChevronUp className="w-5 h-5 text-txt-tertiary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-txt-tertiary" />
                )}
              </button>

              {/* 섹션 필드들 */}
              {expandedSections.has(section.type) && (
                <div className="p-4 pt-0 space-y-4 bg-surface-card">
                  {section.fields.map((field) => (
                    <div key={field.id}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-txt-secondary">
                          {field.label}
                          {field.required && <span className="text-status-danger-text ml-1">*</span>}
                        </label>
                        {field.aiGeneratable && (
                          <button
                            onClick={() => generateWithAi(section.type, field.id)}
                            disabled={isAiLoading}
                            className="flex items-center gap-1 text-xs text-txt-secondary hover:text-txt-secondary disabled:opacity-50"
                          >
                            {isAiLoading &&
                            activeField?.section === section.type &&
                            activeField?.field === field.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            AI 생성
                          </button>
                        )}
                      </div>
                      <textarea
                        value={formData[section.type]?.[field.id] || ''}
                        onChange={(e) => updateField(section.type, field.id, e.target.value)}
                        placeholder={field.placeholder || `${field.label}을(를) 작성하세요...`}
                        className="w-full h-32 p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-border-strong focus:border-transparent text-sm"
                      />
                      {field.helpText && (
                        <p className="mt-1 text-xs text-txt-tertiary">{field.helpText}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 하단 액션 */}
        <div className="p-4 border-t border-border bg-surface-sunken">
          <div className="flex items-center justify-between">
            <button
              onClick={() => downloadFile()}
              className="flex items-center gap-2 px-4 py-2 text-txt-secondary hover:bg-border rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              다운로드
            </button>
            <button
              onClick={() => onSave?.(formData)}
              className="flex items-center gap-2 px-6 py-2 bg-surface-inverse text-txt-inverse rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <Check className="w-4 h-4" />
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽: AI 도우미 */}
      <div
        className={`lg:w-[45%] flex flex-col bg-surface-sunken ${
          mobileView !== 'ai' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* AI 헤더 */}
        <div className="p-4 border-b border-border bg-surface-card">
          <h3 className="font-bold text-txt-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-txt-tertiary" />
            AI 작성 도우미
          </h3>
          <p className="text-sm text-txt-tertiary mt-1">
            현재 섹션: {template.sections.find((s) => s.type === activeSection)?.title}
          </p>
        </div>

        {/* 채팅 메시지 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {aiMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-surface-inverse text-txt-inverse rounded-br-md'
                    : 'bg-surface-card border border-border text-txt-secondary rounded-bl-md shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isAiLoading && !activeField && (
            <div className="flex justify-start">
              <div className="p-3 bg-surface-card border border-border rounded-2xl rounded-bl-md shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-txt-tertiary" />
              </div>
            </div>
          )}
        </div>

        {/* 빠른 질문 */}
        <div className="px-4 py-2 border-t border-border bg-surface-card">
          <p className="text-[10px] text-txt-tertiary mb-2">빠른 질문</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAiInput('이 섹션 어떻게 작성하면 좋을까요?')}
              className="text-xs px-3 py-1.5 bg-surface-sunken text-txt-secondary rounded-full hover:bg-border"
            >
              작성 방법
            </button>
            <button
              onClick={() => setAiInput('예시를 보여주세요')}
              className="text-xs px-3 py-1.5 bg-surface-sunken text-txt-secondary rounded-full hover:bg-border"
            >
              예시 보기
            </button>
            <button
              onClick={() => setAiInput('평가위원이 중요하게 보는 포인트는?')}
              className="text-xs px-3 py-1.5 bg-surface-sunken text-txt-secondary rounded-full hover:bg-border"
            >
              평가 포인트
            </button>
          </div>
        </div>

        {/* 입력창 */}
        <div className="p-4 border-t border-border bg-surface-card">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendAiMessage()}
              placeholder="AI에게 질문하세요..."
              className="flex-1 px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-border-strong text-sm"
            />
            <button
              onClick={sendAiMessage}
              disabled={!aiInput.trim() || isAiLoading}
              className="p-2.5 bg-surface-inverse text-txt-inverse rounded-xl hover:bg-gray-800 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
