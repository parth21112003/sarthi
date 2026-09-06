import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, RotateCcw, Bot, User as UserIcon, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import aiService from '../../services/aiService';
import './AiChatWidget.css';

const STARTER_PROMPTS = [
  'Which stream should I choose if I like problem-solving and logic?',
  'What high-growth careers exist in commerce besides CA?',
  'Recommend a top counselor for engineering and tech careers.',
  'How do I build skills for AI & Data Science during college?',
];

const AiChatWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am **Sarthi AI**, your 24/7 Career Companion. I can help analyze your stream choices, map out career roadmaps, or connect you with expert human counselors. What would you like to explore today?',
    },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg = { role: 'user', content: query };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputMessage('');
    setLoading(true);

    try {
      // Send last 6 conversation turns as context
      const chatHistory = updatedHistory.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiService.chat(query, chatHistory);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply || 'I am ready to help you navigate your academic journey! Feel free to ask more questions.',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I ran into a brief connection issue with our AI brain. Please try asking again in a moment!',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat refreshed. How can I guide your career path today?',
      },
    ]);
  };

  /**
   * Cleans up any stray <br> or HTML tags that might come from raw LLM output
   */
  const cleanMarkdown = (content) => {
    if (!content) return '';
    return content.replace(/<br\s*\/?>/gi, '\n');
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          className="ai-widget-launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Career Companion"
        >
          <div className="ai-widget-launcher-glow" />
          <Sparkles size={18} color="#ffeaa7" />
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Ask Sarthi AI</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-header-title">
              <div className="ai-bot-avatar">
                <Sparkles size={18} />
              </div>
              <div className="ai-header-text">
                <h4>
                  Sarthi AI Mentor <span className="ai-online-dot" />
                </h4>
                <p>24/7 Career & Counselor Guide</p>
              </div>
            </div>

            <div className="ai-header-actions">
              <button
                className="ai-header-btn"
                onClick={handleClearChat}
                title="Reset Chat"
              >
                <RotateCcw size={14} />
              </button>
              <button
                className="ai-header-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="ai-chat-body">
            {messages.length === 1 && (
              <div className="ai-welcome-box">
                <Bot size={28} color="var(--primary-light)" />
                <h5>Instant Career Advice & Counselor Matching</h5>
                <p>
                  Ask any questions about streams, colleges, or skills. You can also ask me to suggest verified counselors on Sarthi.
                </p>
                <div className="ai-prompt-chips">
                  {STARTER_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      className="ai-chip-btn"
                      onClick={() => handleSend(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`ai-msg-row ${msg.role === 'user' ? 'user' : 'bot'}`}
              >
                <div className={`ai-msg-avatar ${msg.role === 'user' ? 'user' : 'bot'}`}>
                  {msg.role === 'user' ? <UserIcon size={14} /> : <Sparkles size={14} />}
                </div>
                <div className="ai-msg-bubble">
                  {msg.role === 'user' ? (
                    <p style={{ margin: 0 }}>{msg.content}</p>
                  ) : (
                    <div className="ai-markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ node, ...props }) => (
                            <div className="ai-markdown-table-wrapper">
                              <table {...props} />
                            </div>
                          ),
                          a: ({ node, ...props }) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" />
                          ),
                        }}
                      >
                        {cleanMarkdown(msg.content)}
                      </ReactMarkdown>
                    </div>
                  )}

                  {msg.role === 'assistant' && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        className="ai-counselor-tag"
                        onClick={() => navigate('/student/counselors')}
                      >
                        <ExternalLink size={10} /> View All Counselors
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-msg-row bot">
                <div className="ai-msg-avatar bot">
                  <Sparkles size={14} />
                </div>
                <div className="ai-typing-indicator">
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer / Input */}
          <div className="ai-chat-footer">
            <div className="ai-input-wrapper">
              <input
                type="text"
                className="ai-chat-input"
                placeholder="Ask Sarthi AI anything about careers..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                className="ai-send-btn"
                onClick={() => handleSend()}
                disabled={!inputMessage.trim() || loading}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiChatWidget;