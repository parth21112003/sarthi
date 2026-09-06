import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageSquare, Send } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import chatService from '../services/chatService';
import './Messages.css';

const formatTime = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
};

const Messages = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChatId, setActiveChatId] = useState(Number(searchParams.get('chatId')) || null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId), [chats, activeChatId]);
  const activePerson = activeChat?.participants?.find((participant) => participant.userId !== user?.id)?.user;

  const loadChats = async () => {
    setLoadingChats(true);
    try {
      const data = await chatService.list();
      setChats(data.chats || []);
      if (!activeChatId && data.chats?.length) {
        setActiveChatId(data.chats[0].id);
      }
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (!activeChatId) return undefined;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await chatService.messages(activeChatId);
        setMessages(data.messages || []);
        await chatService.markRead(activeChatId);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
    setSearchParams({ chatId: String(activeChatId) });

    if (socket) {
      socket.emit('chat:join', activeChatId);
      return () => socket.emit('chat:leave', activeChatId);
    }

    return undefined;
  }, [activeChatId, socket, setSearchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingMessages]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleMessage = ({ message, chatId }) => {
      setChats((current) => current.map((chat) => (
        chat.id === chatId
          ? { ...chat, lastMessage: message.content, lastAt: message.createdAt, messages: [message] }
          : chat
      )));

      if (chatId === activeChatId) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
        chatService.markRead(chatId).catch(() => {});
      } else {
        loadChats();
      }
    };

    const handleTyping = ({ chatId, userId, isTyping }) => {
      if (chatId !== activeChatId || userId === user?.id) return;
      setTypingUsers((current) => ({ ...current, [userId]: isTyping }));
    };

    const handleRead = ({ chatId }) => {
      if (chatId === activeChatId) {
        setMessages((current) => current.map((message) => ({ ...message, isRead: true })));
      }
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:read', handleRead);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:read', handleRead);
    };
  }, [activeChatId, socket, user?.id]);

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
  };

  const handleDraftChange = (event) => {
    setDraft(event.target.value);

    if (socket && activeChatId) {
      socket.emit('chat:typing', { chatId: activeChatId, isTyping: true });
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(() => {
        socket.emit('chat:typing', { chatId: activeChatId, isTyping: false });
      }, 900);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeChatId) return;

    setDraft('');
    socket?.emit('chat:typing', { chatId: activeChatId, isTyping: false });

    try {
      const data = await chatService.send(activeChatId, content);
      setMessages((current) => current.some((item) => item.id === data.message.id) ? current : [...current, data.message]);
      loadChats();
    } catch (error) {
      setDraft(content);
      toast.error(error.response?.data?.error || 'Could not send message');
    }
  };

  const isSomeoneTyping = Object.values(typingUsers).some(Boolean);

  return (
    <DashboardLayout title="Messages">
      <div className="messages-shell">
        <aside className="conversation-list">
          {loadingChats ? (
            <div className="flex-center" style={{ minHeight: 220 }}>
              <Spinner text="Loading chats" />
            </div>
          ) : chats.length === 0 ? (
            <div className="empty-chat">
              <EmptyState
                icon={<MessageSquare size={28} />}
                title="No conversations yet"
                description="Start a chat from a counsellor profile."
              />
            </div>
          ) : chats.map((chat) => {
            const person = chat.participants.find((participant) => participant.userId !== user?.id)?.user;
            const lastMessage = chat.messages?.[0]?.content || chat.lastMessage || 'No messages yet';

            return (
              <button
                key={chat.id}
                className={`conversation-item ${chat.id === activeChatId ? 'active' : ''}`}
                onClick={() => handleSelectChat(chat.id)}
              >
                <Avatar name={person?.name} size="sm" isOnline={Boolean(onlineUsers[person?.id])} />
                <div className="conversation-copy">
                  <strong>{person?.name || 'Conversation'}</strong>
                  <span className="muted small-text">{lastMessage}</span>
                </div>
              </button>
            );
          })}
        </aside>

        <section className="chat-panel">
          {activeChat ? (
            <>
              <header className="chat-header">
                <Avatar name={activePerson?.name} size="sm" isOnline={Boolean(onlineUsers[activePerson?.id])} />
                <div className="conversation-copy">
                  <strong>{activePerson?.name}</strong>
                  <span className="muted small-text">{onlineUsers[activePerson?.id] ? 'Online' : activePerson?.role || 'User'}</span>
                </div>
              </header>

              <div className="chat-messages">
                {loadingMessages ? (
                  <div className="flex-center" style={{ minHeight: 260 }}>
                    <Spinner text="Loading messages" />
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyState
                    icon={<MessageSquare size={28} />}
                    title="Start the conversation"
                    description="Send the first message for this counselling thread."
                  />
                ) : messages.map((message) => {
                  const isMine = String(message.senderId) === String(user?.id);
                  return (
                    <div key={message.id} className={`message-bubble ${isMine ? 'mine sender' : 'theirs receiver'}`}>
                      <span className="message-sender-tag">
                        {isMine ? 'You' : (activePerson?.name || 'Counsellor')}
                      </span>
                      <p>{message.content}</p>
                      <time>{formatTime(message.createdAt)}</time>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="typing-line">
                {isSomeoneTyping ? `${activePerson?.name || 'User'} is typing...` : ''}
              </div>

              <form className="message-form" onSubmit={handleSend}>
                <input
                  className="message-input"
                  value={draft}
                  onChange={handleDraftChange}
                  placeholder="Write a message"
                />
                <Button type="submit" iconLeft={<Send size={18} />}>Send</Button>
              </form>
            </>
          ) : (
            <div className="empty-chat">
              <EmptyState
                icon={<MessageSquare size={28} />}
                title="Choose a conversation"
                description="Your active chat will appear here."
              />
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
