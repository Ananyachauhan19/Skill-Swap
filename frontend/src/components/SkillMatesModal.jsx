import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { X, Trash2, MoreVertical, Search, UserX, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSkillMates } from '../context/SkillMatesContext';

const SkillMatesModal = () => {
  const { isOpen, close, list, loading, error, remove } = useSkillMates();
  const navigate = useNavigate();

  // Search & navigation state
  const [liveQuery, setLiveQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [openMenuId, setOpenMenuId] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Debounce the search query (200ms)
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(liveQuery.trim()), 200);
    return () => clearTimeout(id);
  }, [liveQuery]);

  const onChangeSearch = useCallback((e) => {
    setLiveQuery(e.target.value);
  }, []);

  const displayList = useMemo(() => {
    if (!searchQuery) return (list || []).slice(0, 100);
    const term = searchQuery.toLowerCase();
    return (list || [])
      .filter(user => {
        const first = (user.firstName || '').toLowerCase();
        const last = (user.lastName || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        return (
          first.includes(term) ||
          last.includes(term) ||
          username.includes(term)
        );
      })
      .slice(0, 100)
      .map(user => ({ ...user }));
  }, [searchQuery, list]);

  // Reset active index when query changes or list shrinks
  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (activeIndex >= displayList.length) {
      setActiveIndex(displayList.length ? displayList.length - 1 : 0);
    }
  }, [displayList, activeIndex]);

  // Keep active item visible when navigating
  useEffect(() => {
    if (!displayList.length) return;
    const el = document.getElementById(`skillmate-option-${displayList[activeIndex]?._id}`);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, displayList]);

  const highlight = (text, query) => {
    if (!query) return text;
    const lowerText = String(text || '');
    const lower = query.toLowerCase();
    const full = lowerText.toLowerCase();
    const parts = [];
    let index = 0;
    let matchIndex;

    while ((matchIndex = full.indexOf(lower, index)) !== -1) {
      if (matchIndex > index) {
        parts.push(lowerText.slice(index, matchIndex));
      }
      parts.push(
        <mark key={matchIndex} className="bg-yellow-200 rounded px-0.5">
          {lowerText.slice(matchIndex, matchIndex + lower.length)}
        </mark>
      );
      index = matchIndex + lower.length;
    }

    if (index < lowerText.length) {
      parts.push(lowerText.slice(index));
    }

    return parts.length ? parts : text;
  };

  if (!isOpen) return null;

  const gotoProfile = (username) => {
    close();
    navigate(`/profile/${username}`);
  };

  const handleKeyDown = (e) => {
    if (!displayList.length) {
      if (e.key === 'Escape') close();
      return;
    }
    const last = displayList.length - 1;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i === last ? 0 : i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i === 0 ? last : i - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(last);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const user = displayList[activeIndex];
      if (user) gotoProfile(user.username);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Delete') {
      // Allow quick removal of highlighted item
      const user = displayList[activeIndex];
      if (user) {
        remove(user._id).catch(e => alert(e.message || 'Failed to remove'));
      }
    }
  };

  return (
    <>
      {/* Backdrop with subtle blur */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] transition-opacity" 
        onClick={close}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl h-[85vh] max-h-[700px] bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden transform transition-all flex flex-col">
          
          {/* Header Section */}
          <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 px-6 py-5 border-b border-gray-200/60 flex-shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Your SkillMates</h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {loading ? 'Loading...' : `${list?.length || 0} connection${list?.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
              <button 
                onClick={close} 
                className="p-2 rounded-lg hover:bg-white/80 text-gray-500 hover:text-gray-700 transition-all duration-200 group" 
                aria-label="Close skillmates modal"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
            
            {/* Enhanced Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={liveQuery}
                onChange={onChangeSearch}
                onKeyDown={handleKeyDown}
                ref={inputRef}
                role="combobox"
                aria-expanded="true"
                aria-controls="skillmates-list"
                aria-activedescendant={displayList[activeIndex] ? `skillmate-option-${displayList[activeIndex]._id}` : undefined}
                placeholder="Search by name or username..."
                className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 shadow-sm"
              />
              {liveQuery && (
                <button
                  onClick={() => setLiveQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="bg-white flex-1 overflow-hidden flex flex-col">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-gray-600">Loading your SkillMates...</p>
                <p className="text-xs text-gray-400 mt-1">This will only take a moment</p>
              </div>
            )}
            {error && (
              <div className="px-6 py-4 bg-red-50 border-b border-red-100">
                <div className="flex items-center gap-2 text-red-700">
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}
            {!loading && !error && (
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {displayList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      {searchQuery ? (
                        <Search className="w-8 h-8 text-gray-400" />
                      ) : (
                        <UserX className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {searchQuery ? 'No results found' : 'No SkillMates yet'}
                    </h3>
                    <p className="text-sm text-gray-500 text-center max-w-sm">
                      {searchQuery
                        ? 'Try adjusting your search terms or check the spelling.'
                        : 'Connect with other users to see them here.'}
                    </p>
                  </div>
                ) : (
                  <ul id="skillmates-list" role="listbox" className="divide-y divide-gray-100" ref={listRef}>
                    {displayList.map((u, idx) => (
                      <li
                        id={`skillmate-option-${u._id}`}
                        key={u._id}
                        role="option"
                        aria-selected={idx === activeIndex}
                        className={`group px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 cursor-pointer ${
                          idx === activeIndex ? 'bg-gradient-to-r from-blue-50 to-indigo-50/50 border-l-2 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <button
                            onClick={() => gotoProfile(u.username)}
                            className="shrink-0 relative group/avatar"
                            title={u.username}
                          >
                            <div className="relative">
                              <img
                                src={u.profilePic || 'https://placehold.co/48x48?text=U'}
                                alt={u.username}
                                className="w-12 h-12 rounded-xl object-cover border-2 border-gray-200 group-hover/avatar:border-blue-400 transition-all duration-200 shadow-sm"
                              />
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/0 to-indigo-600/0 group-hover/avatar:from-blue-500/10 group-hover/avatar:to-indigo-600/10 transition-all duration-200" />
                            </div>
                          </button>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => gotoProfile(u.username)}
                              className="block text-left w-full group-hover:translate-x-0.5 transition-transform duration-200"
                            >
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-base font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                  {highlight(`${u.firstName || ''}`, u._matches, 'firstName')} {highlight(`${u.lastName || ''}`, u._matches, 'lastName')}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                @{highlight(u.username, u._matches, 'username')}
                              </div>
                            </button>
                          </div>

                          {/* Action Buttons - Show on hover */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => gotoProfile(u.username)}
                              className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 whitespace-nowrap"
                            >
                              View Profile
                            </button>
                            
                            {/* Menu */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(prev => (prev === u._id ? null : u._id))}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-200"
                                aria-label="Open actions menu"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenuId === u._id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                  
                                  <button
                                    className="w-full text-left px-4 py-3 hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors text-sm font-medium flex items-center gap-2 border-t border-gray-100 group/item"
                                    onClick={async () => {
                                      try {
                                        await remove(u._id);
                                        setOpenMenuId(null);
                                      } catch (e) {
                                        alert(e.message || 'Failed to remove');
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-gray-400 group-hover/item:text-red-500" />
                                    Remove Connection
                                  </button>
                                  <button
                                    className="w-full text-left px-4 py-3 hover:bg-amber-50 text-gray-700 hover:text-amber-700 transition-colors text-sm font-medium flex items-center gap-2 border-t border-gray-100 group/item"
                                    onClick={() => {
                                      close();
                                      setOpenMenuId(null);
                                      navigate('/report', {
                                        state: {
                                          reportedUser: {
                                            _id: u._id,
                                            username: u.username,
                                            fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
                                            email: u.email,
                                          },
                                        },
                                      });
                                    }}
                                  >
                                    <svg className="w-4 h-4 text-gray-400 group-hover/item:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Report User
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SkillMatesModal;
