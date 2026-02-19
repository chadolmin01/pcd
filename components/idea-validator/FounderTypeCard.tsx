'use client';

import React, { useRef, useState } from 'react';
import { Download, Share2, Info, X } from 'lucide-react';
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

  // 이미지 내보내기 (미리 만들어둔 카드 이미지 사용)
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

  // 공유하기 (Web Share API)
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
        // Web Share API 미지원 시 다운로드
        handleExport();
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // 축 라벨
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
        className={`p-4 rounded-sm border-2 ${className}`}
        style={{ backgroundColor: type.bgColor, borderColor: type.color }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-sm flex items-center justify-center text-2xl"
            style={{ backgroundColor: type.color }}
          >
            {type.emoji}
          </div>
          <div>
            <div className="font-bold text-gray-900">{type.name}</div>
            <div className="text-xs text-gray-600">{type.taglineKo}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 카드 (내보내기 대상) */}
      <div
        ref={cardRef}
        className={`bg-white rounded-sm overflow-hidden shadow-lg ${className}`}
        style={{ maxWidth: '400px' }}
      >
        {/* 헤더 */}
        <div
          className="p-6 text-center"
          style={{ backgroundColor: type.bgColor }}
        >
          {/* 마스코트 자리 */}
          <div
            className="w-24 h-24 mx-auto mb-4 rounded-sm flex items-center justify-center text-5xl shadow-lg"
            style={{ backgroundColor: type.color }}
          >
            {type.mascotUrl ? (
              <img src={type.mascotUrl} alt={type.name} className="w-full h-full object-cover rounded-sm" />
            ) : (
              type.emoji
            )}
          </div>

          <div className="text-3xl font-bold text-gray-900 mb-1">
            {type.emoji} {type.name}
          </div>
          {userName && (
            <div className="text-sm text-gray-600 mb-2">@{userName}</div>
          )}
          <div
            className="text-lg font-medium italic"
            style={{ color: type.color }}
          >
            "{type.tagline}"
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {/* Like Person */}
          <div className="mb-5">
            <div className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest mb-2">
              Like
            </div>
            <div className="font-bold text-gray-900 mb-1">{type.likePerson}</div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {type.likeStoryKo}
            </p>
          </div>

          {/* Traits */}
          <div className="mb-5">
            <div className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest mb-2">
              특성
            </div>
            <div className="flex flex-wrap gap-2">
              {type.traitsKo.map((trait, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: type.bgColor, color: type.color }}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* 5축 그래프 (axes가 제공된 경우) */}
          {axes && (
            <div className="mb-5">
              <div className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest mb-3">
                성향 분석
              </div>
              <div className="space-y-2">
                {(Object.keys(axisLabels) as (keyof AxisScores)[]).map(axis => (
                  <div key={axis}>
                    <div className="flex justify-between text-[9px] text-gray-400 mb-0.5">
                      <span>{axisLabels[axis][0]}</span>
                      <span>{axisLabels[axis][1]}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full relative">
                      <div
                        className="absolute top-0 bottom-0 w-2 rounded-full transition-all"
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
          <div
            className="p-4 rounded-sm"
            style={{ backgroundColor: bestMatch.bgColor }}
          >
            <div className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest mb-2">
              Best Match
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-sm flex items-center justify-center text-xl"
                style={{ backgroundColor: bestMatch.color }}
              >
                {bestMatch.emoji}
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900">{bestMatch.name}</div>
                <div className="text-xs text-gray-600">{bestMatch.taglineKo}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-[9px] text-gray-400">
            <span>Draft. Founder Type Framework</span>
            <button
              onClick={() => setShowMethodology(true)}
              className="flex items-center gap-1 hover:text-gray-600"
            >
              <Info size={10} />
              <span>Methodology</span>
            </button>
          </div>
        </div>
      </div>

      {/* 액션 버튼 (카드 외부) */}
      {showActions && (
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-sm text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            <Download size={16} />
            {isExporting ? '생성 중...' : '이미지 저장'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-sm text-sm font-medium hover:bg-gray-50"
          >
            <Share2 size={16} />
            공유하기
          </button>
        </div>
      )}

      {/* Methodology 모달 */}
      {showMethodology && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-sm max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">About Founder Type Framework</h3>
              <button
                onClick={() => setShowMethodology(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Draft의 창업자 유형 분석은 다음 연구와 프레임워크를 기반으로 설계되었습니다:
            </p>
            <ul className="space-y-2 mb-4">
              {METHODOLOGY_REFERENCES.map((ref, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>
                    {ref.name}
                    {ref.year && <span className="text-gray-400"> ({ref.year})</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500">
              AI가 아이디어 빌딩 과정에서의 의사결정 패턴을 분석하여 창업자 성향을 도출합니다.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default FounderTypeCard;
