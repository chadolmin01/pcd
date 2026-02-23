'use client';

import React from 'react';
import { Check, ArrowRight, Cpu, Paintbrush, DollarSign, Megaphone, Scale, ClipboardList, Server, Calculator, User, Settings } from 'lucide-react';
import { ChatMessage, PERSONA_PRESETS, PerspectiveAdvice } from './types';

interface MessageListProps {
  messages: ChatMessage[];
  lastMsgId: string | undefined;
  isTyping: boolean;
  hideInput: boolean;
  onOpenReflectionModal: (
    msgId: string,
    idx: number,
    role: string,
    content: string,
    suggestedActions?: string[],
    reflectedText?: string,
    perspectives?: PerspectiveAdvice[]
  ) => void;
  onConsolidatedSend: () => void;
}

const getPersonaIcon = (role: string) => {
  const preset = PERSONA_PRESETS.find(p => p.id === role || p.name === role);
  if (preset) {
    const icons: Record<string, React.ReactNode> = {
      'Cpu': <Cpu size={16} />,
      'Paintbrush': <Paintbrush size={16} />,
      'DollarSign': <DollarSign size={16} />,
      'Megaphone': <Megaphone size={16} />,
      'Scale': <Scale size={16} />,
      'ClipboardList': <ClipboardList size={16} />,
      'Server': <Server size={16} />,
      'Calculator': <Calculator size={16} />,
      'User': <User size={16} />,
      'Settings': <Settings size={16} />,
    };
    return icons[preset.icon] || <Cpu size={16} />;
  }
  return <Cpu size={16} />;
};

const getPersonaColor = (role: string) => {
  const preset = PERSONA_PRESETS.find(p => p.id === role || p.name === role);
  if (preset) {
    return preset.color;
  }
  return 'bg-gray-50 border-gray-200 text-gray-600';
};

const MessageList: React.FC<MessageListProps> = ({
  messages,
  lastMsgId,
  isTyping,
  hideInput,
  onOpenReflectionModal,
  onConsolidatedSend,
}) => {
  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 pt-4 ${hideInput ? 'pb-20' : 'pb-6'}`}>
      {messages.map((msg) => (
        <div key={msg.id} className={`flex gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
          {msg.isUser ? (
            // User Message
            <>
              <div className="max-w-[70%] space-y-1">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs font-bold text-gray-900">Me</span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`p-4 rounded text-sm leading-relaxed shadow-sm break-keep
                  ${msg.text?.startsWith('[종합 결정 사항]')
                      ? 'bg-black text-white border border-black'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                  {msg.text}
                </div>
              </div>
              <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 mt-6">
                <span className="text-gray-500 text-xs font-bold">U</span>
              </div>
            </>
          ) : (
            // AI Persona Grid
            <>
              {msg.responses && msg.responses[0].role === 'System' ? (
                <>
                  <div className="w-8 h-8 bg-black rounded flex items-center justify-center shrink-0 mt-6">
                    <span className="text-white font-bold text-xs">D</span>
                  </div>
                  <div className="max-w-[70%] space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">Draft AI</span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded text-sm text-gray-700 leading-relaxed break-keep shadow-sm">
                      {msg.responses[0].content}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                      <span className="text-white font-bold text-xs">D</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">Draft AI</span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-10" data-tutorial="persona-cards">
                    {msg.responses?.map((resp, idx) => (
                      <button
                        key={idx}
                        onClick={() => resp.role !== 'System' && onOpenReflectionModal(
                          msg.id, idx, resp.role, resp.content,
                          resp.suggestedActions, resp.reflectedText, resp.perspectives
                        )}
                        className={`relative flex flex-col items-start p-5 border transition-all duration-200 text-left group w-full min-h-[180px]
                          ${resp.isReflected
                            ? 'bg-gray-50 border-gray-300 shadow-sm rounded'
                            : 'bg-white border-gray-200 hover:border-black hover:shadow-sm rounded'
                          }
                        `}
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        {/* Persona Icon */}
                        <div className={`w-9 h-9 border rounded flex items-center justify-center mb-4 transition-colors
                          ${resp.isReflected
                            ? 'bg-gray-800 border-gray-800 text-white'
                            : `${getPersonaColor(resp.role)} group-hover:bg-black group-hover:border-black group-hover:text-white`
                          }
                        `}>
                          {getPersonaIcon(resp.role)}
                        </div>

                        {/* Role Label + Perspective Tags */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-bold text-sm text-gray-900">{resp.role}</span>
                          {resp.perspectives && resp.perspectives.length > 0 && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              {resp.perspectives.slice(0, 3).map((p, pIdx) => (
                                <span key={pIdx}>#{p.perspectiveLabel.replace(/\s+/g, '')} </span>
                              ))}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <p className="text-xs text-gray-500 leading-relaxed break-keep flex-1">
                          {resp.isReflected && resp.reflectedText ? resp.reflectedText : resp.content}
                        </p>

                        {/* Selected Badge */}
                        {resp.isReflected && (
                          <div className="absolute top-4 right-4 w-5 h-5 bg-gray-800 rounded flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Next Step Button */}
                  {msg.id === lastMsgId && msg.responses?.some(r => r.isReflected) && (
                    <div className="ml-10 mt-4 flex items-center justify-between p-3 bg-white border border-gray-200 rounded" data-tutorial="next-step-button">
                      <div className="flex items-center gap-3">
                        <div className="text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wide">
                          {msg.responses.filter(r => r.isReflected).length}개 조언 선택됨
                        </div>
                      </div>
                      <button
                        onClick={onConsolidatedSend}
                        disabled={isTyping}
                        className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        다음 단계
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="flex items-center gap-3 ml-10">
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        </div>
      )}
      <div className="h-4"></div>
    </div>
  );
};

export default MessageList;
