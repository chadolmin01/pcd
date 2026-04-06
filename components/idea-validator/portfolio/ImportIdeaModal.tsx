'use client';

import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Loader2, FileText, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import type { IdeaCore, IdeaVersion } from '@/lib/portfolio/types';
import mammoth from 'mammoth';

// 카테고리 옵션
const CATEGORY_OPTIONS = [
  { value: 'ai-ml', label: 'AI/ML' },
  { value: 'saas', label: 'SaaS' },
  { value: 'healthcare', label: '헬스케어' },
  { value: 'fintech', label: '핀테크' },
  { value: 'ecommerce', label: '이커머스' },
  { value: 'edutech', label: '에듀테크' },
  { value: 'foodtech', label: '푸드테크' },
  { value: 'mobility', label: '모빌리티' },
  { value: 'other', label: '기타' },
] as const;

// 허용된 파일 확장자
const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.docx'];

// AI 분석 결과 타입
interface ParsedIdeaData {
  title: string;
  category: string;
  oneLiner: string;
  problemDefinition: {
    marketStatus: string;
    problemStatement: string;
    necessity: string;
  };
  solution: {
    overview: string;
    coreFeatures: string[];
    techStack: string[];
    differentiation: string;
  };
  market: {
    targetCustomer: string;
    marketSize: string;
    competitors: string[];
  };
  businessModel: {
    revenueModel: string;
    pricingStrategy: string;
    growthPlan: string;
  };
  team: {
    founderBackground: string;
    teamComposition: string;
    capabilities: string[];
  };
  extractedSections: string[];
  confidence: number;
  missingInfo: string[];
}

interface ImportIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (ideaCore: IdeaCore, ideaVersion: IdeaVersion) => void;
}

// 안전하게 배열 접근
function safeArray(arr: unknown): string[] {
  if (Array.isArray(arr)) {
    return arr.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

// 안전하게 문자열 접근
function safeString(str: unknown): string {
  return typeof str === 'string' ? str : '';
}

// 안전하게 숫자 접근
function safeNumber(num: unknown, defaultValue: number = 0): number {
  return typeof num === 'number' && !isNaN(num) ? num : defaultValue;
}

export default function ImportIdeaModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: ImportIdeaModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 파일 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedIdeaData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 유효성 검사
  const isValid = title.trim().length >= 1 &&
                  title.trim().length <= 200 &&
                  category !== '' &&
                  oneLiner.trim().length >= 1 &&
                  oneLiner.trim().length <= 500;

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setOneLiner('');
    setError(null);
    setUploadedFile(null);
    setFileContent('');
    setParsedData(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 파일 확장자 검증
  const isValidFileType = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_EXTENSIONS.includes(extension);
  };

  // 파일 내용 읽기
  const readFileContent = async (file: File): Promise<string> => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (extension === '.docx') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value || '';
      } catch (err) {
        console.error('DOCX parsing error:', err);
        throw new Error('Word 문서를 읽을 수 없습니다. 파일이 손상되었거나 지원하지 않는 형식입니다.');
      }
    } else {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          resolve(typeof result === 'string' ? result : '');
        };
        reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
        reader.readAsText(file);
      });
    }
  };

  // AI 분석 호출
  const analyzeContent = async (content: string) => {
    if (!content || content.trim().length === 0) {
      setError('파일 내용이 비어있습니다.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/portfolio/parse-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류 (${response.status})`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '분석에 실패했습니다.');
      }

      if (!data.data) {
        throw new Error('분석 결과가 없습니다.');
      }

      const parsed = data.data as ParsedIdeaData;
      setParsedData(parsed);

      // 폼 자동 채우기 (값이 있을 때만)
      const parsedTitle = safeString(parsed.title);
      const parsedCategory = safeString(parsed.category);
      const parsedOneLiner = safeString(parsed.oneLiner);

      if (parsedTitle) setTitle(parsedTitle);
      if (parsedCategory && CATEGORY_OPTIONS.some(opt => opt.value === parsedCategory)) {
        setCategory(parsedCategory);
      }
      if (parsedOneLiner) setOneLiner(parsedOneLiner);

    } catch (err) {
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다.';
      setError(errorMessage);
      // 분석 실패해도 파일은 유지
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 파일 처리
  const handleFile = useCallback(async (file: File) => {
    if (!isValidFileType(file)) {
      setError('지원하지 않는 파일 형식입니다. (.txt, .md, .docx만 가능)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB 제한
      setError('파일이 너무 큽니다. (최대 10MB)');
      return;
    }

    setIsParsingFile(true);
    setError(null);
    setParsedData(null);

    try {
      const content = await readFileContent(file);

      if (!content || content.trim().length === 0) {
        throw new Error('파일 내용이 비어있습니다.');
      }

      setUploadedFile(file);
      setFileContent(content);

      // AI 분석 시작
      await analyzeContent(content);

    } catch (err) {
      console.error('File parsing error:', err);
      const errorMessage = err instanceof Error ? err.message : '파일을 읽는 중 오류가 발생했습니다.';
      setError(errorMessage);
      setUploadedFile(null);
      setFileContent('');
    } finally {
      setIsParsingFile(false);
    }
  }, []);

  // 드래그 이벤트 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  // 파일 제거
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileContent('');
    setParsedData(null);
    setTitle('');
    setCategory('');
    setOneLiner('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 분석 결과를 요약 문자열로 변환
  const buildChatSummary = (data: ParsedIdeaData | null): string => {
    if (!data) return '';

    const sections: string[] = [];

    // problemDefinition null 체크
    const problemDef = data.problemDefinition || {};
    const problemStatement = safeString(problemDef.problemStatement);
    const marketStatus = safeString(problemDef.marketStatus);
    const necessity = safeString(problemDef.necessity);

    if (problemStatement || marketStatus) {
      sections.push(`## 문제 정의\n- 시장 현황: ${marketStatus || '미정의'}\n- 핵심 문제: ${problemStatement || '미정의'}\n- 필요성: ${necessity || '미정의'}`);
    }

    // solution null 체크
    const sol = data.solution || {};
    const overview = safeString(sol.overview);
    const coreFeatures = safeArray(sol.coreFeatures);
    const techStack = safeArray(sol.techStack);
    const differentiation = safeString(sol.differentiation);

    if (overview || coreFeatures.length > 0) {
      sections.push(`## 솔루션\n- 개요: ${overview || '미정의'}\n- 핵심 기능: ${coreFeatures.length > 0 ? coreFeatures.join(', ') : '미정의'}\n- 기술 스택: ${techStack.length > 0 ? techStack.join(', ') : '미정의'}\n- 차별화: ${differentiation || '미정의'}`);
    }

    // market null 체크
    const mkt = data.market || {};
    const targetCustomer = safeString(mkt.targetCustomer);
    const marketSize = safeString(mkt.marketSize);
    const competitors = safeArray(mkt.competitors);

    if (targetCustomer || marketSize) {
      sections.push(`## 시장 분석\n- 타겟 고객: ${targetCustomer || '미정의'}\n- 시장 규모: ${marketSize || '미정의'}\n- 경쟁사: ${competitors.length > 0 ? competitors.join(', ') : '미정의'}`);
    }

    // businessModel null 체크
    const biz = data.businessModel || {};
    const revenueModel = safeString(biz.revenueModel);
    const pricingStrategy = safeString(biz.pricingStrategy);
    const growthPlan = safeString(biz.growthPlan);

    if (revenueModel) {
      sections.push(`## 비즈니스 모델\n- 수익 모델: ${revenueModel || '미정의'}\n- 가격 전략: ${pricingStrategy || '미정의'}\n- 성장 전략: ${growthPlan || '미정의'}`);
    }

    // team null 체크
    const tm = data.team || {};
    const founderBackground = safeString(tm.founderBackground);
    const teamComposition = safeString(tm.teamComposition);
    const capabilities = safeArray(tm.capabilities);

    if (founderBackground || teamComposition) {
      sections.push(`## 팀 구성\n- 대표자: ${founderBackground || '미정의'}\n- 팀 구성: ${teamComposition || '미정의'}\n- 역량: ${capabilities.length > 0 ? capabilities.join(', ') : '미정의'}`);
    }

    return sections.join('\n\n');
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: IdeaCore 생성
      const coreResponse = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          title: title.trim(),
          category,
          one_liner: oneLiner.trim(),
        }),
      });

      if (!coreResponse.ok) {
        const errorData = await coreResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류 (${coreResponse.status})`);
      }

      const coreData = await coreResponse.json();

      if (!coreData.success) {
        throw new Error(coreData.error || '아이디어 생성에 실패했습니다.');
      }

      if (!coreData.data || !coreData.data.id) {
        throw new Error('아이디어 ID를 받지 못했습니다.');
      }

      const ideaCore: IdeaCore = coreData.data;

      // Step 2: IdeaVersion 생성 (분석된 데이터 포함)
      const chatSummary = buildChatSummary(parsedData) || fileContent || null;
      const missingInfo = parsedData ? safeArray(parsedData.missingInfo) : [];

      const versionResponse = await fetch(`/api/portfolio/${ideaCore.id}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          version_name: '가져온 버전',
          status: 'draft',
          chat_summary: chatSummary,
          key_feedback: missingInfo,
        }),
      });

      if (!versionResponse.ok) {
        const errorData = await versionResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `버전 생성 실패 (${versionResponse.status})`);
      }

      const versionData = await versionResponse.json();

      if (!versionData.success) {
        throw new Error(versionData.error || '버전 생성에 실패했습니다.');
      }

      if (!versionData.data) {
        throw new Error('버전 데이터를 받지 못했습니다.');
      }

      const ideaVersion: IdeaVersion = versionData.data;

      resetForm();
      onSuccess(ideaCore, ideaVersion);
    } catch (err) {
      console.error('Import failed:', err);
      const errorMessage = err instanceof Error ? err.message : '가져오기에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isLoading = isParsingFile || isAnalyzing;

  // 안전하게 분석 결과 표시
  const extractedSections = parsedData ? safeArray(parsedData.extractedSections) : [];
  const missingInfo = parsedData ? safeArray(parsedData.missingInfo) : [];
  const confidence = parsedData ? safeNumber(parsedData.confidence, 0) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-surface-card w-full max-w-xl mx-4 rounded-xl shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-sunken flex items-center justify-center">
              <Upload className="w-5 h-5 text-txt-secondary" />
            </div>
            <h2 className="text-lg font-bold text-txt-primary">
              기존 아이디어 가져오기
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-surface-sunken rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-txt-tertiary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* File Drop Zone */}
            <div>
              <label className="block text-sm font-medium text-txt-secondary mb-1.5">
                파일 업로드
              </label>

              {!uploadedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                    ${isDragging
                      ? 'border-border-strong bg-surface-sunken'
                      : 'border-border-strong hover:border-border-strong hover:bg-surface-sunken'
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-surface-sunken flex items-center justify-center">
                      <Upload className={`w-6 h-6 ${isDragging ? 'text-txt-primary' : 'text-txt-tertiary'}`} />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-txt-secondary mb-1">
                    파일을 드래그하거나 클릭하여 선택
                  </p>
                  <p className="text-xs text-txt-tertiary">
                    .txt, .md, .docx 파일 지원 (최대 10MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 업로드된 파일 */}
                  <div className="flex items-center justify-between p-4 bg-surface-sunken border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-card flex items-center justify-center">
                        <FileText className="w-5 h-5 text-status-success-text" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-txt-primary">{uploadedFile.name}</p>
                        <p className="text-xs text-txt-tertiary">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isLoading && <CheckCircle className="w-5 h-5 text-status-success-text" />}
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        disabled={isLoading}
                        className="p-1 hover:bg-surface-sunken rounded transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4 text-txt-tertiary" />
                      </button>
                    </div>
                  </div>

                  {/* AI 분석 상태 */}
                  {isLoading && (
                    <div className="flex items-center gap-3 p-4 bg-surface-sunken border border-border rounded-xl">
                      <Loader2 className="w-5 h-5 text-txt-secondary animate-spin" />
                      <div>
                        <p className="text-sm font-medium text-txt-secondary">
                          {isParsingFile ? '파일을 읽고 있습니다...' : 'AI가 내용을 분석하고 있습니다...'}
                        </p>
                        <p className="text-xs text-txt-tertiary">
                          정부지원사업 평가항목에 맞게 정보를 추출합니다
                        </p>
                      </div>
                    </div>
                  )}

                  {/* AI 분석 결과 요약 */}
                  {parsedData && !isLoading && (
                    <div className="p-4 bg-surface-sunken border border-border rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-txt-secondary" />
                        <p className="text-sm font-medium text-txt-secondary">
                          AI 분석 완료 (신뢰도: {confidence}%)
                        </p>
                      </div>

                      <div className="space-y-2 text-xs">
                        {extractedSections.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-txt-tertiary">추출된 정보:</span>
                            {extractedSections.map((section, i) => (
                              <span key={i} className="px-2 py-0.5 bg-surface-sunken text-txt-secondary rounded">
                                {section}
                              </span>
                            ))}
                          </div>
                        )}

                        {missingInfo.length > 0 && (
                          <div className="flex items-start gap-2 mt-2 p-2 bg-surface-sunken rounded-lg">
                            <AlertCircle className="w-4 h-4 text-status-warning-text shrink-0 mt-0.5" />
                            <div>
                              <p className="text-status-warning-text font-medium">보완이 필요한 정보:</p>
                              <p className="text-txt-secondary">{missingInfo.join(', ')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-txt-secondary mb-1.5"
              >
                아이디어 제목 <span className="text-status-danger-text">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: AI 기반 맞춤형 학습 플랫폼"
                maxLength={200}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-surface-sunken border border-border rounded-xl focus:border-surface-inverse focus:bg-surface-card focus:outline-none transition-colors disabled:opacity-50"
              />
              <div className="text-xs text-txt-tertiary mt-1 text-right">
                {title.length}/200
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-txt-secondary mb-1.5"
              >
                카테고리 <span className="text-status-danger-text">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-surface-sunken border border-border rounded-xl focus:border-surface-inverse focus:bg-surface-card focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">카테고리 선택</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* One Liner */}
            <div>
              <label
                htmlFor="oneLiner"
                className="block text-sm font-medium text-txt-secondary mb-1.5"
              >
                한 줄 요약 <span className="text-status-danger-text">*</span>
              </label>
              <textarea
                id="oneLiner"
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value)}
                placeholder="예: 학생의 학습 패턴을 분석하여 맞춤형 커리큘럼을 제공하는 AI 튜터"
                maxLength={500}
                rows={2}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-surface-sunken border border-border rounded-xl focus:border-surface-inverse focus:bg-surface-card focus:outline-none transition-colors resize-none disabled:opacity-50"
              />
              <div className="text-xs text-txt-tertiary mt-1 text-right">
                {oneLiner.length}/500
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-surface-sunken border border-border-subtle rounded-lg">
                <AlertCircle className="w-4 h-4 text-status-danger-text shrink-0 mt-0.5" />
                <p className="text-sm text-status-danger-text">{error}</p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle bg-surface-sunken">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-txt-secondary font-medium rounded-lg hover:bg-border transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting || isLoading}
            className="px-5 py-2.5 bg-surface-inverse text-txt-inverse font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                가져오는 중...
              </>
            ) : (
              '가져오기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
