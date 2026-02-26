'use client';

import React, { useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef2 = useRef<HTMLTextAreaElement>(null);

  // 자동 높이 조절
  const adjustHeight = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`; // 최대 150px
    }
  };

  useEffect(() => {
    adjustHeight(textareaRef.current);
  }, [input]);

  useEffect(() => {
    adjustHeight(textareaRef2.current);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 md:p-6 shrink-0 z-10">
      <div className="max-w-4xl mx-auto relative">
        {/* No metrics yet - show normal input */}
        {!metrics && (
          <>
            <div className="relative flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-lg focus-within:border-black focus-within:shadow-xl transition-all min-h-[52px]">
              <textarea
                ref={textareaRef}
                rows={1}
                className="flex-1 bg-transparent text-base focus:outline-none placeholder-gray-400 resize-none leading-normal self-center"
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
                className={`p-2 rounded-full transition-colors
                  ${input.trim() && !isTyping
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
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
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-lg">
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
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-full hover:bg-gray-100 transition-colors"
              >
                계속 대화하기
              </button>
              <button
                onClick={onFinish}
                className="px-4 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                검증 완료
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Has metrics and in input mode - show input with status */}
        {metrics && showInputMode && (
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>현재 점수: <span className="font-bold text-gray-900">{metrics.score}점</span></span>
                <span className="text-gray-300">|</span>
                <span>{turnCount}/10 턴</span>
              </div>
              <button
                onClick={onFinish}
                className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 transition-colors flex items-center gap-1.5"
              >
                검증 완료
                <ArrowRight size={12} />
              </button>
            </div>
            <div className="relative flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/10 transition-all min-h-[44px]">
              <textarea
                ref={textareaRef2}
                rows={1}
                className="flex-1 bg-transparent text-base focus:outline-none placeholder-gray-400 resize-none leading-normal self-center"
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
                className={`p-2 rounded-full transition-colors
                  ${input.trim() && !isTyping
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                `}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
