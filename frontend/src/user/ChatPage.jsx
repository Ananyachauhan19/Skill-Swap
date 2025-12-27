import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Send, ChevronLeft, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import socket from '../socket';
import { BACKEND_URL } from '../config.js';
import { isChatMuted, toggleChatMuted } from '../utils/chatMute.js';

const formatTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatLastSeen = (lastSeenAt) => {
  if (!lastSeenAt) return '';
  const d = new Date(lastSeenAt);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `last seen today at ${time}`;
  const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `last seen ${date} at ${time}`;
};

const resolveProfilePic = (profilePic) => {
  if (!profilePic) return '';
  if (/^https?:\/\//i.test(profilePic)) return profilePic;
  return `${BACKEND_URL}${profilePic}`;
};

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const initialSkillMateId = location.state?.skillMateId || null;

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsError, setThreadsError] = useState('');

  const [activeSkillMateId, setActiveSkillMateId] = useState(initialSkillMateId);
  const [activeSkillMate, setActiveSkillMate] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');

  const [query, setQuery] = useState('');
  const [mobileView, setMobileView] = useState(initialSkillMateId ? 'chat' : 'list');

  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const menuPanelRef = useRef(null);
  const [muted, setMuted] = useState(false);

  const messagesEndRef = useRef(null);

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const sm = t.skillMate;
      const name = `${sm?.firstName || ''} ${sm?.lastName || ''}`.trim().toLowerCase();
      const username = (sm?.username || '').toLowerCase();
      return name.includes(q) || username.includes(q);
    });
  }, [threads, query]);

  useEffect(() => {
    if (!activeSkillMateId) {
      setMuted(false);
      return;
    }
    setMuted(isChatMuted(activeSkillMateId));
  }, [activeSkillMateId]);

  // Close 3-dot menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (menuPanelRef.current && menuPanelRef.current.contains(e.target)) return;
      if (menuButtonRef.current && menuButtonRef.current.contains(e.target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  // Load threads (chat list)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setThreadsLoading(true);
        setThreadsError('');
        const res = await fetch(`${BACKEND_URL}/api/chat/threads`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load chats');
        const data = await res.json();
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setThreads(list);

        if (initialSkillMateId) {
          const found = list.find((t) => t?.skillMate?._id === initialSkillMateId);
          if (found?.skillMate) setActiveSkillMate(found.skillMate);
        }
      } catch (e) {
        if (!mounted) return;
        setThreadsError(e?.message || 'Failed to load chats');
      } finally {
        if (mounted) setThreadsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [initialSkillMateId]);

  // Keep presence updated from socket broadcasts
  useEffect(() => {
    const handlePresence = (payload) => {
      const userId = payload?.userId;
      if (!userId) return;

      setThreads((prev) =>
        prev.map((t) => {
          if (t?.skillMate?._id !== userId) return t;
          return {
            ...t,
            skillMate: {
              ...t.skillMate,
              isOnline: typeof payload.isOnline === 'boolean' ? payload.isOnline : t.skillMate?.isOnline,
              lastSeenAt: payload.lastSeenAt || t.skillMate?.lastSeenAt,
            },
          };
        })
      );

      setActiveSkillMate((prev) => {
        if (!prev || prev._id !== userId) return prev;
        return {
          ...prev,
          isOnline: typeof payload.isOnline === 'boolean' ? payload.isOnline : prev.isOnline,
          lastSeenAt: payload.lastSeenAt || prev.lastSeenAt,
        };
      });
    };

    socket.on('user-online-status-changed', handlePresence);
    return () => {
      socket.off('user-online-status-changed', handlePresence);
    };
  }, []);

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeSkillMateId) {
      setMessages([]);
      setActiveSkillMate(null);
      return;
    }

    let mounted = true;
    const loadHistory = async () => {
      try {
        setMessagesLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/chat/history/${activeSkillMateId}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load messages');
        const data = await res.json();
        if (!mounted) return;
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        setActiveSkillMate(data.skillMateInfo || null);

        // Clear unread count locally for this thread
        setThreads((prev) => prev.map((t) => (t?.skillMate?._id === activeSkillMateId ? { ...t, unreadCount: 0 } : t)));
      } catch {
        if (!mounted) return;
        setMessages([]);
      } finally {
        if (mounted) setMessagesLoading(false);
      }
    };

    loadHistory();
    return () => {
      mounted = false;
    };
  }, [activeSkillMateId]);

  // Live incoming messages
  useEffect(() => {
    const handleIncoming = (data) => {
      const msg = data?.message;
      if (!msg?._id) return;

      const fromId = msg.senderId;
      const isForActive = activeSkillMateId && fromId === activeSkillMateId;

      if (isForActive) {
        setMessages((prev) => [...prev, msg]);
      }

      setThreads((prev) => {
        const updated = prev.map((t) => {
          if (t?.skillMate?._id !== fromId) return t;
          return {
            ...t,
            lastMessage: msg,
            unreadCount: isForActive ? 0 : (t.unreadCount || 0) + 1,
          };
        });
        updated.sort((a, b) => {
          const at = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const bt = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
          return bt - at;
        });
        return updated;
      });
    };

    socket.on('chat-message-received', handleIncoming);
    return () => {
      socket.off('chat-message-received', handleIncoming);
    };
  }, [activeSkillMateId]);

  // Keep scroll pinned to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeSkillMateId]);

  const openChat = (skillMate) => {
    if (!skillMate?._id) return;
    setActiveSkillMateId(skillMate._id);
    setActiveSkillMate(skillMate);
    setMenuOpen(false);
    setMobileView('chat');
  };

  const handleToggleMute = () => {
    if (!activeSkillMateId) return;
    const next = toggleChatMuted(activeSkillMateId);
    setMuted(next);
    setMenuOpen(false);
  };

  const handleReportUser = () => {
    if (!activeSkillMate) return;
    setMenuOpen(false);
    navigate('/report', {
      state: {
        reportedUser: {
          _id: activeSkillMate._id,
          username: activeSkillMate.username,
          fullName: `${activeSkillMate.firstName || ''} ${activeSkillMate.lastName || ''}`.trim() || activeSkillMate.username,
        },
      },
    });
  };

  const handleRemoveSkillMate = async () => {
    if (!activeSkillMateId) return;
    setMenuOpen(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/skillmates/remove/${activeSkillMateId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to remove SkillMate');

      setThreads((prev) => prev.filter((t) => t?.skillMate?._id !== activeSkillMateId));
      setActiveSkillMateId(null);
      setActiveSkillMate(null);
      setMessages([]);
      setMobileView('list');
    } catch (e) {
      alert(e?.message || 'Failed to remove SkillMate');
    }
  };

  const sendMessage = () => {
    const content = draft.trim();
    if (!content || !activeSkillMateId || !user?._id) return;

    socket.emit('send-chat-message', { recipientId: activeSkillMateId, content });

    const optimistic = {
      _id: `tmp-${Date.now()}`,
      senderId: user._id,
      recipientId: activeSkillMateId,
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setDraft('');

    setThreads((prev) => {
      const updated = prev.map((t) => (t?.skillMate?._id === activeSkillMateId ? { ...t, lastMessage: optimistic } : t));
      updated.sort((a, b) => {
        const at = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const bt = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return bt - at;
      });
      return updated;
    });
  };

  const activePresenceText = useMemo(() => {
    if (!activeSkillMate) return '';
    if (activeSkillMate.isOnline) return 'online';
    const lastSeen = formatLastSeen(activeSkillMate.lastSeenAt);
    return lastSeen || 'offline';
  }, [activeSkillMate]);

  return (
    <div className="min-h-screen bg-white pt-16 md:pt-[72px]">
      <div className="w-full h-[calc(100vh-64px)] md:h-[calc(100vh-72px)] flex">
        {/* Left: chat list */}
        <aside
          className={`w-full md:w-[360px] lg:w-[400px] flex flex-col bg-white shadow-md z-10 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-3 sm:px-4 py-3 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <h1 className="text-sm sm:text-base font-semibold text-slate-900">Messages</h1>
              <button
                onClick={() => navigate(-1)}
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats"
                className="w-full bg-transparent outline-none text-[13px] text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {threadsLoading ? (
              <div className="px-3 sm:px-4 py-3 text-[13px] text-slate-500">Loading chats…</div>
            ) : threadsError ? (
              <div className="px-3 sm:px-4 py-3 text-[13px] text-rose-600">{threadsError}</div>
            ) : filteredThreads.length === 0 ? (
              <div className="px-3 sm:px-4 py-3 text-[13px] text-slate-500">No chats found.</div>
            ) : (
              filteredThreads.map((t) => {
                const sm = t.skillMate;
                const active = sm?._id === activeSkillMateId;
                const last = t.lastMessage?.content || '';
                const lastAt = t.lastMessage?.createdAt;
                const unread = t.unreadCount || 0;

                return (
                  <button
                    key={sm?._id}
                    onClick={() => openChat(sm)}
                    className={`w-full text-left px-3 sm:px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                      active ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {sm?.profilePic ? (
                        <img
                          src={resolveProfilePic(sm.profilePic)}
                          alt={sm.firstName || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                          {(sm?.firstName?.[0] || '?').toUpperCase()}
                        </div>
                      )}
                      {sm?.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 truncate">
                            {`${sm?.firstName || ''} ${sm?.lastName || ''}`.trim() || sm?.username || 'SkillMate'}
                          </p>
                          <p className="text-[12px] text-slate-500 truncate">
                            {last || (sm?.isOnline ? 'Online' : 'Tap to chat')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[11px] text-slate-400">{formatTime(lastAt)}</span>
                          {unread > 0 && (
                            <span className="text-[11px] bg-blue-600 text-white rounded-full px-2 py-0.5 font-semibold">
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: conversation */}
        <section className={`flex-1 flex flex-col bg-white ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
          {!activeSkillMateId ? (
            <div className="h-full flex items-center justify-center text-center px-6">
              <div>
                <p className="text-slate-700 font-semibold text-sm">Select a chat to start messaging</p>
                <p className="text-[13px] text-slate-500 mt-1">Your SkillMates will appear on the left.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-3 sm:px-4 py-3 bg-white shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-2 rounded-lg hover:bg-slate-50 text-slate-600"
                    aria-label="Back to chats"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3 min-w-0">
                    {activeSkillMate?.profilePic ? (
                      <img
                        src={resolveProfilePic(activeSkillMate.profilePic)}
                        alt={activeSkillMate.firstName || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                        {(activeSkillMate?.firstName?.[0] || '?').toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] sm:text-sm font-semibold text-slate-900 truncate">
                        {activeSkillMate
                          ? `${activeSkillMate.firstName || ''} ${activeSkillMate.lastName || ''}`.trim() || activeSkillMate.username
                          : 'Chat'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{activePresenceText}</p>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button
                    ref={menuButtonRef}
                    onClick={() => setMenuOpen((v) => !v)}
                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-600"
                    aria-label="Menu"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {menuOpen && (
                    <div
                      ref={menuPanelRef}
                      className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-30"
                    >
                      <button
                        onClick={handleReportUser}
                        className="w-full text-left px-4 py-3 text-[13px] text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        Report user
                      </button>
                      <button
                        onClick={handleRemoveSkillMate}
                        className="w-full text-left px-4 py-3 text-[13px] text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors border-t border-slate-100"
                      >
                        Remove connection
                      </button>
                      <button
                        onClick={handleToggleMute}
                        className="w-full text-left px-4 py-3 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                      >
                        {muted ? 'Turn on notifications' : 'Turn off notifications'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-slate-50 px-3 sm:px-4 py-4">
                {messagesLoading ? (
                  <div className="text-[13px] text-slate-500">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="text-[13px] text-slate-500">No messages yet. Say hello!</div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((m) => {
                      const mine = m.senderId === user?._id;
                      return (
                        <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm border text-[13px] ${
                              mine ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-800 border-slate-200'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.content}</p>
                            <p className={`mt-1 text-[11px] text-right ${mine ? 'text-blue-100' : 'text-slate-400'}`}>
                              {formatTime(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-3 sm:px-4 py-3 bg-white shadow-sm">
                <div className="flex items-end gap-2">
                  <textarea
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message"
                    className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!draft.trim()}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatPage;
