'use client';

import React from 'react';
import { Send, ArrowRight } from 'lucide-react';
import { AnalysisMetrics } from './types';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFinish: () => void;
  isTyping: boolean;
  metrics: AnalysisMetrics | null;
  showInputMode: boolean;
  onShowInputMode: () => void;
  turnCount: number;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  onInputChange,
  onSend,
  onFinish,
  isTyping,
  metrics,
  showInputMode,
  onShowInputMode,
  turnCount,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      onSend();
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white border-t border-gray-200 shrink-0 z-10">
      <div className="max-w-4xl mx-auto relative">
        {/* No metrics yet - show normal input */}
        {!metrics && (
          <>
            <div className="relative flex items-center gap-3 bg-gray-50 border border-gray-200 rounded px-4 py-2 focus-within:bg-white focus-within:border-black transition-all">
              <input
                type="text"
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400"
                placeholder="아이디어나 답변을 입력하세요..."
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
              <button
                onClick={onSend}
                disabled={isTyping || !input.trim()}
                aria-label="메시지 전송"
                className={`p-2 rounded transition-colors
                  ${input.trim() && !isTyping
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                `}
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2 font-mono">
              Draft AI can make mistakes. Consider checking important information.
            </p>
          </>
        )}

        {/* Has metrics but not in input mode - show thin status bar only */}
        {metrics && !showInputMode && (
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-500">현재 점수: </span>
                <span className="font-bold text-gray-900">{metrics.score}점</span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">{turnCount}/10 턴</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onShowInputMode}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded hover:bg-gray-100 transition-colors"
              >
                계속 대화하기
              </button>
              <button
                onClick={onFinish}
                className="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                검증 완료
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Has metrics and in input mode - show input with status */}
        {metrics && showInputMode && (
          <>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>현재 점수: <span className="font-bold text-gray-900">{metrics.score}점</span></span>
                <span className="text-gray-300">|</span>
                <span>{turnCount}/10 턴</span>
              </div>
              <button
                onClick={onFinish}
                className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition-colors flex items-center gap-1.5"
              >
                검증 완료
                <ArrowRight size={12} />
              </button>
            </div>
            <div className="relative flex items-center gap-3 bg-gray-50 border border-gray-200 rounded px-4 py-2 focus-within:bg-white focus-within:border-black transition-all">
              <input
                type="text"
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400"
                placeholder="추가 질문이나 답변을 입력하세요..."
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                autoFocus
              />
              <button
                onClick={onSend}
                disabled={isTyping || !input.trim()}
                aria-label="메시지 전송"
                className={`p-2 rounded transition-colors
                  ${input.trim() && !isTyping
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                `}
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
