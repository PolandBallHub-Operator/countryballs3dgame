import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { ChatMessage } from '../types/game';

interface ChatOverlayProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  userName: string;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  messages,
  onSendMessage,
  isOpen,
  onToggleOpen,
  userName,
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="absolute bottom-6 left-6 z-30 pointer-events-auto max-w-sm w-full select-none">
      {/* Recent Chat Messages stream */}
      <div
        ref={scrollRef}
        className={`flex flex-col gap-1.5 max-h-48 overflow-y-auto mb-2 p-2 rounded-xl transition-all ${
          isOpen ? 'bg-stone-950/85 border border-stone-800' : 'bg-transparent'
        }`}
      >
        {messages.slice(-10).map((msg) => (
          <div
            key={msg.id}
            className="text-xs bg-stone-900/90 border border-stone-800/80 rounded-lg px-2.5 py-1 text-stone-200 shadow-md backdrop-blur-xs flex items-start gap-1.5"
          >
            <span
              className={`font-black shrink-0 ${
                msg.senderName === userName ? 'text-amber-400' : 'text-sky-400'
              }`}
            >
              {msg.senderName}:
            </span>
            <span className="text-white break-words">{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Input bar */}
      {isOpen ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            maxLength={60}
            placeholder="メッセージを入力 (Enterで送信)..."
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-stone-950/90 border border-amber-500/80 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none shadow-lg"
          />
          <button
            type="submit"
            className="p-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-colors cursor-pointer shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <button
          onClick={onToggleOpen}
          className="flex items-center gap-2 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-300 shadow-lg transition-colors cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span>チャット (Enter)</span>
        </button>
      )}
    </div>
  );
};
