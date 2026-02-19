'use client';

import React, { useEffect, useState, memo, useCallback } from 'react';
import { Download, Share2, Briefcase, FileText, Layout, Cpu, Paintbrush, DollarSign, Shield, MapPin, Clock, Globe, Copy, Check, Target, Server, Zap, BarChart, Users, Star, Award, ArrowRight, Sparkles, Calendar, Gift, ExternalLink, ChevronRight, FileJson, Loader2 } from 'lucide-react';
import { Artifacts, PrdStructure, JdStructure, BusinessPlanData, ChatMessage, Scorecard, createEmptyScorecard } from './types';
import { generateFinalArtifacts, synthesizeBusinessPlan } from './geminiService';
import { validationResultsStore } from '@/src/lib/validationResultsStore';
import DecisionProfileCard from './DecisionProfileCard';

// Recommended event type
interface RecommendedEvent {
  id: string;
  title: string;
  organizer: string;
  eventType: string;
  deadline: string;
  daysLeft: number;
  tags: string[];
  benefits: string[];
  matchScore: number;
}

// Extracted outside main component to prevent re-renders
const ScoreBar = memo(({ label, score, colorClass, icon }: { label: string, score: number, colorClass: string, icon: React.ReactNode }) => (
  <div className="mb-5">
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icon}
        {label}
      </div>
      <span className="text-sm font-bold text-gray-900">{score}</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-1000 ease-out ${colorClass}`}
        style={{ width: `${score}%` }}
      ></div>
    </div>
  </div>
));
ScoreBar.displayName = 'ScoreBar';

// Event Teaser Card Component
const EventTeaserCard = memo(({ event }: { event: RecommendedEvent }) => (
  <div className="bg-white border border-gray-200 rounded p-4 hover:shadow-md hover:border-gray-300 transition-all group cursor-pointer">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {event.eventType}
          </span>
          {event.daysLeft <= 7 && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
              D-{event.daysLeft}
            </span>
          )}
        </div>
        <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
          {event.title}
        </h4>
        <p className="text-xs text-gray-500 mt-0.5">{event.organizer}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
    </div>
    <div className="flex flex-wrap gap-1 mb-3">
      {event.tags.slice(0, 3).map((tag, i) => (
        <span key={i} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {tag}
        </span>
      ))}
    </div>
    <div className="flex items-center gap-2 text-[10px] text-gray-400">
      <Gift size={12} />
      <span className="line-clamp-1">{event.benefits.join(' · ')}</span>
    </div>
  </div>
));
EventTeaserCard.displayName = 'EventTeaserCard';

// Events Teaser Section Component
const EventsTeaserSection = memo(({ tags }: { tags?: string[] }) => {
  const [events, setEvents] = useState<RecommendedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const tagParam = tags?.join(',') || '';
        const response = await fetch(`/api/events/recommend?tags=${encodeURIComponent(tagParam)}&limit=3`);
        const data = await response.json();
        if (data.success) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [tags]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-100 rounded h-24" />
        ))}
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="space-y-3">
      {events.map(event => (
        <EventTeaserCard key={event.id} event={event} />
      ))}
    </div>
  );
});
EventsTeaserSection.displayName = 'EventsTeaserSection';

const ActionCard = memo(({ title, description, items, color, icon }: { title: string, description: string, items: string[], color: string, icon: React.ReactNode }) => (
  <div className="bg-white border border-gray-200 rounded p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded ${color}`}>
              {icon}
          </div>
          <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4 ml-11">{description}</p>
      <ul className="space-y-3">
          {items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
              </li>
          ))}
          {items.length === 0 && <li className="text-sm text-gray-400 italic">할 일이 없습니다.</li>}
      </ul>
  </div>
));
ActionCard.displayName = 'ActionCard';

const PrdView = memo(({ prd }: { prd: PrdStructure }) => (
  <div className="bg-white shadow-lg rounded border border-gray-200 overflow-hidden mx-auto max-w-5xl">
    {/* Header */}
    <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 px-8 py-8 md:px-12 md:py-10">
       <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
             <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
                <FileText size={14} /> Product Requirements Document
             </div>
             <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">{prd.projectName}</h1>
             <p className="text-lg text-gray-500 font-medium">{prd.tagline}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
             <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">Ver {prd.version}</span>
             <span className="text-xs text-gray-400 font-mono">Last Updated: {new Date().toLocaleDateString()}</span>
          </div>
       </div>
    </div>

    <div className="p-8 md:p-12 space-y-12">
       {/* Overview */}
       <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
             <Target size={20} className="text-gray-400" /> Executive Overview
          </h2>
          <p className="text-gray-600 leading-relaxed text-lg border-l-4 border-gray-200 pl-4 bg-gray-50 py-4 pr-4 rounded-r-sm">
             {prd.overview}
          </p>
       </section>

       {/* Two Column Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Target Audience */}
          <section>
             <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-pink-500" /> Target Audience
             </h2>
             <div className="space-y-3">
                {prd.targetAudience.map((target, i) => (
                   <div key={i} className="flex items-center gap-3 p-3 bg-pink-50/50 rounded border border-pink-100">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs shrink-0">
                         {i + 1}
                      </div>
                      <span className="text-gray-700 font-medium text-sm">{target}</span>
                   </div>
                ))}
             </div>
          </section>

          {/* Success Metrics */}
          <section>
             <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart size={20} className="text-emerald-500" /> Success Metrics
             </h2>
             <div className="space-y-3">
                {prd.successMetrics.map((metric, i) => (
                   <div key={i} className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded border border-emerald-100">
                      <Check size={16} className="text-emerald-600 shrink-0" />
                      <span className="text-gray-700 font-medium text-sm">{metric}</span>
                   </div>
                ))}
             </div>
          </section>
       </div>

       {/* Features Grid */}
       <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
             <Zap size={20} className="text-yellow-500" /> Core Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {prd.coreFeatures.map((feature, i) => (
                <div key={i} className="bg-white border border-gray-200 p-5 rounded hover:shadow-md transition-shadow">
                   <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{feature.name}</h3>
                      <div className="flex gap-2">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            feature.priority === 'High' ? 'bg-red-100 text-red-700' :
                            feature.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                         }`}>
                            {feature.priority}
                         </span>
                      </div>
                   </div>
                   <p className="text-sm text-gray-600 leading-relaxed mb-4">{feature.description}</p>
                   <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                       <span className="text-xs text-gray-400 font-mono">Dev Effort:</span>
                       <div className="flex gap-1">
                          {[1,2,3].map(bar => (
                             <div key={bar} className={`w-2 h-2 rounded-full ${
                                (feature.effort === 'High' && bar <= 3) ||
                                (feature.effort === 'Medium' && bar <= 2) ||
                                (feature.effort === 'Low' && bar <= 1)
                                ? 'bg-blue-500' : 'bg-gray-200'
                             }`} />
                          ))}
                       </div>
                   </div>
                </div>
             ))}
          </div>
       </section>

       {/* Tech Stack */}
       <section>
           <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
             <Server size={20} className="text-indigo-500" /> Recommended Stack
          </h2>
          <div className="flex flex-wrap gap-2">
             {prd.techStack.map((tech, i) => (
                <span key={i} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold rounded">
                   {tech}
                </span>
             ))}
          </div>
       </section>

       {/* Footer Note */}
       <div className="text-center text-xs text-gray-400 pt-8 border-t border-gray-100">
          Generated by Draft. AI Validator
       </div>
    </div>
  </div>
));
PrdView.displayName = 'PrdView';

const JdView = memo(({ jd, onCopy, copied }: { jd: JdStructure, onCopy: (text: string) => void, copied: boolean }) => (
  <div className="bg-white shadow-lg rounded border border-gray-200 overflow-hidden mx-auto max-w-5xl relative">
     {/* Decorative Header */}
     <div className="h-40 bg-gray-900 relative pattern-grid-lg">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-90"></div>
        <div className="absolute -bottom-10 left-8 md:left-12 p-1.5 bg-white rounded shadow-lg">
           <div className="w-20 h-20 bg-black rounded flex items-center justify-center text-white font-black text-3xl tracking-tighter">
              D.
           </div>
        </div>
     </div>

     <div className="pt-16 px-8 md:px-12 pb-8 border-b border-gray-100">
         <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold uppercase rounded">{jd.department}</span>
                  <span className="text-xs text-gray-400">Full-time</span>
               </div>
               <h1 className="text-3xl font-bold text-gray-900 mb-4">{jd.roleTitle}</h1>
               <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-1.5"><MapPin size={16} className="text-gray-400"/> Remote / Seoul, KR</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full"><DollarSign size={16}/> Significant Equity Offered</span>
               </div>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
               <button className="px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors shadow-xl shadow-gray-200 transform hover:-translate-y-0.5">
                  Apply Now
               </button>
               <button
                  onClick={() => onCopy(JSON.stringify(jd))}
                  className="p-3 border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 transition-colors"
               >
                  {copied ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
               </button>
            </div>
         </div>
     </div>

     <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
         {/* Main Content */}
         <div className="md:col-span-2 space-y-10">
            <section>
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">About the Team</h3>
               <p className="text-gray-700 leading-relaxed text-lg">
                  {jd.companyIntro}
               </p>
            </section>

            <section>
               <h3 className="text-lg font-bold text-gray-900 mb-4">Responsibilities</h3>
               <ul className="space-y-3">
                  {jd.responsibilities.map((item, i) => (
                     <li key={i} className="flex items-start gap-3 text-gray-600 leading-relaxed">
                        <Check size={18} className="text-blue-500 mt-1 shrink-0" />
                        <span>{item}</span>
                     </li>
                  ))}
               </ul>
            </section>

            <section>
               <h3 className="text-lg font-bold text-gray-900 mb-4">Requirements</h3>
               <ul className="space-y-3">
                  {jd.qualifications.map((item, i) => (
                     <li key={i} className="flex items-start gap-3 text-gray-600 leading-relaxed">
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-2.5 shrink-0" />
                        <span>{item}</span>
                     </li>
                  ))}
               </ul>
            </section>
         </div>

         {/* Sidebar */}
         <div className="space-y-8">
            <div className="bg-gray-50 rounded p-6 border border-gray-200">
               <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                  <Award size={18} className="text-yellow-500" /> Preferred Skills
               </h3>
               <div className="flex flex-wrap gap-2">
                  {jd.preferred.map((skill, i) => (
                     <span key={i} className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 shadow-sm">
                        {skill}
                     </span>
                  ))}
               </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded p-6 border border-blue-100">
               <h3 className="flex items-center gap-2 font-bold text-blue-900 mb-4">
                  <Star size={18} className="text-blue-500" /> Benefits
               </h3>
               <ul className="space-y-3">
                  {jd.benefits.map((benefit, i) => (
                     <li key={i} className="text-sm text-blue-800 font-medium flex items-center gap-2">
                        <span className="w-1 h-1 bg-blue-400 rounded-full" /> {benefit}
                     </li>
                  ))}
               </ul>
            </div>
         </div>
     </div>
  </div>
));
JdView.displayName = 'JdView';

// Business Plan View Component
const BusinessPlanView = memo(({ data, onDownload, onDownloadPDF, onCopy, copied, pdfLoading }: {
  data: BusinessPlanData;
  onDownload: () => void;
  onDownloadPDF: () => void;
  onCopy: () => void;
  copied: boolean;
  pdfLoading?: boolean;
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('problem');

  const sections = [
    { key: 'problem', label: '문제 정의', icon: Target },
    { key: 'solution', label: '솔루션', icon: Zap },
    { key: 'scaleup', label: '스케일업', icon: BarChart },
    { key: 'team', label: '팀 구성', icon: Users },
  ];

  return (
    <div className="bg-white shadow-lg rounded border border-gray-200 overflow-hidden mx-auto max-w-5xl">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 px-8 py-8 md:px-12 md:py-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
              <FileJson size={14} /> Business Plan JSON
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
              {data.basicInfo.itemName}
            </h1>
            <p className="text-lg text-gray-500 font-medium">{data.basicInfo.oneLiner}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              {data.validationScore}/100점
            </span>
            <span className="text-xs text-gray-400 font-mono">
              {new Date(data.generatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onDownload}
            className="px-6 py-2.5 bg-black text-white font-bold rounded hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
          >
            <Download size={16} /> JSON 다운로드
          </button>
          <button
            onClick={onDownloadPDF}
            disabled={pdfLoading}
            className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            {pdfLoading ? 'PDF 생성 중...' : 'PDF 다운로드'}
          </button>
          <button
            onClick={onCopy}
            className="px-6 py-2.5 border border-gray-200 bg-white text-gray-700 font-bold rounded hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="px-8 py-6 md:px-12 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">기본 정보</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">타겟 고객</div>
            <div className="text-sm font-semibold text-gray-900">{data.basicInfo.targetCustomer}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">산업 분류</div>
            <div className="text-sm font-semibold text-gray-900">{data.basicInfo.industry}</div>
          </div>
          {data.basicInfo.fundingAmount && (
            <div>
              <div className="text-xs text-gray-400 mb-1">신청 금액</div>
              <div className="text-sm font-semibold text-gray-900">
                {(data.basicInfo.fundingAmount / 10000).toLocaleString()}만원
              </div>
            </div>
          )}
          {data.basicInfo.templateType && (
            <div>
              <div className="text-xs text-gray-400 mb-1">템플릿</div>
              <div className="text-sm font-semibold text-gray-900">{data.basicInfo.templateType}</div>
            </div>
          )}
        </div>
      </div>

      {/* Section Data - Accordion */}
      <div className="px-8 py-6 md:px-12">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">섹션 데이터</h2>
        <div className="space-y-3">
          {sections.map(({ key, label, icon: Icon }) => {
            const sectionData = data.sectionData[key as keyof typeof data.sectionData];
            const isExpanded = expandedSection === key;

            return (
              <div key={key} className="border border-gray-200 rounded overflow-hidden">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-gray-500" />
                    <span className="font-semibold text-gray-900">{label}</span>
                  </div>
                  <ChevronRight
                    size={18}
                    className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>
                {isExpanded && (
                  <div className="p-4 space-y-4 bg-white">
                    {Object.entries(sectionData).map(([subKey, value]) => (
                      <div key={subKey}>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          {subKey.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded">
                          {value as string}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule */}
      {data.schedule.length > 0 && (
        <div className="px-8 py-6 md:px-12 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">개발 일정</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">No</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">내용</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">기간</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">상세</th>
                </tr>
              </thead>
              <tbody>
                {data.schedule.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-900 font-mono">{item.no}</td>
                    <td className="py-2 px-3 text-gray-900 font-medium">{item.content}</td>
                    <td className="py-2 px-3 text-gray-600">{item.period}</td>
                    <td className="py-2 px-3 text-gray-600">{item.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budget */}
      {data.budget.length > 0 && (
        <div className="px-8 py-6 md:px-12 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">예산 계획</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">구분</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">세부내용</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-semibold">금액</th>
                </tr>
              </thead>
              <tbody>
                {data.budget.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-900 font-medium">{item.category}</td>
                    <td className="py-2 px-3 text-gray-600">{item.detail}</td>
                    <td className="py-2 px-3 text-gray-900 font-mono text-right">
                      {Number(item.amount).toLocaleString()}원
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={2} className="py-2 px-3 text-gray-900">합계</td>
                  <td className="py-2 px-3 text-gray-900 font-mono text-right">
                    {data.budget.reduce((sum, item) => sum + Number(item.amount), 0).toLocaleString()}원
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Table */}
      {data.teamTable.length > 0 && (
        <div className="px-8 py-6 md:px-12 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">팀 현황</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">No</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">직책</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">역할</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">역량</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">상태</th>
                </tr>
              </thead>
              <tbody>
                {data.teamTable.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-900 font-mono">{item.no}</td>
                    <td className="py-2 px-3 text-gray-900 font-medium">{item.position}</td>
                    <td className="py-2 px-3 text-gray-600">{item.role}</td>
                    <td className="py-2 px-3 text-gray-600">{item.capability}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        item.status.includes('완료') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Partners */}
      {data.partners.length > 0 && (
        <div className="px-8 py-6 md:px-12 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">협력 기관</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">No</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">기관명</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">보유역량</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">협력 계획</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">시기</th>
                </tr>
              </thead>
              <tbody>
                {data.partners.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-900 font-mono">{item.no}</td>
                    <td className="py-2 px-3 text-gray-900 font-medium">{item.name}</td>
                    <td className="py-2 px-3 text-gray-600">{item.capability}</td>
                    <td className="py-2 px-3 text-gray-600">{item.plan}</td>
                    <td className="py-2 px-3 text-gray-600">{item.period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-8 py-4 md:px-12 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Generated by Draft. AI Validator</span>
          <span className="font-mono">{data.generatedAt}</span>
        </div>
      </div>
    </div>
  );
});
BusinessPlanView.displayName = 'BusinessPlanView';

interface ResultViewProps {
  conversationHistory: string;
  originalIdea: string;
  reflectedAdvice?: string[];
  onComplete?: () => void;
  // 종합 결과물 생성을 위한 추가 props
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

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        const data = await generateFinalArtifacts(originalIdea, conversationHistory, reflectedAdvice);
        setArtifacts(data);

        // Save artifacts to the latest validation result
        const latest = await validationResultsStore.getLatest();
        if (latest && data.prd && data.jd) {
          await validationResultsStore.updateArtifacts(latest.id, {
            prd: JSON.stringify(data.prd),
            jd: JSON.stringify(data.jd),
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchArtifacts();
  }, [conversationHistory, originalIdea, reflectedAdvice]);

  // 사업계획서 JSON 생성
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

  // JSON 다운로드
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

  // PDF 다운로드
  const [pdfLoading, setPdfLoading] = useState(false);
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
          <div className="w-20 h-20 border-4 border-gray-100 border-t-draft-black rounded-full animate-spin"></div>
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

  // 스코어카드 기반 Validation Scores 계산
  const calculateValidationScores = () => {
    if (!scorecard || scorecard.totalScore === 0) {
      return artifacts?.personaScores || { developer: 0, designer: 0, vc: 0 };
    }

    // Tech Feasibility: solution + feasibility + logicalConsistency (max: 15+15+15=45)
    const techScore = Math.round(
      ((scorecard.solution.current / 15) * 0.4 +
       (scorecard.feasibility.current / 15) * 0.4 +
       (scorecard.logicalConsistency.current / 15) * 0.2) * 100
    );

    // UX & Design: problemDefinition + solution + differentiation (max: 15+15+10=40)
    const uxScore = Math.round(
      ((scorecard.problemDefinition.current / 15) * 0.35 +
       (scorecard.solution.current / 15) * 0.35 +
       (scorecard.differentiation.current / 10) * 0.3) * 100
    );

    // Business Model: marketAnalysis + revenueModel + differentiation (max: 10+10+10=30)
    const bizScore = Math.round(
      ((scorecard.marketAnalysis.current / 10) * 0.35 +
       (scorecard.revenueModel.current / 10) * 0.35 +
       (scorecard.differentiation.current / 10) * 0.3) * 100
    );

    return {
      developer: Math.min(100, techScore),
      designer: Math.min(100, uxScore),
      vc: Math.min(100, bizScore)
    };
  };

  const scores = calculateValidationScores();
  const actionPlan = artifacts?.actionPlan || { developer: [], designer: [], vc: [] };

  return (
    <div className="w-full py-4 px-3 md:px-4">
      {/* Clean Success Banner */}
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
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'overview' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
        >
          <Layout size={16} /> Overview
        </button>
        <button
          onClick={() => setActiveTab('prd')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'prd' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
        >
          <FileText size={16} /> PRD
        </button>
        <button
          onClick={() => setActiveTab('jd')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'jd' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
        >
          <Briefcase size={16} /> 구인공고
        </button>
        <button
          onClick={businessPlan ? () => setActiveTab('businessPlan') : handleSynthesizeBusinessPlan}
          disabled={synthesizing}
          className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'businessPlan' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600'} ${synthesizing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {synthesizing ? <Loader2 size={16} className="animate-spin" /> : <FileJson size={16} />}
          {synthesizing ? '생성중...' : '사업계획서'}
        </button>
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
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded transition-all ${activeTab === 'overview' ? 'bg-white border border-gray-200 shadow-sm text-draft-black' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <Layout size={18} />
                    <span className="font-semibold text-sm">Overview</span>
                  </div>
                  {activeTab === 'overview' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                </button>

                <button
                  onClick={() => setActiveTab('prd')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded transition-all ${activeTab === 'prd' ? 'bg-white border border-gray-200 shadow-sm text-draft-black' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} />
                    <span className="font-semibold text-sm">PRD v1.0</span>
                  </div>
                  {activeTab === 'prd' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                </button>

                <button
                  onClick={() => setActiveTab('jd')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded transition-all ${activeTab === 'jd' ? 'bg-white border border-gray-200 shadow-sm text-draft-black' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <Briefcase size={18} />
                    <span className="font-semibold text-sm">구인 공고</span>
                  </div>
                  {activeTab === 'jd' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                </button>

                <button
                  onClick={businessPlan ? () => setActiveTab('businessPlan') : handleSynthesizeBusinessPlan}
                  disabled={synthesizing}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded transition-all ${activeTab === 'businessPlan' ? 'bg-white border border-gray-200 shadow-sm text-draft-black' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'} ${synthesizing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {synthesizing ? <Loader2 size={18} className="animate-spin" /> : <FileJson size={18} />}
                    <span className="font-semibold text-sm">{synthesizing ? '생성 중...' : '사업계획서'}</span>
                  </div>
                  {activeTab === 'businessPlan' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                </button>

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

           {/* Persona Scores Card */}
           <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Validation Scores</h3>

              <ScoreBar
                label="Tech Feasibility"
                score={scores.developer}
                colorClass="bg-indigo-500"
                icon={<Cpu size={16} className="text-indigo-500" />}
              />

              <ScoreBar
                label="UX & Design"
                score={scores.designer}
                colorClass="bg-pink-500"
                icon={<Paintbrush size={16} className="text-pink-500" />}
              />

              <ScoreBar
                label="Business Model"
                score={scores.vc}
                colorClass="bg-emerald-500"
                icon={<DollarSign size={16} className="text-emerald-500" />}
              />
           </div>

           {/* Founder Type Card */}
           <DecisionProfileCard compact />

           {/* Coming Soon Teaser Card */}
           <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded p-6 shadow-lg overflow-hidden relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Next Step</h3>
                  </div>
                  <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/20 px-2 py-0.5 rounded-full border border-yellow-400/30 animate-pulse">
                    COMING SOON
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white mb-2">
                  🚀 아이디어 실행 지원
                </h4>

                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                  검증된 아이디어를 실제로 만들어 보세요.<br/>
                  창업 지원 프로그램, 투자 연결, 팀 빌딩까지.
                </p>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    <span>맞춤형 창업 지원 사업 매칭</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    <span>VC/엔젤 투자자 네트워킹</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    <span>공동 창업자 & 팀원 매칭</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded p-3 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Draft. Platform</p>
                      <p className="text-sm font-bold text-white">2026년 상반기 오픈 예정</p>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                      <Calendar size={20} className="text-white/60" />
                    </div>
                  </div>
                </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ResultView;
