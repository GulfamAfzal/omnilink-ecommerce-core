'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageCircle, X, Send, Bot, User, Loader2,
  Package, ChevronRight, Minimize2, Maximize2,
} from 'lucide-react';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "👋 Hi! I'm **OmniBot**, your OMNILINK assistant.\n\nI can help you:\n- 🔍 Search & discover products\n- 🛒 Guide you through checkout\n- ❓ Answer questions about orders & support\n- 📞 Escalate issues to our human team\n\nHow can I help you today?",
  id: 'welcome',
};

const QUICK_REPLIES = [
  '🔍 Show me smartphones',
  '🎧 Find audio products',
  '💻 Search for laptops',
  '📞 I need human support',
  '🛒 How do I checkout?',
];

function parseMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showQuick, setShowQuick] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput('');
    setShowQuick(false);
    setLoading(true);

    const userMsg = { role: 'user', content: userText, id: Date.now().toString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    try {
      // Build history for API (exclude welcome message)
      const history = newMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();

      const botMsg = {
        role: 'assistant',
        content: data.reply || "I'm sorry, I couldn't process that. Please try again.",
        products: data.products || [],
        id: Date.now().toString() + '_bot',
      };

      setMessages(prev => [...prev, botMsg]);

      if (!isOpen) {
        setUnread(prev => prev + 1);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Connection error. Please check your internet or try again.',
        id: Date.now().toString() + '_err',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const panelW = isExpanded ? '420px' : '360px';
  const panelH = isExpanded ? '580px' : '500px';

  return (
    <>
      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={bubbleStyle}
        aria-label="Open AI Chat Assistant"
        id="chatbot-toggle"
      >
        <div style={bubbleGlow} />
        {isOpen
          ? <X size={22} strokeWidth={2.5} color="#fff" />
          : <MessageCircle size={22} strokeWidth={2.5} color="#fff" />}
        {unread > 0 && !isOpen && (
          <span style={badgeStyle}>{unread}</span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            right: '24px',
            width: panelW,
            height: panelH,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 20px rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.2)',
            backgroundColor: '#ffffff',
            animation: 'slideUpFade 0.25s ease',
            transition: 'width 0.3s ease, height 0.3s ease',
          }}
          role="dialog"
          aria-label="AI Chat Assistant"
        >
          {/* Header */}
          <div style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={botAvatarStyle}>
                <Bot size={16} color="#fff" strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>OmniBot</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#34D399', borderRadius: '50%', boxShadow: '0 0 5px #34D399' }} />
                  AI-powered · Gemini
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setIsExpanded(e => !e)}
                style={iconBtnStyle}
                aria-label={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 size={14} strokeWidth={2} /> : <Maximize2 size={14} strokeWidth={2} />}
              </button>
              <button onClick={() => setIsOpen(false)} style={iconBtnStyle} aria-label="Close chat">
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={messagesStyle}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: '8px',
                  }}
                >
                  {/* Avatar */}
                  <div style={msg.role === 'user' ? userAvatarStyle : botAvatarSmStyle}>
                    {msg.role === 'user'
                      ? <User size={12} color="#fff" strokeWidth={2.5} />
                      : <Bot size={12} color="#fff" strokeWidth={2} />}
                  </div>

                  {/* Bubble */}
                  <div
                    style={msg.role === 'user' ? userBubbleStyle : botBubbleStyle}
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                  />
                </div>

                {/* Product Cards */}
                {msg.products && msg.products.length > 0 && (
                  <div style={productCardsWrap}>
                    {msg.products.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.id}`}
                        style={productCard}
                        onClick={() => setIsOpen(false)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={productIconBox}>
                            <Package size={14} color="#06B6D4" strokeWidth={1.5} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={productName}>{p.name}</div>
                            <div style={productBrand}>{p.brand}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={productPrice}>
                              {p.currency} {p.price > 0 ? p.price.toLocaleString() : 'N/A'}
                            </div>
                            <ChevronRight size={12} color="#94A3B8" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '12px' }}>
                <div style={botAvatarSmStyle}><Bot size={12} color="#fff" strokeWidth={2} /></div>
                <div style={{ ...botBubbleStyle, padding: '10px 14px' }}>
                  <Loader2 size={14} color="#94A3B8" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              </div>
            )}

            {/* Quick replies */}
            {showQuick && !loading && messages.length === 1 && (
              <div style={quickWrap}>
                {QUICK_REPLIES.map(q => (
                  <button key={q} onClick={() => sendMessage(q)} style={quickBtn}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={inputAreaStyle}>
            <textarea
              ref={inputRef}
              id="chatbot-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything…"
              rows={1}
              style={textareaStyle}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={!input.trim() || loading ? sendBtnDisabled : sendBtn}
              aria-label="Send message"
              id="chatbot-send"
            >
              <Send size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50%       { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const bubbleStyle = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  width: '52px',
  height: '52px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9998,
  boxShadow: '0 4px 20px rgba(6,182,212,0.4), 0 2px 8px rgba(0,0,0,0.15)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

const bubbleGlow = {
  position: 'absolute',
  inset: 0,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)',
  animation: 'pulse-glow 2.5s ease-in-out infinite',
};

const badgeStyle = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  width: '18px',
  height: '18px',
  backgroundColor: '#EF4444',
  color: '#fff',
  borderRadius: '50%',
  fontSize: '10px',
  fontWeight: '800',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #fff',
};

const headerStyle = {
  background: 'linear-gradient(135deg, #1E3A5F 0%, #1E40AF 60%, #0891B2 100%)',
  padding: '14px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
};

const botAvatarStyle = {
  width: '34px',
  height: '34px',
  background: 'rgba(255,255,255,0.2)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(255,255,255,0.3)',
};

const iconBtnStyle = {
  width: '28px',
  height: '28px',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '6px',
  color: 'rgba(255,255,255,0.8)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s',
};

const messagesStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  backgroundColor: '#F8FAFB',
};

const botAvatarSmStyle = {
  width: '24px',
  height: '24px',
  background: 'linear-gradient(135deg, #06B6D4, #2563EB)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const userAvatarStyle = {
  width: '24px',
  height: '24px',
  background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const botBubbleStyle = {
  maxWidth: '80%',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '14px 14px 14px 4px',
  padding: '10px 14px',
  fontSize: '13px',
  color: '#0F172A',
  lineHeight: '1.55',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
};

const userBubbleStyle = {
  maxWidth: '80%',
  background: 'linear-gradient(135deg, #1E40AF, #0891B2)',
  borderRadius: '14px 14px 4px 14px',
  padding: '10px 14px',
  fontSize: '13px',
  color: '#FFFFFF',
  lineHeight: '1.55',
  boxShadow: '0 2px 8px rgba(30,64,175,0.2)',
};

const productCardsWrap = {
  marginTop: '8px',
  marginLeft: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const productCard = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  padding: '10px 12px',
  textDecoration: 'none',
  display: 'block',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

const productIconBox = {
  width: '32px',
  height: '32px',
  backgroundColor: 'rgba(6,182,212,0.08)',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const productName = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#0F172A',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const productBrand = {
  fontSize: '10px',
  color: '#64748B',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const productPrice = {
  fontSize: '12px',
  fontWeight: '800',
  color: '#06B6D4',
};

const quickWrap = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginTop: '4px',
  marginLeft: '32px',
};

const quickBtn = {
  fontSize: '12px',
  color: '#1E40AF',
  backgroundColor: 'rgba(30,64,175,0.06)',
  border: '1px solid rgba(30,64,175,0.2)',
  borderRadius: '20px',
  padding: '5px 12px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: '600',
  transition: 'all 0.15s',
};

const inputAreaStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: '8px',
  padding: '12px 14px',
  backgroundColor: '#FFFFFF',
  borderTop: '1px solid #E2E8F0',
  flexShrink: 0,
};

const textareaStyle = {
  flex: 1,
  padding: '9px 12px',
  backgroundColor: '#F8FAFB',
  border: '1px solid #E2E8F0',
  borderRadius: '10px',
  fontSize: '13px',
  color: '#0F172A',
  resize: 'none',
  outline: 'none',
  fontFamily: 'inherit',
  lineHeight: '1.4',
  maxHeight: '80px',
  overflowY: 'auto',
};

const sendBtn = {
  width: '36px',
  height: '36px',
  background: 'linear-gradient(135deg, #06B6D4, #2563EB)',
  border: 'none',
  borderRadius: '10px',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  boxShadow: '0 2px 8px rgba(6,182,212,0.3)',
  transition: 'transform 0.15s, box-shadow 0.15s',
};

const sendBtnDisabled = {
  ...sendBtn,
  background: '#E2E8F0',
  color: '#94A3B8',
  cursor: 'not-allowed',
  boxShadow: 'none',
};
