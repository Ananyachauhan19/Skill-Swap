import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { X, Trash2, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSkillMates } from '../context/SkillMatesContext';
import Fuse from 'fuse.js';

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

  const fuse = useMemo(() => new Fuse(list || [], {
    keys: [
      { name: 'firstName', weight: 0.4 },
      { name: 'lastName', weight: 0.3 },
      { name: 'username', weight: 0.3 }
    ],
    includeMatches: true,
    // Slightly looser matching and allow single-character queries
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 1
  }), [list]);

  const displayList = useMemo(() => {
    if (!searchQuery) return (list || []).slice(0, 100);
    return fuse.search(searchQuery).slice(0, 100).map(r => ({ ...r.item, _matches: r.matches }));
  }, [searchQuery, list, fuse]);

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

  const highlight = (text, matches, key) => {
    if (!matches) return text;
    const m = matches.find(x => x.key === key);
    if (!m) return text;
    const parts = [];
    let last = 0;
    m.indices.forEach(([start, end], idx) => {
      if (start > last) parts.push(text.slice(last, start));
      parts.push(<mark key={key+idx} className="bg-yellow-200 rounded px-0.5">{text.slice(start, end+1)}</mark>);
      last = end + 1;
    });
    if (last < text.length) parts.push(text.slice(last));
    return parts;
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
      <div className="fixed inset-0 bg-black/40 z-[1000]" onClick={close} />
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-blue-100 p-4 sm:p-6">
          <div className="flex flex-col gap-3 mb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-blue-900">Your SkillMates</h2>
              <button onClick={close} className="p-2 rounded-md hover:bg-blue-50 text-blue-700" aria-label="Close skillmates modal">
                <X size={18} />
              </button>
            </div>
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
              className="w-full bg-blue-50/50 border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-300/40 rounded-lg px-3 py-2 text-sm outline-none transition"
            />
          </div>
          {loading && (
            <div className="text-sm text-gray-500">Loading...</div>
          )}
          {error && (
            <div className="text-sm text-red-600 mb-2">{error}</div>
          )}
          {!loading && !error && (
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {displayList.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  {searchQuery
                    ? 'No SkillMates match your search.'
                    : 'No SkillMates yet.'}
                </div>
              ) : (
                <ul id="skillmates-list" role="listbox" className="divide-y divide-blue-50" ref={listRef}>
                  {displayList.map((u, idx) => (
                    <li
                      id={`skillmate-option-${u._id}`}
                      key={u._id}
                      role="option"
                      aria-selected={idx === activeIndex}
                      className={`py-3 flex items-center gap-3 rounded-md ${idx === activeIndex ? 'bg-blue-50/60 ring-1 ring-blue-200' : ''}`}
                    >
                      <button
                        onClick={() => gotoProfile(u.username)}
                        className="shrink-0"
                        title={u.username}
                      >
                        <img
                          src={u.profilePic || 'https://placehold.co/40x40?text=U'}
                          alt={u.username}
                          className="w-10 h-10 rounded-full object-cover border border-blue-100"
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => gotoProfile(u.username)}
                          className="block text-left text-blue-900 font-medium hover:underline truncate"
                        >
                          {highlight(`${u.firstName || ''}`, u._matches, 'firstName')} {highlight(`${u.lastName || ''}`, u._matches, 'lastName')}
                        </button>
                        <div className="text-gray-500 text-xs truncate">@{highlight(u.username, u._matches, 'username')}</div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(prev => (prev === u._id ? null : u._id))}
                          className="p-2 rounded-md hover:bg-blue-50 text-blue-700"
                          aria-label="Open actions menu"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === u._id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white border border-blue-100 rounded-md shadow-lg z-10 text-xs">
                            <button
                              className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-blue-900"
                              onClick={() => {
                                gotoProfile(u.username);
                                setOpenMenuId(null);
                              }}
                            >
                              View Profile
                            </button>
                            <button
                              className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-1"
                              onClick={async () => {
                                try {
                                  await remove(u._id);
                                  setOpenMenuId(null);
                                } catch (e) {
                                  alert(e.message || 'Failed to remove');
                                }
                              }}
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                            <button
                              className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-amber-700"
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
                              Report
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SkillMatesModal;
