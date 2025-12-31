import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import socket from '../../socket';
import TutorCard from './TutorCard';
import { BACKEND_URL } from '../../config.js';
import { supabase, getPublicUrl } from '../../lib/supabaseClient';

const StartSkillSwapSearchForm = () => {
  const { user } = useAuth();
  const [courseValue, setCourseValue] = useState("");
  const [unitValue, setUnitValue] = useState("");
  const [topicValue, setTopicValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [highlightedCourseIdx, setHighlightedCourseIdx] = useState(-1);
  const [highlightedUnitIdx, setHighlightedUnitIdx] = useState(-1);
  const [highlightedTopicIdx, setHighlightedTopicIdx] = useState(-1);
  const courseInputRef = React.useRef();
  const unitInputRef = React.useRef();
  const topicInputRef = React.useRef();

  const [classes, setClasses] = useState([]);
  const [subjectsByClass, setSubjectsByClass] = useState({});
  const [topicsBySubject, setTopicsBySubject] = useState({});

  useEffect(() => {
    let aborted = false;
    const fetchLists = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/skills-list`);
        if (!res.ok) throw new Error('Failed to load skills list');
        const json = await res.json();
        if (aborted) return;
        setClasses(Array.isArray(json.classes) ? json.classes : []);
        setSubjectsByClass(json.subjectsByClass || {});
        setTopicsBySubject(json.topicsBySubject || {});
      } catch (e) {
        console.error('Failed to fetch skills list:', e);
      }
    };
    fetchLists();
    return () => { aborted = true; };
  }, []);
  const courseList = useMemo(() => {
    const term = (courseValue || '').trim().toLowerCase();
    if (!term) return classes;
    return classes.filter(c => c.toLowerCase().includes(term));
  }, [courseValue, classes]);

  const unitList = useMemo(() => {
    return courseValue ? (subjectsByClass[courseValue] || []) : [];
  }, [courseValue, subjectsByClass]);

  const topicList = useMemo(() => {
    return unitValue ? (topicsBySubject[unitValue] || []) : [];
  }, [unitValue, topicsBySubject]);

  const unitDropdownList = useMemo(() => {
    const term = (unitValue || '').trim().toLowerCase();
    if (!term) return unitList;
    return unitList.filter(u => u.toLowerCase().includes(term));
  }, [unitValue, unitList]);

  const topicDropdownList = useMemo(() => {
    const term = (topicValue || '').trim().toLowerCase();
    if (!term) return topicList;
    return topicList.filter(t => t.toLowerCase().includes(term));
  }, [topicValue, topicList]);

  const handleCourseKeyDown = (e) => {
    if (!showDropdown || courseList.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedCourseIdx(idx => (idx + 1) % courseList.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedCourseIdx(idx => (idx - 1 + courseList.length) % courseList.length);
    } else if (e.key === 'Enter') {
      if (highlightedCourseIdx >= 0 && highlightedCourseIdx < courseList.length) {
        setCourseValue(courseList[highlightedCourseIdx]);
        setShowDropdown(false);
        setHighlightedCourseIdx(-1);
        setUnitValue('');
        setTopicValue('');
        setTimeout(() => unitInputRef.current && unitInputRef.current.focus(), 0);
      }
    }
  };

  const handleUnitKeyDown = (e) => {
    if (!showUnitDropdown || unitDropdownList.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedUnitIdx(idx => (idx + 1) % unitDropdownList.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedUnitIdx(idx => (idx - 1 + unitDropdownList.length) % unitDropdownList.length);
    } else if (e.key === 'Enter') {
      if (highlightedUnitIdx >= 0 && highlightedUnitIdx < unitDropdownList.length) {
        setUnitValue(unitDropdownList[highlightedUnitIdx]);
        setShowUnitDropdown(false);
        setHighlightedUnitIdx(-1);
        setTopicValue('');
        setTimeout(() => topicInputRef.current && topicInputRef.current.focus(), 0);
      }
    }
  };

  const handleTopicKeyDown = (e) => {
    if (!showTopicDropdown || topicDropdownList.length === 0) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setHighlightedTopicIdx(idx => (idx + 1) % topicDropdownList.length);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setHighlightedTopicIdx(idx => (idx - 1 + topicDropdownList.length) % topicDropdownList.length);
    } else if (e.key === 'Enter') {
      if (highlightedTopicIdx >= 0 && highlightedTopicIdx < topicDropdownList.length) {
        setTopicValue(topicDropdownList[highlightedTopicIdx]);
        setShowTopicDropdown(false);
        setHighlightedTopicIdx(-1);
      }
    }
  };

  const [questionValue, setQuestionValue] = useState("");
  const [questionPhoto, setQuestionPhoto] = useState(null);
  const [questionImageUrl, setQuestionImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [tutors, setTutors] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (user && user._id) {
      socket.emit('register', user._id);
    }

    socket.on('tutors-found', (data) => {
      setLoading(false);
      if (data.error) {
        setError(data.error);
        setTutors([]);
      } else {
        setError("");
        setTutors(data.tutors);
      }
      setSearched(true);
    });

    socket.on('session-request-sent', (data) => {
      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(""), 3000);
    });

    socket.on('session-request-error', (data) => {
      setError(data.message);
      setTimeout(() => setError(""), 5000);
    });

    return () => {
      socket.off('tutors-found');
      socket.off('session-request-sent');
      socket.off('session-request-error');
    };
  }, [user]);

  const handleFindTutor = () => {
    if (!courseValue || !unitValue || !topicValue) {
      setError("Please select all fields (Class, Subject, and Topic)");
      return;
    }
    if (!questionValue || questionValue.trim() === '') {
      setError("Please describe your question");
      return;
    }
    setLoading(true);
    setError("");
    socket.emit('find-tutors', {
      subject: courseValue,
      topic: unitValue,
      subtopic: topicValue,
      question: questionValue,
      questionPhoto: questionPhoto ? questionPhoto.name : null,
    });
  };

  const handleRequestSession = async (tutor) => {
    try {
      setError("");
      setSuccessMessage("");
      socket.emit('send-session-request', {
        tutorId: tutor.userId,
        subject: unitValue,
        topic: topicValue,
        question: questionValue,
        questionImageUrl: questionImageUrl || '',
        questionPhoto: questionPhoto ? questionPhoto.name : null,
        message: `I would like to learn ${unitValue} - ${topicValue}${questionValue ? `: ${questionValue}` : ''}`,
      });
    } catch {
      setError("Failed to send session request. Please try again.");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0] || null;
    setQuestionPhoto(file);
    setQuestionImageUrl("");
    if (!file) return;
    try {
      setUploading(true);
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const safeBase = file.name.replace(/\.[^/.]+$/, '').slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '_');
      const ts = Date.now();
      const uid = (user && user._id) ? user._id : 'anonymous';
      const path = `${uid}/${ts}-${safeBase}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('questions')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const publicUrl = getPublicUrl('questions', path);
      setQuestionImageUrl(publicUrl || "");
    } catch (err) {
      console.error('Supabase upload failed:', err);
      const msg = (err && (err.message || err.error_description)) || '';
      if (/row-level security/i.test(msg) || /RLS/i.test(msg)) {
        setError('Upload blocked by Supabase policy. Please add an INSERT policy for bucket "questions" (public insert).');
      } else if (/Bucket not found/i.test(msg)) {
        setError('Supabase bucket "questions" not found. Check bucket name and case.');
      } else {
        setError('Failed to upload image. You can still proceed without it.');
      }
      setQuestionImageUrl("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div className="relative">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Class</label>
          <input
            ref={courseInputRef}
            type="text"
            value={courseValue}
            onChange={e => {
              setCourseValue(e.target.value);
              setShowDropdown(true);
              setUnitValue('');
              setTopicValue('');
              setHighlightedCourseIdx(-1);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => { setShowDropdown(false); setHighlightedCourseIdx(-1); }, 120)}
            onKeyDown={handleCourseKeyDown}
            placeholder="Search Class..."
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm outline-none"
            autoComplete="off"
          />
          {showDropdown && courseList.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-2">
              {courseList.map((s, idx) => (
                <li
                  key={idx}
                  className={`px-4 py-2.5 text-slate-700 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${highlightedCourseIdx === idx ? 'bg-blue-100' : ''}`}
                  onMouseDown={() => {
                    setCourseValue(s);
                    setShowDropdown(false);
                    setHighlightedCourseIdx(-1);
                    setUnitValue('');
                    setTopicValue('');
                    setTimeout(() => unitInputRef.current && unitInputRef.current.focus(), 0);
                  }}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="relative">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Subject</label>
          <input
            ref={unitInputRef}
            type="text"
            value={unitValue}
            onChange={e => {
              setUnitValue(e.target.value);
              setShowUnitDropdown(true);
              setHighlightedUnitIdx(-1);
              setTopicValue('');
            }}
            onFocus={() => setShowUnitDropdown(true)}
            onBlur={() => setTimeout(() => { setShowUnitDropdown(false); setHighlightedUnitIdx(-1); }, 120)}
            onKeyDown={handleUnitKeyDown}
            placeholder="Search Subject..."
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            autoComplete="off"
            disabled={!courseValue || !unitList.length}
          />
          {showUnitDropdown && courseValue && unitList.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-2">
              {unitDropdownList.map((u, idx) => (
                <li
                  key={idx}
                  className={`px-4 py-2.5 text-slate-700 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${highlightedUnitIdx === idx ? 'bg-blue-100' : ''}`}
                  onMouseDown={() => {
                    setUnitValue(u);
                    setShowUnitDropdown(false);
                    setHighlightedUnitIdx(-1);
                    setTopicValue('');
                    setTimeout(() => topicInputRef.current && topicInputRef.current.focus(), 0);
                  }}
                >
                  {u}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="relative">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Topic</label>
          <input
            ref={topicInputRef}
            type="text"
            value={topicValue}
            onChange={e => {
              setTopicValue(e.target.value);
              setShowTopicDropdown(true);
              setHighlightedTopicIdx(-1);
            }}
            onFocus={() => setShowTopicDropdown(true)}
            onBlur={() => setTimeout(() => { setShowTopicDropdown(false); setHighlightedTopicIdx(-1); }, 150)}
            onKeyDown={handleTopicKeyDown}
            placeholder="Search Topic..."
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            autoComplete="off"
            disabled={!unitValue || !topicList.length}
          />
          {showTopicDropdown && unitValue && topicList.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-2">
              {topicDropdownList.map((t, idx) => (
                <li
                  key={idx}
                  className={`px-4 py-2.5 text-slate-700 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${highlightedTopicIdx === idx ? 'bg-blue-100' : ''}`}
                  onMouseDown={e => {
                    e.preventDefault();
                    setTopicValue(t);
                    setShowTopicDropdown(false);
                    setHighlightedTopicIdx(-1);
                  }}
                >
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="mb-6">
        <label htmlFor="question" className="block text-sm font-semibold text-slate-900 mb-2">
          Your Question <span className="text-red-500">*</span>
        </label>
        <textarea
          id="question"
          value={questionValue}
          onChange={(e) => setQuestionValue(e.target.value)}
          placeholder="Describe your question or doubt in detail to help tutors prepare..."
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm outline-none resize-none hover:border-slate-400 transition-colors"
          rows="4"
          required
        />
      </div>
      <div className="mb-7">
        <label htmlFor="questionPhoto" className="block text-sm font-semibold text-slate-900 mb-2">
          Upload Question Photo <span className="text-slate-400 font-normal">(Optional)</span>
        </label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-blue-900/40 transition-colors bg-slate-50/50">
          <input
            id="questionPhoto"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer file:transition-colors"
          />
          {uploading && (
            <p className="mt-3 text-sm text-blue-900 font-medium flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading image…
            </p>
          )}
          {!uploading && questionImageUrl && (
            <p className="mt-3 text-sm text-green-600 font-medium">✓ Image uploaded successfully</p>
          )}
        </div>
      </div>
      <button
        onClick={handleFindTutor}
        disabled={loading}
        className="w-full bg-blue-900 text-white px-6 py-3.5 rounded-lg font-semibold text-base hover:bg-blue-800 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Finding Tutors...
          </span>
        ) : 'Find Tutor'}
      </button>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {loading && (
        <div className="mt-8 text-center py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-900 border-t-transparent"></div>
            <span className="text-slate-700 font-medium">Finding online tutors...</span>
          </div>
        </div>
      )}

      {searched && !loading && (
        <div className="mt-8">
          {tutors.length === 0 ? (
            <div className="text-center text-slate-600 py-8">
              No online tutors found for your search criteria. Try different subjects or topics.
            </div>
          ) : (
            <>
              <div className="text-center text-blue-900 font-semibold mb-6">
                Found {tutors.length} online tutor{tutors.length > 1 ? 's' : ''} for your search
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tutors.map((tutor, idx) => (
                  <TutorCard
                    key={idx}
                    tutor={{
                      name: `${tutor.firstName} ${tutor.lastName}`,
                      profilePic: tutor.profilePic || "",
                      status: tutor.status,
                      date: new Date().toISOString().split('T')[0],
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      skills: [courseValue, unitValue, topicValue].filter(Boolean),
                      rating: tutor.rating || 4.5,
                      userId: tutor.userId,
                      socketId: tutor.socketId,
                    }}
                    onRequestSession={() => handleRequestSession(tutor)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default StartSkillSwapSearchForm;
