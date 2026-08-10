import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Lock, Unlock, MailCheck } from 'lucide-react';
import { ChatMessage } from '../types';

interface Props {
  messages: ChatMessage[];
  loginUser: string;
  currentUserRole: string;
  onSendMessage: (text: string) => void;
  onLockMessage: (id: string, lock: boolean) => void;
  onClearAllMessages: () => void;
}

export default function MessengerTab({
  messages,
  loginUser,
  currentUserRole,
  onSendMessage,
  onLockMessage,
  onClearAllMessages
}: Props) {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-210px)] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm m-6">
      {/* HEADER BAR */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <h3 className="text-white text-sm font-bold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>AMM SECURE MESSENGER</span>
          </h3>
          <p className="text-slate-400 text-[10px] mt-0.5">Canal de communication interne crypté</p>
        </div>

        {/* President level clear messages functionality */}
        {currentUserRole === 'NATIONAL_PRESIDENT' && (
          <button 
            onClick={onClearAllMessages}
            className="text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer border border-rose-950/40 bg-rose-950/20 px-3 py-1.5 rounded-lg transition-all"
          >
            Fafana ny Resaka Rehetra
          </button>
        )}
      </div>

      {/* CHAT BUBBLES BLOCK */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50 space-y-3">
        {messages.map((msg, index) => {
          const isMine = msg.sender === loginUser;
          return (
            <div 
              key={msg.id || index} 
              className={`flex flex-col max-w-[75%] ${isMine ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              {/* Sender signature block */}
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-bold px-1 select-none">
                <span className="text-slate-700">{msg.sender}</span>
                <span>•</span>
                <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded scale-95">{msg.role}</span>
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Message contents */}
              <div className={`p-3 rounded-2xl shadow-sm relative text-sm leading-relaxed ${
                isMine 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
              }`}>
                <p className="break-words whitespace-pre-line">{msg.text}</p>
                
                {/* Security locks indicators */}
                {msg.locked && (
                  <div className="flex items-center justify-end mt-1 text-[10px] opacity-75 font-bold gap-0.5">
                    <Lock className="h-3 w-3" />
                    <span>Crypté à vie</span>
                  </div>
                )}
              </div>

              {/* Admin toggle lock controls */}
              {currentUserRole === 'NATIONAL_PRESIDENT' && msg.id && (
                <button 
                  onClick={() => onLockMessage(msg.id!, !msg.locked)}
                  className="text-[9px] font-bold text-indigo-600 hover:underline mt-1 cursor-pointer select-none"
                >
                  {msg.locked ? "Déverrouiller" : "Verrouiller ce message"}
                </button>
              )}
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* INPUT CONTROLLER FORM */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
        <input 
          type="text" 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Soraty eto ny hafatra ho avy..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
        />
        <button 
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </form>
    </div>
  );
}
