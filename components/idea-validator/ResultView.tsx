'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Download, Share2, Briefcase, FileText, Layout, Cpu, Paintbrush, DollarSign, Shield, FileJson, Loader2 } from 'lucide-react';
import { Artifacts, BusinessPlanData, ChatMessage, Scorecard, createEmptyScorecard } from './types';
import { generateFinalArtifacts, synthesizeBusinessPlan } from './geminiService';
import { validationResultsStore } from '@/lib/validationResultsStore';
import DecisionProfileCard from './DecisionProfileCard';

// Import split components
import {
  ValidationScoresCard,
  calculateValidationScores,
  ActionCard,
  PrdView,
  JdView,
  BusinessPlanView,
  ComingSoonCard,
} from './result-view';

interface ResultViewProps {
  conversationHistory: string;
  originalIdea: string;
  reflectedAdvice?: string[];
  onComplete?: () => void;
  rawMessages?: ChatMessage[];
  scorecard?: Scorecard;
  ideaCategory?: string;
}

const ResultView: React.FC<ResultViewProps> = ({
  conversationHistory,
  originalIdea,
  reflectedAdvice = [],
  onComplete,
  rawMessages = [],
  scorecard,
  ideaCategory
}) => {
  const [artifacts, setArtifacts] = useState<Artifacts | null>(null);
  const [businessPlan, setBusinessPlan] = useState<BusinessPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [synthesizing, setSynthesizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'prd' | 'jd' | 'businessPlan'>('overview');
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        const data = await generateFinalArtifacts(originalIdea, conversationHistory, reflectedAdvice);
        setArtifacts(data);

        const latest = await validationResultsStore.getLatest();
        if (latest && data.prd && data.jd) {
          await validationResultsStore.updateArtifacts(latest.id, {
            prd: JSON.stringify(data.prd),
            jd: JSON.stringify(data.jd),
          });
        }
      } catch (e) {
        console.error('Failed to fetch artifacts:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchArtifacts();
  }, [conversationHistory, originalIdea, reflectedAdvice]);

  const handleSynthesizeBusinessPlan = useCallback(async () => {
    if (synthesizing || businessPlan) return;

    setSynthesizing(true);
    try {
      const result = await synthesizeBusinessPlan(
        originalIdea,
        rawMessages,
        reflectedAdvice,
        scorecard || createEmptyScorecard(),
        ideaCategory
      );
      setBusinessPlan(result);
      setActiveTab('businessPlan');
    } catch (e) {
      console.error('Business plan synthesis failed:', e);
    } finally {
      setSynthesizing(false);
    }
  }, [originalIdea, rawMessages, reflectedAdvice, scorecard, ideaCategory, synthesizing, businessPlan]);

  const handleDownloadJSON = useCallback(() => {
    if (!businessPlan) return;

    const jsonString = JSON.stringify(businessPlan, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-plan-${businessPlan.basicInfo.itemName || 'draft'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [businessPlan]);

  const handleDownloadPDF = useCallback(async () => {
    if (!businessPlan) return;

    setPdfLoading(true);
    try {
      const response = await fetch('/api/business-plan/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: businessPlan, format: 'pdf' }),
      });

      if (!response.ok) {
        throw new Error('PDF 생성 실패');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-plan-${businessPlan.basicInfo.itemName || 'draft'}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('PDF 다운로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setPdfLoading(false);
    }
  }, [businessPlan]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-100 border-t-draft-black rounded-full animate-spin" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-draft-black mb-2 tracking-tight">문서 생성 및 정리 중...</h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm">
            전문가들의 피드백을 구조화된 데이터로 변환하고 있습니다.<br/>
            PRD v1.0과 채용 공고(JD), 그리고 실행 계획이 곧 준비됩니다.
          </p>
        </div>
      </div>
    );
  }

  const scores = calculateValidationScores(scorecard, artifacts?.personaScores);
  const actionPlan = artifacts?.actionPlan || { developer: [], designer: [], vc: [] };

  return (
    <div className="w-full py-4 px-3 md:px-4">
      {/* Success Banner */}
      <div className="mb-8 bg-white border border-gray-200 rounded p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="bg-black text-white p-3 rounded-full shrink-0">
            <Shield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl md:text-2xl font-bold text-draft-black tracking-tight">프로젝트 검증 완료</h2>
              <span className="px-2 py-0.5 rounded bg-black text-white text-[10px] md:text-xs font-bold tracking-widest uppercase">
                AI Verified
              </span>
            </div>
            <p className="text-gray-500 text-sm md:text-base">
              Draft 시스템 검증을 통과했습니다. PRD와 JD가 준비되었습니다.
            </p>
          </div>
        </div>
        <div className="mt-6 md:mt-0 flex items-center gap-4">
          {/* Mobile Score */}
          <div className="md:hidden text-center">
            <div className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-1">Score</div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-black text-draft-black tracking-tighter">{artifacts?.score}</span>
              <span className="text-sm text-gray-400 font-medium">/100</span>
            </div>
          </div>
          {/* Desktop Score */}
          <div className="text-right hidden md:block border-l border-gray-100 pl-6">
            <div className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-1">Total Score</div>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-4xl font-black text-draft-black tracking-tighter">{artifacts?.score}</span>
              <span className="text-lg text-gray-400 font-medium">/100</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onComplete && (
              <button
                onClick={onComplete}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
              >
                완료
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden mb-4 flex items-center gap-2 overflow-x-auto pb-2">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Layout size={16} />} label="Overview" />
        <TabButton active={activeTab === 'prd'} onClick={() => setActiveTab('prd')} icon={<FileText size={16} />} label="PRD" />
        <TabButton active={activeTab === 'jd'} onClick={() => setActiveTab('jd')} icon={<Briefcase size={16} />} label="구인공고" />
        <TabButton
          active={activeTab === 'businessPlan'}
          onClick={businessPlan ? () => setActiveTab('businessPlan') : handleSynthesizeBusinessPlan}
          disabled={synthesizing}
          icon={synthesizing ? <Loader2 size={16} className="animate-spin" /> : <FileJson size={16} />}
          label={synthesizing ? '생성중...' : '사업계획서'}
        />
        <div className="flex items-center gap-2 ml-auto">
          <button className="p-2 rounded border border-gray-200 bg-white text-gray-600">
            <Download size={16} />
          </button>
          <button className="p-2 rounded bg-black text-white">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8 items-start">
        {/* Left Column: Navigation - Hidden on mobile */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="sticky top-6 space-y-1">
            <NavButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Layout size={18} />} label="Overview" />
            <NavButton active={activeTab === 'prd'} onClick={() => setActiveTab('prd')} icon={<FileText size={18} />} label="PRD v1.0" />
            <NavButton active={activeTab === 'jd'} onClick={() => setActiveTab('jd')} icon={<Briefcase size={18} />} label="구인 공고" />
            <NavButton
              active={activeTab === 'businessPlan'}
              onClick={businessPlan ? () => setActiveTab('businessPlan') : handleSynthesizeBusinessPlan}
              disabled={synthesizing}
              icon={synthesizing ? <Loader2 size={18} className="animate-spin" /> : <FileJson size={18} />}
              label={synthesizing ? '생성 중...' : '사업계획서'}
            />
          </div>
        </div>

        {/* Center Column: Content */}
        <div className="w-full lg:col-span-7 order-1 lg:order-none">
          <div className="relative">
            {activeTab === 'overview' && (
              <div className="animate-in fade-in duration-300 space-y-8 bg-white border border-gray-200 rounded p-8 md:p-12 shadow-sm min-h-[800px]">
                <div>
                  <h2 className="text-2xl font-bold text-draft-black mb-4">실행 계획 (Action Plan)</h2>
                  <p className="text-gray-500 mb-6">
                    성공적인 프로젝트 런칭을 위해 각 팀이 즉시 착수해야 할 핵심 과제입니다.
                  </p>
                  <div className="grid grid-cols-1 gap-4">
                    <ActionCard
                      title="Development"
                      description="핵심 기술 스택 선정, 시스템 아키텍처 설계, API 연동 및 보안 검토를 포함한 기술 구현 로드맵"
                      items={actionPlan.developer}
                      color="bg-indigo-100 text-indigo-700"
                      icon={<Cpu size={20} />}
                    />
                    <ActionCard
                      title="Design & UX"
                      description="사용자 여정 맵핑, UI/UX 프로토타입 제작, 브랜드 아이덴티티 및 디자인 시스템 구축"
                      items={actionPlan.designer}
                      color="bg-pink-100 text-pink-700"
                      icon={<Paintbrush size={20} />}
                    />
                    <ActionCard
                      title="Business & VC"
                      description="시장 진입 전략 수립, 수익 모델 검증, 투자 유치 준비 및 파트너십 구축 계획"
                      items={actionPlan.vc}
                      color="bg-emerald-100 text-emerald-700"
                      icon={<DollarSign size={20} />}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'prd' && artifacts?.prd && (
              <div className="animate-in fade-in duration-300">
                <PrdView prd={artifacts.prd} />
              </div>
            )}

            {activeTab === 'jd' && artifacts?.jd && (
              <div className="animate-in fade-in duration-300">
                <JdView jd={artifacts.jd} onCopy={handleCopy} copied={copied} />
              </div>
            )}

            {activeTab === 'businessPlan' && businessPlan && (
              <div className="animate-in fade-in duration-300">
                <BusinessPlanView
                  data={businessPlan}
                  onDownload={handleDownloadJSON}
                  onDownloadPDF={handleDownloadPDF}
                  onCopy={() => handleCopy(JSON.stringify(businessPlan, null, 2))}
                  copied={copied}
                  pdfLoading={pdfLoading}
                />
              </div>
            )}

            {activeTab === 'businessPlan' && !businessPlan && !synthesizing && (
              <div className="animate-in fade-in duration-300 bg-white border border-gray-200 rounded p-12 text-center">
                <FileJson size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">사업계획서 생성</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  대화 내역을 분석하여 정부 지원사업 제출용 사업계획서 JSON을 생성합니다.
                </p>
                <button
                  onClick={handleSynthesizeBusinessPlan}
                  className="px-6 py-3 bg-black text-white font-bold rounded hover:bg-gray-800 transition-colors"
                >
                  사업계획서 생성하기
                </button>
              </div>
            )}

            {activeTab === 'businessPlan' && synthesizing && (
              <div className="animate-in fade-in duration-300 bg-white border border-gray-200 rounded p-12 text-center">
                <Loader2 size={48} className="mx-auto text-gray-400 mb-4 animate-spin" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">사업계획서 생성 중...</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  대화 내역을 분석하고 구조화된 데이터로 변환하고 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Summary & Scores */}
        <div className="w-full lg:col-span-3 space-y-3 sm:space-y-4 order-2 lg:order-none">
          {/* Idea Summary Card */}
          <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Project Summary</h3>
            <p className="text-gray-800 text-sm leading-relaxed font-medium">
              {artifacts?.ideaSummary || "요약 정보를 불러오는 중입니다..."}
            </p>
          </div>

          {/* Validation Scores Card */}
          <ValidationScoresCard scorecard={scorecard} fallbackScores={artifacts?.personaScores} />

          {/* Founder Type Card */}
          <DecisionProfileCard compact />

          {/* Coming Soon Card */}
          <ComingSoonCard />
        </div>
      </div>
    </div>
  );
};

// Helper components for tabs/nav buttons
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold whitespace-nowrap transition-all ${
      active ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {icon} {label}
  </button>
);

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center justify-between px-4 py-3 rounded transition-all ${
      active ? 'bg-white border border-gray-200 shadow-sm text-draft-black' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-semibold text-sm">{label}</span>
    </div>
    {active && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
  </button>
);

export default ResultView;
