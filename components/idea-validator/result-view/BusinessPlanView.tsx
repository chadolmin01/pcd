'use client';

import React, { memo, useState } from 'react';
import { Download, FileText, FileJson, Copy, Check, Target, Zap, BarChart, Users, ChevronRight, Loader2 } from 'lucide-react';
import { BusinessPlanData } from '../types';

interface BusinessPlanViewProps {
  data: BusinessPlanData;
  onDownload: () => void;
  onDownloadPDF: () => void;
  onCopy: () => void;
  copied: boolean;
  pdfLoading?: boolean;
}

export const BusinessPlanView = memo(({ data, onDownload, onDownloadPDF, onCopy, copied, pdfLoading }: BusinessPlanViewProps) => {
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
