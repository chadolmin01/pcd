'use client';

import React, { useRef, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { FounderTypeId, getFounderType, getBestMatch, METHODOLOGY_REFERENCES } from './founderTypes';
import { AxisScores } from './decisionAnalyzer';

interface FounderTypeCardProps {
  typeId: FounderTypeId;
  axes?: AxisScores;
  userName?: string;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

const FounderTypeCard: React.FC<FounderTypeCardProps> = ({
  typeId,
  axes,
  userName,
  showActions = true,
  compact = false,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showMethodology, setShowMethodology] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const type = getFounderType(typeId);
  const bestMatch = getBestMatch(typeId);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(type.cardImageUrl);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.download = `founder-type-${typeId}.jpeg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch(type.cardImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `founder-type-${typeId}.jpeg`, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `My Founder Type: ${type.name}`,
          text: `${type.emoji} ${type.name} - "${type.tagline}"`,
          files: [file],
        });
      } else {
        handleExport();
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const axisLabels: Record<keyof AxisScores, [string, string]> = {
    speedVsQuality: ['완성도', '실행속도'],
    marketVsProduct: ['제품', '시장'],
    receptiveVsIndependent: ['독립', '수용'],
    techVsBusiness: ['비즈니스', '기술'],
    riskSeekingVsAvoiding: ['안정', '도전'],
  };

  const axisToPercent = (value: number) => Math.round((value + 1) * 50);

  if (compact) {
    return (
      <div
        className={`p-4 rounded border ${className}`}
        style={{ backgroundColor: type.bgColor, borderColor: type.color }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded flex items-center justify-center text-2xl"
            style={{ backgroundColor: type.color }}
          >
            {type.emoji}
          </div>
          <div>
            <div className="font-bold text-gray-900">{type.name}</div>
            <div className="text-xs text-gray-500">{type.taglineKo}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={cardRef}
        className={`bg-white rounded overflow-hidden shadow-lg ${className}`}
        style={{ width: '520px', maxWidth: '90vw' }}
      >
        {/* Header with Full Image - Wider aspect ratio */}
        {type.mascotUrl ? (
          <div className="relative">
            <div className="aspect-[2/1] w-full overflow-hidden">
              <img
                src={type.mascotUrl}
                alt={type.likePerson}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <div className="text-xl font-bold mb-0.5">{type.emoji} {type.name}</div>
              {userName && <div className="text-xs text-white/70">@{userName}</div>}
              <div className="text-xs font-medium text-white/90">"{type.tagline}"</div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center" style={{ backgroundColor: type.bgColor }}>
            <div
              className="w-16 h-16 mx-auto mb-4 rounded flex items-center justify-center text-3xl"
              style={{ backgroundColor: type.color }}
            >
              {type.emoji}
            </div>
            <div className="text-xl font-bold text-gray-900 mb-1">{type.emoji} {type.name}</div>
            {userName && <div className="text-xs text-gray-500 mb-1">@{userName}</div>}
            <div className="text-xs font-medium" style={{ color: type.color }}>
              "{type.tagline}"
            </div>
          </div>
        )}

        {/* Body - Two column layout */}
        <div className="p-5">
          <div className="grid grid-cols-2 gap-5">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Like Section */}
              <div>
                <div className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest mb-2">
                  Like
                </div>
                <div className="font-bold text-sm text-gray-900 mb-1">{type.likePerson}</div>
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">{type.likeStoryKo}</p>
              </div>

              {/* Traits */}
              <div>
                <div className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest mb-2">
                  특성
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {type.traitsKo.map((trait, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded text-[10px] font-medium"
                      style={{ backgroundColor: type.bgColor, color: type.color }}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* 5-Axis Graph */}
              {axes && (
                <div>
                  <div className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest mb-2">
                    성향 분석
                  </div>
                  <div className="space-y-2">
                    {(Object.keys(axisLabels) as (keyof AxisScores)[]).map(axis => (
                      <div key={axis}>
                        <div className="flex justify-between text-[8px] text-gray-400 mb-0.5">
                          <span>{axisLabels[axis][0]}</span>
                          <span>{axisLabels[axis][1]}</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full relative">
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all"
                            style={{
                              left: `calc(${axisToPercent(axes[axis])}% - 4px)`,
                              backgroundColor: type.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Match */}
              <div className="p-3 rounded" style={{ backgroundColor: bestMatch.bgColor }}>
                <div className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest mb-2">
                  Best Match
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-base"
                    style={{ backgroundColor: bestMatch.color }}
                  >
                    {bestMatch.emoji}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900">{bestMatch.name}</div>
                    <div className="text-[10px] text-gray-500">{bestMatch.taglineKo}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[9px] text-gray-400 font-mono">Draft. Founder Type</span>
          <button
            onClick={() => setShowMethodology(true)}
            className="text-[9px] text-gray-400 hover:text-gray-600 font-mono transition-colors"
          >
            Methodology
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex justify-center gap-3 mt-5">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            {isExporting ? '생성 중...' : '이미지 저장'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Share2 size={14} />
            공유하기
          </button>
        </div>
      )}

      {/* Methodology Modal */}
      {showMethodology && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded max-w-sm w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Methodology</h3>
              <button
                onClick={() => setShowMethodology(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-500 mb-4">
                Draft의 창업자 유형 분석은 다음 연구를 기반으로 합니다:
              </p>
              <div className="space-y-2">
                {METHODOLOGY_REFERENCES.map((ref, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="text-gray-300">•</span>
                    <span>
                      {ref.name}
                      {ref.year && <span className="text-gray-400 ml-1">({ref.year})</span>}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-4 pt-4 border-t border-gray-100">
                AI가 의사결정 패턴을 분석하여 창업자 성향을 도출합니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FounderTypeCard;
